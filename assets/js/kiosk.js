/* ============================================================
   TVM kiosk state machine.
   Demo-only where hardware would act: payment result and card
   taps are driven from the review rail; timers are real.
   ============================================================ */

const CFG = {
  IDLE_S: 60,          /* inactivity before the "still there?" modal   */
  IDLE_WARN_S: 15,     /* modal countdown before reset                  */
  PAY_WINDOW_S: 120,   /* UPI confirmation window (config, open pt.)    */
  AUTORETURN_S: 20,    /* success screens → attract                     */
  PRINT_MS: 1500,      /* per-ticket print time (demo)                  */
};

const state = {
  lang: 'hi',
  screen: 'attract',
  history: [],
  order: { product: 'sjt', dest: null, pax: 1 },
  topup: { amount: null },
  payCtx: 'ticket',            /* 'ticket' | 'topup' */
  cardBalance: 235.50,
  ref: null,
  seq: 118,
  timers: {},
};

const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const stage = () => $('#stage');

/* ---------- money ---------- */
const inr  = n => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
const inr2 = n => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function fareFor(product, dest) {
  const base = FARES[dest] ?? 0;
  return product === 'rjt' ? base * 2 : base;
}
function orderTotal() {
  return fareFor(state.order.product, state.order.dest) * state.order.pax;
}
function gstOf(total) { return total * GST_RATE / (1 + GST_RATE); }
function ticketCount() {
  return state.order.pax * (state.order.product === 'rjt' ? 2 : 1);
}

/* ---------- i18n rendering ---------- */
function applyI18n() {
  const L = state.lang, O = otherLang(L);
  $$('[data-bl]').forEach(el => {
    const k = el.dataset.bl;
    el.innerHTML = `<span>${t(k, L)}</span><small>${t(k, O)}</small>`;
    el.classList.add('bl');
  });
  $$('[data-t]').forEach(el => { el.innerHTML = t(el.dataset.t, state.lang); });
  $$('.lang-seg button').forEach(b => b.classList.toggle('on', b.dataset.lang === L));
  renderDynamic();
}
function setLang(l) { state.lang = l; applyI18n(); }

/* bilingual template into a node: primary + secondary line */
function blHTML(primary, secondary) {
  return `<span>${primary}</span><small>${secondary}</small>`;
}
/* set bilingual content AND the .bl class that stacks the two lines */
function setBL(el, primary, secondary) {
  if (!el) return;
  el.innerHTML = blHTML(primary, secondary);
  el.classList.add('bl');
}

/* ---------- navigation ---------- */
const FLOW_STEPS = { product: 0, destination: 1, passengers: 2, summary: 3, upi: 3 };

function go(screen, push = true) {
  if (push && state.screen && state.screen !== screen) state.history.push(state.screen);
  state.screen = screen;
  $$('.scr').forEach(s => s.classList.toggle('active', s.dataset.screen === screen));
  stage().classList.toggle('at-attract', screen === 'attract');
  stage().classList.toggle('at-dark', screen === 'oos' || screen === 'offline');
  document.body.dataset.screen = screen;
  clearTimers(['pay', 'print', 'ret']);
  renderDynamic();
  if (screen === 'attract') resetSession(false);
  if (screen === 'upi') startPayment();
  if (screen === 'printing') startPrinting();
  if (screen === 'success' || screen === 'topup-success') startAutoReturn();
  armIdle();
  if (screen === 'card-tap') {
    /* demo: the reader "sees" the card after a moment */
    state.timers.tap = setTimeout(() => {
      if (state.screen !== 'card-tap') return;
      go(state.tapNext || 'balance');
    }, 2600);
  } else { clearTimers(['tap']); }
  syncRail();
}
function back() {
  go(state.history.pop() || 'menu', false);
}
function cancelToMenu() {
  state.order = { product: 'sjt', dest: null, pax: 1 };
  state.topup = { amount: null };
  state.history = [];
  go('menu', false);
}
function resetSession(navigate = true) {
  state.order = { product: 'sjt', dest: null, pax: 1 };
  state.topup = { amount: null };
  state.history = [];
  clearTimers(['pay', 'print', 'ret', 'tap', 'idle', 'warn']);
  closeIdleModal();
  if (navigate) go('attract', false);
}
function clearTimers(keys) {
  keys.forEach(k => {
    if (state.timers[k]) { clearTimeout(state.timers[k]); clearInterval(state.timers[k]); state.timers[k] = null; }
  });
}

/* ---------- clock ---------- */
function tickClock() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  $$('.js-time').forEach(e => e.textContent = `${hh}:${mm}`);
  const dt = d.toLocaleDateString(state.lang === 'hi' ? 'hi-IN' : 'en-IN',
    { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  $$('.js-date').forEach(e => e.textContent = dt);
}

/* ---------- idle handling ---------- */
const IDLE_EXEMPT = new Set(['attract', 'oos', 'offline', 'printing', 'success', 'topup-success',
  /* upi runs its own 2:00 window → pay-timeout; these two show the recovery
     reference the passenger must carry to the counter */
  'upi', 'pay-timeout', 'print-fail']);
function armIdle() {
  clearTimers(['idle']);
  if (IDLE_EXEMPT.has(state.screen)) return;
  state.timers.idle = setTimeout(openIdleModal, CFG.IDLE_S * 1000);
}
function openIdleModal() {
  if (IDLE_EXEMPT.has(state.screen)) return;
  const m = $('#idleModal'); m.classList.add('open');
  let left = CFG.IDLE_WARN_S;
  const num = $('#idleNum'), ring = $('#idleRing');
  const C = 2 * Math.PI * 88;
  const draw = () => { num.textContent = left; ring.style.strokeDashoffset = C * (1 - left / CFG.IDLE_WARN_S); };
  draw();
  state.timers.warn = setInterval(() => {
    left -= 1; draw();
    if (left <= 0) { closeIdleModal(); resetSession(); }
  }, 1000);
}
function closeIdleModal() {
  $('#idleModal').classList.remove('open');
  clearTimers(['warn']);
}

/* ---------- payment ---------- */
function newRef() {
  const d = new Date();
  const ymd = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  state.seq += 1;
  return `${KIOSK.device}-${ymd}-${String(state.seq).padStart(6, '0')}`;
}
function startPayment() {
  state.ref = newRef();
  drawQR($('#qrCanvas'), state.ref);
  let left = CFG.PAY_WINDOW_S;
  const C = 2 * Math.PI * 46;
  const wrap = $('#payTimer'), mmss = $('#payMmss'), ring = $('#payRing');
  const draw = () => {
    const m = Math.floor(left / 60), s = left % 60;
    mmss.textContent = `${m}:${String(s).padStart(2, '0')}`;
    ring.style.strokeDashoffset = C * (1 - left / CFG.PAY_WINDOW_S);
    wrap.classList.toggle('low', left <= 20);
  };
  draw();
  state.timers.pay = setInterval(() => {
    left -= 1; draw();
    if (left <= 0) { clearTimers(['pay']); simTimeout(); }
  }, 1000);
  renderDynamic();
}
function simPaySuccess() {
  if (state.screen !== 'upi') return;
  clearTimers(['pay']);
  if (state.payCtx === 'topup') state.cardBalance += state.topup.amount;
  go(state.payCtx === 'topup' ? 'topup-success' : 'printing');
}
function simTimeout() {
  if (state.screen !== 'upi') return;
  clearTimers(['pay']);
  go('pay-timeout');
}
function simPrintJam() {
  if (state.screen !== 'printing') return;
  clearTimers(['print']);
  go('print-fail');
}

/* ---------- printing ---------- */
function startPrinting() {
  const total = ticketCount();
  let n = 0;
  const step = () => {
    n += 1;
    setBL($('#printCount'),
      tf('print.n', state.lang, n, total),
      tf('print.n', otherLang(state.lang), n, total));
    $('#printBarFill').style.width = Math.round(n / total * 100) + '%';
    if (n >= total) {
      state.timers.print = setTimeout(() => go('success'), 1200);
    } else {
      state.timers.print = setTimeout(step, CFG.PRINT_MS);
    }
  };
  $('#printBarFill').style.width = '6%';
  state.timers.print = setTimeout(step, 500);
}

/* ---------- auto return ---------- */
function startAutoReturn() {
  let left = CFG.AUTORETURN_S;
  /* re-query per tick: a language switch re-renders the line */
  const draw = () => {
    const el = $(state.screen === 'success' ? '#retNum' : '#retNumT');
    if (el) el.textContent = left;
  };
  draw();
  state.timers.ret = setInterval(() => {
    left -= 1; draw();
    if (left <= 0) { clearTimers(['ret']); resetSession(); }
  }, 1000);
}

/* ---------- QR (visual placeholder — deterministic per ref) ---------- */
function drawQR(canvas, seedStr) {
  if (!canvas) return;
  const N = 29, S = 40;                 /* 29 modules @ 40px = 1160 backing, CSS scales */
  canvas.width = N * S; canvas.height = N * S;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  let h = 2166136261;
  for (const c of seedStr) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) / 4294967295); };
  ctx.fillStyle = '#1a1712';
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const inFinder = (x < 9 && y < 9) || (x >= N - 9 && y < 9) || (x < 9 && y >= N - 9);
    if (!inFinder && rnd() > 0.52) ctx.fillRect(x * S, y * S, S - 3, S - 3);
  }
  const finder = (fx, fy) => {
    ctx.fillStyle = '#1a1712';
    ctx.fillRect(fx * S, fy * S, 7 * S, 7 * S);
    ctx.fillStyle = '#fff';
    ctx.fillRect((fx + 1) * S, (fy + 1) * S, 5 * S, 5 * S);
    ctx.fillStyle = '#1a1712';
    ctx.fillRect((fx + 2) * S, (fy + 2) * S, 3 * S, 3 * S);
  };
  finder(0, 0); finder(N - 7, 0); finder(0, N - 7);
}

/* ---------- dynamic screen content ---------- */
function stationName(code, lang) {
  const s = STATIONS.find(x => x.code === code);
  return s ? s[lang] : code;
}
function renderDynamic() {
  const L = state.lang, O = otherLang(L);
  const o = state.order;
  const origin = KIOSK.station;

  /* product cards: from-fares */
  const minS = Math.min(...Object.values(FARES));
  $('#sjtFrom').textContent = inr(minS);
  $('#rjtFrom').textContent = inr(minS * 2);

  /* destination screen */
  setBL($('#destHint'),
    tf('dest.hint', L, stationName(origin, L)),
    tf('dest.hint', O, stationName(origin, O)));
  const dc = $('#destCards'); dc.innerHTML = '';
  STATIONS.filter(s => s.code !== origin).forEach((s, i) => {
    const hops = Math.abs(STATIONS.findIndex(x => x.code === s.code) - STATIONS.findIndex(x => x.code === origin));
    const fare = fareFor(o.product, s.code);
    const hopsTxt = hops === 1 ? t('hops.1', L) : tf('hops.n', L, hops);
    const fl = o.product === 'rjt' ? t('dfare.rjt', L) : t('dfare.sjt', L);
    const btn = document.createElement('button');
    btn.className = 'dest-card'; btn.dataset.dest = s.code;
    btn.innerHTML = `
      <span class="dcode">${s.code}</span>
      <span class="dname"><span class="bl">${blHTML(s[L], s[O])}</span>
        <span class="dhops">${hopsTxt}</span></span>
      <span class="dfare"><span class="amt">${inr(fare)}</span><span class="lbl">${fl}</span></span>`;
    btn.addEventListener('click', () => { state.order.dest = s.code; go('passengers'); });
    dc.appendChild(btn);
  });

  /* route map highlight */
  $$('#routeMap .rm-node').forEach(n => {
    n.classList.toggle('origin', n.dataset.code === origin);
  });
  const hereTag = $('#youAreHere');
  if (hereTag) hereTag.innerHTML = `${t('youarehere', L)} · ${t('youarehere', O)}`;

  /* passengers */
  const per = o.dest ? fareFor(o.product, o.dest) : 0;
  $('#paxCount').textContent = o.pax;
  $('#paxMath').innerHTML =
    `${o.pax} × ${inr(per)} = <b>${inr(per * o.pax)}</b>`;
  const paxKey = o.product === 'rjt' ? 'pax.note.rjt' : 'pax.note';
  setBL($('#paxNote'), tf(paxKey, L, MAX_GROUP), tf(paxKey, O, MAX_GROUP));
  $('#paxMinus').disabled = o.pax <= 1;
  $('#paxPlus').disabled = o.pax >= MAX_GROUP;
  const icons = $('#paxIcons'); icons.innerHTML = '';
  for (let i = 0; i < o.pax; i++) icons.insertAdjacentHTML('beforeend',
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="7" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>');

  /* summary */
  if (o.dest) {
    const total = orderTotal(), gst = gstOf(total);
    setBL($('#sumProduct'), t(o.product, L), t(o.product, O));
    $('#sumJourney').innerHTML =
      `<span class="bl">${blHTML(
        `${stationName(origin, L)} → ${stationName(o.dest, L)}`,
        `${stationName(origin, O)} → ${stationName(o.dest, O)}`)}</span>` +
      (o.product === 'rjt' ? `<span class="via">+ ${stationName(o.dest, L)} → ${stationName(origin, L)}</span>` : '');
    $('#sumPax').textContent = o.pax;
    $('#sumFare').textContent = inr(fareFor(o.product, o.dest));
    $('#sumTickets').textContent = ticketCount();
    $('#sumTotal').textContent = inr(total);
    const rate = (GST_RATE * 100).toFixed(0), gstAmt = inr2(gst).slice(1);
    $('#sumGst').innerHTML = `${tf('gst.line', L, rate, gstAmt)} · ${tf('gst.line', O, rate, gstAmt)}`;
    $('#payBtn').innerHTML =
      `<span class="bl">${blHTML(tf('pay.upi', L, total.toLocaleString('en-IN')),
                                 tf('pay.upi', O, total.toLocaleString('en-IN')))}</span>`;
  }

  /* upi screen */
  const payAmt = state.payCtx === 'topup' ? (state.topup.amount ?? 0) : (o.dest ? orderTotal() : 0);
  $('#upiAmt').textContent = inr(payAmt);
  $('#upiTitle').innerHTML = blHTML(
    t(state.payCtx === 'topup' ? 'upi.topup.q' : 'upi.q', L),
    t(state.payCtx === 'topup' ? 'upi.topup.q' : 'upi.q', O));
  if (state.ref) $('#upiRef').textContent = `${t('ref', L)} · ${state.ref}`;
  $$('.js-ref').forEach(e => e.textContent = state.ref || '—');

  /* success */
  const tc = ticketCount();
  $('#chipTickets').innerHTML = tc === 1 ? t('chip.ticket1', L) : tf('chip.tickets', L, tc);
  const rn = $('#retNum');   if (rn) { /* value driven by timer */ }

  /* card-tap context: balance enquiry vs recharge */
  const tc2 = $('#tapCtx');
  if (tc2) setBL(tc2,
    t(state.tapNext === 'topup-amount' ? 'ctx.topup' : 'ctx.balance', L),
    t(state.tapNext === 'topup-amount' ? 'ctx.topup' : 'ctx.balance', O));

  /* help facts with config values */
  const fg = $('#factGroup'); if (fg) fg.innerHTML = tf('fact.group', L, MAX_GROUP);

  /* localized assistive labels */
  const pm = $('#paxMinus'), pp = $('#paxPlus');
  if (pm) pm.setAttribute('aria-label', t('a11y.fewer', L));
  if (pp) pp.setAttribute('aria-label', t('a11y.more', L));

  /* balance / topup */
  $$('.js-balance').forEach(e => e.textContent = inr2(state.cardBalance));
  const nb = $('#newBal'); if (nb) nb.textContent = inr2(state.cardBalance);
  if (state.topup.amount) setBL($('#tsBody'),
    tf('ts.body', L, state.topup.amount.toLocaleString('en-IN')),
    tf('ts.body', O, state.topup.amount.toLocaleString('en-IN')));
  $$('.amt-cell').forEach(c => c.classList.toggle('sel', Number(c.dataset.amt) === state.topup.amount));

  /* autoreturn labels */
  $$('.js-retline').forEach(e => {
    e.innerHTML = `${tf('returning', L, `<b>${CFG.AUTORETURN_S}</b>`)}`
      .replace('<b>' + CFG.AUTORETURN_S + '</b>', `<b id="${e.dataset.num}">${CFG.AUTORETURN_S}</b>`);
  });
}

/* ---------- wire up ---------- */
function init() {
  /* raw mode for screenshots: ?screen=upi&lang=hi&raw=1 */
  const q = new URLSearchParams(location.search);
  if (q.get('lang')) state.lang = q.get('lang');

  applyI18n();
  tickClock(); setInterval(tickClock, 20000);

  /* attract → language */
  $('.scr[data-screen="attract"]').addEventListener('click', () => go('language'));

  /* language cards */
  $$('.lang-card').forEach(c => c.addEventListener('click', () => {
    setLang(c.dataset.lang); go('menu');
  }));
  /* footer language segment */
  $$('.lang-seg button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));

  /* menu tiles */
  $('#tileBuy').addEventListener('click', () => { state.payCtx = 'ticket'; go('product'); });
  $('#tileBalance').addEventListener('click', () => { state.payCtx = 'ticket'; state.tapNext = 'balance'; go('card-tap'); });
  $('#tileRecharge').addEventListener('click', () => { state.payCtx = 'topup'; state.tapNext = 'topup-amount'; go('card-tap'); });

  /* product cards */
  $$('.prod-card').forEach(c => c.addEventListener('click', () => {
    state.order.product = c.dataset.product; go('destination');
  }));

  /* passengers */
  $('#paxMinus').addEventListener('click', () => { if (state.order.pax > 1) { state.order.pax--; renderDynamic(); } });
  $('#paxPlus').addEventListener('click', () => { if (state.order.pax < MAX_GROUP) { state.order.pax++; renderDynamic(); } });
  $('#paxContinue').addEventListener('click', () => go('summary'));

  /* summary */
  $('#payBtn').addEventListener('click', () => { state.payCtx = 'ticket'; go('upi'); });

  /* timeout screen */
  $('#ptRetry').addEventListener('click', () => go('upi'));
  $('#ptStart').addEventListener('click', cancelToMenu);
  $('#pfDone').addEventListener('click', () => resetSession());

  /* success */
  $('#doneBtn').addEventListener('click', () => resetSession());

  /* balance / topup */
  $('#balRecharge').addEventListener('click', () => { state.payCtx = 'topup'; go('topup-amount'); });
  $('#balDone').addEventListener('click', () => resetSession());
  $$('.amt-cell').forEach(c => c.addEventListener('click', () => {
    state.topup.amount = Number(c.dataset.amt);
    renderDynamic();
    setTimeout(() => go('upi'), 220);
  }));
  $('#tsDone').addEventListener('click', () => resetSession());
  $('#cbDone').addEventListener('click', () => resetSession());

  /* back / cancel buttons */
  $$('.js-back').forEach(b => b.addEventListener('click', back));
  $$('.js-cancel').forEach(b => b.addEventListener('click', cancelToMenu));
  $('#helpBtn').addEventListener('click', () => go('help'));
  $('#helpBack').addEventListener('click', back);

  /* idle modal */
  $('#idleYes').addEventListener('click', () => { closeIdleModal(); armIdle(); });
  stage().addEventListener('pointerdown', () => { closeIdleModal(); armIdle(); }, true);
  armIdle();

  /* ---- review rail (outside the stage) ---- */
  $$('.rail [data-jump]').forEach(b => b.addEventListener('click', () => jump(b.dataset.jump)));
  const on = (id, fn) => { const e = $(id); if (e) e.addEventListener('click', fn); };
  on('#simPay',    simPaySuccess);
  on('#simTo',     simTimeout);
  on('#simJam',    simPrintJam);
  on('#simHot',    () => { if (state.screen === 'card-tap') { clearTimers(['tap']); go('card-blocked'); } });
  on('#simReset',  () => resetSession());
  on('#railToggle', () => document.body.classList.toggle('rail-closed'));
  $$('.rail [data-zoom]').forEach(b => b.addEventListener('click', () => setZoom(b.dataset.zoom)));
  $$('.rail [data-setlang]').forEach(b => b.addEventListener('click', () => setLang(b.dataset.setlang)));

  fitStage();
  window.addEventListener('resize', fitStage);

  if (q.get('raw')) {
    document.body.classList.add('raw');
    setZoom('raw');
  }
  if (q.get('screen')) jump(q.get('screen'));
  else go('attract', false);

  syncRail();
}

/* seeds so any screen can be jumped to with sensible data */
function jump(screen) {
  const seeded = ['summary', 'upi', 'printing', 'success', 'pay-timeout', 'print-fail'];
  if (seeded.includes(screen)) {
    state.payCtx = 'ticket';
    if (!state.order.dest) state.order = { product: 'sjt', dest: 'RYT', pax: 2 };
    if ((screen === 'pay-timeout' || screen === 'print-fail') && !state.ref) state.ref = newRef();
  }
  if (screen === 'passengers' && !state.order.dest) state.order.dest = 'RYT';
  if (screen === 'topup-success' && !state.topup.amount) state.topup.amount = 500;
  if (screen === 'balance' || screen === 'topup-amount') state.payCtx = screen === 'topup-amount' ? 'topup' : 'ticket';
  state.history = [];
  go(screen, false);
}

function syncRail() {
  $$('.rail [data-jump]').forEach(b =>
    b.classList.toggle('on', b.dataset.jump === state.screen));
  const ctx = $('#simCtx');
  if (ctx) {
    $('#simPay').disabled = state.screen !== 'upi';
    $('#simTo').disabled = state.screen !== 'upi';
    $('#simJam').disabled = state.screen !== 'printing';
    const hot = $('#simHot'); if (hot) hot.disabled = state.screen !== 'card-tap';
  }
}

/* ---------- stage scaling ---------- */
let zoomMode = 'fit';
function setZoom(m) { zoomMode = m; fitStage(); }
function fitStage() {
  const vp = $('#viewport'), st = stage();
  if (!vp || !st) return;
  if (zoomMode === 'raw') { st.style.transform = 'none'; return; }
  const pad = 48;
  const availW = vp.clientWidth - pad, availH = vp.clientHeight - pad;
  let s = Math.min(availW / 1080, availH / 1920);
  if (zoomMode === '50') s = 0.5;
  if (zoomMode === '100') s = 1;
  st.style.transform = `scale(${s})`;
  $$('.rail [data-zoom]').forEach(b => b.classList.toggle('on', b.dataset.zoom === zoomMode));
}

document.addEventListener('DOMContentLoaded', init);
