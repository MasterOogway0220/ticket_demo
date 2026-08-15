/* ============================================================
   BOS demo data layer v2 — mirrors the real console's model:
   fare VERSIONS with rules + maker-checker approvals, label
   master, rich station/device/product/user records, hash-chained
   audit. localStorage-backed; deterministic seed.
   db.fares stays as the flat "effective published fares" view so
   the ToM terminal keeps working; publishing recomputes it.
   ============================================================ */

const DB_KEY = 'vr-afc-bos-v2';
const SES_KEY = 'vr-afc-bos-session';

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STN = [
  { code: 'VCT', en: 'Varanasi Cantt', hi: 'वाराणसी कैंट', type: 'Terminal', entry: 5, exit: 5 },
  { code: 'VDP', en: 'Vidyapith', hi: 'विद्यापीठ', type: 'Intermediate', entry: 5, exit: 5 },
  { code: 'RYT', en: 'Rath Yatra', hi: 'रथयात्रा', type: 'Intermediate', entry: 5, exit: 4 },
  { code: 'GDC', en: 'Gadoliya Chowk', hi: 'गदौलिया चौक', type: 'Terminal', entry: 6, exit: 6 },
];
const LINE = ['VCT', 'VDP', 'RYT', 'GDC'];

/* PLACEHOLDER fares (₹) pending the approved schedule */
const PAIR_FARES = {
  'VCT-VDP': 60, 'VCT-RYT': 90, 'VCT-GDC': 120,
  'VDP-RYT': 60, 'VDP-GDC': 90, 'RYT-GDC': 60,
};
function baseFare(a, b) {
  return PAIR_FARES[`${a}-${b}`] ?? PAIR_FARES[`${b}-${a}`] ?? 0;
}
/* rule 5: exit permitted at any station up to and including the destination */
function permittedExits(origin, dest) {
  const i = LINE.indexOf(origin), j = LINE.indexOf(dest);
  const dir = j > i ? 1 : -1, out = [];
  for (let k = i + dir; dir > 0 ? k <= j : k >= j; k += dir) out.push(LINE[k]);
  return out;
}
/* 24 rules: 12 directed pairs × SJT/RJT, adult fare only (rule 3) */
function buildRules() {
  const rules = [];
  for (const o of LINE) for (const d of LINE) {
    if (o === d) continue;
    for (const p of ['SINGLE_JOURNEY', 'RETURN_JOURNEY']) {
      rules.push({
        product: p, passenger: 'Adult',
        origin: o, dest: d,
        exits: permittedExits(o, d),
        fare: baseFare(o, d) * (p === 'RETURN_JOURNEY' ? 2 : 1),
      });
    }
  }
  return rules;
}

/* ---------- roles & permissions (matches the live console navs) ---------- */
const ROLES = {
  SYSTEM_ADMIN:        { label: 'System Administrator',            nav: ['dashboard','stations','devices','products','fares','labels','approvals','users','hotlist','transactions','audit','settings'], write: true,  approve: true },
  FINANCE_OFFICER:     { label: 'Finance Officer',                 nav: ['dashboard','stations','devices','products','fares','approvals','hotlist','transactions','audit'],                             write: false, approve: true },
  STATION_CONTROLLER:  { label: 'Station Controller — one station',nav: ['dashboard','stations','devices','products','fares','users','transactions'],                                                   write: false, approve: false },
  TOM_OPERATOR:        { label: 'Counter Operator — one station',  nav: ['dashboard','stations','products','fares'],                                                                                    write: false, approve: false },
  EXCESS_FARE_OFFICER: { label: 'Excess Fare Officer — one station', nav: ['dashboard','stations','devices','products','fares','transactions'],                                                         write: false, approve: false },
  MAINTENANCE:         { label: 'Maintenance Engineer',            nav: ['dashboard','stations','devices'],                                                                                             write: false, approve: false },
  AUDITOR:             { label: 'Auditor — read only',             nav: ['dashboard','stations','devices','products','fares','labels','approvals','users','hotlist','transactions','audit','settings'], write: false, approve: false },
};

function seedDB() {
  const rnd = mulberry32(20260815);
  const now = Date.now();
  const day = 86400000;

  const stations = STN.map((s, i) => ({
    id: 'st' + (i + 1), ...s, seq: i + 1,
    short: s.code, open: '05:00', close: '21:00',
    lat: null, lng: null, address: null,
    status: 'active', commissioned: now - 120 * day,
  }));

  const devices = [];
  let d = 0;
  for (const s of STN) {
    for (let g = 1; g <= s.entry; g++) devices.push({
      id: 'dv' + (++d), code: `${s.code}-ECU-E${String(g).padStart(2, '0')}`,
      type: 'Gate controller (ECU)', station: s.code,
      role: g === s.entry ? 'Entry · swing' : 'Entry · tripod', status: 'active',
    });
    for (let g = 1; g <= s.exit; g++) devices.push({
      id: 'dv' + (++d), code: `${s.code}-ECU-X${String(g).padStart(2, '0')}`,
      type: 'Gate controller (ECU)', station: s.code,
      role: g === s.exit ? 'Exit · swing' : 'Exit · tripod', status: 'active',
    });
    for (let k = 1; k <= 2; k++) devices.push({
      id: 'dv' + (++d), code: `${s.code}-TVM-${String(k).padStart(2, '0')}`,
      type: 'Kiosk (TVM)', station: s.code, role: 'Self-service · UPI only', status: 'active',
    });
    for (let k = 1; k <= 2; k++) devices.push({
      id: 'dv' + (++d), code: `${s.code}-POS-${String(k).padStart(2, '0')}`,
      type: 'Counter (ToM)', station: s.code,
      role: k === 1 ? 'POS 1 · QR ticketing' : 'POS 2 · NCMC services', status: 'active',
    });
    devices.push({
      id: 'dv' + (++d), code: `${s.code}-EFO-01`,
      type: 'Excess Fare Office terminal', station: s.code, role: 'Excess fare office', status: 'active',
    });
    devices.push({
      id: 'dv' + (++d), code: `${s.code}-SRV-01`,
      type: 'Station server', station: s.code, role: 'Station tier · buffers the centre', status: 'active',
    });
  }
  devices.forEach(x => {
    x.manufacturer = null; x.model = null; x.serial = null; x.assetTag = null;
    x.ip = null; x.locationNote = null; x.installedOn = now - 90 * day;
    x.cert = 'Pending — issued during provisioning (phase 2)';
    x.lastSeen = now - Math.floor(rnd() * 3600 * 1000);
  });
  devices.find(x => x.code === 'RYT-ECU-X02').status = 'faulty';
  devices.find(x => x.code === 'GDC-TVM-02').status = 'maintenance';
  devices.find(x => x.code === 'VDP-ECU-E03').status = 'offline';

  /* products — the real console's four (BOS-FP-02) */
  const products = [
    { id: 'pr1', code: 'SINGLE_JOURNEY', en: 'Single Journey Ticket', hi: 'एकल यात्रा टिकट',
      category: 'Single journey', sac: '996429', trips: 1, printed: 1,
      fulfilment: 'Direct QR ticket', channels: ['ToM', 'TVM'], passengers: ['Adult'],
      maxPerTxn: 6, order: 1, active: true },
    { id: 'pr2', code: 'RETURN_JOURNEY', en: 'Return Journey Ticket', hi: 'वापसी यात्रा टिकट',
      category: 'Return journey', sac: '996429', trips: 2, printed: 2,
      fulfilment: 'Direct QR ticket', channels: ['ToM', 'TVM'], passengers: ['Adult'],
      maxPerTxn: 6, order: 2, active: true },
    { id: 'pr3', code: 'CONCESSION_SINGLE', en: 'Concessional — Single Journey', hi: 'रियायती — एकल यात्रा',
      category: 'Concession', sac: '996429', trips: 1, printed: 1,
      fulfilment: 'Booking code, redeemed at a counter', channels: ['ToM'], passengers: ['Child', 'Senior', 'Differently abled'],
      maxPerTxn: 6, order: 3, active: false },
    { id: 'pr4', code: 'GROUP_SINGLE', en: 'Group — Single Journey', hi: 'समूह — एकल यात्रा',
      category: 'Group', sac: '996429', trips: 1, printed: 6,
      fulfilment: 'Direct QR ticket', channels: ['ToM'], passengers: ['Adult'],
      maxPerTxn: 6, order: 4, active: false },
  ];

  /* fare versions — v1 published (dual-authorised), v2 draft ready to walk
     through the maker-checker flow */
  const fareVersions = [
    { id: 'fv1', version: 1, title: 'Phase 1 station-pair fares (seed, GST 18% on fare)',
      model: 'Station pair', status: 'published',
      discountPct: 20, rules: buildRules(),
      tax: [{ component: 'CGST', rate: 9, scope: 'on fare' }, { component: 'SGST', rate: 9, scope: 'on fare' }],
      draftedBy: 'admin.dev', submittedBy: 'admin.dev', approvedBy: 'checker.dev', publishedBy: 'checker.dev',
      createdAt: now - 14 * day, effectiveFrom: now - 13 * day, effectiveTo: null,
      hash: 'a3f2c81b9e04d7', notes: 'PLACEHOLDER fares for development and UAT. Replace with the approved fare schedule before go-live.' },
    { id: 'fv2', version: 2, title: 'Festival season revision (draft)',
      model: 'Station pair', status: 'draft',
      discountPct: 20, rules: buildRules().map(r => ({ ...r, fare: Math.round(r.fare * 1.1 / 10) * 10 })),
      tax: [{ component: 'CGST', rate: 9, scope: 'on fare' }, { component: 'SGST', rate: 9, scope: 'on fare' }],
      draftedBy: 'admin.dev', submittedBy: null, approvedBy: null, publishedBy: null,
      createdAt: now - 2 * day, effectiveFrom: null, effectiveTo: null,
      hash: null, notes: 'Adjust fares ahead of the festival window. Edit the rules, then submit for approval.' },
  ];
  /* flat effective view — the ToM terminal sells from this */
  const fares = Object.entries(PAIR_FARES).map(([pair, sjt], i) => ({
    id: 'fr' + (i + 1), pair, sjt, rjt: sjt * 2,
  }));

  /* label master — 13 rows (BOS-MD-04, rule 16) */
  const labels = [
    { id: 'lb1', ns: 'product', key: 'single_journey', en: 'Single Journey Ticket', hi: 'एकल यात्रा टिकट', receipt: false },
    { id: 'lb2', ns: 'product', key: 'return_journey', en: 'Return Journey Ticket', hi: 'वापसी यात्रा टिकट', receipt: false },
    { id: 'lb3', ns: 'product', key: 'concession_single', en: 'Concessional — Single Journey', hi: 'रियायती — एकल यात्रा', receipt: false },
    { id: 'lb4', ns: 'product', key: 'group_single', en: 'Group — Single Journey', hi: 'समूह — एकल यात्रा', receipt: false },
    { id: 'lb5', ns: 'receipt', key: 'brand', en: 'Varanasi Ropeway', hi: 'वाराणसी रोपवे', receipt: true },
    { id: 'lb6', ns: 'receipt', key: 'tax_note', en: 'Fare is inclusive of tax', hi: 'किराया कर सहित है', receipt: true },
    { id: 'lb7', ns: 'receipt', key: 'thanks', en: 'Thank you for travelling with us', hi: 'हमारे साथ यात्रा करने के लिए धन्यवाद', receipt: true },
    { id: 'lb8', ns: 'receipt', key: 'keep_ticket', en: 'Keep your ticket until you exit', hi: 'बाहर निकलने तक टिकट संभालकर रखें', receipt: true },
    { id: 'lb9', ns: 'receipt', key: 'no_reprint', en: 'Tickets cannot be reprinted', hi: 'टिकट दोबारा प्रिंट नहीं होते', receipt: true },
    { id: 'lb10', ns: 'station', key: 'vct', en: 'Varanasi Cantt', hi: 'वाराणसी कैंट', receipt: false },
    { id: 'lb11', ns: 'station', key: 'vdp', en: 'Vidyapith', hi: 'विद्यापीठ', receipt: false },
    { id: 'lb12', ns: 'station', key: 'ryt', en: 'Rath Yatra', hi: 'रथयात्रा', receipt: false },
    { id: 'lb13', ns: 'station', key: 'gdc', en: 'Gadoliya Chowk', hi: 'गदौलिया चौक', receipt: false },
  ];

  const users = [
    { id: 'us1', username: 'admin.dev',   name: 'Arvind Pathak',  empCode: 'VR-ADM-001', designation: 'Systems Lead',        email: 'admin@vr.dev',   mobile: '98•••• ••01', role: 'SYSTEM_ADMIN',        station: '—',   status: 'active',   lastSignIn: now - 3600e3 },
    { id: 'us2', username: 'checker.dev', name: 'Meera Iyer',     empCode: 'VR-ADM-002', designation: 'Deputy Systems Lead', email: 'checker@vr.dev', mobile: '98•••• ••02', role: 'SYSTEM_ADMIN',        station: '—',   status: 'active',   lastSignIn: now - 5 * 3600e3 },
    { id: 'us3', username: 'station.dev', name: 'Ravi Kumar',     empCode: 'VR-STN-011', designation: 'Station Controller',  email: 'ravi@vr.dev',    mobile: '98•••• ••03', role: 'STATION_CONTROLLER',  station: 'VCT', status: 'active',   lastSignIn: now - day },
    { id: 'us4', username: 'tom.dev',     name: 'Sunita Devi',    empCode: 'VR-OPR-031', designation: 'Counter Operator',    email: 'sunita@vr.dev',  mobile: '98•••• ••04', role: 'TOM_OPERATOR',        station: 'VCT', status: 'active',   lastSignIn: now - 2 * 3600e3 },
    { id: 'us5', username: 'tom.ryt.dev', name: 'Imran Ali',      empCode: 'VR-OPR-032', designation: 'Counter Operator',    email: 'imran@vr.dev',   mobile: '98•••• ••05', role: 'TOM_OPERATOR',        station: 'RYT', status: 'active',   lastSignIn: now - 3 * day },
    { id: 'us6', username: 'excess.dev',  name: 'Prakash Singh',  empCode: 'VR-EFO-021', designation: 'Excess Fare Officer', email: 'prakash@vr.dev', mobile: '98•••• ••06', role: 'EXCESS_FARE_OFFICER', station: 'GDC', status: 'active',   lastSignIn: now - 2 * day },
    { id: 'us7', username: 'finance.dev', name: 'Kavita Rao',     empCode: 'VR-FIN-001', designation: 'Finance Officer',     email: 'kavita@vr.dev',  mobile: '98•••• ••07', role: 'FINANCE_OFFICER',     station: '—',   status: 'active',   lastSignIn: now - 6 * 3600e3 },
    { id: 'us8', username: 'auditor.dev', name: 'S. Raghunathan', empCode: 'VR-AUD-001', designation: 'Statutory Auditor',   email: 'audit@vr.dev',   mobile: '98•••• ••08', role: 'AUDITOR',             station: '—',   status: 'active',   lastSignIn: now - 7 * day },
  ];

  const hotlist = [
    { id: 'hl1', card: '6080 11•• •••• 4021', reason: 'Reported lost', by: 'tom.dev', ts: now - 6 * day },
    { id: 'hl2', card: '6080 39•• •••• 7788', reason: 'Reported stolen', by: 'tom.dev', ts: now - 3 * day },
    { id: 'hl3', card: '6080 52•• •••• 1904', reason: 'Bank instruction', by: 'admin.dev', ts: now - 1 * day },
  ];

  const config = [
    { key: 'GST_RATE', label: 'GST rate (%)', value: 5, unit: '%', note: 'Open point 15 — passenger-facing prices stay tax-inclusive (rule 13); the fare version carries the CGST/SGST split' },
    { key: 'NCMC_DISCOUNT', label: 'NCMC fare discount (%)', value: 20, unit: '%', note: 'Rule 11 — applied at exit deduction' },
    { key: 'OVERTRAVEL_FINE', label: 'Over-travel fine (₹)', value: 50, unit: '₹', note: 'Rule 14 — charged with fare difference' },
    { key: 'MIN_CARD_BALANCE', label: 'Minimum card balance at entry (₹)', value: 60, unit: '₹', note: 'Open point 4 — single value, all stations' },
    { key: 'MAX_GROUP', label: 'Max tickets per group payment', value: 6, unit: '', note: 'Rule 12' },
    { key: 'UPI_WINDOW', label: 'Kiosk UPI confirmation window (s)', value: 120, unit: 's', note: 'Kiosk cancels and holds the reference after this' },
    { key: 'KIOSK_IDLE', label: 'Kiosk session timeout (s)', value: 60, unit: 's', note: 'Open point 10' },
    { key: 'RJT_MIN_INTERVAL', label: 'Min interval before return leg (min)', value: 30, unit: 'min', note: 'Open point 6' },
    { key: 'HOTLIST_MAX_AGE', label: 'Max cached hotlist age (h)', value: 24, unit: 'h', note: 'Card acceptance stops beyond this' },
    { key: 'FARE_MAX_AGE', label: 'Max cached fare-table age (h)', value: 24, unit: 'h', note: 'Counter sales stop beyond this' },
    { key: 'APPROVAL_EXPIRY', label: 'Approval request expiry (days)', value: 7, unit: 'd', note: 'BOS-SC-04 — an undecided request lapses' },
  ];

  /* transactions — deterministic 7-day history */
  const transactions = [];
  const pairsFrom = { VCT: ['VCT-VDP', 'VCT-RYT', 'VCT-GDC'], VDP: ['VCT-VDP', 'VDP-RYT', 'VDP-GDC'], RYT: ['VCT-RYT', 'VDP-RYT', 'RYT-GDC'], GDC: ['VCT-GDC', 'VDP-GDC', 'RYT-GDC'] };
  let tx = 0;
  for (let dd = 6; dd >= 0; dd--) {
    const base = new Date(now - dd * day); base.setHours(5, 0, 0, 0);
    const dayCount = 26 + Math.floor(rnd() * 22) + (dd === 0 ? -8 : 0);
    for (let i = 0; i < dayCount; i++) {
      const st = STN[Math.floor(rnd() * 4)].code;
      const viaTVM = rnd() < 0.55;
      const mode = viaTVM ? 'UPI' : (rnd() < 0.6 ? 'Cash' : (rnd() < 0.5 ? 'UPI' : 'Card'));
      const product = rnd() < 0.72 ? 'SJT' : 'RJT';
      const pair = pairsFrom[st][Math.floor(rnd() * 3)];
      const qty = rnd() < 0.68 ? 1 : (2 + Math.floor(rnd() * 3));
      const unit = (PAIR_FARES[pair] ?? 60) * (product === 'RJT' ? 2 : 1);
      const t = new Date(base.getTime() + Math.floor(rnd() * 16 * 3600 * 1000));
      transactions.push({
        id: 'tx' + (++tx), ts: t.getTime(), station: st,
        device: viaTVM ? `${st}-TVM-0${1 + Math.floor(rnd() * 2)}` : `${st}-POS-01`,
        product, pair, qty, mode, amount: unit * qty,
      });
    }
  }
  transactions.sort((a, b) => b.ts - a.ts);

  /* approvals — one decided historical request; the queue starts empty */
  const approvals = [
    { id: 'ap1', ref: 'APR-2026-000001', operation: 'fare_version.publish', risk: 'critical',
      summary: 'Publish fare version 1 ("Phase 1 station-pair fares") with 24 rules',
      payload: { fareVersionId: 'fv1', effectiveFrom: 'seed' },
      reason: 'Initial fare schedule for UAT', maker: 'admin.dev', madeAt: now - 14 * day,
      expiresAt: now - 7 * day, status: 'approved', decidedBy: 'checker.dev', decidedAt: now - 13 * day,
      decisionReason: null },
  ];

  /* hash-chained audit — seq numbered */
  const audit = [
    { id: 'au3', seq: 3, ts: now - 2 * day, user: 'admin.dev', action: 'update', entity: 'Device', detail: 'GDC-TVM-02 → maintenance', chain: 'ok' },
    { id: 'au2', seq: 2, ts: now - 6 * day, user: 'tom.dev', action: 'create', entity: 'Hotlist', detail: '6080 11•• •••• 4021 — reported lost', chain: 'ok' },
    { id: 'au1', seq: 1, ts: now - 13 * day, user: 'checker.dev', action: 'publish', entity: 'Fare version', detail: 'v1 published — APR-2026-000001 approved', chain: 'ok' },
  ];

  return {
    stations, devices, products, fares, fareVersions, labels, users, hotlist,
    config, transactions, approvals, audit, shifts: [], _seq: 1000, _apr: 1, _auseq: 3,
  };
}

/* ---------- store ---------- */
const store = {
  db: null,
  load() {
    try { this.db = JSON.parse(localStorage.getItem(DB_KEY)); } catch { this.db = null; }
    if (!this.db || !this.db.stations || !this.db.labels) { this.db = seedDB(); this.save(); }
    if (!this.db.shifts) { this.db.shifts = []; this.save(); }
    if (!this.db.efoCases) { this.db.efoCases = []; this.db._efo = 0; this.save(); }
    return this.db;
  },
  save() { localStorage.setItem(DB_KEY, JSON.stringify(this.db)); },
  reset() { localStorage.removeItem(DB_KEY); this.load(); },
  nextId(prefix) { this.db._seq += 1; return prefix + this.db._seq; },

  logAudit(action, entity, detail) {
    this.db._auseq = (this.db._auseq || 0) + 1;
    this.db.audit.unshift({
      id: this.nextId('au'), seq: this.db._auseq, ts: Date.now(),
      user: session.user ? session.user.username : 'system',
      action, entity, detail, chain: 'ok',
    });
  },
  insert(coll, obj, entity, detail) {
    obj.id = this.nextId(coll.slice(0, 2));
    this.db[coll].unshift(obj);
    this.logAudit('create', entity, detail);
    this.save();
    return obj;
  },
  update(coll, id, patch, entity, detail) {
    const row = this.db[coll].find(r => r.id === id);
    if (row) { Object.assign(row, patch); this.logAudit('update', entity, detail); this.save(); }
    return row;
  },
  remove(coll, id, entity, detail) {
    const i = this.db[coll].findIndex(r => r.id === id);
    if (i >= 0) { this.db[coll].splice(i, 1); this.logAudit('delete', entity, detail); this.save(); }
  },

  /* ---- maker-checker (BOS-SC-04) ---- */
  raiseApproval(operation, summary, payload, reason, risk = 'critical') {
    this.db._apr = (this.db._apr || 1) + 1;
    const days = (this.db.config.find(c => c.key === 'APPROVAL_EXPIRY') || { value: 7 }).value;
    const req = {
      id: this.nextId('ap'), ref: 'APR-2026-' + String(this.db._apr).padStart(6, '0'),
      operation, risk, summary, payload, reason,
      maker: session.user.username, madeAt: Date.now(),
      expiresAt: Date.now() + days * 86400000, status: 'pending',
      decidedBy: null, decidedAt: null, decisionReason: null,
    };
    this.db.approvals.unshift(req);
    this.logAudit('create', 'Approval', `${req.ref} raised — ${summary}`);
    this.save();
    return req;
  },
  decideApproval(id, approve, reason) {
    const req = this.db.approvals.find(a => a.id === id);
    if (!req || req.status !== 'pending') return { err: 'Request is no longer pending.' };
    if (req.maker === session.user.username) return { err: 'You raised this request. Segregation of duties requires a different person to decide it (BOS-SC-04).' };
    if (!session.canApprove()) return { err: 'Your role cannot decide approval requests.' };
    if (!approve && !reason) return { err: 'A reason is required to reject — an unexplained refusal is not reviewable.' };
    req.status = approve ? 'approved' : 'rejected';
    req.decidedBy = session.user.username; req.decidedAt = Date.now(); req.decisionReason = reason || null;
    this.logAudit(approve ? 'publish' : 'update', 'Approval', `${req.ref} ${req.status} by ${req.decidedBy}`);
    if (approve) this.applyApproval(req);
    this.save();
    return { ok: true, req };
  },
  withdrawApproval(id, reason) {
    const req = this.db.approvals.find(a => a.id === id);
    if (!req || req.status !== 'pending') return { err: 'Request is no longer pending.' };
    if (req.maker !== session.user.username) return { err: 'Only the person who raised a request can withdraw it.' };
    req.status = 'withdrawn'; req.decidedAt = Date.now(); req.decisionReason = reason || null;
    this.logAudit('update', 'Approval', `${req.ref} withdrawn by ${req.maker}`);
    this.save();
    return { ok: true };
  },
  applyApproval(req) {
    if (req.operation === 'fare_version.publish') {
      const v = this.db.fareVersions.find(x => x.id === req.payload.fareVersionId);
      if (!v) return;
      this.db.fareVersions.forEach(x => { if (x.status === 'published') { x.status = 'superseded'; x.effectiveTo = Date.now(); } });
      v.status = 'published'; v.publishedBy = req.decidedBy; v.approvedBy = req.decidedBy;
      v.effectiveFrom = req.payload.effectiveFrom || Date.now();
      v.hash = Math.random().toString(16).slice(2, 16);
      /* recompute the flat effective view the terminal sells from */
      this.db.fares.forEach(f => {
        const [a, b] = f.pair.split('-');
        const s = v.rules.find(r => r.product === 'SINGLE_JOURNEY' && r.origin === a && r.dest === b);
        const r = v.rules.find(r => r.product === 'RETURN_JOURNEY' && r.origin === a && r.dest === b);
        if (s) f.sjt = s.fare;
        if (r) f.rjt = r.fare;
      });
      this.logAudit('publish', 'Fare version', `v${v.version} "${v.title}" published, effective immediately — distributed to every device`);
    }
    if (req.operation === 'user_role.grant') {
      const u = this.db.users.find(x => x.id === req.payload.userId);
      if (u) {
        u.role = req.payload.role;
        if (req.payload.station) u.station = req.payload.station;
        this.logAudit('update', 'User', `${u.username} granted ${req.payload.role}${req.payload.station ? ' at ' + req.payload.station : ''}`);
      }
    }
  },
};

/* ---------- session / RBAC ---------- */
const session = {
  user: null,
  load() {
    try { this.user = JSON.parse(localStorage.getItem(SES_KEY)); } catch { this.user = null; }
    return this.user;
  },
  signIn(username) {
    const u = store.db.users.find(x => x.username === username && x.status === 'active');
    if (!u) return null;
    this.user = { username: u.username, name: u.name, role: u.role };
    u.lastSignIn = Date.now(); store.save();
    localStorage.setItem(SES_KEY, JSON.stringify(this.user));
    return this.user;
  },
  signOut() { this.user = null; localStorage.removeItem(SES_KEY); },
  roleDef() { return ROLES[this.user?.role] || ROLES.AUDITOR; },
  roleLabel() { return this.roleDef().label; },
  canWrite() { return !!this.user && this.roleDef().write; },
  canApprove() { return !!this.user && this.roleDef().approve; },
  navFor() { return this.roleDef().nav; },
};

/* ---------- shared formatting ---------- */
const fmtINR = n => '₹' + n.toLocaleString('en-IN');
const fmtDT = ts => ts ? new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtD = ts => ts ? new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const stationName = code => (STN.find(s => s.code === code) || { en: code }).en;
