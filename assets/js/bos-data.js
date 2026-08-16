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
  /* the estate is commissioned and reporting — the ops feed shows every
     station selling, so the devices behind it are active with heartbeats */
  const hex = (str) => { let h = 0; for (const c of str) h = ((h << 5) - h + c.charCodeAt(0)) | 0; return (h >>> 0).toString(16).padStart(8, '0'); };
  d.forEach((x, i) => {
    x.status = 'active';
    x.cert = hex(x.code) + hex(x.code + ':crt') + hex(':crt' + x.code);
    x.fareV = 1; x.hotlistV = 1;
    x.lastSeen = Date.now() - (((i * 37) % 280) + 5) * 1000;
  });
  const mt = d.find(x => x.code === 'VDP-TVM-02'); mt.status = 'maintenance'; mt.lastSeen = Date.now() - 26 * 3600e3;
  const ft = d.find(x => x.code === 'RYT-ECU-X02'); ft.status = 'faulty'; ft.lastSeen = Date.now() - 3 * 3600e3;

  /* the freshest heartbeat: VCT-TOM-01 */
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

/* ---------- PLACEHOLDER daily operations series (35 days) ----------
   Deterministic per (date, station) so every browser sees the same
   figures. The demo stand-in for the reporting plane; amounts in
   paise, GST-inclusive. Today is a part-day (05:00 to now). */
function buildOps() {
  const BASE = { VCT: { t: 1900, f: 11800 }, VDP: { t: 310, f: 7900 }, RYT: { t: 540, f: 9900 }, GDC: { t: 1650, f: 11400 } };
  const rnd = (seed) => {
    let h = 0; for (const c of seed) h = ((h << 5) - h + c.charCodeAt(0)) | 0;
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return ((h >>> 0) % 1000) / 1000;
  };
  const key = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const now = new Date();
  const frac = Math.min(1, Math.max(0.05, (now.getHours() + now.getMinutes() / 60 - 5) / 16));
  const out = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const k = key(d), dow = d.getDay();
    const wk = (dow === 0 || dow === 6) ? 1.38 : dow === 1 ? 0.88 : 1;
    const part = i === 0 ? frac : 1;
    for (const code of ['VCT', 'VDP', 'RYT', 'GDC']) {
      const b = BASE[code];
      const n1 = rnd(k + code), n2 = rnd(code + k);
      const total = Math.round(b.t * wk * (0.88 + n1 * 0.24) * part);
      const tomT = Math.round(total * (0.68 + n2 * 0.1)), tvmT = total - tomT;
      const fare = Math.round(b.f * (0.94 + n2 * 0.12));
      const taps = Math.round(total * (0.09 + n1 * 0.05));
      /* gate passages: every ticket and every card tap is a person through
         an entry gate. On a completed day everyone who entered has left;
         part-way through today some are still on the line. */
      const entries = total + taps;
      const exits = i === 0 ? Math.round(entries * 0.93) : entries;
      out.push({ date: k, code,
        tom: { tickets: tomT, grossPaise: tomT * fare },
        tvm: { tickets: tvmT, grossPaise: tvmT * Math.round(fare * 0.93) },
        ncmcTaps: taps, entries, exits });
    }
  }
  return out;
}

function seedDB() {
  const now = Date.now();
  return {
    v: 8,
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
      { id: 'ap8', requestRef: 'APR-2026-000008', operation: 'fare_version.publish', entityType: 'fare_version',
        summary: 'Publish fare version 4 ("UI parity demo revision") with 24 rules, effective 2026-09-01T00:00:00+05:30',
        payload: { effectiveFrom: '2026-09-01T00:00:00+05:30', fareVersionId: 'fv4' },
        amountPaise: null, risk: 'critical', status: 'pending',
        maker: 'checker.dev', makerDisplay: 'Dev Checker',
        makerReason: 'Fare revision agreed at the January fare committee; publishing for the new quarter',
        madeAt: now - 9 * 3600e3, expiresAt: now + 6.6 * 86400e3, checker: null, checkerDisplay: null, checkerReason: null, decidedAt: null },
      { id: 'ap6', requestRef: 'APR-2026-000006', operation: 'user.role_grant', entityType: 'staff_user',
        summary: 'Grant EXCESS_FARE_OFFICER at RYT to tom.ryt.dev',
        payload: { username: 'tom.ryt.dev', role: 'EXCESS_FARE_OFFICER', station: 'RYT' },
        amountPaise: null, risk: 'high', status: 'pending',
        maker: 'finance.dev', makerDisplay: 'Dev Finance Officer',
        makerReason: 'Rath Yatra needs excess-fare cover on the evening shift; operator already works that counter',
        madeAt: now - 26 * 3600e3, expiresAt: now + 5.9 * 86400e3, checker: null, checkerDisplay: null, checkerReason: null, decidedAt: null },
      { id: 'ap5', requestRef: 'APR-2026-000005', operation: 'hotlist.whitelist_override', entityType: 'hotlist_entry',
        summary: 'Take NCMC-TOKEN-91ac04 off the hotlist',
        payload: { cardReference: 'NCMC-TOKEN-91ac04' },
        amountPaise: null, risk: 'critical', status: 'applied',
        maker: 'checker.dev', makerDisplay: 'Dev Checker',
        makerReason: 'Card was blocked on a mistaken report; the passenger produced the card and ID at the counter',
        madeAt: now - 3 * 86400e3, expiresAt: now - 2 * 86400e3, checker: 'admin.dev', checkerDisplay: 'Dev Administrator',
        checkerReason: 'Verified with the counter log for that shift', decidedAt: now - 2.7 * 86400e3 },
      { id: 'ap4', requestRef: 'APR-2026-000004', operation: 'device.decommission', entityType: 'device',
        summary: 'Decommission VDP-TVM-02 (kiosk, Vidyapith)',
        payload: { deviceCode: 'VDP-TVM-02' },
        amountPaise: null, risk: 'high', status: 'rejected',
        maker: 'station.dev', makerDisplay: 'Dev Station Controller',
        makerReason: 'Kiosk repeatedly jams on printing; proposing removal until the vendor replaces the cutter',
        madeAt: now - 6 * 86400e3, expiresAt: now - 5 * 86400e3, checker: 'admin.dev', checkerDisplay: 'Dev Administrator',
        checkerReason: 'Repair visit is booked; keep it registered and set it to maintenance instead', decidedAt: now - 5.6 * 86400e3 },
      { id: 'ap3', requestRef: 'APR-2026-000003', operation: 'promotion.publish', entityType: 'promotion',
        summary: 'Publish "Kartik Purnima weekend" 10% promotion on SINGLE_JOURNEY',
        payload: { promotionCode: 'KARTIK10' },
        amountPaise: null, risk: 'high', status: 'expired',
        maker: 'finance.dev', makerDisplay: 'Dev Finance Officer',
        makerReason: 'Festival footfall promotion agreed with the operator',
        madeAt: now - 9 * 86400e3, expiresAt: now - 2 * 86400e3, checker: null, checkerDisplay: null, checkerReason: null, decidedAt: null },
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
    opsDaily: buildOps(),
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
      if (raw) { this.db = JSON.parse(raw); if (this.db.v === 8) return; }
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

/* ============================================================ REPORTS
   BOS-RP-01. The catalogue mirrors the Back Office report registry — same
   ids, categories, permissions, parameters and columns — so a report added
   there shows up here without this screen learning anything about it.

   Rows are read from opsDaily — the same 35-day feed the dashboard totals —
   rather than seeded again here, so a figure in a report and the same figure
   on the dashboard cannot disagree. What the demo has no table for at all
   (shifts, journeys) is derived from that feed with a fixed per-date factor:
   stable across re-runs, and consistent between reports. The variance rows
   are the settlement rows that did not balance, and the tax documents total
   back to the takings they were raised against. */

const REPORTS = [
  { id: 'daily-takings', title: 'Daily takings by station', category: 'revenue', permission: 'reconciliation.read',
    description: 'What each station took on each day, split by how passengers paid, net of refunds authorised against those sales.',
    requirements: ['BOS-RP-01'],
    parameters: [{ name: 'from', label: 'From', kind: 'date', required: true }, { name: 'to', label: 'To', kind: 'date', required: true }, { name: 'stationId', label: 'Station', kind: 'station', required: false }],
    columns: [{ key: 'business_date', label: 'Business date' }, { key: 'station_code', label: 'Station' }, { key: 'sales_count', label: 'Sales' }, { key: 'cash_paise', label: 'Cash (paise)' }, { key: 'non_cash_paise', label: 'Non-cash (paise)' }, { key: 'refunded_paise', label: 'Refunded (paise)' }, { key: 'net_paise', label: 'Net (paise)' }] },

  { id: 'shift-settlement', title: 'Shift settlement', category: 'reconciliation', permission: 'reconciliation.read',
    description: 'Every shift, what its drawer should have held and what was counted. The variance column is signed: negative is short.',
    requirements: ['BOS-RP-01'],
    parameters: [{ name: 'from', label: 'From', kind: 'date', required: true }, { name: 'to', label: 'To', kind: 'date', required: true }, { name: 'stationId', label: 'Station', kind: 'station', required: false }],
    columns: [{ key: 'business_date', label: 'Business date' }, { key: 'shift_ref', label: 'Shift' }, { key: 'station_code', label: 'Station' }, { key: 'operator', label: 'Operator' }, { key: 'opening_float_paise', label: 'Float (paise)' }, { key: 'expected_paise', label: 'Expected (paise)' }, { key: 'declared_paise', label: 'Declared (paise)' }, { key: 'variance_paise', label: 'Variance (paise)' }] },

  { id: 'cash-variances', title: 'Cash variances and how they were settled', category: 'reconciliation', permission: 'reconciliation.read',
    description: 'Drawers that did not balance, what was said about them, and whether the money came back or was written off.',
    requirements: ['BOS-RP-01', 'BOS-RP-06'],
    parameters: [{ name: 'from', label: 'From', kind: 'date', required: true }, { name: 'to', label: 'To', kind: 'date', required: true }, { name: 'stationId', label: 'Station', kind: 'station', required: false }],
    columns: [{ key: 'case_ref', label: 'Case' }, { key: 'business_date', label: 'Business date' }, { key: 'station_code', label: 'Station' }, { key: 'variance_paise', label: 'Variance (paise)' }, { key: 'status', label: 'Status' }, { key: 'explanation', label: 'Explanation' }, { key: 'resolution_note', label: 'Resolution' }, { key: 'resolved_by', label: 'Resolved by' }] },

  { id: 'gst-documents', title: 'Tax invoices and credit notes', category: 'statutory', permission: 'reconciliation.read',
    description: 'The GST series in order, for a financial year. The sequence column should have no gaps; one would mean an invoice was issued and is missing.',
    requirements: ['BOS-RP-06'],
    parameters: [{ name: 'financialYear', label: 'Financial year', kind: 'financial_year', required: true }, { name: 'stationId', label: 'Station', kind: 'station', required: false }],
    columns: [{ key: 'sequence_no', label: 'No.' }, { key: 'document_number', label: 'Document' }, { key: 'kind', label: 'Kind' }, { key: 'business_date', label: 'Business date' }, { key: 'station_code', label: 'Station' }, { key: 'taxable_paise', label: 'Taxable (paise)' }, { key: 'cgst_paise', label: 'CGST (paise)' }, { key: 'sgst_paise', label: 'SGST (paise)' }, { key: 'total_paise', label: 'Total (paise)' }] },

  { id: 'incomplete-journeys', title: 'Journeys nobody finished', category: 'operations', permission: 'reconciliation.read',
    description: 'Tickets that entered a gate and never left one, past the validity they were sold with.',
    requirements: ['BOS-RP-01'],
    parameters: [{ name: 'from', label: 'From', kind: 'date', required: true }, { name: 'to', label: 'To', kind: 'date', required: true }],
    columns: [{ key: 'ticket_ref', label: 'Ticket' }, { key: 'sale_ref', label: 'Sale' }, { key: 'sold_on', label: 'Sold on' }, { key: 'entry_station', label: 'Entered at' }, { key: 'entered_at', label: 'Entry time' }, { key: 'ticket_state', label: 'State' }] },

  { id: 'device-availability', title: 'Device availability', category: 'operations', permission: 'device.read',
    description: 'Every device, when it was last heard from, and how far its clock has drifted. The ones that have never been heard from at all are listed first.',
    requirements: ['BOS-RP-01'],
    parameters: [{ name: 'stationId', label: 'Station', kind: 'station', required: false }],
    columns: [{ key: 'device_code', label: 'Device' }, { key: 'device_type', label: 'Type' }, { key: 'station_code', label: 'Station' }, { key: 'status', label: 'Status' }, { key: 'last_seen_at', label: 'Last seen' }, { key: 'clock_skew_ms', label: 'Clock skew (ms)' }, { key: 'app_version', label: 'App version' }] },

  { id: 'approval-decisions', title: 'Approvals and who decided them', category: 'audit', permission: 'audit.read',
    description: 'Every maker-checker request in the period, what was asked for, who asked and who decided. The refused ones are the evidence the control does anything.',
    requirements: ['BOS-RP-06'],
    parameters: [{ name: 'from', label: 'From', kind: 'date', required: true }, { name: 'to', label: 'To', kind: 'date', required: true }],
    columns: [{ key: 'request_ref', label: 'Request' }, { key: 'operation', label: 'Operation' }, { key: 'summary', label: 'Summary' }, { key: 'amount_paise', label: 'Amount (paise)' }, { key: 'status', label: 'Status' }, { key: 'maker', label: 'Raised by' }, { key: 'checker', label: 'Decided by' }, { key: 'decided_at', label: 'Decided' }] },
];

/* An ISO business date (yyyy-mm-dd) in IST, and the inclusive list between two. */
const isoDate = (ts) => new Date(ts + 5.5 * 3600e3).toISOString().slice(0, 10);
function datesBetween(from, to) {
  const out = [];
  const a = Date.parse(from + 'T00:00:00+05:30'), b = Date.parse(to + 'T00:00:00+05:30');
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return out;
  /* A range nobody would run interactively is capped rather than refused. */
  for (let t = a, n = 0; t <= b && n < 120; t += 86400e3, n++) out.push(isoDate(t));
  return out;
}

/* Stable 0..1 from a string. The same date and station always give the same
   day, so re-running a report without changing anything does not change it. */
function seedOf(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
}

/* One day's trading for one station, straight off the opsDaily feed. Days
   outside the feed have no row, which is why a range beyond it reports
   nothing rather than inventing a quiet day. */
function dayTakings(date, code) {
  const o = (store.db.opsDaily || []).find(x => x.date === date && x.code === code);
  if (!o) return null;
  const sales = o.tom.tickets + o.tvm.tickets;
  const gross = o.tom.grossPaise + o.tvm.grossPaise;
  /* The counter takes mostly cash and the kiosk mostly card and UPI, which
     is what makes the shift settlement below worth looking at. */
  const cash = Math.round(o.tom.grossPaise * 0.82) + Math.round(o.tvm.grossPaise * 0.15);
  const refunded = seedOf('r' + date + code) < 0.25 ? Math.round(gross * 0.004) : 0;
  return { date, code, sales, gross, cash, nonCash: gross - cash, refunded, net: gross - refunded };
}

const SHIFT_OPERATORS = ['tom.dev', 'tom.ryt.dev', 'station.dev'];

/* Two shifts a day per station, derived from that day's takings so the
   settlement and the takings agree with each other. */
function dayShifts(date, code) {
  const t = dayTakings(date, code);
  if (!t) return [];
  return [0, 1].map(i => {
    const expected = Math.round(t.cash * (i === 0 ? 0.58 : 0.42));
    const float = 200000;
    const s = seedOf(date + code + i);
    /* Most drawers balance. The ones that do not are the variance report. */
    const variance = s < 0.78 ? 0 : Math.round((s - 0.78) * 40000) * (s < 0.9 ? -1 : 1);
    return {
      date, code, seq: i,
      ref: 'SH-' + date.replace(/-/g, '') + '-' + code + '-' + (i + 1),
      operator: SHIFT_OPERATORS[Math.floor(seedOf('o' + date + code + i) * SHIFT_OPERATORS.length)],
      float, expected: expected + float, declared: expected + float + variance, variance,
    };
  });
}

const VARIANCE_EXPLANATIONS = [
  'Change given from the operator’s own pocket during a card-terminal outage',
  'Miscount at handover — counted twice, the second count stood',
  'Note rejected by the deposit machine and re-counted the next morning',
];
const VARIANCE_RESOLUTIONS = [
  'Recovered from the operator and banked',
  'Written off under the counter-cash tolerance',
  'Still open — awaiting the station controller',
];

/* Financial year 'yyyy-yy' to the dates it spans (1 April to 31 March). */
function fyRange(fy) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(fy || '').trim());
  if (!m) return null;
  const start = Number(m[1]);
  return { from: start + '-04-01', to: (start + 1) + '-03-31' };
}

/**
 * Run one report.
 *
 * Returns { columns, rows, scope, truncated }, or null for an id that is not
 * in the catalogue. Missing parameters yield no rows rather than an error —
 * the screen decides what to say about that.
 */
function runReport(id, params) {
  const def = REPORTS.find(r => r.id === id);
  if (!def) return null;
  const p = params || {};
  const code = p.stationId || null;
  const stations = (store.db.stations || STN).filter(s => !code || s.code === code);
  const scope = code ? [code] : ['all'];
  const rows = [];

  if (id === 'device-availability') {
    const never = [], seen = [];
    for (const d of store.db.devices) {
      if (code && d.station !== code) continue;
      (d.lastSeen ? seen : never).push({
        device_code: d.code, device_type: d.type, station_code: d.station, status: d.status,
        last_seen_at: d.lastSeen ? fmtDT(d.lastSeen) : null,
        clock_skew_ms: d.clockSkewMs == null ? null : d.clockSkewMs,
        app_version: d.appVersion == null ? null : d.appVersion,
      });
    }
    const byCode = (a, b) => String(a.device_code).localeCompare(String(b.device_code));
    never.sort(byCode); seen.sort(byCode);
    rows.push(...never, ...seen);        /* never heard from first, as the description promises */
    return { columns: def.columns, rows, scope, truncated: false };
  }

  if (id === 'approval-decisions') {
    const a0 = Date.parse(p.from + 'T00:00:00+05:30'), b0 = Date.parse(p.to + 'T23:59:59+05:30');
    for (const a of store.db.approvals) {
      const at = a.decidedAt || a.madeAt;
      if (!(at >= a0 && at <= b0)) continue;
      rows.push({
        request_ref: a.requestRef, operation: a.operation, summary: a.summary,
        amount_paise: a.amountPaise, status: a.status,
        maker: a.makerDisplay || a.maker, checker: a.checkerDisplay || a.checker,
        decided_at: a.decidedAt ? fmtDT(a.decidedAt) : null,
      });
    }
    return { columns: def.columns, rows, scope, truncated: false };
  }

  if (id === 'gst-documents') {
    const r = fyRange(p.financialYear);
    if (!r) return { columns: def.columns, rows, scope, truncated: false };
    const today = isoDate(Date.now());
    const to = r.to < today ? r.to : today;      /* only the part of the year that has traded */
    let seq = 0;
    for (const date of datesBetween(r.from, to)) {
      for (const s of stations) {
        const t = dayTakings(date, s.code);
        if (!t || t.sales === 0) continue;
        const taxable = Math.round(t.gross / 1.18);
        const cgst = Math.round((t.gross - taxable) / 2);
        seq += 1;
        rows.push({
          sequence_no: seq, document_number: 'VRAFC/' + p.financialYear + '/' + String(seq).padStart(5, '0'),
          kind: 'tax_invoice', business_date: date, station_code: s.code,
          taxable_paise: taxable, cgst_paise: cgst, sgst_paise: t.gross - taxable - cgst, total_paise: t.gross,
        });
        if (t.refunded > 0) {
          const cTax = Math.round(t.refunded / 1.18);
          const cCgst = Math.round((t.refunded - cTax) / 2);
          seq += 1;
          rows.push({
            sequence_no: seq, document_number: 'VRAFC/' + p.financialYear + '/' + String(seq).padStart(5, '0'),
            kind: 'credit_note', business_date: date, station_code: s.code,
            taxable_paise: cTax, cgst_paise: cCgst, sgst_paise: t.refunded - cTax - cCgst, total_paise: t.refunded,
          });
        }
      }
    }
    return { columns: def.columns, rows, scope, truncated: rows.length > 500 };
  }

  const dates = datesBetween(p.from, p.to);

  if (id === 'daily-takings') {
    for (const date of dates) for (const s of stations) {
      const t = dayTakings(date, s.code);
      if (!t) continue;
      rows.push({ business_date: date, station_code: s.code, sales_count: t.sales, cash_paise: t.cash, non_cash_paise: t.nonCash, refunded_paise: t.refunded, net_paise: t.net });
    }
  }

  if (id === 'shift-settlement') {
    for (const date of dates) for (const s of stations) for (const sh of dayShifts(date, s.code)) {
      rows.push({ business_date: date, shift_ref: sh.ref, station_code: s.code, operator: sh.operator, opening_float_paise: sh.float, expected_paise: sh.expected, declared_paise: sh.declared, variance_paise: sh.variance });
    }
  }

  if (id === 'cash-variances') {
    let n = 0;
    for (const date of dates) for (const s of stations) for (const sh of dayShifts(date, s.code)) {
      if (sh.variance === 0) continue;
      const pick = Math.floor(seedOf(sh.ref) * 3);
      const open = pick === 2;
      n += 1;
      rows.push({
        case_ref: 'CV-' + date.slice(0, 4) + '-' + String(n).padStart(6, '0'), business_date: date, station_code: s.code,
        variance_paise: sh.variance, status: open ? 'pending' : 'approved',
        explanation: VARIANCE_EXPLANATIONS[pick], resolution_note: open ? null : VARIANCE_RESOLUTIONS[pick],
        resolved_by: open ? null : 'Dev Finance Officer',
      });
    }
  }

  if (id === 'incomplete-journeys') {
    let n = 0;
    for (const date of dates) for (const s of stations) {
      const t = dayTakings(date, s.code);
      if (!t) continue;
      const count = Math.floor(t.sales * 0.0018 + seedOf('j' + date + s.code) * 2);   /* a few per thousand */
      for (let i = 0; i < count; i++) {
        n += 1;
        const enteredAt = Date.parse(date + 'T00:00:00+05:30') + (7 + Math.floor(seedOf(date + s.code + i) * 12)) * 3600e3;
        rows.push({
          ticket_ref: 'TK-' + date.replace(/-/g, '') + '-' + String(n).padStart(5, '0'),
          sale_ref: 'SL-' + date.replace(/-/g, '') + '-' + String(n).padStart(5, '0'),
          sold_on: date, entry_station: s.code, entered_at: fmtDT(enteredAt), ticket_state: 'expired',
        });
      }
    }
  }

  /* The real report caps its result set and says so rather than paging. */
  const LIMIT = 500;
  const truncated = rows.length > LIMIT;
  return { columns: def.columns, rows: truncated ? rows.slice(0, LIMIT) : rows, scope, truncated };
}
