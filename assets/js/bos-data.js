/* ============================================================
   Varanasi Ropeway AFC — demo data layer, v3.
   Mirrors the fix/tester-bugs branch exactly: same stations,
   devices, products, fares (paise, tax-exclusive + 18% GST),
   staff, permissions, reasons, config. Nothing invented.
   Persisted in localStorage for the working demo.
   ============================================================ */

const DB_KEY = 'vr-afc-v3';

/* ---------- shared helpers ---------- */
const fmtP = (paise) => '₹' + (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDT = (ts) => ts == null ? '—' : new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).replace(' at ', ', ').replace(' AM', ' am').replace(' PM', ' pm');
const fmtD = (ts) => ts == null ? '—' : new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/* ---------- stations (4, in route order) ---------- */
const STN = [
  { code: 'VCT', en: 'Varanasi Cantt',  hi: 'वाराणसी कैंट', type: 'terminal',     seq: 1, status: 'active', open: '05:00', close: '21:00' },
  { code: 'VDP', en: 'Vidyapith',       hi: 'विद्यापीठ',     type: 'intermediate', seq: 2, status: 'active', open: '05:00', close: '21:00' },
  { code: 'RYT', en: 'Rath Yatra',      hi: 'रथ यात्रा',     type: 'intermediate', seq: 3, status: 'active', open: '05:00', close: '21:00' },
  { code: 'GDC', en: 'Gadoliya Chowk',  hi: 'गोदौलिया चौक',  type: 'terminal',     seq: 4, status: 'active', open: '05:00', close: '21:00' },
];
const stationName = (c) => (STN.find(s => s.code === c) || {}).en || c;

/* ---------- devices (61) — exact branch layout ---------- */
function buildDevices() {
  const d = [];
  const gate = (st, code, lane, dir, hw, acc) =>
    d.push({ id: 'dv' + (d.length + 1), code, type: 'ECU', station: st, status: 'registered', lane, dir, hw, accessible: !!acc, cert: null, fareV: null, hotlistV: null, lastSeen: null });
  const dev = (st, code, type) =>
    d.push({ id: 'dv' + (d.length + 1), code, type, station: st, status: 'registered', lane: null, dir: null, hw: null, accessible: false, cert: null, fareV: null, hotlistV: null, lastSeen: null });

  /* VCT: 5 entry (E05 swing/accessible), 5 exit (X05 swing/accessible) */
  for (let i = 1; i <= 4; i++) gate('VCT', `VCT-ECU-E0${i}`, i, 'entry', 'tripod_turnstile');
  gate('VCT', 'VCT-ECU-E05', 5, 'entry', 'swing_gate', true);
  for (let i = 1; i <= 4; i++) gate('VCT', `VCT-ECU-X0${i}`, 50 + i, 'exit', 'tripod_turnstile');
  gate('VCT', 'VCT-ECU-X05', 55, 'exit', 'swing_gate', true);
  /* VDP: identical pattern */
  for (let i = 1; i <= 4; i++) gate('VDP', `VDP-ECU-E0${i}`, i, 'entry', 'tripod_turnstile');
  gate('VDP', 'VDP-ECU-E05', 5, 'entry', 'swing_gate', true);
  for (let i = 1; i <= 4; i++) gate('VDP', `VDP-ECU-X0${i}`, 50 + i, 'exit', 'tripod_turnstile');
  gate('VDP', 'VDP-ECU-X05', 55, 'exit', 'swing_gate', true);
  /* RYT: 4+1 entry, 3+1 exit (X04 swing gate 54) */
  for (let i = 1; i <= 4; i++) gate('RYT', `RYT-ECU-E0${i}`, i, 'entry', 'tripod_turnstile');
  gate('RYT', 'RYT-ECU-E05', 5, 'entry', 'swing_gate', true);
  for (let i = 1; i <= 3; i++) gate('RYT', `RYT-ECU-X0${i}`, 50 + i, 'exit', 'tripod_turnstile');
  gate('RYT', 'RYT-ECU-X04', 54, 'exit', 'swing_gate', true);
  /* GDC: 5+1 entry (E06 swing gate 6), 5+1 exit (X06 swing gate 56) */
  for (let i = 1; i <= 5; i++) gate('GDC', `GDC-ECU-E0${i}`, i, 'entry', 'tripod_turnstile');
  gate('GDC', 'GDC-ECU-E06', 6, 'entry', 'swing_gate', true);
  for (let i = 1; i <= 5; i++) gate('GDC', `GDC-ECU-X0${i}`, 50 + i, 'exit', 'tripod_turnstile');
  gate('GDC', 'GDC-ECU-X06', 56, 'exit', 'swing_gate', true);

  for (const s of ['VCT', 'VDP', 'RYT', 'GDC']) {
    dev(s, `${s}-TOM-01`, 'TOM');
    dev(s, `${s}-TVM-01`, 'TVM'); dev(s, `${s}-TVM-02`, 'TVM');
    dev(s, `${s}-EFO-01`, 'EXCESS_FARE');
    dev(s, `${s}-SRV-01`, 'STATION_SERVER');
  }
  /* the one device that has reported: VCT-TOM-01 */
  const t = d.find(x => x.code === 'VCT-TOM-01');
  t.fareV = 1; t.lastSeen = Date.now() - 4 * 60000; t.appVersion = '0.1.0'; t.clockSkewMs = -2;
  return d;
}

/* ---------- products (4) — all SAC 996429 ---------- */
const PRODUCTS = [
  { code: 'SINGLE_JOURNEY',  en: 'Single Journey Ticket',          hi: 'एकल यात्रा टिकट',   category: 'single_journey', sac: '996429', trips: 1, ticketsPerSale: 1, returnLeg: false, fulfilment: 'direct_qr',    idCheck: false, tom: true, tvm: true,  ptypes: ['adult'], maxQty: 10, order: 10, status: 'active',
    descEn: '' },
  { code: 'RETURN_JOURNEY',  en: 'Return Journey Ticket',          hi: 'वापसी यात्रा टिकट', category: 'return_journey', sac: '996429', trips: 1, ticketsPerSale: 2, returnLeg: true,  fulfilment: 'direct_qr',    idCheck: false, tom: true, tvm: true,  ptypes: ['adult'], maxQty: 10, order: 20, status: 'active',
    descEn: '' },
  { code: 'CONCESSION_SINGLE', en: 'Concessional — Single Journey', hi: 'रियायती — एकल यात्रा', category: 'concession',   sac: '996429', trips: 1, ticketsPerSale: 1, returnLeg: false, fulfilment: 'booking_code', idCheck: true,  tom: true, tvm: false, ptypes: ['child', 'senior', 'differently_abled', 'student'], maxQty: 10, order: 50, status: 'draft',
    descEn: 'Phase 2 — concessions require identity verification (s.2 scope table)' },
  { code: 'GROUP_SINGLE',    en: 'Group — Single Journey',         hi: 'समूह — एकल यात्रा', category: 'group',          sac: '996429', trips: 1, ticketsPerSale: 1, returnLeg: false, fulfilment: 'direct_qr',    idCheck: false, tom: true, tvm: true,  ptypes: ['adult'], maxQty: 10, order: 60, status: 'draft',
    descEn: 'Phase 2 — consolidated group tickets (s.2 scope table). Rule 12 describes one payment printing tickets separately.' },
];

/* ---------- fare rules (24, paise, tax-EXCLUSIVE; GST 18% added on top) ---------- */
function buildRules() {
  const seqOf = (c) => STN.find(s => s.code === c).seq;
  const rules = [];
  const pairs = [];
  for (const a of STN) for (const b of STN) if (a.code !== b.code) pairs.push([a.code, b.code]);
  for (const product of ['SINGLE_JOURNEY', 'RETURN_JOURNEY']) {
    for (const [o, dst] of pairs) {
      const hops = Math.abs(seqOf(o) - seqOf(dst));
      const base = hops === 1 ? 3000 : hops === 2 ? 5000 : 7000;
      const paise = product === 'RETURN_JOURNEY' ? base * 2 : base;
      /* permitted exits: every station strictly beyond the origin up to and including the destination */
      const dirn = seqOf(dst) > seqOf(o) ? 1 : -1;
      const exits = STN.filter(s => (s.seq - seqOf(o)) * dirn > 0 && (s.seq - seqOf(dst)) * dirn <= 0).map(s => s.code);
      rules.push({ product, from: o, to: dst, passengerType: 'adult', basePaise: paise, taxInclusive: false, exits });
    }
  }
  return rules;
}
/* gross = base + CGST 9% + SGST 9% (each rounded per component) */
const GST_BP = 900; /* per component, basis points of 100ths of a percent /100 → 9.00% */
function taxOn(basePaise) {
  const cgst = Math.round(basePaise * 0.09), sgst = Math.round(basePaise * 0.09);
  return { taxable: basePaise, cgst, sgst, gross: basePaise + cgst + sgst };
}

/* ---------- roles & permissions — exact branch role_permission sets ---------- */
const ROLES = {
  SYSTEM_ADMIN: { label: 'System Administrator', perms: ['alarm.acknowledge','alarm.read','approval.decide','approval.read','audit.read','audit.verify','device.command','device.read','device.write','fare.approve','fare.draft','fare.read','fare.rollback','hotlist.override','hotlist.read','hotlist.write','label.read','label.write','product.read','product.write','promotion.read','promotion.write','reconciliation.read','refund.request','report.adhoc','report.read','report.schedule','role.read','role.write','shift.manage','shift.override','shift.read','station.read','station.write','tax.read','tax.write','user.read','user.role_approve','user.write','zone.read','zone.write'] },
  FINANCE_OFFICER: { label: 'Finance / Reconciliation Officer', perms: ['approval.decide','approval.read','audit.read','device.read','fare.approve','fare.read','product.read','promotion.read','reconciliation.read','reconciliation.write','refund.approve','report.adhoc','report.read','report.schedule','shift.read','station.read','tax.read','tax.write'] },
  STATION_CONTROLLER: { label: 'Station Controller — one station', perms: ['alarm.acknowledge','alarm.read','device.command','device.read','fare.read','hotlist.read','product.read','refund.request','report.read','shift.manage','shift.override','shift.read','station.read','user.read'] },
  TOM_OPERATOR: { label: 'Counter Operator — one station', perms: ['station.read','product.read','fare.read','shift.read','refund.request','hotlist.read','report.read'] },
  EXCESS_FARE_OFFICER: { label: 'Excess Fare Officer', perms: ['device.read','dispute.raise','excess_fare.case','excess_fare.read','excess_fare.waive','fare.read','hotlist.read','product.read','report.read','shift.read','station.read'] },
  AUDITOR: { label: 'Auditor', readOnly: true, perms: ['alarm.read','approval.read','audit.read','audit.verify','device.read','excess_fare.read','fare.read','hotlist.read','label.read','product.read','promotion.read','reconciliation.read','report.read','role.read','shift.read','station.read','tax.read','user.read','zone.read'] },
};

/* ---------- staff (8) ---------- */
const USERS = [
  { username: 'admin.dev',   name: 'Dev Administrator',                 emp: 'VR-ADM-001', role: 'SYSTEM_ADMIN',        station: null,  status: 'active', lastSignIn: Date.now() - 1 * 3600e3 },
  { username: 'auditor.dev', name: 'Dev Auditor',                       emp: 'VR-AUD-001', role: 'AUDITOR',             station: null,  status: 'active', lastSignIn: Date.now() - 7 * 86400e3 },
  { username: 'checker.dev', name: 'Dev Checker',                       emp: 'VR-ADM-002', role: 'SYSTEM_ADMIN',        station: null,  status: 'active', lastSignIn: null },
  { username: 'excess.dev',  name: 'Dev Excess Fare Officer',           emp: 'VR-EFO-001', role: 'EXCESS_FARE_OFFICER', station: 'VCT', status: 'active', lastSignIn: Date.now() - 2 * 86400e3 },
  { username: 'finance.dev', name: 'Dev Finance Officer',               emp: 'VR-FIN-001', role: 'FINANCE_OFFICER',     station: null,  status: 'active', lastSignIn: Date.now() - 5 * 3600e3 },
  { username: 'station.dev', name: 'Dev Station Controller',            emp: 'VR-STN-001', role: 'STATION_CONTROLLER',  station: 'VCT', status: 'active', lastSignIn: Date.now() - 26 * 3600e3 },
  { username: 'tom.dev',     name: 'Dev Counter Operator',              emp: 'VR-TOM-001', role: 'TOM_OPERATOR',        station: 'VCT', status: 'active', lastSignIn: Date.now() - 2 * 3600e3 },
  { username: 'tom.ryt.dev', name: 'Dev Counter Operator (Rath Yatra)', emp: 'VR-TOM-002', role: 'TOM_OPERATOR',        station: 'RYT', status: 'active', lastSignIn: Date.now() - 3 * 86400e3 },
];

/* ---------- excess-fare reason codes (10, exact) ---------- */
const EF_REASONS = [
  { code: 'OVERTRAVEL_BEYOND_DEST',   caseType: 'over_travel',               description: 'Exited beyond the ticketed destination', chargesFine: true,  requiresNotes: false },
  { code: 'CARD_BALANCE_SHORT',       caseType: 'insufficient_card_balance', description: 'Card balance short of the fare due at exit; fare settled at the office', chargesFine: false, requiresNotes: false },
  { code: 'NO_TRAVEL_SAME_STATION',   caseType: 'exit_at_entry_station',     description: 'Entered but did not travel; released at the station of entry', chargesFine: false, requiresNotes: false },
  { code: 'TICKET_LOST',              caseType: 'lost_ticket',               description: 'Passenger inside the paid area cannot produce a ticket', chargesFine: true,  requiresNotes: false },
  { code: 'ENTRY_MISSING_PASSENGER',  caseType: 'no_entry_record',           description: 'No entry record and the passenger cannot account for the entry', chargesFine: true,  requiresNotes: true },
  { code: 'ENTRY_MISSING_SYSTEM',     caseType: 'no_entry_record',           description: 'No entry record because of a device or link failure; raised for investigation', chargesFine: false, requiresNotes: true },
  { code: 'GATE_FAULT',               caseType: 'fault_assisted_passage',    description: 'Gate, reader or scanner failed with a valid medium presented', chargesFine: false, requiresNotes: true },
  { code: 'DISPUTE_CARD_DEDUCTION',   caseType: 'disputed_transaction',      description: 'Query on a card deduction; passed to the Bank through the Back Office', chargesFine: false, requiresNotes: true },
  { code: 'DISPUTE_OTHER',            caseType: 'disputed_transaction',      description: 'Other disputed transaction', chargesFine: false, requiresNotes: true },
  { code: 'DISPUTE_PAYMENT_NO_TICKET', caseType: 'disputed_transaction',     description: 'Payment taken and no ticket issued', chargesFine: false, requiresNotes: true },
];
const EF_TYPES = {
  over_travel: 'Over-travel', insufficient_card_balance: 'Card balance short',
  exit_at_entry_station: 'Exit at station of entry', lost_ticket: 'Lost ticket',
  no_entry_record: 'No entry record', fault_assisted_passage: 'Fault-assisted passage',
  disputed_transaction: 'Disputed transaction',
};

/* ---------- labels (26) ---------- */
function buildLabels() {
  const L = [];
  const add = (ns, key, en, hi, translit) => {
    L.push({ namespace: ns, labelKey: key, locale: 'en-IN', value: en, printerSafe: true, transliteration: null });
    L.push({ namespace: ns, labelKey: key, locale: 'hi-IN', value: hi, printerSafe: false, transliteration: translit });
  };
  for (const s of STN) add('station', s.code, s.en, s.hi, s.en);
  add('product', 'SINGLE_JOURNEY', 'Single Journey Ticket', 'एकल यात्रा टिकट', 'Single Journey Ticket');
  add('product', 'RETURN_JOURNEY', 'Return Journey Ticket', 'वापसी यात्रा टिकट', 'Return Journey Ticket');
  add('product', 'CONCESSION_SINGLE', 'Concessional — Single Journey', 'रियायती — एकल यात्रा', 'Concessional — Single Journey');
  add('product', 'GROUP_SINGLE', 'Group — Single Journey', 'समूह — एकल यात्रा', 'Group — Single Journey');
  add('receipt', 'header', 'Varanasi Ropeway', 'वाराणसी रोपवे', 'Varanasi Ropeway');
  add('receipt', 'thank_you', 'Thank you for travelling with us', 'हमारे साथ यात्रा करने के लिए धन्यवाद', 'Thank you for travelling with us');
  add('receipt', 'tax_note', 'Fare is inclusive of tax', 'किराया कर सहित है', 'Fare is inclusive of tax');
  add('ticket', 'outward_leg', 'Outward leg', 'बाहर जाने वाला चरण', 'Outward leg');
  add('ticket', 'return_leg', 'Return leg', 'वापसी चरण', 'Return leg');
  return L;
}

/* ---------- system config (§33) — set + open points, as on the branch ---------- */
const CONFIG = [
  { key: 'alarm.escalate_after_seconds',      value: null,    confirmed: false, desc: 'How long a high or critical alarm may sit unacknowledged before the console escalates it.' },
  { key: 'device.counter_inactivity_lock',    value: 300,     confirmed: true,  desc: 'Counter inactivity lock (open point 10).' },
  { key: 'device.fare_table_max_age',         value: 86400,   confirmed: true,  desc: 'Maximum age of a cached fare table before selling is suspended.' },
  { key: 'device.kiosk_session_timeout',      value: 120,     confirmed: true,  desc: 'Kiosk session timeout.' },
  { key: 'fare.gst_rate_bp',                  value: 1800,    confirmed: true,  desc: 'GST 18% charged on the fare (CGST 9% + SGST 9%). Closes s.33 open point 15.' },
  { key: 'fare.lost_ticket_fine_paise',       value: 5000,    confirmed: true,  desc: 'Fine for a lost ticket inside the paid area.' },
  { key: 'fare.over_travel_fine_paise',       value: 5000,    confirmed: true,  desc: 'Fine charged on an over-travel, on top of the fare difference.' },
  { key: 'gst.invoice_prefix',                value: 'VRW',   confirmed: false, desc: 'Prefix on the GST invoice series.' },
  { key: 'gst.place_of_supply_code',          value: '09',    confirmed: false, desc: 'Place of supply — Uttar Pradesh.' },
  { key: 'ncmc.discount_bp',                  value: 2000,    confirmed: false, desc: 'NCMC discount applied to the card fare at exit (rule 11).' },
  { key: 'reconciliation.cash_variance_threshold_paise', value: 10000, confirmed: false, desc: 'Variance above which a drawer must be explained.' },
  { key: 'terminal.heartbeat_interval_seconds', value: 30,    confirmed: true,  desc: 'How often a terminal reports its position.' },
  { key: 'terminal.inactivity_lock_seconds',  value: 300,     confirmed: true,  desc: 'Counter inactivity lock and kiosk session timeout. Open point 10.' },
  { key: 'terminal.master_data_max_age_seconds', value: 86400, confirmed: true, desc: 'Maximum age of the cached master data bundle.' },
];

/* ---------- seed DB ---------- */
function seedDB() {
  const now = Date.now();
  return {
    v: 3,
    stations: STN.map(s => ({ ...s })),
    devices: buildDevices(),
    products: PRODUCTS.map(p => ({ ...p })),
    fareVersions: [
      { id: 'fv1', versionNo: 1, title: 'Phase 1 station-pair fares (seed, GST 18% on fare)',
        notes: 'PLACEHOLDER fares for development and UAT. Replace with the approved fare schedule before go-live. Rule 2: fares are charged by station pair.',
        model: 'station_pair', status: 'published', ncmcDiscountBp: 2000,
        effectiveFrom: now - 2 * 86400e3, effectiveTo: null,
        createdBy: 'seed:drafter', submittedBy: 'seed:drafter', approvedBy: 'seed:approver', publishedBy: 'seed:approver',
        contentHash: 'e648d80eda54139815ee3a6d0149ad0618709e255b84d680670247c43d170fc5',
        rules: buildRules(), rollbackOf: null,
        tax: [{ component: 'CGST', rateBp: 900, scope: 'all products' }, { component: 'SGST', rateBp: 900, scope: 'all products' }] },
      { id: 'fv4', versionNo: 4, title: 'UI parity demo revision',
        notes: 'Created to inspect the approval queue UI',
        model: 'station_pair', status: 'pending_approval', ncmcDiscountBp: 0,
        effectiveFrom: null, effectiveTo: null,
        createdBy: 'dev-token:admin.dev', submittedBy: 'dev-token:admin.dev', approvedBy: null, publishedBy: null,
        contentHash: null, rules: buildRules(), rollbackOf: null,
        tax: [{ component: 'CGST', rateBp: 900, scope: 'all products' }, { component: 'SGST', rateBp: 900, scope: 'all products' }] },
    ],
    users: USERS.map(u => ({ ...u })),
    approvals: [
      { id: 'ap7', requestRef: 'APR-2026-000007', operation: 'fare_version.publish', entityType: 'fare_version',
        summary: 'Publish fare version 4 ("UI parity demo revision") with 24 rules, effective 2026-09-01T00:00:00+05:30',
        payload: { effectiveFrom: '2026-09-01T00:00:00+05:30', fareVersionId: 'fv4' },
        amountPaise: null, risk: 'critical', status: 'withdrawn',
        maker: 'admin.dev', makerDisplay: 'Dev Administrator',
        makerReason: 'UI parity inspection — will be refused afterwards | withdrawn: Inspection complete — withdrawing the parity test request',
        madeAt: now - 10 * 3600e3, expiresAt: now + 6.6 * 86400e3, checker: null, checkerDisplay: null, checkerReason: null, decidedAt: null },
    ],
    alarms: [
      { key: 'vct-tom-01:reader_absent', deviceCode: 'VCT-TOM-01', deviceType: 'TOM', stationCode: 'VCT',
        alarmType: 'reader_absent', severity: 'medium', message: 'Card reader is not attached.',
        observedAt: now - 4 * 60000, acknowledgedAt: null, acknowledgedBy: null, escalated: false },
    ],
    incidents: [],
    hotlist: [],
    efCases: [],
    labels: buildLabels(),
    config: CONFIG.map(c => ({ ...c })),
    audit: [
      { seq: 3, ts: now - 10 * 3600e3, actor: 'Dev Administrator', actorType: 'dev-token', action: 'approval.withdraw', entityType: 'approval_request', reason: 'Inspection complete — withdrawing the parity test request', hash: '9c41d2ae' },
      { seq: 2, ts: now - 10.1 * 3600e3, actor: 'Dev Administrator', actorType: 'dev-token', action: 'fare_version.submit', entityType: 'fare_version', reason: 'UI parity inspection — will be refused afterwards', hash: '5b07e1c3' },
      { seq: 1, ts: now - 2 * 86400e3, actor: 'seed:approver', actorType: 'seed', action: 'fare_version.publish', entityType: 'fare_version', reason: null, hash: 'a3f2c81b' },
    ],
    seqCounters: { approval: 7, efCase: 0, hotlist: 0 },
  };
}

/* ---------- store ---------- */
const store = {
  db: null,
  load() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) { this.db = JSON.parse(raw); if (this.db.v === 3) return; }
    } catch (e) { /* fall through to reseed */ }
    this.db = seedDB(); this.save();
  },
  save() { localStorage.setItem(DB_KEY, JSON.stringify(this.db)); },
  reset() { localStorage.removeItem(DB_KEY); this.load(); },
  nextRef(kind) {
    const n = ++this.db.seqCounters[kind];
    return n;
  },
  logAudit(action, entityType, reason, actor) {
    const seq = (this.db.audit[0]?.seq || 0) + 1;
    this.db.audit.unshift({ seq, ts: Date.now(), actor, actorType: 'dev-token', action, entityType, reason: reason || null, hash: Math.random().toString(16).slice(2, 10) });
  },
};
store.load();

/* ---------- session ---------- */
const SES_KEY = 'vr-afc-v3-session';
const session = {
  user: null,
  signIn(username) {
    const u = store.db.users.find(x => x.username === username && x.status === 'active');
    if (!u) return null;
    this.user = u; localStorage.setItem(SES_KEY, username);
    u.lastSignIn = Date.now(); store.save();
    return u;
  },
  restore() {
    const un = localStorage.getItem(SES_KEY);
    if (un) this.user = store.db.users.find(x => x.username === un) || null;
    return this.user;
  },
  signOut() { this.user = null; localStorage.removeItem(SES_KEY); },
  role() { return this.user ? ROLES[this.user.role] : null; },
  can(perm) { return !!this.user && ROLES[this.user.role].perms.includes(perm); },
  isReadOnly() { return !!this.user && !!ROLES[this.user.role].readOnly; },
};

/* fare lookup: gross fare (with 18% GST on top) for product+origin+dest against published version */
function publishedVersion() { return store.db.fareVersions.find(v => v.status === 'published'); }
function fareQuote(product, from, to, qty) {
  const v = publishedVersion(); if (!v) return null;
  const r = v.rules.find(x => x.product === product && x.from === from && x.to === to);
  if (!r) return null;
  const per = taxOn(r.basePaise);
  return {
    taxable: per.taxable * qty, cgst: per.cgst * qty, sgst: per.sgst * qty, gross: per.gross * qty,
    perGross: per.gross, rule: r, version: v,
  };
}
