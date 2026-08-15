/* ============================================================
   ToM terminal — mirrors apps/terminal (Electron) on
   fix/tester-bugs. Same screens, strings, formats, refusals.
   Device: VCT-TOM-01 at Varanasi Cantt. Cash only, exact cash.
   ============================================================ */

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const DEVICE_CODE = 'VCT-TOM-01';
const ORIGIN = 'VCT';
const ORIGIN_STATION_ID = 'a2546706-1e29-4b4f-a438-40b819f764cb';
const MAX_QTY = 10;

const T = {
  op: null,               /* operator session */
  link: 'online',         /* online | offline | stale (demo affordance) */
  queued: 0,              /* outbound queue depth */
  order: { product: null, dest: null, qty: 1 },
  lastSales: [],          /* reprint memory — last 20 */
  current: null,
};

const TSES = 'vr-afc-v3-tom';

/* ---------- money / formats ---------- */
const rupees = (paise) => '₹' + (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* 16-hex ticket number from 8 random bytes, uppercase */
function ticketNumber() {
  const b = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}
/* sale ref: first 8 of origin stationId - Date.now() - first 8 of a uuid */
function saleRef() {
  return `${ORIGIN_STATION_ID.slice(0, 8)}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
}

/* ---------- views ---------- */
function show(id) {
  $$('.view').forEach(v => v.classList.toggle('on', v.id === id));
  if (window.Motion) Motion.view($('#' + id));
}
function toast(msg) {
  const t = $('#toast'); $('#toastMsg').textContent = msg;
  t.classList.add('show'); if (window.Motion) Motion.toast(t);
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 3200);
}

/* ---------- status bar ---------- */
function renderStatus() {
  $('#thStation').textContent = `${stationName(ORIGIN)} · ${DEVICE_CODE}`;
  const dot = $('#linkDot');
  dot.textContent = T.link === 'offline' ? 'offline' : 'linked';
  dot.classList.toggle('bad', T.link !== 'online');
  const v = publishedVersion();
  const fv = $('#faresVer'), fc = $('#faresChip');
  fv.textContent = v ? `fares v${v.versionNo}${T.link === 'stale' ? ' stale' : ''}` : 'fares v—';
  fc.classList.toggle('stale', T.link === 'stale');
  $('#queueChip').style.display = T.queued > 0 ? '' : 'none';
  $('#queueN').textContent = `queue ${T.queued}`;
  $('#thOp').style.display = T.op ? '' : 'none';
  $('#thLogout').style.display = T.op ? '' : 'none';
  if (T.op) {
    $('#thOpName').textContent = T.op.name;
    $('#thAv').textContent = T.op.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }
  /* stale banner (exact) */
  const sn = $('#staleNote');
  if (sn) {
    if (T.link === 'stale') {
      const mins = 1441; /* just past the permitted 24 h in the demo */
      sn.style.display = '';
      sn.textContent = `The cached fare table has not been confirmed for ${mins} minutes. Selling is suspended until it refreshes.` + (T.link === 'offline' ? ' The link to the Back Office is down.' : '');
    } else sn.style.display = 'none';
  }
  const tc = $('#takeCash'); if (tc) tc.disabled = T.link === 'stale';
}
function cycleLink() {
  T.link = T.link === 'online' ? 'offline' : T.link === 'offline' ? 'stale' : 'online';
  if (T.link === 'online' && T.queued > 0) { toast(`Link restored — ${T.queued} queued sale${T.queued > 1 ? 's' : ''} forwarded to the Back Office`); T.queued = 0; }
  renderStatus();
}

/* ---------- sign-in (exact refusal strings, incl. error-name prefix) ---------- */
function signInError(username) {
  const u = store.db.users.find(x => x.username === username);
  if (!u) return `ApiError: No Back Office account exists for "${username}". An administrator must create one before this person can work a terminal (BOS-UM-02).`;
  if (u.status !== 'active') return `ApiError: The account "${username}" is ${u.status}.`;
  /* station binding: role scoped to another station is refused (s.8.1) */
  if (u.station && u.station !== ORIGIN)
    return `ApiError: ${u.name} is not assigned to ${ORIGIN}. A role granted at another station does not authorise work here (s.8.1).`;
  return null;
}
function doSignIn(username) {
  const err = signInError(username);
  const box = $('#tLoginErr');
  if (err) { box.textContent = err; box.classList.add('show'); return; }
  const u = store.db.users.find(x => x.username === username);
  T.op = u; localStorage.setItem(TSES, username);
  box.classList.remove('show');
  T.order = { product: null, dest: null, qty: 1 };
  renderStatus(); renderSale(); show('v-sale');
}
function signOut() {
  T.op = null; localStorage.removeItem(TSES);
  renderStatus(); show('v-login');
}

/* ---------- sale ---------- */
function sellableProducts() {
  return store.db.products.filter(p => p.status === 'active' && p.tom).sort((a, b) => a.order - b.order);
}
function destinations(product) {
  const v = publishedVersion(); if (!v) return [];
  return store.db.stations.slice().sort((a, b) => a.seq - b.seq)
    .filter(s => s.code !== ORIGIN && v.rules.some(r => r.product === product && r.from === ORIGIN && r.to === s.code));
}
function renderSale() {
  const o = T.order;
  $('#saleErr').style.display = 'none';
  /* products */
  const PICONS = {
    SINGLE_JOURNEY: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-4z"/><path d="M13 7v10" stroke-dasharray="2 3"/></svg>',
    RETURN_JOURNEY: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 8h11l-3-3M17 16H6l3 3"/></svg>',
  };
  $('#pkProduct').innerHTML = sellableProducts().map(p => `
    <button class="pick prod ${o.product === p.code ? 'on' : ''}" data-p="${p.code}" aria-pressed="${o.product === p.code}">
      <span class="pico">${PICONS[p.code] || PICONS.SINGLE_JOURNEY}</span>
      <span class="radio" aria-hidden="true"></span>
      <span class="ptxt"><b>${esc(p.en)}</b><span lang="hi-IN">${esc(p.hi)}</span></span>
    </button>`).join('');
  $$('#pkProduct .pick').forEach(b => b.addEventListener('click', () => {
    T.order.product = b.dataset.p; T.order.dest = null; renderSale();
  }));
  /* destinations — only stations with a published fare, station order, mono gross fare */
  $('#destWrap').style.display = o.product ? '' : 'none';
  if (o.product) {
    const DICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2 3h-4z"/><path d="M8 10l4-4 4 4"/><path d="M6 21v-8l6-5 6 5v8"/><path d="M10 21v-4h4v4"/></svg>';
    $('#pkDest').innerHTML = destinations(o.product).map(s => {
      const q = fareQuote(o.product, ORIGIN, s.code, 1);
      return `<button class="pick dest ${o.dest === s.code ? 'on' : ''}" data-d="${s.code}" aria-pressed="${o.dest === s.code}">
        <span class="pico">${DICON}</span>
        <span class="radio" aria-hidden="true"></span>
        <b>${esc(s.en)}</b><span lang="hi-IN">${esc(s.hi)}</span>
        <span class="pf">${q ? rupees(q.gross) : '—'}</span>
      </button>`;
    }).join('');
    $$('#pkDest .pick').forEach(b => b.addEventListener('click', () => { T.order.dest = b.dataset.d; renderSale(); }));
  }
  /* passengers */
  $('#qtyWrap').style.display = o.dest ? '' : 'none';
  $('#qVal').textContent = o.qty;
  $('#qMinus').disabled = o.qty <= 1;
  /* quote */
  const has = o.product && o.dest;
  $('#quoteEmpty').style.display = has ? 'none' : '';
  $('#quoteRows').style.display = has ? '' : 'none';
  if (has) {
    if (o.qty > MAX_QTY) {
      const e = $('#saleErr'); e.style.display = '';
      e.textContent = `Error: Between 1 and ${MAX_QTY} passengers are permitted in one transaction.`;
      $('#quoteRows').style.display = 'none'; $('#quoteEmpty').style.display = '';
      renderStatus(); return;
    }
    const q = fareQuote(o.product, ORIGIN, o.dest, o.qty);
    if (!q) {
      const e = $('#saleErr'); e.style.display = '';
      e.textContent = 'Error: No fare is published for that product and destination. It cannot be sold here.';
      return;
    }
    $('#bTaxable').textContent = rupees(q.taxable);
    $('#bCgst').textContent = rupees(q.cgst);
    $('#bSgst').textContent = rupees(q.sgst);
    const total = q.gross;
    $('#bTotal').textContent = rupees(total);
    if (T._lastTotal !== total) {
      if (T._lastTotal !== undefined && window.Motion) Motion.pop($('#bTotal'));
      T._lastTotal = total;
    }
  }
  renderStatus();
}

/* ---------- take cash → issued ---------- */
function recordSale(mode) {
  const o = T.order;
  if (!T.op) return toast('Error: No operator is signed in at this terminal.');
  if (T.link === 'stale') return;
  const q = fareQuote(o.product, ORIGIN, o.dest, o.qty);
  if (!q) return;
  const btn = $('#takeCash'); btn.disabled = true;
  const product = store.db.products.find(p => p.code === o.product);
  const nTickets = o.qty * product.ticketsPerSale;
  const tickets = Array.from({ length: nTickets }, (_, i) => ({
    ref: ticketNumber(), pos: i + 1,
  }));
  const sale = {
    saleRef: saleRef(), product: o.product, dest: o.dest, qty: o.qty, mode,
    taxable: q.taxable, cgst: q.cgst, sgst: q.sgst, gross: q.gross,
    tickets, at: Date.now(),
  };
  T.lastSales.unshift(sale); T.lastSales = T.lastSales.slice(0, 20);
  T.current = sale;
  T.queued += 1;           /* held locally and queued for the Back Office */
  setTimeout(() => {
    btn.disabled = false;
    showIssued(sale);
  }, 380);
}

/* tiny deterministic QR-style block for the demo ticket card */
function drawQR(canvas, seed) {
  const ctx = canvas.getContext('2d'); const N = 25, cell = canvas.width / N;
  let h = 0; for (const ch of seed) h = ((h << 5) - h + ch.charCodeAt(0)) | 0;
  const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) / 4294967295); };
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#12151c';
  const finder = (x, y) => { ctx.fillRect(x * cell, y * cell, 7 * cell, 7 * cell); ctx.fillStyle = '#fff'; ctx.fillRect((x + 1) * cell, (y + 1) * cell, 5 * cell, 5 * cell); ctx.fillStyle = '#12151c'; ctx.fillRect((x + 2) * cell, (y + 2) * cell, 3 * cell, 3 * cell); };
  finder(0, 0); finder(N - 7, 0); finder(0, N - 7);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const inF = (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8);
    if (!inF && rnd() > 0.52) ctx.fillRect(x * cell, y * cell, cell, cell);
  }
}

function showIssued(sale) {
  const n = sale.tickets.length;
  $('#isNotice').innerHTML = `<div class="notice-ok">${n} ticket${n > 1 ? 's' : ''} printed. The sale is held locally and queued for the Back Office.</div>`;
  $('#isTickets').innerHTML = sale.tickets.map(t => `
    <div class="ticket-card">
      <div class="ticket-head"><span>${ORIGIN} → ${sale.dest}</span>${n > 1 ? `<span class="ticket-of mono">${t.pos} of ${n}</span>` : ''}</div>
      <canvas width="150" height="150" data-ref="${t.ref}"></canvas>
      <div class="ticket-ref" style="user-select:text">${t.ref}</div>
    </div>`).join('');
  $$('#isTickets canvas').forEach(c => drawQR(c, 'VR1.' + c.dataset.ref + '.' + DEVICE_CODE));
  $('#isTaxable').textContent = rupees(sale.taxable);
  $('#isCgst').textContent = rupees(sale.cgst);
  $('#isSgst').textContent = rupees(sale.sgst);
  $('#isPaid').textContent = rupees(sale.gross);
  $('#isSaleRef').textContent = sale.saleRef;
  renderStatus();
  show('v-issued');
}

/* ---------- boot ---------- */
function boot() {
  renderStatus();
  /* sign-in form: button disabled while either field empty */
  const upd = () => { $('#tSignIn').disabled = !$('#tUser').value.trim() || !$('#tPass').value; };
  $('#tUser').addEventListener('input', upd); $('#tPass').addEventListener('input', upd);
  $('#tLoginForm').addEventListener('submit', e => {
    e.preventDefault();
    const b = $('#tSignIn'); b.textContent = 'Checking…'; b.disabled = true;
    setTimeout(() => { b.textContent = 'Sign in'; upd(); doSignIn($('#tUser').value.trim()); }, 300);
  });
  $$('.demo-chips button').forEach(b => b.addEventListener('click', () => {
    $('#tUser').value = b.dataset.demo; $('#tPass').value = 'dev'; upd();
    const s = $('#tSignIn'); s.textContent = 'Checking…'; s.disabled = true;
    setTimeout(() => { s.textContent = 'Sign in'; upd(); doSignIn(b.dataset.demo); }, 300);
  }));
  $('#tEye').addEventListener('click', () => {
    const p = $('#tPass'); p.type = p.type === 'password' ? 'text' : 'password';
  });
  $('#thLogout').addEventListener('click', signOut);
  $('#linkChip').addEventListener('click', cycleLink);
  $('#qMinus').addEventListener('click', () => { if (T.order.qty > 1) { T.order.qty--; renderSale(); } });
  $('#qPlus').addEventListener('click', () => { T.order.qty++; renderSale(); });   /* no UI ceiling — the quote refuses beyond 10 */
  $('#takeCash').addEventListener('click', () => recordSale('cash'));
  $('#isNext').addEventListener('click', () => {
    T.order = { product: null, dest: null, qty: 1 }; T._lastTotal = undefined;
    renderSale(); show('v-sale');
  });
  $('#isReprint').addEventListener('click', () => {
    const b = $('#isReprint'); b.textContent = 'Printing…'; b.disabled = true;
    setTimeout(() => {
      b.textContent = 'Print again'; b.disabled = false;
      if (T.current && T.lastSales.includes(T.current)) showIssued(T.current);
      else $('#isNotice').innerHTML = `<div class="notice-stale"><b>The ticket did not print.</b> Error: That sale is no longer available to reprint from this terminal. Raise it with the Excess Fare Office, which can reissue against the original record.<br>The sale is recorded and the money has been taken. Reprint below, or send the passenger to the Excess Fare Office with the reference.</div>`;
    }, 380);
  });
  /* ?demo=<user> bypass for tests */
  const qs = new URLSearchParams(location.search);
  if (qs.get('demo')) { doSignIn(qs.get('demo')); return; }
  const saved = localStorage.getItem(TSES);
  if (saved && !signInError(saved)) { doSignIn(saved); }
}
document.addEventListener('DOMContentLoaded', boot);
