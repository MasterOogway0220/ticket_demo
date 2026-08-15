/* ============================================================
   ToM counter terminal — VCT · POS 1.
   Shares the localStorage DB with the Back Office: every sale
   lands in the same ledger the BOS dashboard reads.
   ============================================================ */

const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

const TERMINAL = { station: 'VCT', device: 'VCT-POS-01', pos2: 'VCT-POS-02' };
const TSES_KEY = 'vr-afc-tom-session';

const T = {
  op: null,          /* {username,name} */
  shift: null,       /* row in db.shifts */
  link: 'online',    /* 'online' | 'offline' | 'stale'  (demo: click the chip) */
  queued: [],        /* sale ids awaiting sync while offline */
  lastSale: null,
  order: { product: 'SJT', dest: 'VDP', qty: 1 },
  payMode: null,
  payCtx: 'ticket',  /* 'ticket' | 'topup' */
  topup: { card: '', amount: 0 },
  tendered: 0,
};

/* ---------- helpers ---------- */
function cfg(key, fallback) {
  const c = store.db.config.find(x => x.key === key);
  return c ? c.value : fallback;
}
function fareFor(product, dest) {
  const pair = pairOf(dest);
  const f = store.db.fares.find(x => x.pair === pair);
  if (!f) return 0;
  return product === 'RJT' ? f.rjt : f.sjt;
}
function pairOf(dest) {
  const f = store.db.fares.find(x => x.pair === `${TERMINAL.station}-${dest}` || x.pair === `${dest}-${TERMINAL.station}`);
  return f ? f.pair : `${TERMINAL.station}-${dest}`;
}
function gstOf(total) { const r = cfg('GST_RATE', 5) / 100; return total * r / (1 + r); }
/* tax-inclusive split: taxable + CGST + SGST = total (components printed separately, s.8.2) */
function taxSplit(total) {
  const rate = cfg('GST_RATE', 5);
  const taxable = total / (1 + rate / 100);
  const half = (total - taxable) / 2;
  return { taxable, cgst: half, sgst: half, half: rate / 2 };
}
const inr2 = n => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function toast(msg) {
  $('#toastMsg').textContent = msg;
  const t = $('#toast'); t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2600);
}
function show(viewId) {
  $$('.view').forEach(v => v.classList.toggle('on', v.id === viewId));
  if (window.Motion) Motion.view($('#' + viewId));
}
function flash(title, body, ms = 1900) {
  $('#flashT').textContent = title; $('#flashP').textContent = body;
  const f = $('#flash'); f.classList.add('open');
  if (window.Motion) Motion.pop(f.querySelector('.fcard'));
  setTimeout(() => f.classList.remove('open'), ms);
}

/* ---------- link state (demo affordance, mirrors the real status bar) ---------- */
function pubFareVersion() {
  const v = store.db.fareVersions.find(x => x.status === 'published');
  return v ? v.version : '—';
}
function renderLink() {
  const dot = $('#linkDot'), fc = $('#faresChip'), fv = $('#faresVer');
  const stale = T.link === 'stale';
  dot.textContent = T.link === 'online' ? 'linked' : 'offline';
  dot.classList.toggle('bad', T.link !== 'online');
  fv.textContent = `fares v${pubFareVersion()}${stale ? ' · stale' : ''}`;
  fc.classList.toggle('stale', stale);
  const qc = $('#queueChip');
  qc.style.display = T.queued.length ? '' : 'none';
  $('#queueN').textContent = `queue ${T.queued.length}`;
  const sn = $('#staleNote'); if (sn) sn.style.display = stale ? '' : 'none';
  /* selling gates: stale suspends everything; offline suspends UPI + card */
  const offline = T.link !== 'online';
  const gate = (id, dis, why) => { const b = $(id); if (b) { b.disabled = dis; b.title = dis ? why : ''; } };
  gate('#payCash', stale, 'Selling is suspended — the cached fare table is stale');
  gate('#payUpi', offline, stale ? 'Selling is suspended — stale fare table' : 'UPI needs a live link to the Back Office');
  gate('#payCard', offline, stale ? 'Selling is suspended — stale fare table' : 'The card terminal needs a live link');
}
function cycleLink() {
  T.link = T.link === 'online' ? 'offline' : T.link === 'offline' ? 'stale' : 'online';
  if (T.link === 'online' && T.queued.length) {
    const n = T.queued.length;
    store.db.transactions.forEach(t => { if (T.queued.includes(t.id)) delete t.queued; });
    store.save(); T.queued = [];
    toast(`Link restored — ${n} queued sale${n > 1 ? 's' : ''} forwarded to the Back Office`);
  } else if (T.link === 'offline') {
    toast('Offline — cash sales continue on the cached fare table and queue locally');
  } else if (T.link === 'stale') {
    toast('Cached fare table is now stale — selling is suspended (counter exception 13)');
  }
  renderLink();
}

/* ---------- clock ---------- */
function tick() {
  const d = new Date();
  $('#thClock').textContent = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  $('#thDate').textContent = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

/* ---------- login ---------- */
const OPERATOR_ROLES = ['TOM_OPERATOR', 'STATION_CONTROLLER', 'SYSTEM_ADMIN'];
function tryOpLogin(username) {
  const err = $('#tLoginErr');
  const u = store.db.users.find(x => x.username === username);
  if (!u || u.status !== 'active') {
    err.textContent = 'Unknown or suspended operator. Use a demo account below.';
    err.classList.add('show'); return;
  }
  if (!OPERATOR_ROLES.includes(u.role)) {
    err.textContent = `${(typeof ROLES !== 'undefined' && ROLES[u.role]) ? ROLES[u.role].label : u.role} cannot operate a counter terminal.`;
    err.classList.add('show'); return;
  }
  /* ToM-LG-03: operator must be assigned to this station (— = all) */
  if (u.station !== '—' && u.station !== TERMINAL.station) {
    err.textContent = `Working as intended: ${u.username} is assigned to ${u.station}, and this terminal is ${TERMINAL.station} — the system refuses operators at terminals they are not assigned to (spec rule ToM-LG-03). Use tom.dev to sign in here.`;
    err.classList.add('show'); return;
  }
  err.classList.remove('show');
  T.op = { username: u.username, name: u.name };
  localStorage.setItem(TSES_KEY, JSON.stringify(T.op));
  afterLogin();
}
function afterLogin() {
  $('#thOp').style.display = '';
  $('#thLogout').style.display = '';
  $('#thOpName').textContent = T.op.name;
  $('#thOpId').textContent = T.op.username;
  /* resume an open shift for this operator+terminal if one exists */
  T.shift = store.db.shifts.find(s =>
    s.operator === T.op.username && s.device === TERMINAL.device && s.status === 'open') || null;
  if (T.shift) { show('v-ws'); renderSale(); renderShift(); }
  else { show('v-float'); renderDenoms(); }
  renderLink();
}
function signOut() {
  localStorage.removeItem(TSES_KEY);
  location.reload();
}

/* ---------- opening float ---------- */
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
function floatTotal() {
  return $$('#denoms input').reduce((a, i) => a + (Number(i.value) || 0) * Number(i.dataset.d), 0);
}
function updFloat() {
  $$('#denoms input').forEach(i => {
    $(`[data-sub="${i.dataset.d}"]`).textContent = fmtINR((Number(i.value) || 0) * Number(i.dataset.d));
  });
  $('#floatTotal').textContent = fmtINR(floatTotal());
}
function openShift() {
  const f = floatTotal();
  T.shift = {
    id: store.nextId('sh'), operator: T.op.username, device: TERMINAL.device,
    station: TERMINAL.station, openedAt: Date.now(), float: f, status: 'open',
  };
  store.db.shifts.unshift(T.shift);
  store.logAudit('create', 'Shift', `${T.op.username} opened ${TERMINAL.device} with float ${fmtINR(f)}`);
  store.save();
  toast(`Shift open — float ${fmtINR(f)} declared`);
  show('v-ws'); renderSale(); renderShift();
}

/* ---------- sale ---------- */
function destList() {
  return STN.filter(s => s.code !== TERMINAL.station);
}
function renderSale() {
  const o = T.order;
  $('#pfS').textContent = '₹' + Math.min(...destList().map(s => fareFor('SJT', s.code)));
  $('#pfR').textContent = '₹' + Math.min(...destList().map(s => fareFor('RJT', s.code)));
  $$('#pkProduct .pick').forEach(p => p.classList.toggle('on', p.dataset.p === o.product));

  $('#pkDest').innerHTML = destList().map(s => `
    <button class="pick ${o.dest === s.code ? 'on' : ''}" data-dest="${s.code}">
      <span class="pf">${fmtINR(fareFor(o.product, s.code))}</span>
      <b>${s.en}</b><span>${s.hi}</span>
      <span class="pin" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-5.3-7-11a7 7 0 0 1 14 0c0 5.7-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg></span>
    </button>`).join('');
  $$('#pkDest .pick').forEach(b => b.addEventListener('click', () => { T.order.dest = b.dataset.dest; renderSale(); }));

  const maxG = cfg('MAX_GROUP', 6);
  $('#qVal').textContent = o.qty;
  $('#qMinus').disabled = o.qty <= 1;
  $('#qPlus').disabled = o.qty >= maxG;
  $('#qNote').textContent = `up to ${maxG} per payment · one payment mode only`;

  const unit = fareFor(o.product, o.dest);
  const total = unit * o.qty;
  const tix = o.qty * (o.product === 'RJT' ? 2 : 1);
  $('#bProduct').textContent = o.product === 'RJT' ? 'Return Journey' : 'Single Journey';
  $('#bJourney').textContent = `${TERMINAL.station} → ${o.dest}` + (o.product === 'RJT' ? ` → ${TERMINAL.station}` : '');
  $('#bQty').textContent = o.qty;
  $('#bUnit').textContent = fmtINR(unit);
  $('#bTix').textContent = tix;
  $('#bTotal').textContent = fmtINR(total);
  const ts = taxSplit(total);
  $('#bTaxable').textContent = inr2(ts.taxable);
  $('#bCgstL').textContent = `CGST @ ${ts.half.toFixed(2)}%`;
  $('#bSgstL').textContent = `SGST @ ${ts.half.toFixed(2)}%`;
  $('#bCgst').textContent = inr2(ts.cgst);
  $('#bSgst').textContent = inr2(ts.sgst);
  renderLink();
}

/* ---------- payment ---------- */
function openPay(mode) {
  T.payMode = mode; T.tendered = 0;
  const total = T.payCtx === 'topup' ? T.topup.amount
    : fareFor(T.order.product, T.order.dest) * T.order.qty;
  const sub = T.payCtx === 'topup'
    ? `NCMC recharge · card ${T.topup.card}`
    : `${$('#bProduct').textContent} · ${$('#bJourney').textContent} · ${T.order.qty} passenger(s)`;
  $('#pmTitle').textContent = { Cash: 'Cash payment', UPI: 'UPI payment', Card: 'Card payment' }[mode] + ` — ${fmtINR(total)}`;
  $('#pmSub').textContent = sub;

  let body = '';
  if (mode === 'Cash') {
    const opts = [...new Set([total, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500, 2000])]
      .filter(v => v >= total).slice(0, 4);
    body = `<div class="tender">${opts.map(v => `<button data-t="${v}">${fmtINR(v)}</button>`).join('')}</div>
      <div class="change-line" id="changeLine"><span>Change due · वापसी</span><b>—</b></div>`;
  } else if (mode === 'UPI') {
    body = `<div class="mini-qr"><canvas id="pmQr" width="380" height="380"></canvas></div>
      <p style="text-align:center;color:var(--b-ink-faint);font-size:13.5px;margin:0 0 10px">
      Customer scans with any UPI app · demo confirms on print</p>`;
  } else {
    body = `<p style="color:var(--b-ink-soft);font-size:14.5px;background:#fbf6ea;border-radius:12px;padding:14px 18px">
      Amount sent to the card terminal. Hand the terminal to the customer — demo confirms on print.</p>`;
  }
  $('#pmBody').innerHTML = body;

  if (mode === 'Cash') {
    $$('#pmBody .tender button').forEach(b => b.addEventListener('click', () => {
      T.tendered = Number(b.dataset.t);
      $$('#pmBody .tender button').forEach(x => x.classList.toggle('on', x === b));
      const ch = T.tendered - total;
      const cl = $('#changeLine');
      cl.classList.toggle('short', ch < 0);
      cl.querySelector('b').textContent = fmtINR(Math.max(ch, 0));
    }));
  }
  if (mode === 'UPI') drawMiniQR($('#pmQr'), 'VR-' + Date.now());
  $('#payModal').classList.add('open');
  if (window.Motion) Motion.pop($('#payModal .pcard'));
}
function confirmPay() {
  const isTop = T.payCtx === 'topup';
  const total = isTop ? T.topup.amount : fareFor(T.order.product, T.order.dest) * T.order.qty;
  if (T.payMode === 'Cash' && T.tendered < total) return toast('Select the cash tendered first');

  const tx = {
    id: store.nextId('tx'), ts: Date.now(),
    station: TERMINAL.station,
    device: isTop ? TERMINAL.pos2 : TERMINAL.device,
    product: isTop ? 'TOPUP' : T.order.product,
    pair: isTop ? '—' : pairOf(T.order.dest),
    qty: isTop ? 1 : T.order.qty,
    mode: T.payMode, amount: total,
    operator: T.op.username, shift: T.shift.id,
  };
  const queued = T.link !== 'online';
  if (queued) { tx.queued = true; T.queued.push(tx.id); }
  store.db.transactions.unshift(tx);
  store.save();
  $('#payModal').classList.remove('open');

  if (isTop) {
    flash('Recharge successful', `${fmtINR(total)} loaded · receipt printing · balance updates at the Bank`);
    T.payCtx = 'ticket';
    $('#cardResult').innerHTML = '';
    $('#cardIn').value = ''; $('#cardTopup').disabled = true;
  } else {
    showIssued(tx, queued);
    T.order = { product: 'SJT', dest: 'VDP', qty: 1 };  /* next customer */
    renderSale();
  }
  renderShift();
  renderLink();
}

/* ---------- issued view: tickets as the passenger holds them ---------- */
function showIssued(tx, queued) {
  const d = new Date();
  const ymd = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  store.db._seq += 1;
  const saleRef = `SALE-${ymd}-${String(store.db._seq).padStart(6, '0')}`;
  const tixCount = tx.qty * (tx.product === 'RJT' ? 2 : 1);
  const [a, b] = tx.pair.split('-');
  const dest = a === tx.station ? b : a;

  T.lastSale = { saleRef, tx };
  $('#isNotice').className = 'notice-ok';
  $('#isNotice').innerHTML = `${tixCount} ticket${tixCount > 1 ? 's' : ''} printed.` +
    (queued ? ' The sale is held locally and queued for the Back Office.' : '');
  const change = T.payMode === 'Cash' && T.tendered > tx.amount ? T.tendered - tx.amount : 0;
  $('#isChange').style.display = change ? '' : 'none';
  if (change) $('#isChange').innerHTML = `<b>Change due: ${fmtINR(change)}</b>`;

  const wrap = $('#isTickets'); wrap.innerHTML = '';
  for (let i = 1; i <= tixCount; i++) {
    const leg = tx.product === 'RJT' ? (i % 2 === 1 ? `${tx.station} → ${dest}` : `${dest} → ${tx.station}`) : `${tx.station} → ${dest}`;
    const ref = `${tx.station}-${ymd}-${String(store.db._seq).padStart(6, '0')}-${i}`;
    const card = document.createElement('div');
    card.className = 'ticket-card';
    card.innerHTML = `
      <div class="ticket-head"><span>${leg}</span>${tixCount > 1 ? `<span class="ticket-of">${i} of ${tixCount}</span>` : ''}</div>
      <canvas width="380" height="380"></canvas>
      <div class="ticket-ref">${ref}</div>`;
    wrap.appendChild(card);
    drawMiniQR(card.querySelector('canvas'), ref);
  }
  const ts = taxSplit(tx.amount);
  $('#isTaxable').textContent = inr2(ts.taxable);
  $('#isCgstL').textContent = `CGST @ ${ts.half.toFixed(2)}%`;
  $('#isSgstL').textContent = `SGST @ ${ts.half.toFixed(2)}%`;
  $('#isCgst').textContent = inr2(ts.cgst);
  $('#isSgst').textContent = inr2(ts.sgst);
  $('#isPaid').textContent = fmtINR(tx.amount);
  $('#isSaleRef').textContent = saleRef;
  show('v-issued');
}

/* mini QR placeholder */
function drawMiniQR(canvas, seed) {
  const N = 25, S = canvas.width / N;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  let h = 216613; for (const c of seed) { h = Math.imul(h ^ c.charCodeAt(0), 16777619); }
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

/* ---------- NCMC tab ---------- */
function cardBalanceOf(digits) {
  /* stable pseudo-balance from the digits */
  let h = 7; for (const c of digits) h = (h * 31 + c.charCodeAt(0)) % 90000;
  return 60 + (h % 900) + 0.5;
}
function checkCard() {
  const raw = $('#cardIn').value.replace(/\D/g, '');
  if (raw.length < 4) return toast('Enter at least the last 4 digits');
  const last4 = raw.slice(-4);
  const hot = store.db.hotlist.find(hl => hl.card.replace(/\D/g, '').endsWith(last4));
  const res = $('#cardResult');
  if (hot) {
    res.innerHTML = `<div class="ro-note" style="display:flex;background:var(--danger-bg);color:var(--danger);border-color:#e8b3a8">
      Card refused — it is on the hotlist (${hot.reason.toLowerCase()}). Advise the passenger; the attempt is logged.</div>`;
    store.logAudit('update', 'Hotlist', `Hotlisted card ••${last4} presented at ${TERMINAL.pos2} — refused`);
    store.save();
    $('#cardTopup').disabled = true;
    return;
  }
  T.topup.card = '6080 ••·· ' + last4;
  const bal = cardBalanceOf(last4);
  res.innerHTML = `
    <div class="card" style="box-shadow:none">
      <div class="pad" style="display:flex;gap:26px;align-items:center;flex-wrap:wrap">
        <div>
          <div style="font-size:12.5px;color:var(--b-ink-faint)">Card ${T.topup.card} · balance from the Bank</div>
          <div style="font-family:var(--font-display);font-size:38px;font-weight:800">₹${bal.toFixed(2)}</div>
        </div>
        <div class="tender" style="margin:0;grid-template-columns:repeat(4,90px)">
          ${[100, 200, 500, 1000].map(v => `<button data-top="${v}">₹${v}</button>`).join('')}
        </div>
      </div>
    </div>`;
  $('#cardTopup').disabled = false;
  $$('#cardResult [data-top]').forEach(b => b.addEventListener('click', () => {
    T.topup.amount = Number(b.dataset.top);
    $$('#cardResult [data-top]').forEach(x => x.classList.toggle('on', x === b));
  }));
  $('#cardTopup').onclick = () => {
    if (!T.topup.amount) return toast('Pick a recharge amount');
    T.payCtx = 'topup';
    openPay('Cash');   /* counter default; operator can cancel and pick UPI/card from the sale panel norms */
  };
}

/* ---------- shift tab ---------- */
function shiftTxs() {
  return store.db.transactions.filter(t => t.shift === T.shift.id);
}
function renderShift() {
  if (!T.shift) return;
  const txs = shiftTxs();
  const by = m => txs.filter(t => t.mode === m).reduce((a, t) => a + t.amount, 0);
  const cash = by('Cash'), upi = by('UPI'), card = by('Card');
  const tix = txs.filter(t => t.product !== 'TOPUP').reduce((a, t) => a + t.qty * (t.product === 'RJT' ? 2 : 1), 0);
  $('#svOp').textContent = `${T.op.name} · ${T.op.username}`;
  $('#svOpened').textContent = fmtDT(T.shift.openedAt);
  $('#svFloat').textContent = fmtINR(T.shift.float);
  $('#svTix').textContent = tix;
  $('#svTop').textContent = txs.filter(t => t.product === 'TOPUP').length;
  $('#svCash').textContent = fmtINR(cash);
  $('#svUpi').textContent = fmtINR(upi);
  $('#svCard').textContent = fmtINR(card);
  $('#svTotal').textContent = fmtINR(cash + upi + card);
  $('#svExpect').textContent = fmtINR(T.shift.float + cash);
}
function openCloseModal() {
  $('#declareIn').value = '';
  $('#varLine').innerHTML = '';
  $('#closeModal').classList.add('open');
}
function updVariance() {
  const cash = shiftTxs().filter(t => t.mode === 'Cash').reduce((a, t) => a + t.amount, 0);
  const expected = T.shift.float + cash;
  const declared = Number($('#declareIn').value);
  const v = declared - expected;
  $('#varLine').innerHTML = Number.isFinite(declared) && $('#declareIn').value !== ''
    ? `<div class="kv"><span>Expected</span><b>${fmtINR(expected)}</b></div>
       <div class="kv"><span>Variance</span><b class="${v === 0 ? 'variance-ok' : 'variance-bad'}">
         ${v === 0 ? 'Balanced — no variance' : (v > 0 ? '+' : '−') + fmtINR(Math.abs(v))}</b></div>`
    : '';
}
function closeShift() {
  const declared = Number($('#declareIn').value);
  if (!Number.isFinite(declared) || $('#declareIn').value === '') return toast('Enter the declared cash amount');
  const cash = shiftTxs().filter(t => t.mode === 'Cash').reduce((a, t) => a + t.amount, 0);
  const expected = T.shift.float + cash;
  const v = declared - expected;
  Object.assign(T.shift, { status: v === 0 ? 'closed' : 'closed-variance', declared, expected, variance: v, closedAt: Date.now() });
  store.logAudit(v === 0 ? 'update' : 'publish', 'Shift',
    `${T.op.username} closed ${TERMINAL.device}: expected ${fmtINR(expected)}, declared ${fmtINR(declared)}` +
    (v === 0 ? ' — balanced' : ` — VARIANCE ${(v > 0 ? '+' : '−') + fmtINR(Math.abs(v))} routed to finance queue`));
  store.save();
  $('#closeModal').classList.remove('open');
  flash(v === 0 ? 'Shift closed — balanced' : 'Shift closed with variance',
    v === 0 ? 'Settlement report transmitted to the Back Office.'
            : `${(v > 0 ? 'Over' : 'Short')} by ${fmtINR(Math.abs(v))} — routed to the supervisor and finance queue.`, 2600);
  setTimeout(signOut, 2700);
}

/* ---------- boot ---------- */
function boot() {
  store.load();
  tick(); setInterval(tick, 20000);
  renderLink();

  $('#tLoginForm').addEventListener('submit', e => { e.preventDefault(); tryOpLogin($('#tUser').value.trim()); });
  $$('.demo-chips button').forEach(b => b.addEventListener('click', () => {
    $('#tUser').value = b.dataset.demo; $('#tPass').value = 'demo';
    tryOpLogin(b.dataset.demo);
  }));
  $('#thLogout').addEventListener('click', signOut);

  $('#openShift').addEventListener('click', openShift);

  $$('#tabs button').forEach(b => b.addEventListener('click', () => {
    $$('#tabs button').forEach(x => x.classList.toggle('on', x === b));
    $$('.tabpane').forEach(p => p.style.display = p.dataset.pane === b.dataset.tab ? '' : 'none');
    if (b.dataset.tab === 'shift') renderShift();
    if (window.Motion) Motion.pane($$('.tabpane').find(p => p.dataset.pane === b.dataset.tab));
  }));

  $$('#pkProduct .pick').forEach(b => b.addEventListener('click', () => { T.order.product = b.dataset.p; renderSale(); }));
  $('#qMinus').addEventListener('click', () => { if (T.order.qty > 1) { T.order.qty--; renderSale(); } });
  $('#qPlus').addEventListener('click', () => { if (T.order.qty < cfg('MAX_GROUP', 6)) { T.order.qty++; renderSale(); } });

  $('#payCash').addEventListener('click', () => { T.payCtx = 'ticket'; openPay('Cash'); });
  $('#payUpi').addEventListener('click', () => { T.payCtx = 'ticket'; openPay('UPI'); });
  $('#payCard').addEventListener('click', () => { T.payCtx = 'ticket'; openPay('Card'); });
  $('#pmCancel').addEventListener('click', () => { $('#payModal').classList.remove('open'); T.payCtx = 'ticket'; });
  $('#pmConfirm').addEventListener('click', confirmPay);

  $('#cardCheck').addEventListener('click', checkCard);

  $('#linkChip').addEventListener('click', cycleLink);
  $('#isNext').addEventListener('click', () => { show('v-ws'); renderSale(); });
  $('#isReprint').addEventListener('click', () => {
    /* the real terminal re-renders the SAME ticket references — a paper
       problem, not a money problem; no new tickets are created */
    toast('Reprinted — same ticket references, logged against the sale');
  });

  $('#closeShiftBtn').addEventListener('click', openCloseModal);
  $('#closeCancel').addEventListener('click', () => $('#closeModal').classList.remove('open'));
  $('#declareIn') && $('#declareIn').addEventListener('input', updVariance);
  $('#closeConfirm').addEventListener('click', closeShift);

  /* session resume + ?demo= for screenshots */
  const q = new URLSearchParams(location.search);
  if (q.get('demo')) {
    $('#tUser').value = q.get('demo'); tryOpLogin(q.get('demo'));
    if (q.get('shift') && T.op && !T.shift) {   /* screenshot/demo shortcut */
      T.shift = { id: store.nextId('sh'), operator: T.op.username, device: TERMINAL.device,
        station: TERMINAL.station, openedAt: Date.now(), float: 2000, status: 'open' };
      store.db.shifts.unshift(T.shift); store.save();
      show('v-ws'); renderSale(); renderShift();
    }
    return;
  }
  try {
    const s = JSON.parse(localStorage.getItem(TSES_KEY));
    if (s && s.username) { T.op = s; afterLogin(); return; }
  } catch { /* stay on login */ }
  /* fresh visitor: pre-fill a working operator so Login (or any
     4-digit PIN) succeeds without knowing the seed accounts */
  $('#tUser').value = 'tom.dev';
  $('#tPass').value = 'demo';
}
document.addEventListener('DOMContentLoaded', boot);
