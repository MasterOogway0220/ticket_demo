/* ============================================================
   EFO terminal — GDC-EFO-01. The station's problem desk:
   seven case types (System Flow §10), fare + fine recorded
   apart, no release without a case and a reason.
   Shares the localStorage DB with BOS and the counter.
   ============================================================ */

const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

const TERMINAL = { station: 'GDC', device: 'GDC-EFO-01' };
const ESES_KEY = 'vr-afc-efo-session';

const E = {
  op: null, shift: null,
  link: 'online', queued: [],
  caseType: null,
  input: {},            /* per-case entry values */
  computed: null,       /* {fare, fine, note, releaseOnly} */
  payMode: null, tendered: 0,
};

/* ---------- helpers ---------- */
function cfg(key, fb) { const c = store.db.config.find(x => x.key === key); return c ? c.value : fb; }
function fareBetween(a, b) {
  const f = store.db.fares.find(x => x.pair === `${a}-${b}` || x.pair === `${b}-${a}`);
  return f ? f.sjt : 0;
}
function toast(msg) {
  $('#toastMsg').textContent = msg;
  const t = $('#toast'); t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2800);
}
function show(id) {
  $$('.view').forEach(v => v.classList.toggle('on', v.id === id));
  if (window.Motion) Motion.view($('#' + id));
}
function flash(title, body, ms = 2000) {
  $('#flashT').textContent = title; $('#flashP').textContent = body;
  const f = $('#flash'); f.classList.add('open');
  if (window.Motion) Motion.pop(f.querySelector('.fcard'));
  setTimeout(() => f.classList.remove('open'), ms);
}
function tick() {
  const d = new Date();
  $('#thClock').textContent = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  $('#thDate').textContent = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
function renderLink() {
  const dot = $('#linkDot');
  dot.textContent = E.link === 'online' ? 'linked' : 'offline';
  dot.classList.toggle('bad', E.link !== 'online');
  const qc = $('#queueChip');
  qc.style.display = E.queued.length ? '' : 'none';
  $('#queueN').textContent = `queue ${E.queued.length}`;
}
function cycleLink() {
  E.link = E.link === 'online' ? 'offline' : 'online';
  if (E.link === 'online' && E.queued.length) {
    const n = E.queued.length; E.queued = [];
    toast(`Link restored — ${n} case${n > 1 ? 's' : ''} forwarded to the Back Office`);
  } else if (E.link === 'offline') {
    toast('Offline — the office continues; cases and fines are recorded locally and queued');
  }
  renderLink();
}

/* ---------- login (same rule as the counter: station-bound) ---------- */
const OFFICER_ROLES = ['EXCESS_FARE_OFFICER', 'STATION_CONTROLLER', 'SYSTEM_ADMIN'];
function tryLogin(username) {
  const err = $('#tLoginErr');
  const u = store.db.users.find(x => x.username === username);
  if (!u || u.status !== 'active') { err.textContent = 'Unknown or suspended officer.'; err.classList.add('show'); return; }
  if (!OFFICER_ROLES.includes(u.role)) {
    err.textContent = `${(ROLES[u.role] || { label: u.role }).label} cannot operate the Excess Fare Office.`;
    err.classList.add('show'); return;
  }
  if (u.station !== '—' && u.station !== TERMINAL.station) {
    err.textContent = `Working as intended: ${u.username} is assigned to ${u.station}, and this terminal is ${TERMINAL.station}. Use excess.dev here.`;
    err.classList.add('show'); return;
  }
  err.classList.remove('show');
  E.op = { username: u.username, name: u.name };
  localStorage.setItem(ESES_KEY, JSON.stringify(E.op));
  afterLogin();
}
function afterLogin() {
  $('#thOp').style.display = ''; $('#thLogout').style.display = '';
  $('#thOpName').textContent = E.op.name; $('#thOpId').textContent = E.op.username;
  E.shift = store.db.shifts.find(s => s.operator === E.op.username && s.device === TERMINAL.device && s.status === 'open') || null;
  if (E.shift) { show('v-ws'); renderCaseTypes(); renderShift(); renderLog(); }
  else { show('v-float'); renderDenoms(); }
}
function signOut() { localStorage.removeItem(ESES_KEY); location.reload(); }

/* ---------- float / shift (counter chassis) ---------- */
const DENOMS = [500, 200, 100, 50, 20, 10, 5, 2, 1];
function renderDenoms() {
  $('#denoms').innerHTML = DENOMS.map(d => `
    <div class="denom">
      <label>₹${d} ${d >= 10 ? 'notes' : 'coins'}</label>
      <input type="number" min="0" step="1" value="0" data-d="${d}" inputmode="numeric">
      <div class="sub" data-sub="${d}">₹0</div>
    </div>`).join('');
  $$('#denoms input').forEach(i => i.addEventListener('input', updFloat));
  updFloat();
}
function floatTotal() { return $$('#denoms input').reduce((a, i) => a + (Number(i.value) || 0) * Number(i.dataset.d), 0); }
function updFloat() {
  $$('#denoms input').forEach(i => { $(`[data-sub="${i.dataset.d}"]`).textContent = fmtINR((Number(i.value) || 0) * Number(i.dataset.d)); });
  $('#floatTotal').textContent = fmtINR(floatTotal());
}
function openShift() {
  E.shift = { id: store.nextId('sh'), operator: E.op.username, device: TERMINAL.device,
    station: TERMINAL.station, openedAt: Date.now(), float: floatTotal(), status: 'open' };
  store.db.shifts.unshift(E.shift);
  store.logAudit('create', 'Shift', `${E.op.username} opened ${TERMINAL.device} with float ${fmtINR(E.shift.float)}`);
  store.save();
  toast(`Shift open — float ${fmtINR(E.shift.float)} declared`);
  show('v-ws'); renderCaseTypes(); renderShift(); renderLog();
}

/* ============================================================
   THE SEVEN CASES (System Flow §10.1–10.7)
   ============================================================ */
const FINE = () => cfg('OVERTRAVEL_FINE', 50);
const CASES = [
  { id: 'overtravel', t: 'Over-travel', fee: () => `+₹${FINE()} fine`,
    d: 'Travelled beyond the ticketed destination. Fare difference plus the fine; an Over-Travel Ticket opens the exit gate.' },
  { id: 'shortbal', t: 'Short card balance at exit', fee: () => 'fare due',
    d: 'NCMC balance cannot cover the fare. Nothing was taken at entry, so the fare is settled here in cash, UPI or card.' },
  { id: 'exitentry', t: 'Exit at station of entry', fee: () => 'no charge',
    d: 'Entered but did not travel. The journey is closed without a fare adjustment (assumption 2).' },
  { id: 'lost', t: 'Lost ticket in the paid area', fee: () => `₹${FINE()} fine`,
    d: 'The entry cannot be matched to a ticket, so the configured fine applies with a receipt.' },
  { id: 'noentry', t: 'No entry record', fee: () => 'fine or fault',
    d: 'A medium at the exit with no matching entry. Fine — unless the entry was lost to a device fault, then no charge.' },
  { id: 'fault', t: 'Assisted passage on fault', fee: () => 'no charge',
    d: 'The gate or reader failed against a valid medium. Release free; the fault is raised against the device.' },
  { id: 'dispute', t: 'Disputed transaction', fee: () => 'no charge',
    d: 'A query about a deduction or a payment without a ticket. Recorded and raised to the Back Office; card value goes to the Bank.' },
];
const REASONS = {
  overtravel: ['Chose to continue past destination', 'Boarded wrong direction', 'Missed the alighting station'],
  shortbal: ['Balance below fare at exit', 'Top-up failed en route'],
  exitentry: ['Changed mind before boarding', 'Entered by mistake', 'Medical / assistance'],
  lost: ['Ticket lost inside paid area', 'Ticket damaged beyond scanning'],
  noentry: ['Cannot account for entry', 'Entry lost to device fault (no fine)'],
  fault: ['Gate motor fault', 'Scanner fault', 'Reader fault'],
  dispute: ['Card deducted, journey refused', 'Paid but no ticket issued', 'Double deduction suspected'],
};

function renderCaseTypes() {
  $('#caseTypes').innerHTML = CASES.map(c => `
    <button class="case-tile ${E.caseType === c.id ? 'on' : ''}" data-case="${c.id}">
      <span class="fee">${c.fee()}</span><b>${c.t}</b><span>${c.d}</span>
    </button>`).join('');
  $$('#caseTypes .case-tile').forEach(b => b.addEventListener('click', () => {
    E.caseType = b.dataset.case; E.input = {}; E.computed = null;
    renderCaseTypes(); renderCaseForm(); renderBill();
  }));
  renderCaseForm(); renderBill();
}

const sel = (id, label, opts, help) => `
  <div class="field"><label for="${id}">${label}</label>
    <select id="${id}">${opts.map(o => `<option value="${o.v}">${o.t}</option>`).join('')}</select>
    ${help ? `<div class="fhelp">${help}</div>` : ''}</div>`;
const inp = (id, label, ph, help) => `
  <div class="field"><label for="${id}">${label}</label>
    <input id="${id}" placeholder="${ph}" style="padding-left:16px">
    ${help ? `<div class="fhelp">${help}</div>` : ''}</div>`;
const stnOpts = (excl) => STN.filter(s => s.code !== excl).map(s => ({ v: s.code, t: `${s.code} — ${s.en}` }));

function renderCaseForm() {
  const c = CASES.find(x => x.id === E.caseType);
  const cf = $('#caseForm');
  if (!c) { cf.innerHTML = ''; return; }
  let html = `<h3 style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--b-ink-faint);font-family:var(--font-body);font-weight:700;margin:18px 0 10px">${c.t}</h3>`;
  switch (c.id) {
    case 'overtravel':
      html += inp('c_ref', 'Scan / enter the ticket', 'VCT-20260815-000123-1', 'The system shows the ticketed pair and the exit attempted.') +
        sel('c_origin', 'Ticketed origin', stnOpts('GDC')) +
        sel('c_dest', 'Ticketed destination', stnOpts()) ;
      break;
    case 'shortbal':
      html += inp('c_ref', 'Card — last 4 digits', '1234') +
        sel('c_entry', 'Entry station on the card', stnOpts('GDC'), 'Fare is computed for the actual entry → exit pair; the card journey closes without a deduction.');
      break;
    case 'exitentry':
      html += inp('c_ref', 'Scan the ticket or card', 'ref…', 'The entry record is confirmed and the journey closed with a no-travel flag.');
      break;
    case 'lost':
      html += inp('c_ref', 'Passenger name (no ticket reference exists)', 'name…');
      break;
    case 'noentry':
      html += inp('c_ref', 'Medium reference', 'ticket / card ref…');
      break;
    case 'fault':
      html += inp('c_ref', 'Medium reference', 'ticket / card ref…') +
        sel('c_dev', 'Failed device', store.db.devices.filter(d => d.station === 'GDC' && d.type.includes('ECU')).map(d => ({ v: d.code, t: d.code })), 'The fault is raised against the device for maintenance.');
      break;
    case 'dispute':
      html += inp('c_ref', 'Transaction / card / ticket reference', 'ref…') ;
      break;
  }
  html += sel('c_reason', 'Reason code *', REASONS[c.id].map(r => ({ v: r, t: r })), 'Reason code lists are a project dependency (System Flow §34.10) — placeholders shown.');
  cf.innerHTML = html;
  $$('#caseForm select, #caseForm input').forEach(el => el.addEventListener('input', compute));
  compute();
}

function compute() {
  const c = E.caseType;
  if (!c) return;
  const v = id => ($(id) ? $(id).value : '');
  let fare = 0, fine = 0, note = '', releaseOnly = false;
  if (c === 'overtravel') {
    const o = v('#c_origin') || 'VCT', d = v('#c_dest') || 'VDP';
    const paid = fareBetween(o, d), due = fareBetween(o, 'GDC');
    fare = Math.max(due - paid, 0); fine = FINE();
    note = `Ticketed ${o} → ${d} (${fmtINR(paid)}); exit attempted at GDC (${fmtINR(due)}). The original ticket closes with an over-travel flag.`;
  } else if (c === 'shortbal') {
    const en = v('#c_entry') || 'VCT';
    fare = fareBetween(en, 'GDC');
    note = `Journey ${en} → GDC settled at the office; the card journey closes without a deduction (assumption 4 variant).`;
  } else if (c === 'exitentry') {
    releaseOnly = true; note = 'No fare was taken at entry and none is taken now. Ticket closes with a no-travel flag.';
  } else if (c === 'lost') {
    fine = FINE(); note = 'Recorded against the station, the officer and the timestamp, with no ticket reference.';
  } else if (c === 'noentry') {
    const fault = (v('#c_reason') || '').includes('fault');
    fine = fault ? 0 : FINE(); releaseOnly = fault;
    note = fault ? 'System fault — no fine; the case is raised for investigation.' : 'The passenger cannot account for the entry.';
  } else if (c === 'fault') {
    releaseOnly = true; note = `Fault-assisted passage. The journey closes correctly; ${v('#c_dev') || 'the device'} is raised for maintenance.`;
  } else if (c === 'dispute') {
    releaseOnly = true; note = 'Recorded and raised to the Back Office. Card-value disputes are passed to the Bank.';
  }
  E.computed = { fare, fine, note, releaseOnly };
  renderBill();
}

function renderBill() {
  const c = CASES.find(x => x.id === E.caseType);
  const b = $('#cbBody');
  if (!c || !E.computed) {
    b.innerHTML = '<p style="color:var(--b-ink-faint);font-size:13px">Choose a case type. The system computes what is due; you record the reason and authorise the release.</p>';
    return;
  }
  const { fare, fine, note, releaseOnly } = E.computed;
  const total = fare + fine;
  b.innerHTML = `
    <div class="brow"><span>Case</span><b>${c.t}</b></div>
    <div class="fee-split">
      <div class="fs"><span>Fare component</span><b>${fmtINR(fare)}</b></div>
      <div class="fs"><span>Fine component</span><b>${fmtINR(fine)}</b></div>
    </div>
    <div class="btotal"><span style="font-weight:700">${releaseOnly && !total ? 'Nothing due' : 'To collect'}</span><span class="amt">${fmtINR(total)}</span></div>
    <div class="gst" style="text-align:left">${note}</div>
    <div class="paystack">
      ${total > 0 ? `
        <button class="paybtn hero" id="payCash">Cash · नकद</button>
        <button class="paybtn" id="payUpi">UPI</button>
        <button class="paybtn" id="payCard">Debit / Credit Card</button>`
      : `<button class="paybtn hero" id="releaseFree">Record case &amp; authorise release</button>`}
    </div>`;
  const on = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };
  on('#payCash', () => openPay('Cash'));
  on('#payUpi', () => openPay('UPI'));
  on('#payCard', () => openPay('Card'));
  on('#releaseFree', () => finalise(null));
}

/* ---------- payment (counter chassis) ---------- */
function openPay(mode) {
  E.payMode = mode; E.tendered = 0;
  const total = E.computed.fare + E.computed.fine;
  const c = CASES.find(x => x.id === E.caseType);
  $('#pmTitle').textContent = `${mode} — ${fmtINR(total)}`;
  $('#pmSub').textContent = `${c.t} · fare ${fmtINR(E.computed.fare)} + fine ${fmtINR(E.computed.fine)}`;
  let body = '';
  if (mode === 'Cash') {
    const opts = [...new Set([total, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500, 2000])].filter(v => v >= total).slice(0, 4);
    body = `<div class="tender">${opts.map(v => `<button data-t="${v}">${fmtINR(v)}</button>`).join('')}</div>
      <div class="change-line" id="changeLine"><span>Change due</span><b>—</b></div>`;
  } else if (mode === 'UPI') {
    body = `<div class="mini-qr"><canvas id="pmQr" width="380" height="380"></canvas></div>
      <p style="text-align:center;color:var(--b-ink-faint);font-size:13px;margin:0 0 8px">Passenger scans — demo confirms on release</p>`;
  } else {
    body = `<p style="color:var(--b-ink-soft);font-size:13.5px;background:#fbf6ea;border-radius:12px;padding:12px 16px">Amount sent to the card terminal — demo confirms on release.</p>`;
  }
  $('#pmBody').innerHTML = body;
  if (mode === 'Cash') $$('#pmBody .tender button').forEach(b => b.addEventListener('click', () => {
    E.tendered = Number(b.dataset.t);
    $$('#pmBody .tender button').forEach(x => x.classList.toggle('on', x === b));
    const ch = E.tendered - total;
    $('#changeLine').classList.toggle('short', ch < 0);
    $('#changeLine').querySelector('b').textContent = fmtINR(Math.max(ch, 0));
  }));
  if (mode === 'UPI') drawQR($('#pmQr'), 'EFO-' + Date.now());
  $('#payModal').classList.add('open');
  if (window.Motion) Motion.pop($('#payModal .pcard'));
}
function drawQR(canvas, seed) {
  const N = 25, S = canvas.width / N;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  let h = 216613; for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) / 4294967295); };
  ctx.fillStyle = '#33221a';
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const inF = (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8);
    if (!inF && rnd() > .52) ctx.fillRect(x * S, y * S, S - 1.5, S - 1.5);
  }
  const F = (fx, fy) => {
    ctx.fillStyle = '#33221a'; ctx.fillRect(fx * S, fy * S, 7 * S, 7 * S);
    ctx.fillStyle = '#fff'; ctx.fillRect((fx + 1) * S, (fy + 1) * S, 5 * S, 5 * S);
    ctx.fillStyle = '#33221a'; ctx.fillRect((fx + 2) * S, (fy + 2) * S, 3 * S, 3 * S);
  };
  F(0, 0); F(N - 7, 0); F(0, N - 7);
}

/* ---------- finalise: record case, take money, release ---------- */
function finalise(payMode) {
  const c = CASES.find(x => x.id === E.caseType);
  const { fare, fine } = E.computed;
  const total = fare + fine;
  if (payMode === 'Cash' && E.tendered < total) return toast('Select the cash tendered first');
  store.db._efo = (store.db._efo || 0) + 1;
  const ref = 'EFO-2026-' + String(store.db._efo).padStart(6, '0');
  const rec = {
    id: store.nextId('ef'), ref, type: c.t, caseId: c.id,
    medium: ($('#c_ref') || {}).value || '—',
    reason: ($('#c_reason') || {}).value || '—',
    fare, fine, mode: payMode || '—',
    officer: E.op.username, shift: E.shift.id, station: TERMINAL.station,
    ts: Date.now(), released: true, otTicket: c.id === 'overtravel' ? ref.replace('EFO', 'OTT') : null,
    queued: E.link !== 'online',
  };
  store.db.efoCases.unshift(rec);
  if (total > 0) {
    store.db.transactions.unshift({
      id: store.nextId('tx'), ts: Date.now(), station: TERMINAL.station,
      device: TERMINAL.device, product: 'EFO', pair: '—', qty: 1,
      mode: payMode, amount: total, shift: E.shift.id, operator: E.op.username,
    });
  }
  if (c.id === 'fault') store.logAudit('update', 'Device', `${($('#c_dev') || {}).value || 'device'} — fault raised from the EFO (assisted passage ${ref})`);
  if (c.id === 'dispute') store.logAudit('create', 'Dispute', `${ref} raised to the Back Office — ${rec.reason}`);
  store.save();
  if (rec.queued) E.queued.push(rec.id);
  $('#payModal').classList.remove('open');

  const bits = [];
  if (total > 0) bits.push(`${fmtINR(total)} collected by ${payMode}` + (payMode === 'Cash' && E.tendered > total ? ` · change ${fmtINR(E.tendered - total)}` : ''));
  if (rec.otTicket) bits.push(`Over-Travel Ticket ${rec.otTicket} printed — it opens the exit gate once`);
  bits.push(`Release authorised · ${ref}`);
  flash(total > 0 ? 'Collected & released' : 'Released — no charge', bits.join(' · '), 2600);

  E.caseType = null; E.computed = null; E.tendered = 0;
  renderCaseTypes(); renderShift(); renderLog(); renderLink();
}

/* ---------- log + shift ---------- */
function myCases() { return store.db.efoCases.filter(x => x.shift === E.shift.id); }
function renderLog() {
  const rows = store.db.efoCases.filter(x => x.station === TERMINAL.station);
  $('#logCount').textContent = `${rows.length} case${rows.length === 1 ? '' : 's'}`;
  $('#logRows').innerHTML = rows.map(x => `<tr>
    <td class="mono">${x.ref}</td>
    <td style="white-space:nowrap;color:var(--b-ink-faint)">${fmtDT(x.ts)}</td>
    <td><b style="font-weight:600">${x.type}</b>${x.otTicket ? `<br><span class="mono" style="font-size:10.5px;color:var(--b-ink-faint)">${x.otTicket}</span>` : ''}</td>
    <td class="mono" style="font-size:12px">${x.medium}</td>
    <td class="num">${x.fare ? fmtINR(x.fare) : '—'}</td>
    <td class="num">${x.fine ? fmtINR(x.fine) : '—'}</td>
    <td>${x.mode}</td>
    <td class="mono">${x.officer}</td></tr>`).join('') ||
    '<tr><td colspan="8"><div class="empty">No cases yet this session.</div></td></tr>';
}
function renderShift() {
  if (!E.shift) return;
  const cases = myCases();
  const fares = cases.reduce((a, x) => a + x.fare, 0);
  const fines = cases.reduce((a, x) => a + x.fine, 0);
  const cash = cases.filter(x => x.mode === 'Cash').reduce((a, x) => a + x.fare + x.fine, 0);
  $('#svOp').textContent = `${E.op.name} · ${E.op.username}`;
  $('#svOpened').textContent = fmtDT(E.shift.openedAt);
  $('#svFloat').textContent = fmtINR(E.shift.float);
  $('#svCases').textContent = cases.length;
  $('#svFree').textContent = cases.filter(x => x.fare + x.fine === 0).length;
  $('#svFares').textContent = fmtINR(fares);
  $('#svFines').textContent = fmtINR(fines);
  $('#svTotal').textContent = fmtINR(fares + fines);
  $('#svExpect').textContent = fmtINR(E.shift.float + cash);
}
function updVariance() {
  const cash = myCases().filter(x => x.mode === 'Cash').reduce((a, x) => a + x.fare + x.fine, 0);
  const expected = E.shift.float + cash;
  const declared = Number($('#declareIn').value);
  const v = declared - expected;
  $('#varLine').innerHTML = Number.isFinite(declared) && $('#declareIn').value !== ''
    ? `<div class="kv"><span>Expected</span><b>${fmtINR(expected)}</b></div>
       <div class="kv"><span>Variance</span><b class="${v === 0 ? 'variance-ok' : 'variance-bad'}">${v === 0 ? 'Balanced' : (v > 0 ? '+' : '−') + fmtINR(Math.abs(v))}</b></div>` : '';
}
function closeShift() {
  const declared = Number($('#declareIn').value);
  if (!Number.isFinite(declared) || $('#declareIn').value === '') return toast('Enter the declared cash amount');
  const cash = myCases().filter(x => x.mode === 'Cash').reduce((a, x) => a + x.fare + x.fine, 0);
  const expected = E.shift.float + cash;
  const v = declared - expected;
  Object.assign(E.shift, { status: v === 0 ? 'closed' : 'closed-variance', declared, expected, variance: v, closedAt: Date.now() });
  store.logAudit(v === 0 ? 'update' : 'publish', 'Shift',
    `${E.op.username} closed ${TERMINAL.device}: expected ${fmtINR(expected)}, declared ${fmtINR(declared)}` +
    (v === 0 ? ' — balanced' : ` — VARIANCE ${(v > 0 ? '+' : '−') + fmtINR(Math.abs(v))} routed to finance`));
  store.save();
  $('#closeModal').classList.remove('open');
  flash(v === 0 ? 'Shift closed — balanced' : 'Shift closed with variance',
    'Collections reconcile into the excess fare report (§10.8).', 2600);
  setTimeout(signOut, 2700);
}

/* ---------- boot ---------- */
function boot() {
  store.load();
  tick(); setInterval(tick, 20000);
  renderLink();

  $('#tLoginForm').addEventListener('submit', e => { e.preventDefault(); tryLogin($('#tUser').value.trim()); });
  $$('.demo-chips button').forEach(b => b.addEventListener('click', () => {
    $('#tUser').value = b.dataset.demo; $('#tPass').value = 'demo'; tryLogin(b.dataset.demo);
  }));
  $('#thLogout').addEventListener('click', signOut);
  $('#linkChip').addEventListener('click', cycleLink);
  $('#openShift').addEventListener('click', openShift);

  $$('#tabs button').forEach(b => b.addEventListener('click', () => {
    $$('#tabs button').forEach(x => x.classList.toggle('on', x === b));
    $$('.tabpane').forEach(p => p.style.display = p.dataset.pane === b.dataset.tab ? '' : 'none');
    if (b.dataset.tab === 'shift') renderShift();
    if (b.dataset.tab === 'log') renderLog();
    if (window.Motion) Motion.pane($$('.tabpane').find(p => p.dataset.pane === b.dataset.tab));
  }));

  $('#pmCancel').addEventListener('click', () => $('#payModal').classList.remove('open'));
  $('#pmConfirm').addEventListener('click', () => finalise(E.payMode));
  $('#closeShiftBtn').addEventListener('click', () => { $('#declareIn').value = ''; $('#varLine').innerHTML = ''; $('#closeModal').classList.add('open'); });
  $('#closeCancel').addEventListener('click', () => $('#closeModal').classList.remove('open'));
  $('#declareIn').addEventListener('input', updVariance);
  $('#closeConfirm').addEventListener('click', closeShift);

  const q = new URLSearchParams(location.search);
  if (q.get('demo')) {
    $('#tUser').value = q.get('demo'); tryLogin(q.get('demo'));
    if (q.get('shift') && E.op && !E.shift) {
      E.shift = { id: store.nextId('sh'), operator: E.op.username, device: TERMINAL.device,
        station: TERMINAL.station, openedAt: Date.now(), float: 1000, status: 'open' };
      store.db.shifts.unshift(E.shift); store.save();
      show('v-ws'); renderCaseTypes(); renderShift(); renderLog();
    }
    return;
  }
  try {
    const s = JSON.parse(localStorage.getItem(ESES_KEY));
    if (s && s.username) { E.op = s; afterLogin(); return; }
  } catch { /* stay */ }
  $('#tUser').value = 'excess.dev'; $('#tPass').value = 'demo';
}
document.addEventListener('DOMContentLoaded', boot);
