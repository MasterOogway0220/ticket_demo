/* ============================================================
   BOS console — mirrors apps/bos-console on fix/tester-bugs.
   Same pages, same strings, same permission gating, working
   actions against the localStorage store. Design system: bos.css.
   ============================================================ */

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- status badge (exact tone map) ---------- */
const TONES = {
  ok: ['active', 'published', 'approved', 'applied', 'ok', 'online', 'blocked_no', 'collected'],
  warn: ['pending', 'pending_approval', 'provisioning', 'maintenance', 'degraded', 'suspended', 'late', 'raised'],
  danger: ['faulty', 'rejected', 'failed', 'expired', 'down', 'offline', 'blocked', 'refused'],
};
function badge(status) {
  const s = String(status);
  const tone = TONES.ok.includes(s) ? 'ok' : TONES.warn.includes(s) ? 'warn' : TONES.danger.includes(s) ? 'danger' : 'dim';
  return `<span class="chip ${tone}">${esc(s.replace(/_/g, ' '))}</span>`;
}
function riskBadge(risk) {
  const tone = { low: 'dim', medium: 'info', high: 'warn', critical: 'danger' }[risk] || 'dim';
  return `<span class="chip ${tone}">${esc(risk)}</span>`;
}
const mono = (s) => `<span class="mono">${esc(s)}</span>`;

function toast(msg) {
  const t = $('#toast'); $('#toastMsg').textContent = msg;
  t.classList.add('show'); if (window.Motion) Motion.toast(t);
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 3400);
}

/* banner helpers — exact FormOutcome wording */
const savedBanner = (msg) => `<div class="notice-ok"><b>Saved</b>${msg ? ' ' + esc(msg) : ''}</div>`;
const approvalBanner = (ref, roles) => `<div class="notice-stale"><b>Submitted for approval — not yet applied</b><br>
  Submitted as ${esc(ref)}. A second person holding one of ${esc(roles)} must approve before this takes effect (BOS-SC-04, segregation of duties).<br>
  Reference ${esc(ref)} — <a href="#/approvals">view the approval queue</a></div>`;

function accessDenied(perm) {
  const roles = session.user ? [session.user.role] : [];
  const roleLine = roles.length === 0
    ? 'You hold no roles yet, so nothing has been granted to you.'
    : `You hold ${roles.join(', ')}, which ${roles.length > 1 ? 'do' : 'does'} not include it. Ask an administrator if you need it.`;
  return `<div class="card"><div class="pad">
    <p style="font-weight:600">This screen needs the ${mono(perm)} permission.</p>
    <p style="color:var(--b-ink-faint);margin-top:6px">${esc(roleLine)}</p></div></div>`;
}

/* ---------- routes: exact nav (label, hash, permission) ---------- */
const NAV = [
  { label: 'Dashboard',   id: 'dashboard', perm: null },
  { label: 'Stations',    id: 'stations',  perm: 'station.read' },
  { label: 'Devices',     id: 'devices',   perm: 'device.read' },
  { label: 'Products',    id: 'products',  perm: 'product.read' },
  { label: 'Fares',       id: 'fares',     perm: 'fare.read' },
  { label: 'Excess fare', id: 'excess-fare', perm: 'excess_fare.read' },
  { label: 'Reports',     id: 'reports',   perm: 'report.read' },
  { label: 'Alarms',      id: 'alarms',    perm: 'alarm.read' },
  { label: 'Hotlist',     id: 'hotlist',   perm: 'hotlist.read' },
  { label: 'Approvals',   id: 'approvals', perm: 'approval.read' },
  { label: 'Users',       id: 'users',     perm: 'user.read' },
  { label: 'Audit trail', id: 'audit',     perm: 'audit.read' },
];

/* ---------- shell ---------- */
const KI = {
  ticket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-4z"/><path d="M13 7v10" stroke-dasharray="2 3"/></svg>',
  rupee: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h12M6 8.5h12M6 4c4 0 7 2 7 6l-7 9.5"/><path d="M13 10H6"/></svg>',
  station: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21v-6h6v6"/></svg>',
  tom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="12" rx="2"/><path d="M7 7V5h10v2M3 12h18"/></svg>',
  tvm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M8.5 6.5h7v5h-7z"/><path d="M9 16h6"/></svg>',
  srv: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/></svg>',
  gate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9h6v6H9z"/></svg>',
  entry: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3"/><path d="M14 8l4 4-4 4M18 12H9"/></svg>',
  exit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"/><path d="M10 8l-4 4 4 4M6 12h9"/></svg>',
  appr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/></svg>',
  fare: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h4"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5 4.5 5.5v5c0 4.6 3.1 8.4 7.5 10 4.4-1.6 7.5-5.4 7.5-10v-5z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/></svg>',
  done: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></svg>',
};
const NAV_ICONS = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/></svg>',
  stations: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21v-6h6v6"/></svg>',
  devices: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
  products: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7-7A2 2 0 0 1 3 12.2V5a2 2 0 0 1 2-2h7.2a2 2 0 0 1 1.4.6l7 7a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1" fill="currentColor" stroke="none"/></svg>',
  fares: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h12M6 8.5h12M6 4c4 0 7 2 7 6l-7 9.5"/><path d="M13 10H6"/></svg>',
  'excess-fare': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-4z"/></svg>',
  reports: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 17v-3M12 17v-6M15 17v-4"/></svg>',
  alarms: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
  hotlist: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M5.5 5.5l13 13"/></svg>',
  labels: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3.5 12h17M12 3a14.5 14.5 0 0 1 0 18M12 3a14.5 14.5 0 0 0 0 18"/></svg>',
  approvals: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3.2 3.2 0 0 1 0 5.9M17.5 14.6a5.5 5.5 0 0 1 3 4.9"/></svg>',
  audit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5 4.5 5.5v5c0 4.6 3.1 8.4 7.5 10 4.4-1.6 7.5-5.4 7.5-10v-5z"/><path d="M9 11.5l2 2 4-4.5"/></svg>',
};
const NAV_GROUPS = [
  ['Overview', ['dashboard']],
  ['Network', ['stations', 'devices']],
  ['Commercial', ['products', 'fares', 'excess-fare']],
  ['Reporting', ['reports']],
  ['Operations', ['alarms', 'hotlist']],
  ['Governance', ['approvals', 'users', 'audit']],
];
function renderNav(current) {
  const visible = NAV.filter(n => !n.perm || session.can(n.perm));
  $('#nav').innerHTML = NAV_GROUPS.map(([title, ids]) => {
    const items = ids.map(id => visible.find(n => n.id === id)).filter(Boolean);
    if (!items.length) return '';
    return `<h6>${title}</h6>` + items.map(n =>
      `<a href="#/${n.id}" class="${n.id === current ? 'on' : ''}">${NAV_ICONS[n.id] || ''}<span>${esc(n.label)}</span></a>`).join('');
  }).join('');
}
function setHeader(title, desc) {
  $('#pageTitle').textContent = title;
  if ($('#pageSub')) $('#pageSub').textContent = '';
  const d = $('#pageDesc');
  if (d) { d.textContent = desc || ''; d.style.display = desc ? '' : 'none'; }
}
function renderUserBox() {
  $('#topUserName').textContent = session.user.name;
  $('#topUserRoles').textContent = session.user.role;
  $('#roBadge').style.display = session.isReadOnly() ? '' : 'none';
  const av = $('#tbAv');
  if (av) av.textContent = session.user.name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const n = $('#tbBellN');
  if (n) {
    const open = store.db.approvals.filter(a => a.status === 'pending' && a.maker !== session.user.username).length
      + store.db.alarms.filter(a => !a.acknowledgedAt).length;
    n.textContent = open; n.style.display = open ? '' : 'none';
  }
}

/* ---------- router ---------- */
let CURRENT = 'dashboard', PARAM = null;
function route() {
  const h = location.hash.replace(/^#\//, '') || 'dashboard';
  const [page, param] = h.split('/');
  CURRENT = page; PARAM = param || null;
  const def = NAV.find(n => n.id === page);
  if (!def || !PAGES[page]) { location.hash = '#/dashboard'; return; }
  closeDrawer();
  const render = () => {
    renderNav(page);
    const fresh = $('#content').cloneNode(false);
    $('#content').replaceWith(fresh);
    PAGES[page](param);
    window.scrollTo(0, 0);
  };
  // buttery page change: the browser morphs the nav pill and slides the
  // content in (see ::view-transition rules in bos.css); GSAP fallback
  const vt = route._ran && document.startViewTransition &&
    !matchMedia('(prefers-reduced-motion: reduce)').matches;
  route._ran = true;
  if (vt) document.startViewTransition(render);
  else { render(); if (window.Motion) Motion.page(); }
}
window.addEventListener('hashchange', route);

/* ============================================================ PAGES */
const PAGES = {};

/* ---------- Dashboard — role-aware numeric analysis with a period filter ---------- */
const DASH = { range: 'today', date: null, station: 'all' };
const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function dashRange() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = [];
  const push = (from, to) => { for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) days.push(dayKey(d)); };
  const fmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  let label = 'today';
  switch (DASH.range) {
    case 'yesterday': { const y = new Date(today); y.setDate(y.getDate() - 1); push(y, y); label = `yesterday, ${fmt(y)}`; break; }
    case 'week': { const s = new Date(today); s.setDate(s.getDate() - ((s.getDay() + 6) % 7)); push(s, today); label = `this week, ${fmt(s)} to ${fmt(today)}`; break; }
    case '7d': { const s = new Date(today); s.setDate(s.getDate() - 6); push(s, today); label = `last 7 days, ${fmt(s)} to ${fmt(today)}`; break; }
    case 'month': { const s = new Date(today.getFullYear(), today.getMonth(), 1); push(s, today); label = `${today.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}, to date`; break; }
    case '30d': { const s = new Date(today); s.setDate(s.getDate() - 29); push(s, today); label = `last 30 days, ${fmt(s)} to ${fmt(today)}`; break; }
    case 'date': { const d = DASH.date ? new Date(DASH.date + 'T00:00:00') : today; push(d, d); label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); break; }
    default: push(today, today); label = 'today, 05:00 to now';
  }
  return { days: new Set(days), label };
}

PAGES.dashboard = () => {
  setHeader('Operational overview');
  if ($('#pageSub')) $('#pageSub').textContent = "Real-time summary of today's operations";
  const db = store.db;
  const me = session.user;
  const num = (n) => n.toLocaleString('en-IN');
  const stat = (v, l) => `<div class="st"><b>${v}</b><span>${l}</span></div>`;
  const { days, label } = dashRange();

  /* period aggregation of the seeded reporting feed */
  const rows = (db.opsDaily || []).filter(r => days.has(r.date));
  const agg = {};
  for (const r of rows) {
    const a = agg[r.code] || (agg[r.code] = { code: r.code, tomT: 0, tomG: 0, tvmT: 0, tvmG: 0, taps: 0 });
    a.tomT += r.tom.tickets; a.tomG += r.tom.grossPaise;
    a.tvmT += r.tvm.tickets; a.tvmG += r.tvm.grossPaise;
    a.taps += r.ncmcTaps;
  }
  const stAgg = db.stations.slice().sort((a, b) => a.seq - b.seq).map(s => agg[s.code]).filter(Boolean);
  const sum = (f) => stAgg.reduce((a, o) => a + f(o), 0);
  const tomT = sum(o => o.tomT), tvmT = sum(o => o.tvmT);
  const tomG = sum(o => o.tomG), tvmG = sum(o => o.tvmG);
  const tickets = tomT + tvmT, gross = tomG + tvmG, taps = sum(o => o.taps);
  const taxable = Math.round(gross / 1.18);
  const cgst = Math.round((gross - taxable) / 2), sgst = gross - taxable - cgst;

  /* excess-fare cases within the period */
  const dayList = [...days].sort();
  const startMs = new Date(dayList[0] + 'T00:00:00').getTime();
  const endMs = new Date(dayList[dayList.length - 1] + 'T23:59:59').getTime();
  const efIn = db.efCases.filter(c => c.openedAt >= startMs && c.openedAt <= endMs);
  const efFare = efIn.reduce((a, c) => a + (c.farePaise || 0), 0);
  const efFine = efIn.reduce((a, c) => a + (c.finePaise || 0), 0);
  const efWaived = efIn.filter(c => c.outcome === 'waived').length;

  /* point-in-time facts */
  const byType = (t, st) => db.devices.filter(d => d.type === t && (!st || d.station === st)).length;
  const online = (st) => db.devices.filter(d => (!st || d.station === st) && d.lastSeen && Date.now() - d.lastSeen < 300e3).length;
  const devTotal = (st) => db.devices.filter(d => !st || d.station === st).length;
  const actionable = db.approvals.filter(a => a.status === 'pending' && a.maker !== me.username && session.can('approval.decide'));
  const pendingAll = db.approvals.filter(a => a.status === 'pending').length;
  const uBy = (s) => db.users.filter(u => u.status === s).length;
  const alarmsOpen = (st) => db.alarms.filter(a => !a.acknowledgedAt && (!st || a.stationCode === st)).length;
  const canAudit = session.can('audit.verify');
  const fares = db.fareVersions.slice().sort((a, b) => b.versionNo - a.versionNo).slice(0, 5);
  const stName = (c) => (db.stations.find(s => s.code === c) || { en: c }).en;

  /* ── section builders ─────────────────────────────────────── */
  const filterBar = () => `
    <div class="dashfilter">
      <span>Showing</span>
      <select id="dashRange">
        <option value="today" ${DASH.range === 'today' ? 'selected' : ''}>Today</option>
        <option value="yesterday" ${DASH.range === 'yesterday' ? 'selected' : ''}>Yesterday</option>
        <option value="week" ${DASH.range === 'week' ? 'selected' : ''}>This week</option>
        <option value="7d" ${DASH.range === '7d' ? 'selected' : ''}>Last 7 days</option>
        <option value="month" ${DASH.range === 'month' ? 'selected' : ''}>This month</option>
        <option value="30d" ${DASH.range === '30d' ? 'selected' : ''}>Last 30 days</option>
        <option value="date" ${DASH.range === 'date' ? 'selected' : ''}>On a date…</option>
      </select>
      <input type="date" id="dashDate" value="${DASH.date || dayKey(new Date())}" ${DASH.range === 'date' ? '' : 'style="display:none"'}>
      ${session.can('report.read') ? `<select id="dashStation">
        <option value="all" ${DASH.station === 'all' ? 'selected' : ''}>All stations</option>
        ${db.stations.slice().sort((a, b) => a.seq - b.seq).map(s => `<option value="${s.code}" ${DASH.station === s.code ? 'selected' : ''}>${s.code} — ${esc(s.en)}</option>`).join('')}
      </select>` : ''}
      <span class="hspace"></span>
      <span class="df-pill">${KI.clock}${esc(label)}</span>
      <button class="df-refresh" id="dashRefresh" aria-label="Refresh figures">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-.6 4"/><path d="M20 4.5V11h-6"/></svg>
      </button>
    </div>`;

  const opsRow = (o) => `<tr><td>${esc(stName(o.code))} ${mono(o.code)}</td>
      <td class="num">${num(o.tomT)}</td><td class="num">${fmtP(o.tomG)}</td>
      <td class="num">${num(o.tvmT)}</td><td class="num">${fmtP(o.tvmG)}</td>
      <td class="num">${num(o.taps)}</td>
      <td class="num">${num(o.tomT + o.tvmT)}</td>
      <td class="num">${fmtP(o.tomG + o.tvmG)}</td></tr>`;
  const opsTable = () => stAgg.length === 0
    ? `<div class="card"><header><h2>Operations by station</h2></header><div class="empty">No operations data is seeded for this period.</div></div>`
    : `<div class="card">
      <header><h2>Operations by station</h2><div class="hspace"></div><span class="chip dim">${esc(label)}</span></header>
      <div class="tscroll"><table class="grid">
        <thead><tr><th>Station</th><th class="num">ToM tickets</th><th class="num">ToM collected</th><th class="num">TVM tickets</th><th class="num">TVM collected</th><th class="num">NCMC taps</th><th class="num">Total tickets</th><th class="num">Total collected</th></tr></thead>
        <tbody>${stAgg.map(opsRow).join('')}</tbody>
        <tfoot><tr><td>All stations</td><td class="num">${num(tomT)}</td><td class="num">${fmtP(tomG)}</td><td class="num">${num(tvmT)}</td><td class="num">${fmtP(tvmG)}</td><td class="num">${num(taps)}</td><td class="num">${num(tickets)}</td><td class="num">${fmtP(gross)}</td></tr></tfoot>
      </table></div>
    </div>`;

  const revenueGrid = () => `
    <div class="card">
      <header><h2>Revenue analysis</h2><div class="hspace"></div><span class="chip dim">${esc(label)}</span></header>
      <div class="statgrid">
        ${stat(fmtP(gross), 'Gross collected')}
        ${stat(fmtP(taxable), 'Taxable value')}
        ${stat(fmtP(cgst), 'CGST @ 9.00%')}
        ${stat(fmtP(sgst), 'SGST @ 9.00%')}
        ${stat(fmtP(tickets ? Math.round(gross / tickets) : 0), 'Average fare per ticket')}
        ${stat(tickets ? (tomT * 100 / tickets).toFixed(1) + '%' : '—', 'Sold at the counter (ToM)')}
        ${stat(tickets ? (tvmT * 100 / tickets).toFixed(1) + '%' : '—', 'Sold at kiosks (TVM)')}
        ${stat(fmtP(efFare), 'Excess fare collected')}
        ${stat(fmtP(efFine), 'Fines collected')}
        ${stat(num(efWaived), 'Cases waived')}
      </div>
    </div>`;

  const estateRow = (s) => `<tr><td>${esc(s.en)} ${mono(s.code)}</td>
      <td class="num">${byType('ECU', s.code)}</td><td class="num">${byType('TOM', s.code)}</td><td class="num">${byType('TVM', s.code)}</td>
      <td class="num">${byType('EXCESS_FARE', s.code)}</td><td class="num">${byType('STATION_SERVER', s.code)}</td><td class="num">${byType('HANDHELD', s.code)}</td>
      <td class="num">${devTotal(s.code)}</td><td class="num">${online(s.code)}</td>
      ${session.can('user.read') ? `<td class="num">${db.users.filter(u => u.station === s.code).length}</td>` : ''}</tr>`;
  const estateTable = () => `
    <div class="card">
      <header><h2>Network estate</h2><div class="hspace"></div><span class="chip dim">${num(db.devices.length)} devices · ${num(db.stations.length)} stations</span></header>
      <div class="tscroll"><table class="grid">
        <thead><tr><th>Station</th><th class="num">Gates</th><th class="num">Counters</th><th class="num">Kiosks</th><th class="num">EFO</th><th class="num">Servers</th><th class="num">Handhelds</th><th class="num">Total</th><th class="num">Reporting</th>${session.can('user.read') ? '<th class="num">Staff</th>' : ''}</tr></thead>
        <tbody>${db.stations.slice().sort((a, b) => a.seq - b.seq).map(estateRow).join('')}</tbody>
        <tfoot><tr><td>All stations</td><td class="num">${byType('ECU')}</td><td class="num">${byType('TOM')}</td><td class="num">${byType('TVM')}</td><td class="num">${byType('EXCESS_FARE')}</td><td class="num">${byType('STATION_SERVER')}</td><td class="num">${byType('HANDHELD')}</td><td class="num">${num(db.devices.length)}</td><td class="num">${online()}</td>${session.can('user.read') ? `<td class="num">${num(db.users.length)}</td>` : ''}</tr></tfoot>
      </table></div>
    </div>`;

  const smartGrid = () => {
    const scope = DASH.station === 'all' ? null : DASH.station;
    const dIn = db.devices.filter(d => !scope || d.station === scope);
    const act = (t) => { const l = dIn.filter(d => d.type === t); return { on: l.filter(x => x.status === 'active').length, total: l.length }; };
    const tom = act('TOM'), tvm = act('TVM'), srv = act('STATION_SERVER'), ecu = act('ECU');
    const entry = dIn.filter(d => d.type === 'ECU' && d.dir === 'entry').length;
    const exit = dIn.filter(d => d.type === 'ECU' && d.dir === 'exit').length;
    const o = scope ? (agg[scope] || { tomT: 0, tomG: 0, tvmT: 0, tvmG: 0, taps: 0 }) : { tomT, tomG, tvmT, tvmG, taps };
    const t = o.tomT + o.tvmT, g = o.tomG + o.tvmG;
    const stIn = db.stations.filter(s => !scope || s.code === scope);
    const stOn = stIn.filter(s => s.status === 'active').length;
    /* same window, shifted back by its own length — a like-for-like comparison */
    const prevDays = new Set(dayList.map(k => { const d = new Date(k + 'T00:00:00'); d.setDate(d.getDate() - dayList.length); return dayKey(d); }));
    const pRows = (db.opsDaily || []).filter(r => prevDays.has(r.date) && (!scope || r.code === scope));
    /* today is a part-day, so the day before is scaled to the same elapsed slice */
    const nowH = new Date().getHours() + new Date().getMinutes() / 60;
    const frac = DASH.range === 'today' ? Math.min(1, Math.max(0.05, (nowH - 5) / 16)) : 1;
    const pT = pRows.reduce((a, r) => a + r.tom.tickets + r.tvm.tickets, 0) * frac;
    const pG = pRows.reduce((a, r) => a + r.tom.grossPaise + r.tvm.grossPaise, 0) * frac;
    const vsWhat = DASH.range === 'today' ? 'vs same time yesterday' : 'vs previous period';
    const trend = (now, before) => {
      if (!before) return '';
      const d = (now - before) / before * 100;
      const up = d >= 0;
      return `<span class="kpi-m ${up ? 'up' : 'down'}">${up ? '↗' : '↘'} ${Math.abs(d).toFixed(1)}% ${vsWhat}</span>`;
    };
    const dot = (on, total) => total - on
      ? `<span class="kpi-m warn">${total - on} inactive</span>`
      : `<span class="kpi-m ok">100% operational</span>`;
    const live = `<span class="kpi-m ok">Live</span>`;
    const kpi = (i, icon, value, label, meta) => `<div class="kpi k${i}">
      <span class="kpi-ic">${icon}</span><b>${value}</b><span class="kpi-l">${label}</span>${meta || ''}</div>`;
    return `
    <div class="kpigrid">
      ${kpi(1, KI.ticket, num(t), 'Tickets issued', trend(t, pT))}
      ${kpi(2, KI.rupee, fmtP(g), 'Amount collected', trend(g, pG))}
      ${kpi(3, KI.station, `${stOn} / ${stIn.length}`, 'Stations active', dot(stOn, stIn.length))}
      ${kpi(4, KI.tom, `${tom.on} / ${tom.total}`, 'ToM counters active', dot(tom.on, tom.total))}
      ${kpi(5, KI.tvm, `${tvm.on} / ${tvm.total}`, 'TVM kiosks active', dot(tvm.on, tvm.total))}
      ${kpi(6, KI.srv, `${srv.on} / ${srv.total}`, 'Station servers active', dot(srv.on, srv.total))}
      ${kpi(7, KI.entry, num(entry), 'Entry gates', live)}
      ${kpi(8, KI.exit, num(exit), 'Exit gates', live)}
    </div>`;
  };

  const governanceGrid = (title) => `
    <div class="card">
      <header><h2>${title || 'Governance &amp; integrity'}</h2></header>
      <div class="statgrid">
        ${session.can('approval.read') ? stat(num(pendingAll), 'Approvals pending') + stat(num(actionable.length), 'For your decision') : ''}
        ${session.can('user.read') ? stat(num(uBy('active')), 'Active staff accounts') + stat(num(uBy('invited')), 'Invited, not yet signed in') + stat(num(uBy('suspended')), 'Suspended accounts') : ''}
        ${session.can('fare.read') ? stat(num(db.fareVersions.filter(v => v.status === 'published').length), 'Fare versions published') + stat(num(db.fareVersions.filter(v => v.status === 'pending_approval').length), 'Fare versions awaiting approval') : ''}
        ${session.can('alarm.read') ? stat(num(alarmsOpen()), 'Alarms unacknowledged') : ''}
        ${session.can('hotlist.read') ? stat(num(db.hotlist.length), 'Hotlist entries') : ''}
        ${session.can('audit.read') ? stat(num(db.audit.length), 'Audit entries' + (canAudit ? ' — chain intact' : '')) : ''}
      </div>
    </div>`;

  const stationScope = (code) => {
    const o = agg[code] || { tomT: 0, tomG: 0, tvmT: 0, tvmG: 0, taps: 0 };
    const t = o.tomT + o.tvmT, g = o.tomG + o.tvmG;
    return `
    <div class="tiles-b">
      <div class="tile-b"><div class="ic">${I.rupee}</div><div class="tv"><b>${num(t)}</b><span>Tickets at ${esc(stName(code))} — ${esc(label)}</span></div></div>
      <div class="tile-b"><div class="ic">${I.rupee}</div><div class="tv"><b>${fmtP(g)}</b><span>Collected at this station — Gross, GST-inclusive</span></div></div>
      ${session.can('device.read') ? `<div class="tile-b"><div class="ic">${I.device}</div><div class="tv"><b>${online(code)} / ${devTotal(code)}</b><span>Devices reporting — Heartbeat within 5 minutes</span></div></div>` : ''}
      ${session.can('alarm.read') ? `<div class="tile-b"><div class="ic">${I.appr}</div><div class="tv"><b>${num(alarmsOpen(code))}</b><span>Alarms unacknowledged — At this station</span></div></div>` : ''}
    </div>
    <div class="card">
      <header><h2>${esc(stName(code))} — sales analysis</h2><div class="hspace"></div><span class="chip dim">${esc(label)}</span></header>
      <div class="statgrid">
        ${stat(num(o.tomT), 'Counter tickets (ToM)')}
        ${stat(fmtP(o.tomG), 'Counter collected')}
        ${stat(num(o.tvmT), 'Kiosk tickets (TVM)')}
        ${stat(fmtP(o.tvmG), 'Kiosk collected')}
        ${stat(num(o.taps), 'NCMC taps at the gates')}
        ${stat(fmtP(t ? Math.round(g / t) : 0), 'Average fare per ticket')}
        ${stat(t ? (o.tomT * 100 / t).toFixed(1) + '%' : '—', 'Counter share')}
      </div>
    </div>
    ${session.can('device.read') ? `
    <div class="card">
      <header><h2>${esc(stName(code))} — equipment</h2></header>
      <div class="statgrid">
        ${stat(num(byType('ECU', code)), 'Gate controllers')}
        ${stat(num(byType('TOM', code)), 'Ticket counters')}
        ${stat(num(byType('TVM', code)), 'Kiosks')}
        ${stat(num(byType('EXCESS_FARE', code)), 'Excess fare terminals')}
        ${stat(num(byType('STATION_SERVER', code)), 'Station servers')}
        ${stat(num(online(code)) + ' / ' + num(devTotal(code)), 'Reporting now')}
        ${session.can('user.read') ? stat(num(db.users.filter(u => u.station === code).length), 'Staff assigned here') : ''}
      </div>
    </div>` : ''}`;
  };

  const efScope = (code) => {
    const open = db.efCases.filter(c => !c.outcome).length;
    return `
    <div class="tiles-b">
      <div class="tile-b"><div class="ic">${I.appr}</div><div class="tv"><b>${num(efIn.length)}</b><span>Excess fare cases — ${esc(label)}</span></div></div>
      <div class="tile-b"><div class="ic">${I.rupee}</div><div class="tv"><b>${fmtP(efFare)}</b><span>Fare collected — Revenue</span></div></div>
      <div class="tile-b"><div class="ic">${I.rupee}</div><div class="tv"><b>${fmtP(efFine)}</b><span>Fines collected — Penalty, not revenue</span></div></div>
      <div class="tile-b"><div class="ic">${I.audit}</div><div class="tv"><b>${num(efWaived)}</b><span>Waived — Closed without charge</span></div></div>
    </div>
    <div class="card">
      <header><h2>Case analysis</h2><div class="hspace"></div><a class="btn btn-ghost" style="height:34px" href="#/excess-fare">Open the case desk</a></header>
      <div class="statgrid">
        ${stat(num(efIn.length), 'Cases in the period')}
        ${stat(num(open), 'Cases still open')}
        ${stat(num(db.efCases.length), 'Cases all time, this browser')}
        ${stat(fmtP(efFare + efFine), 'Total taken at the office')}
      </div>
    </div>
    ${stationScope(code)}`;
  };

  const twoCol = () => `
    <div class="two-col">
      ${session.can('approval.read') ? `
      <div class="card">
        <header class="hd"><span class="hd-ic">${KI.appr}</span>
          <div class="hd-t"><h2>Awaiting your decision</h2><p>Requests raised by someone else. You cannot decide your own.</p></div>
          <div class="hspace"></div><a class="btn btn-ghost" href="#/approvals">View all</a></header>
        ${actionable.length === 0 ? `<div class="allcaught"><span class="ac-ic">${KI.done}</span><b>All caught up!</b><span>No items are waiting on your decision.</span></div>` : `
        <div class="tscroll"><table class="grid">
          <thead><tr><th>Reference</th><th>Change</th><th>Raised by</th><th>Expires</th></tr></thead>
          <tbody>${actionable.slice(0, 5).map(a => {
            const left = Math.max(0, Math.ceil((a.expiresAt - Date.now()) / 86400e3));
            const ini = (a.makerDisplay || '?').split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
            return `<tr>
            <td><a class="mono" href="#/approvals" style="text-decoration:underline">${esc(a.requestRef)}</a></td>
            <td>${esc(a.summary)}</td>
            <td><span class="rowwho"><span class="rw-av">${esc(ini)}</span>${esc(a.makerDisplay || '—')}</span></td>
            <td style="color:var(--b-ink-faint)">${fmtDT(a.expiresAt)}<div class="expchip ${left <= 2 ? 'soon' : ''}">${left}d left</div></td></tr>`;
          }).join('')}</tbody>
        </table></div>`}
      </div>` : ''}
      ${session.can('fare.read') ? `
      <div class="card">
        <header class="hd"><span class="hd-ic">${KI.fare}</span>
          <div class="hd-t"><h2>Fare versions</h2><p>A published version is immutable. Changes are published forward, never edited.</p></div>
          <div class="hspace"></div><a class="btn btn-ghost" href="#/fares">View all</a></header>
        <div class="tscroll"><table class="grid">
          <thead><tr><th class="num">Version</th><th>Title</th><th>Status</th><th>Effective from</th></tr></thead>
          <tbody>${fares.map(v => `<tr>
            <td class="num">${v.versionNo}</td>
            <td><a href="#/fares/${v.id}" style="text-decoration:underline;color:inherit">${esc(v.title)}</a></td>
            <td>${badge(v.status)}</td><td style="color:var(--b-ink-faint)">${fmtDT(v.effectiveFrom)}</td></tr>`).join('')}</tbody>
        </table></div>
        ${(() => {
          const pub = db.fareVersions.filter(v => v.status === 'published');
          const pend = db.fareVersions.filter(v => v.status === 'pending_approval').length;
          const last = pub.slice().sort((a, b) => (b.effectiveFrom || 0) - (a.effectiveFrom || 0))[0];
          return `<div class="cardfoot">
            <div class="cf-cell"><span class="cf-ic">${KI.shield}</span><div><b>${db.fareVersions.length} versions total</b><span>${pub.length} published · ${pend} pending</span></div></div>
            <div class="cf-cell"><span class="cf-ic">${KI.clock}</span><div><b>Last published</b><span>${last ? fmtDT(last.effectiveFrom) : '—'}</span></div></div>
          </div>`;
        })()}
      </div>` : ''}
    </div>`;

  /* ── role compositions — each sign-in reads a different desk ── */
  let body;
  const role = me.role;
  if (role === 'FINANCE_OFFICER') {
    setHeader('Revenue & reconciliation');
    body = `
      <div class="tiles-b">
        <div class="tile-b"><div class="ic">${I.rupee}</div><div class="tv"><b>${fmtP(gross)}</b><span>Gross collected — ${esc(label)}</span></div></div>
        <div class="tile-b"><div class="ic">${I.rupee}</div><div class="tv"><b>${fmtP(gross - taxable)}</b><span>GST within it — CGST + SGST</span></div></div>
        <div class="tile-b"><div class="ic">${I.appr}</div><div class="tv"><b>${num(tickets)}</b><span>Tickets behind the money — ToM ${num(tomT)} · TVM ${num(tvmT)}</span></div></div>
        <div class="tile-b"><div class="ic">${I.audit}</div><div class="tv"><b>${num(actionable.length)}</b><span>Awaiting your decision — Fare and refund approvals</span></div></div>
      </div>
      ${revenueGrid()}
      ${opsTable()}
      ${governanceGrid('Approvals &amp; fare governance')}
      ${twoCol()}`;
  } else if (role === 'AUDITOR') {
    setHeader('Audit & integrity');
    body = `
      <div class="tiles-b">
        <div class="tile-b"><div class="ic">${I.audit}</div><div class="tv"><b>${canAudit ? 'Intact' : '—'}</b><span>Audit chain — ${num(db.audit.length)} entries, hash-linked</span></div></div>
        <div class="tile-b"><div class="ic">${I.appr}</div><div class="tv"><b>${num(pendingAll)}</b><span>Approvals pending — Across all makers</span></div></div>
        <div class="tile-b"><div class="ic">${I.station}</div><div class="tv"><b>${num(db.fareVersions.filter(v => v.status === 'published').length)}</b><span>Fare versions in force — Published, immutable</span></div></div>
        <div class="tile-b"><div class="ic">${I.device}</div><div class="tv"><b>${num(db.users.filter(u => u.status === 'active').length)}</b><span>Active staff accounts — Of ${num(db.users.length)} on record</span></div></div>
      </div>
      ${governanceGrid()}
      ${opsTable()}
      ${estateTable()}
      ${twoCol()}`;
  } else if (role === 'STATION_CONTROLLER' || role === 'TOM_OPERATOR') {
    setHeader(`${stName(me.station)} — station overview`);
    body = stationScope(me.station);
  } else if (role === 'EXCESS_FARE_OFFICER') {
    setHeader('Excess fare desk');
    body = efScope(me.station);
  } else {
    /* SYSTEM_ADMIN and anything unrecognised: the full estate */
    body = `
      ${smartGrid()}
      ${twoCol()}`;
  }

  $('#content').innerHTML = filterBar() + body;

  $('#dashRange')?.addEventListener('change', () => {
    DASH.range = $('#dashRange').value;
    if (DASH.range === 'date' && !DASH.date) DASH.date = dayKey(new Date());
    PAGES.dashboard();
  });
  $('#dashDate')?.addEventListener('change', () => { DASH.date = $('#dashDate').value; PAGES.dashboard(); });
  $('#dashStation')?.addEventListener('change', () => { DASH.station = $('#dashStation').value; PAGES.dashboard(); });
};

/* ---------- Stations ---------- */
PAGES.stations = (param) => {
  if (!session.can('station.read')) { setHeader('Stations'); $('#content').innerHTML = accessDenied('station.read'); return; }
  if (param) return stationEdit(param);
  setHeader('Station master', 'BOS-DM-01. Stations are ordered by their position along the route; that ordering drives every report and every distance-based fare.');
  const rows = store.db.stations.slice().sort((a, b) => a.seq - b.seq);
  const w = session.can('station.write') && !session.isReadOnly();
  $('#content').innerHTML = `
    <div class="card">
      <header><h2>${rows.length} stations</h2><div class="hspace"></div>${w ? `<button class="btn btn-primary" id="newStation">New station</button>` : ''}</header>
      <div class="tscroll"><table class="grid">
        <thead><tr><th class="num">#</th><th>Code</th><th>Name</th><th>Type</th><th>Status</th><th>Operating hours</th>${w ? '<th></th>' : ''}</tr></thead>
        <tbody>${rows.map(s => `<tr>
          <td class="num">${s.seq}</td><td>${mono(s.code)}</td>
          <td>${esc(s.en)}<div style="font-size:12px;color:var(--b-ink-faint)" lang="hi-IN">${esc(s.hi)}</div></td>
          <td>${esc(s.type)}</td>
          <td>${badge(s.status === 'active' ? 'active' : 'inactive')}</td>
          <td>${s.open ? `${s.open}–${s.close}` : '—'}</td>
          ${w ? `<td style="text-align:right"><a href="#/stations/${s.code}" style="text-decoration:underline">Edit</a></td>` : ''}</tr>`).join('')}</tbody>
      </table></div>
    </div>`;
  if (w) $('#newStation')?.addEventListener('click', () => stationForm(null));
};

function stationForm(code) {
  const s = code ? store.db.stations.find(x => x.code === code) : null;
  openDrawer(s ? `Edit ${s.en}` : 'Register a station',
    s ? `Station ${s.code}. Every change is recorded against your identity with the values before and after.`
      : 'BOS-DM-01. The station code and its position on the route are the two values that are painful to change later — both appear in reports and in the fare table.', `
    ${s ? '' : `<div class="field"><label>Station code <i class="req">*</i></label><input id="fCode" maxlength="6" placeholder="VCT"><div class="hint">Two to six upper-case letters. Used in reports and clearing files, so it must be stable.</div></div>`}
    ${s ? `<div class="field"><label>Station code</label><input value="${esc(s.code)}" disabled><div class="hint">The code cannot be changed — it appears in reports and clearing files.</div></div>` : ''}
    <div class="field"><label>Position on the route <i class="req">*</i></label><input id="fSeq" type="number" min="1" value="${s ? s.seq : ''}"><div class="hint">Order along the line. Drives every report and every distance-based fare.</div></div>
    <div class="field"><label>Name (English) <i class="req">*</i></label><input id="fEn" value="${esc(s ? s.en : '')}"></div>
    <div class="field"><label>Name (Hindi)</label><input id="fHi" value="${esc(s ? s.hi : '')}" lang="hi-IN"><div class="hint">Shown on screens and receipts alongside the English name.</div></div>
    <div class="field"><label>Type <i class="req">*</i></label><select id="fType">
      <option value="terminal" ${s && s.type === 'terminal' ? 'selected' : ''}>Terminal — end of the line</option>
      <option value="intermediate" ${s && s.type === 'intermediate' ? 'selected' : ''}>Intermediate</option></select></div>
    <div class="field"><label>Opens</label><input id="fOpen" type="time" value="${s ? s.open : '05:00'}"></div>
    <div class="field"><label>Closes</label><input id="fClose" type="time" value="${s ? s.close : '21:00'}"></div>
    <div class="field"><label>Status</label><select id="fStatus">
      <option value="active" ${!s || s.status === 'active' ? 'selected' : ''}>Active</option>
      <option value="suspended" ${s && s.status !== 'active' ? 'selected' : ''}>Inactive</option></select>
      <div class="hint">Inactive takes the station out of service without giving up its position on the route.</div></div>
    <div class="drawer-actions">
      <button class="btn btn-primary" id="fSave">${s ? 'Save changes' : 'Create station'}</button>
      <button class="btn btn-quiet" id="fCancel">Cancel</button>
    </div>
    ${s ? `<div class="card" style="margin-top:18px"><header><h2>Delete this station</h2></header>
      <div class="pad" style="font-size:13px;color:var(--b-ink-soft)">For a station registered in error. A station that is closing should be set to Inactive instead — deleting removes the record, and reports covering the time it was open would no longer resolve where those journeys happened.
      <div style="margin-top:12px">${s.status === 'active'
        ? `<div class="hint" style="color:var(--warn)">Set the station to Inactive and save it before it can be deleted.</div><button class="btn btn-danger" disabled>Delete station</button>`
        : `<button class="btn btn-danger" id="fDelete">Delete station</button>`}</div></div></div>` : ''}`);
  $('#fCancel').addEventListener('click', closeDrawer);
  $('#fSave').addEventListener('click', () => {
    const en = $('#fEn').value.trim(); if (!en) return toast('One field needs correcting — see the message below it.');
    if (s) {
      Object.assign(s, { seq: +$('#fSeq').value || s.seq, en, hi: $('#fHi').value.trim(), type: $('#fType').value, open: $('#fOpen').value, close: $('#fClose').value, status: $('#fStatus').value === 'active' ? 'active' : 'suspended' });
      store.logAudit('station.update', 'station', null, session.user.name); store.save();
      toast('Saved — The station has been updated.'); closeDrawer(); route();
    } else {
      const codeV = ($('#fCode').value || '').trim().toUpperCase();
      if (!/^[A-Z]{2,6}$/.test(codeV)) return toast('Two to six upper-case letters.');
      store.db.stations.push({ code: codeV, en, hi: $('#fHi').value.trim(), type: $('#fType').value, seq: +$('#fSeq').value || store.db.stations.length + 1, status: $('#fStatus').value === 'active' ? 'active' : 'suspended', open: $('#fOpen').value, close: $('#fClose').value });
      store.logAudit('station.create', 'station', null, session.user.name); store.save();
      closeDrawer(); route();
    }
  });
  $('#fDelete')?.addEventListener('click', () => {
    const refs = [];
    const dn = store.db.devices.filter(d => d.station === s.code).length;
    const fr = publishedVersion() ? publishedVersion().rules.filter(r => r.from === s.code || r.to === s.code).length : 0;
    const un = store.db.users.filter(u => u.station === s.code).length;
    if (dn) refs.push(`${dn} device${dn > 1 ? 's' : ''}`);
    if (fr) refs.push(`${fr} fare rule${fr > 1 ? 's' : ''}`);
    if (un) refs.push(`${un} member${un > 1 ? 's' : ''} of staff`);
    if (s.status === 'active') return toast(`${s.code} is in service. Set it to inactive before deleting it, so that taking it out of service is a decision of its own.`);
    if (refs.length) return toast(`${s.code} still has ${refs.join(', ')} against it. Move or remove them first, or leave the station inactive rather than deleting it.`);
    if (!confirm(`Delete ${s.code} — ${s.en}? This cannot be undone. It will be refused if any device, fare or member of staff still refers to it.`)) return;
    store.db.stations = store.db.stations.filter(x => x.code !== s.code);
    store.logAudit('station.delete', 'station', null, session.user.name); store.save();
    closeDrawer(); location.hash = '#/stations';
  });
}
function stationEdit(code) { PAGES.stations(); stationForm(code); }

/* ---------- Devices ---------- */
const DEVICE_TYPES = ['ECU', 'TOM', 'TVM', 'HANDHELD', 'STATION_SERVER', 'EXCESS_FARE'];
const DEVICE_TYPE_SHORT = { ECU: 'Gates', TOM: 'Counters', TVM: 'Kiosks', HANDHELD: 'Handhelds', STATION_SERVER: 'Servers', EXCESS_FARE: 'EFO' };
const DEVICE_TYPE_LABELS = { ECU: 'Gate controller (ECU)', TOM: 'Counter (ToM)', TVM: 'Kiosk (TVM)', EXCESS_FARE: 'Excess Fare Office terminal', STATION_SERVER: 'Station server', HANDHELD: 'Handheld' };
PAGES.devices = (param) => {
  if (!session.can('device.read')) { setHeader('Devices'); $('#content').innerHTML = accessDenied('device.read'); return; }
  setHeader('Device registry', 'BOS-DM-02. Every ECU, ToM, TVM and station server, with the certificate identity it uses to authenticate to the Back Office.');
  const db = store.db;
  const filter = param && DEVICE_TYPES.includes(param) ? param : null;
  const all = db.devices;
  const rows = filter ? all.filter(d => d.type === filter) : all;
  const w = session.can('device.write') && !session.isReadOnly();
  const conn = (d) => {
    if (!d.lastSeen) return `<span class="chip dim">never seen</span><div style="font-size:11.5px;color:var(--b-ink-faint)">no heartbeat yet</div>`;
    const age = Date.now() - d.lastSeen;
    const state = age < 90e3 ? 'online' : age < 300e3 ? 'late' : 'offline';
    return `${badge(state)}<div style="font-size:11.5px;color:var(--b-ink-faint)">${fmtDT(d.lastSeen)}</div>`;
  };
  $('#content').innerHTML = `
    <nav class="typebar" aria-label="Filter by device type">
      <a class="${!filter ? 'on' : ''}" href="#/devices">All <i>${all.length}</i></a>
      ${DEVICE_TYPES.map(t => `<a class="${filter === t ? 'on' : ''}" href="#/devices/${t}">${DEVICE_TYPE_SHORT[t]} <i>${all.filter(d => d.type === t).length}</i></a>`).join('')}
    </nav>
    <div class="card">
      <header><h2>${filter ? `${rows.length} ${DEVICE_TYPE_SHORT[filter].toLowerCase()}` : `${all.length} devices`}</h2><span class="chip dim">${all.filter(d => d.lastSeen).length} have reported</span><div class="hspace"></div>${w ? `<button class="btn btn-primary" id="regDevice">Register device</button>` : ''}</header>
      <div class="tscroll"><table class="grid">
        <thead><tr><th>Device</th><th>Station</th><th>Lane</th><th>Status</th><th>Certificate</th><th class="num">Fare / hotlist</th><th>Connectivity</th>${w ? '<th></th>' : ''}</tr></thead>
        <tbody>${rows.map(d => `<tr>
          <td>${mono(d.code)}<div style="font-size:11.5px;color:var(--b-ink-faint)">${d.type}</div></td>
          <td>${d.station}</td>
          <td>${d.lane == null ? '—' : `${d.lane} <span style="color:var(--b-ink-faint);font-size:12px">${d.dir}</span>${d.accessible ? ' <span class="chip info">accessible</span>' : ''}`}</td>
          <td>${badge(d.status)}</td>
          <td>${d.cert ? mono(d.cert.slice(0, 12) + '…') : '<span style="color:var(--b-ink-faint)">not issued</span>'}</td>
          <td class="num">${d.fareV ?? '—'} / ${d.hotlistV ?? '—'}</td>
          <td>${conn(d)}</td>
          ${w ? `<td style="text-align:right"><button class="btn-linklike" data-dev="${d.id}" style="text-decoration:underline">Manage</button></td>` : ''}</tr>`).join('')}</tbody>
      </table></div>
      <div class="pad" style="font-size:12.5px;color:var(--b-ink-faint)">Connectivity is worked out from the last heartbeat each time this page is read, so a device that stops reporting becomes late and then offline on its own. Certificate issue and configuration distribution still arrive with the rest of the device plane.</div>
    </div>`;
  const devManage = (d) => {
    if (!d) return;
    openDrawer(`Manage ${d.code}`, `${DEVICE_TYPE_LABELS[d.type] || d.type} at ${d.station}. Every change is recorded against your identity.`, `
      <div class="field"><label>Device code</label><input value="${esc(d.code)}" disabled><div class="hint">The code cannot be changed — it appears in clearing files and reports.</div></div>
      <div class="field"><label>Status <i class="req">*</i></label><select id="dvStatus">
        <option value="registered" ${d.status === 'registered' ? 'selected' : ''}>Registered — awaiting provisioning</option>
        <option value="active" ${d.status === 'active' ? 'selected' : ''}>Active — in service</option>
        <option value="maintenance" ${d.status === 'maintenance' ? 'selected' : ''}>Maintenance — out of service, kept registered</option>
        <option value="faulty" ${d.status === 'faulty' ? 'selected' : ''}>Faulty</option></select>
        <div class="hint">Maintenance takes the device out of service without giving up its registration or its lane.</div></div>
      ${d.type === 'ECU' ? `<label class="chk"><input type="checkbox" id="dvAcc" ${d.accessible ? 'checked' : ''}> Accessible lane</label>` : ''}
      <div class="drawer-actions"><button class="btn btn-primary" id="dvSave">Save changes</button><button class="btn btn-quiet" id="dvCancel">Cancel</button></div>
      <div class="dsec" style="margin-top:20px">Remove this device</div>
      ${!d.lastSeen && d.status === 'registered'
        ? `<p style="font-size:12.5px;color:var(--b-ink-faint);margin:0 0 10px">Registered in error and never heard from — it can be removed outright.</p><button class="btn btn-danger" id="dvDelete">Delete device</button>`
        : `<p style="font-size:12.5px;color:var(--b-ink-faint);margin:0 0 10px">This device has been provisioned or has reported, so its records are referenced. Decommissioning is dual-authorised.</p>
           <div class="field"><label>Why it should be decommissioned <i class="req">*</i></label><textarea id="dvWhy" rows="2" maxlength="500"></textarea></div>
           <div id="dvOut"></div>
           <button class="btn btn-danger" id="dvDecom">Propose decommission</button>`}`);
    $('#dvCancel').addEventListener('click', closeDrawer);
    $('#dvSave').addEventListener('click', () => {
      d.status = $('#dvStatus').value;
      if (d.type === 'ECU' && $('#dvAcc')) d.accessible = $('#dvAcc').checked;
      store.logAudit('device.update', 'device', null, session.user.name); store.save();
      toast(`${d.code} has been updated.`); closeDrawer(); route();
    });
    $('#dvDelete')?.addEventListener('click', () => {
      if (d.lastSeen) return toast(`${d.code} has reported a heartbeat. Propose decommission instead.`);
      if (!confirm(`Delete ${d.code}? This cannot be undone. Registration only — nothing has ever been accepted from it.`)) return;
      store.db.devices = store.db.devices.filter(x => x.id !== d.id);
      store.logAudit('device.delete', 'device', 'Registered in error — removed before provisioning', session.user.name); store.save();
      toast(`${d.code} has been removed.`); closeDrawer(); route();
    });
    $('#dvDecom')?.addEventListener('click', () => {
      const why = ($('#dvWhy').value || '').trim();
      if (why.length < 10) return toast('Say why, in enough words to mean something to whoever reads this later.');
      const ref = `APR-2026-${String(store.nextRef('approval')).padStart(6, '0')}`;
      store.db.approvals.unshift({ id: 'ap' + Date.now(), requestRef: ref, operation: 'device.decommission', entityType: 'device',
        summary: `Decommission ${d.code} (${(DEVICE_TYPE_LABELS[d.type] || d.type).toLowerCase()}, ${d.station})`,
        payload: { deviceCode: d.code }, amountPaise: null, risk: 'high', status: 'pending',
        maker: session.user.username, makerDisplay: session.user.name, makerReason: why,
        madeAt: Date.now(), expiresAt: Date.now() + 7 * 86400e3, checker: null, checkerDisplay: null, checkerReason: null, decidedAt: null });
      store.logAudit('device.decommission', 'device', why, session.user.name); store.save();
      $('#dvOut').innerHTML = approvalBanner(ref, 'SYSTEM_ADMIN, STATION_CONTROLLER');
    });
  };
  $('#content').addEventListener('click', e => {
    const b = e.target.closest('[data-dev]');
    if (b) devManage(store.db.devices.find(x => x.id === b.dataset.dev));
  });
  $('#regDevice')?.addEventListener('click', () => {
    openDrawer('Register a device', 'BOS-DM-02. Registration only — the client certificate is issued during provisioning, and nothing is accepted from a device whose certificate does not match its registration.', `
      <div class="field"><label>Device type <i class="req">*</i></label><select id="dType"><option value="">Select a type</option>
        ${Object.entries(DEVICE_TYPE_LABELS).map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>
      <div class="field"><label>Station <i class="req">*</i></label><select id="dStation"><option value="">Select a station</option>
        ${store.db.stations.filter(s => s.status === 'active').map(s => `<option value="${s.code}">${s.code} — ${esc(s.en)}</option>`).join('')}</select></div>
      <div class="field"><label>Device code <i class="req">*</i></label><input id="dCode" placeholder="VCT-<SEG>-01"><div class="hint">Station code, then the type segment, then a suffix. It appears in clearing files and reports, so it must survive a restore unchanged.</div></div>
      <div id="dGate" style="display:none">
        <h3 style="font-size:13px;margin:12px 0 8px">Gate lane</h3>
        <div class="hint" style="margin-bottom:8px">Required for a gate controller and refused for anything else. Two live controllers on one lane would write anti-passback state twice, so a lane already taken at this station is refused.</div>
        <div class="field"><label>Lane number</label><input id="dLane" type="number" min="1"><div class="hint">Entry lanes from 1, exit lanes from 51, so the number reads unambiguously in an alarm.</div></div>
        <div class="field"><label>Direction</label><select id="dDir"><option value="">Select a direction</option><option value="entry">Entry</option><option value="exit">Exit</option><option value="bidirectional">Bidirectional</option></select></div>
        <div class="field"><label>Hardware</label><select id="dHw"><option value="">Select the hardware</option><option value="tripod_turnstile">Tripod turnstile</option><option value="swing_gate">Swing gate</option><option value="flap_barrier">Flap barrier</option><option value="full_height_turnstile">Full-height turnstile</option></select></div>
        <label style="display:flex;gap:8px;align-items:center;font-size:13px;margin-bottom:12px" class="chk"><input type="checkbox" id="dAcc"> Accessible lane</label>
      </div>
      <div class="drawer-actions"><button class="btn btn-primary" id="dSave">Register device</button><button class="btn btn-quiet" id="dCancel">Cancel</button></div>`);
    $('#dType').addEventListener('change', () => { $('#dGate').style.display = $('#dType').value === 'ECU' ? '' : 'none'; });
    $('#dCancel').addEventListener('click', closeDrawer);
    $('#dSave').addEventListener('click', () => {
      const type = $('#dType').value, st = $('#dStation').value, codeV = ($('#dCode').value || '').trim().toUpperCase();
      if (!type || !st || !codeV) return toast('One field needs correcting — see the message below it.');
      if (!/^[A-Z]{2,6}-[A-Z]{3}-[A-Z0-9]+$/.test(codeV)) return toast('Expected STATION-TYPE-SUFFIX, e.g. VCT-ECU-E01');
      const seg = { ECU: 'ECU', TOM: 'TOM', TVM: 'TVM', EXCESS_FARE: 'EFO', STATION_SERVER: 'SRV', HANDHELD: 'HHD' }[type];
      if (codeV.split('-')[1] !== seg) return toast(`A ${type} device code must use the segment "${seg}", not "${codeV.split('-')[1]}".`);
      if (type === 'ECU' && (!$('#dLane').value || !$('#dDir').value || !$('#dHw').value)) return toast('An ECU must declare its gate number, direction and hardware type.');
      store.db.devices.push({ id: 'dv' + (store.db.devices.length + 1), code: codeV, type, station: st, status: 'registered',
        lane: type === 'ECU' ? +$('#dLane').value : null, dir: type === 'ECU' ? $('#dDir').value : null,
        hw: type === 'ECU' ? $('#dHw').value : null, accessible: type === 'ECU' && $('#dAcc').checked,
        cert: null, fareV: null, hotlistV: null, lastSeen: null });
      store.logAudit('device.register', 'device', null, session.user.name); store.save();
      closeDrawer(); route();
    });
  });
};

/* ---------- Products ---------- */
PAGES.products = () => {
  if (!session.can('product.read')) { setHeader('Products'); $('#content').innerHTML = accessDenied('product.read'); return; }
  setHeader('Fare products', 'BOS-FP-02. What can be sold, where, and how it turns into something a gate will accept.');
  const rows = store.db.products.slice().sort((a, b) => a.order - b.order);
  const w = session.can('product.write') && !session.isReadOnly();
  const channels = (p) => [p.tom && 'ToM', p.tvm && 'TVM'].filter(Boolean).join(', ') || '—';
  $('#content').innerHTML = `
    <div class="card">
      <header><h2>${rows.length} products</h2><div class="hspace"></div>${w ? `<button class="btn btn-primary" id="newProduct">New product</button>` : ''}</header>
      <div class="tscroll"><table class="grid">
        <thead><tr><th>Code</th><th>Name</th><th>Category</th><th>SAC</th><th class="num">Trips</th><th>Fulfilment</th><th>Channels</th><th>Status</th>${w ? '<th></th>' : ''}</tr></thead>
        <tbody>${rows.map(p => `<tr>
          <td>${mono(p.code)}</td>
          <td>${esc(p.en)}<div style="font-size:12px;color:var(--b-ink-faint)" lang="hi-IN">${esc(p.hi)}</div></td>
          <td>${esc(p.category.replace(/_/g, ' '))}</td><td>${mono(p.sac)}</td><td class="num">${p.trips}</td>
          <td><span class="chip ${p.fulfilment === 'direct_qr' ? 'ok' : 'info'}">${p.fulfilment.replace(/_/g, ' ')}</span>${p.idCheck ? ' <span class="chip warn">ID check</span>' : ''}</td>
          <td>${channels(p)}</td><td>${badge(p.status)}</td>
          ${w ? `<td style="text-align:right"><button class="btn-linklike" data-edit="${p.code}" style="text-decoration:underline">Edit</button></td>` : ''}</tr>`).join('')}</tbody>
      </table></div>
      <div class="pad" style="font-size:12.5px;color:var(--b-ink-faint)">The SAC code classifies every invoice a product raises. The seeded value is a placeholder pending determination by the project tax advisor.</div>
    </div>`;
  const form = (p) => {
    openDrawer(p ? `Edit ${p.en}` : 'Define a product',
      p ? `Product ${p.code}. Every change is recorded against your identity with the values before and after. Fare versions already priced for this product are unaffected — they record what was charged.`
        : 'BOS-FP-02. What can be sold, where, and how a paid booking turns into something a gate will accept.', `
      <div class="field"><label>Product code ${p ? '' : '<i class="req">*</i>'}</label><input id="pCode" value="${esc(p ? p.code : '')}" ${p ? 'disabled' : 'placeholder="SINGLE_JOURNEY"'}>
        <div class="hint">${p ? 'The code cannot be changed — it appears on every ticket and report already raised against this product.' : 'Upper case, digits and underscores. Appears on every ticket and in every report.'}</div></div>
      <div class="field"><label>Name (English) <i class="req">*</i></label><input id="pEn" value="${esc(p ? p.en : '')}"></div>
      <div class="field"><label>Name (Hindi)</label><input id="pHi" value="${esc(p ? p.hi : '')}" lang="hi-IN"></div>
      <div class="field"><label>SAC code <i class="req">*</i></label><input id="pSac" maxlength="6" value="${esc(p ? p.sac : '')}" placeholder="996429"><div class="hint">Six digits. Confirm with the project tax advisor.</div></div>
      <div class="field"><label>Printed tickets per sale <i class="req">*</i></label><input id="pTix" type="number" min="1" max="4" value="${p ? p.ticketsPerSale : 1}"><div class="hint">2 for a return journey — one for each leg.</div></div>
      <div class="field"><label>Maximum per transaction <i class="req">*</i></label><input id="pMax" type="number" min="1" max="100" value="${p ? p.maxQty : 10}"></div>
      <div class="field"><label>Display order <i class="req">*</i></label><input id="pOrd" type="number" value="${p ? p.order : 100}"><div class="hint">Lower numbers appear first at the counter and the kiosk.</div></div>
      ${p ? `<div class="field"><label>Status <i class="req">*</i></label><select id="pStatus">
        <option value="draft" ${p.status === 'draft' ? 'selected' : ''}>Draft — not sellable</option>
        <option value="active" ${p.status === 'active' ? 'selected' : ''}>Active</option>
        <option value="suspended" ${p.status === 'suspended' ? 'selected' : ''}>Suspended</option>
        <option value="withdrawn" ${p.status === 'withdrawn' ? 'selected' : ''}>Withdrawn</option></select>
        <div class="hint">Withdrawing a product stops it being sold. Fare versions already priced for it are unaffected — they are a record of what was charged.</div></div>`
      : `<div class="notice-stale" style="margin-top:8px">A new product is created as a <b>draft</b>. It cannot be sold until a fare version priced for it is published.</div>`}
      <div class="drawer-actions"><button class="btn btn-primary" id="pSave">${p ? 'Save changes' : 'Create product'}</button><button class="btn btn-quiet" id="pCancel">Cancel</button></div>
      ${p ? `<div class="dsec" style="margin-top:20px">Delete this product</div>
        ${p.status === 'draft'
          ? `<p style="font-size:12.5px;color:var(--b-ink-faint);margin:0 0 10px">A draft has never been sellable, so it can be removed outright.</p><button class="btn btn-danger" id="pDelete">Delete product</button>`
          : `<p style="font-size:12.5px;color:var(--b-ink-faint);margin:0">This product has been sellable — tickets and fare rules reference its code. Set it to <b>Withdrawn</b> instead; the record stays so reports keep resolving.</p>`}` : ''}`);
    $('#pCancel').addEventListener('click', closeDrawer);
    $('#pDelete')?.addEventListener('click', () => {
      const ruled = store.db.fareVersions.some(v => v.rules.some(r => r.product === p.code));
      if (ruled) return toast(`${p.code} is priced in a fare version. Remove those rules first, or withdraw the product instead.`);
      if (!confirm(`Delete ${p.code} — ${p.en}? This cannot be undone.`)) return;
      store.db.products = store.db.products.filter(x => x.code !== p.code);
      store.logAudit('product.delete', 'product', 'Draft removed before ever being sellable', session.user.name); store.save();
      toast(`${p.en} has been removed.`);
      closeDrawer(); route();
    });
    $('#pSave').addEventListener('click', () => {
      const en = $('#pEn').value.trim(); if (!en) return toast('One field needs correcting — see the message below it.');
      if (p) {
        Object.assign(p, { en, hi: $('#pHi').value.trim(), sac: $('#pSac').value.trim(), ticketsPerSale: +$('#pTix').value || 1, maxQty: +$('#pMax').value || 10, order: +$('#pOrd').value || 100, status: $('#pStatus').value });
      } else {
        const codeV = ($('#pCode').value || '').trim().toUpperCase();
        if (!/^[A-Z0-9_]+$/.test(codeV)) return toast('Upper case, digits and underscores.');
        store.db.products.push({ code: codeV, en, hi: $('#pHi').value.trim(), category: 'single_journey', sac: $('#pSac').value.trim(), trips: 1, ticketsPerSale: +$('#pTix').value || 1, returnLeg: false, fulfilment: 'direct_qr', idCheck: false, tom: true, tvm: true, ptypes: ['adult'], maxQty: +$('#pMax').value || 10, order: +$('#pOrd').value || 100, status: 'draft', descEn: '' });
      }
      store.logAudit(p ? 'product.update' : 'product.create', 'product', null, session.user.name); store.save();
      closeDrawer(); route();
    });
  };
  $('#newProduct')?.addEventListener('click', () => form(null));
  $('#content').addEventListener('click', e => {
    const b = e.target.closest('[data-edit]');
    if (b) form(store.db.products.find(x => x.code === b.dataset.edit));
  });
};

/* ---------- Fares ---------- */
PAGES.fares = (param) => {
  if (!session.can('fare.read')) { setHeader('Fares'); $('#content').innerHTML = accessDenied('fare.read'); return; }
  if (param) return fareDetail(param);
  setHeader('Fare versions', 'BOS-FP-01, 03, 06, 08. A published version can never be edited. To change a fare, publish a new version; to revert, publish a rollback that carries the earlier contents forward.');
  const db = store.db;
  const rows = db.fareVersions.slice().sort((a, b) => b.versionNo - a.versionNo);
  const canDraft = session.can('fare.draft') && !session.isReadOnly();
  const canRb = session.can('fare.rollback') && !session.isReadOnly();
  const rbSources = db.fareVersions.filter(v => ['published', 'superseded'].includes(v.status));
  $('#content').innerHTML = `
    <div class="notice-stale"><b>Two people are required</b><br>Submitting a fare version does not publish it. A second person holding ${mono('fare.approve')} must decide, and the drafter may never approve their own version. Enforced by the database, not only by this interface.</div>
    <div class="card">
      <header><h2>${rows.length} versions</h2><div class="hspace"></div>${canDraft ? `<button class="btn btn-primary" id="draftV">Draft a version</button>` : ''}</header>
      <div class="tscroll"><table class="grid">
        <thead><tr><th class="num">Version</th><th>Title</th><th>Model</th><th>Status</th><th class="num">Rules</th><th>Effective from</th><th>Drafted / approved by</th><th>Content hash</th></tr></thead>
        <tbody>${rows.map(v => `<tr>
          <td class="num">${v.versionNo}</td>
          <td><a href="#/fares/${v.id}" style="text-decoration:underline;color:inherit">${esc(v.title)}</a>${v.rollbackOf ? '<div style="font-size:11.5px;color:var(--b-ink-faint)">rollback — reinstates earlier contents</div>' : ''}</td>
          <td>${v.model.replace(/_/g, ' ')}</td><td>${badge(v.status)}</td>
          <td class="num">${v.status === 'pending_approval' && !v.contentHash ? '—' : v.rules.length}</td>
          <td>${fmtDT(v.effectiveFrom)}</td>
          <td style="font-size:12px">${esc(v.createdBy)}<br><span style="color:var(--b-ink-faint)">${v.approvedBy ? esc(v.approvedBy) : 'not approved'}</span></td>
          <td>${v.contentHash ? mono(v.contentHash.slice(0, 12) + '…') : '—'}</td></tr>`).join('')}</tbody>
      </table></div>
    </div>
    ${canRb && rbSources.length ? `
    <div class="card">
      <header><h2>Reinstate an earlier version</h2></header>
      <div class="pad">
        <div style="font-size:12.5px;color:var(--b-ink-faint);margin-bottom:12px">BOS-FP-08. Publishes forward rather than reviving the old version, so history stays intact.</div>
        <button class="btn btn-ghost" id="rbOpen">Reinstate an earlier version</button>
        <div id="rbForm" style="display:none;margin-top:16px">
          <div class="field"><label>Reinstate the contents of <i class="req">*</i></label><select id="rbSrc"><option value="">Select a published version</option>
            ${rbSources.map(v => `<option value="${v.id}">Version ${v.versionNo} — ${esc(v.title)}</option>`).join('')}</select></div>
          <div class="field"><label>Takes effect on <i class="req">*</i></label><input id="rbDate" type="date"></div>
          <div class="field"><label>Reason <i class="req">*</i></label><textarea id="rbReason" rows="2" maxlength="1000"></textarea></div>
          <div class="notice-stale" style="margin: 14px 0 18px">This publishes a <b>new</b> version carrying the earlier contents, recording where they came from. Nothing is rewritten, so a transaction settled under the intervening version still resolves the fare that applied to it. It needs approval like any other publication.</div>
          <div id="rbOut"></div>
          <div style="display:flex;gap:10px"><button class="btn btn-primary" id="rbGo">Submit rollback for approval</button><button class="btn btn-quiet" id="rbCancel">Cancel</button></div>
        </div>
      </div>
    </div>` : ''}`;
  const t = new Date(Date.now() + 86400e3); if ($('#rbDate')) $('#rbDate').value = t.toISOString().slice(0, 10);
  $('#draftV')?.addEventListener('click', () => fareDraftForm());
  $('#rbOpen')?.addEventListener('click', () => { $('#rbForm').style.display = ''; $('#rbOpen').style.display = 'none'; });
  $('#rbCancel')?.addEventListener('click', () => { $('#rbForm').style.display = 'none'; $('#rbOpen').style.display = ''; });
  $('#rbGo')?.addEventListener('click', () => {
    const src = db.fareVersions.find(v => v.id === $('#rbSrc').value);
    if (!src || !$('#rbReason').value.trim()) return toast('One field needs correcting — see the message below it.');
    const ref = `APR-2026-${String(store.nextRef('approval')).padStart(6, '0')}`;
    db.approvals.unshift({ id: 'ap' + Date.now(), requestRef: ref, operation: 'fare_version.rollback', entityType: 'fare_version',
      summary: `Reinstate the contents of version ${src.versionNo} ("${src.title}")`, payload: { sourceVersionId: src.id, effectiveFrom: $('#rbDate').value },
      amountPaise: null, risk: 'critical', status: 'pending', maker: session.user.username, makerDisplay: session.user.name,
      makerReason: $('#rbReason').value.trim(), madeAt: Date.now(), expiresAt: Date.now() + 7 * 86400e3, checker: null, checkerDisplay: null, checkerReason: null, decidedAt: null });
    store.logAudit('fare_version.rollback', 'fare_version', $('#rbReason').value.trim(), session.user.name); store.save();
    $('#rbOut').innerHTML = approvalBanner(ref, 'SYSTEM_ADMIN, FINANCE_OFFICER');
  });
};

function fareDraftForm() {
  const db = store.db;
  openDrawer('Draft a fare version', 'A draft can be edited freely. Once published it is immutable — to change a fare you publish a new version, and to revert you publish a rollback.', `
    <div class="field"><label>Title <i class="req">*</i></label><input id="fvTitle" placeholder="Revision effective 1 April"><div class="hint">Shown to the approver and in the version history.</div></div>
    <div class="field"><label>Fare model <i class="req">*</i></label><select id="fvModel">
      <option value="station_pair" selected>Station pair — a price per journey (rule 2)</option>
      <option value="flat">Flat — one price regardless of journey</option>
      <option value="zone">Zone</option><option value="distance_band">Distance band</option></select>
      <div class="hint">Phase 1 charges by station pair.</div></div>
    <div class="field"><label>NCMC discount (%) <i class="req">*</i></label><input id="fvNcmc" type="number" min="0" max="100" step="0.01" value="20"><div class="hint">Applied to the card fare at exit (rule 11). Versioned here so a past settlement stays reproducible.</div></div>
    <div class="field"><label>Copy rules from</label><select id="fvCopy"><option value="">Start empty</option>
      ${db.fareVersions.filter(v => ['published', 'superseded'].includes(v.status)).map(v => `<option value="${v.id}">Version ${v.versionNo} — ${esc(v.title)}</option>`).join('')}</select>
      <div class="hint">Most revisions change a handful of prices. Retyping a full table is how a wrong fare reaches a gate.</div></div>
    <div class="field"><label>Notes</label><textarea id="fvNotes" rows="2" maxlength="2000"></textarea></div>
    <div class="drawer-actions"><button class="btn btn-primary" id="fvGo">Create draft</button><button class="btn btn-quiet" id="fvCancel">Cancel</button></div>`);
  $('#fvCancel').addEventListener('click', closeDrawer);
  $('#fvGo').addEventListener('click', () => {
    const title = $('#fvTitle').value.trim(); if (!title) return toast('One field needs correcting — see the message below it.');
    const src = db.fareVersions.find(v => v.id === $('#fvCopy').value);
    const vn = Math.max(...db.fareVersions.map(v => v.versionNo)) + 1;
    const nv = { id: 'fv' + vn + '-' + Date.now(), versionNo: vn, title, notes: $('#fvNotes').value.trim(), model: $('#fvModel').value,
      status: 'draft', ncmcDiscountBp: Math.round((+$('#fvNcmc').value || 0) * 100),
      effectiveFrom: null, effectiveTo: null, createdBy: `dev-token:${session.user.username}`, submittedBy: null, approvedBy: null, publishedBy: null,
      contentHash: null, rules: src ? JSON.parse(JSON.stringify(src.rules)) : [], rollbackOf: null,
      tax: src ? JSON.parse(JSON.stringify(src.tax)) : [] };
    db.fareVersions.push(nv);
    store.logAudit('fare_version.draft', 'fare_version', null, session.user.name); store.save();
    closeDrawer(); location.hash = `#/fares/${nv.id}`;
  });
}

function fareDetail(id) {
  const db = store.db;
  const v = db.fareVersions.find(x => x.id === id);
  if (!v) { location.hash = '#/fares'; return; }
  setHeader(`Version ${v.versionNo} — ${v.title}`, v.notes || '');
  const editable = v.status === 'draft' && session.can('fare.draft') && !session.isReadOnly();
  const dual = v.approvedBy && v.approvedBy !== v.createdBy;
  $('#content').innerHTML = `
    <div class="fd-panels" style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">
      <div class="card"><header><h2>Lifecycle</h2></header><div class="pad" style="font-size:13.5px">
        <div style="margin-bottom:8px">${badge(v.status)}</div>
        <div class="kv"><span>Drafted by</span><b>${esc(v.createdBy)}</b></div>
        <div class="kv"><span>Submitted by</span><b>${v.submittedBy ? esc(v.submittedBy) : '—'}</b></div>
        <div class="kv"><span>Approved by</span><b>${v.approvedBy ? esc(v.approvedBy) : '—'}</b></div>
        ${dual ? `<div class="notice-ok" style="margin-top:10px">Dual authorisation satisfied — drafted and approved by different people (BOS-FP-06).</div>` : ''}</div></div>
      <div class="card"><header><h2>Effect</h2></header><div class="pad" style="font-size:13.5px">
        <div class="kv"><span>Model</span><b>${v.model.replace(/_/g, ' ')}</b></div>
        <div class="kv"><span>NCMC discount</span><b>${(v.ncmcDiscountBp / 100).toFixed(2)}%</b></div>
        <div class="kv"><span>Effective from</span><b>${fmtDT(v.effectiveFrom)}</b></div>
        <div class="kv"><span>Effective to</span><b>${v.effectiveTo ? fmtDT(v.effectiveTo) : (v.status === 'published' ? 'still in force' : '—')}</b></div></div></div>
      <div class="card"><header><h2>Integrity</h2></header><div class="pad" style="font-size:13.5px">
        <div class="kv"><span>Content hash</span><b class="mono" style="font-size:10.5px;word-break:break-all">${v.contentHash || '—'}</b></div>
        <div class="kv"><span>Rules</span><b>${v.rules.length}</b></div>
        <div class="hint" style="margin-top:8px">ToM, TVM and ECU recompute this hash over their local copy. A mismatch means a device is pricing from a fare table that is not the one published.</div></div></div>
    </div>
    ${!editable ? `<div class="card"><div class="pad" style="font-size:13.5px">This version is <b>${v.status}</b> and can no longer be edited. To change a fare, draft a new version — copying this one as a starting point. To revert, publish a rollback from the <a href="#/fares" style="text-decoration:underline">fare versions</a> screen.</div></div>` : `
    <div class="card"><header><h2>Submit for approval</h2></header><div class="pad">
      ${v.rules.length === 0 ? `<div class="notice-stale" style="background:var(--danger-bg);border-color:var(--danger);color:var(--danger)">This version has no rules. Every sale against it would fail to price, so it cannot be submitted.</div>` : `
      <div class="field"><label>Takes effect on <i class="req">*</i></label><input id="sbDate" type="date" value="${new Date(Date.now() + 86400e3).toISOString().slice(0, 10)}"><div class="hint">Must be in the future. Back-dating would reprice transactions already settled and reported.</div></div>
      <div class="field"><label>Reason <i class="req">*</i></label><textarea id="sbReason" rows="2" maxlength="1000"></textarea><div class="hint">At least ten characters. Shown to the approver and recorded in the audit trail.</div></div>
      <div class="notice-stale">Submitting does not publish. A second person holding ${mono('fare.approve')} must decide, and it cannot be you.</div>
      <div id="sbOut"></div>
      <button class="btn btn-primary" id="sbGo">Submit for approval</button>`}
    </div></div>`}
    <div class="card">
      <header><h2>Fare rules (${v.rules.length})</h2></header>
      <div class="pad" style="padding-top:4px;padding-bottom:4px;font-size:12.5px;color:var(--b-ink-faint)">Prices are inclusive of tax unless stated otherwise.</div>
      ${v.rules.length === 0 ? `<div class="empty">This version has no rules.<div class="hint">A version with no rules cannot be published — every sale against it would fail to price.</div></div>` : `
      <div class="tscroll"><table class="grid">
        <thead><tr><th>Product</th><th>Passenger</th><th>Journey</th><th>Exit permitted at</th><th class="num">Fare</th></tr></thead>
        <tbody>${v.rules.map(r => `<tr>
          <td>${mono(r.product)}</td><td>${r.passengerType}</td>
          <td>${r.from} → ${r.to}</td><td>${r.exits.join(', ') || '—'}</td>
          <td class="num">${fmtP(r.basePaise)}</td></tr>`).join('')}</tbody>
      </table></div>`}
    </div>
    <div class="card">
      <header><h2>Tax configuration</h2></header>
      <div class="pad" style="padding-top:4px;padding-bottom:4px;font-size:12.5px;color:var(--b-ink-faint)">Total ${(v.tax.reduce((a, t) => a + t.rateBp, 0) / 100).toFixed(2)}%</div>
      <div class="tscroll"><table class="grid">
        <thead><tr><th>Component</th><th class="num">Rate</th><th>Scope</th></tr></thead>
        <tbody>${v.tax.map(t => `<tr><td>${t.component}</td><td class="num">${(t.rateBp / 100).toFixed(2)}%</td><td>${t.scope}</td></tr>`).join('')}</tbody>
      </table></div>
      <div class="pad" style="font-size:12.5px;color:var(--b-ink-faint)">CGST and SGST are held equal at every amount; rounding is absorbed into the taxable value rather than split unevenly between components.</div>
    </div>
    <p><a href="#/fares" style="text-decoration:underline">Back to fare versions</a></p>`;
  $('#sbGo')?.addEventListener('click', () => {
    const reason = ($('#sbReason').value || '').trim();
    if (reason.length < 10) return toast('At least ten characters. Shown to the approver and recorded in the audit trail.');
    const ref = `APR-2026-${String(store.nextRef('approval')).padStart(6, '0')}`;
    v.status = 'pending_approval'; v.submittedBy = `dev-token:${session.user.username}`;
    db.approvals.unshift({ id: 'ap' + Date.now(), requestRef: ref, operation: 'fare_version.publish', entityType: 'fare_version',
      summary: `Publish fare version ${v.versionNo} ("${v.title}") with ${v.rules.length} rules, effective ${$('#sbDate').value}T00:00:00+05:30`,
      payload: { effectiveFrom: `${$('#sbDate').value}T00:00:00+05:30`, fareVersionId: v.id },
      amountPaise: null, risk: 'critical', status: 'pending', maker: session.user.username, makerDisplay: session.user.name,
      makerReason: reason, madeAt: Date.now(), expiresAt: Date.now() + 7 * 86400e3, checker: null, checkerDisplay: null, checkerReason: null, decidedAt: null });
    store.logAudit('fare_version.submit', 'fare_version', reason, session.user.name); store.save();
    $('#sbOut').innerHTML = approvalBanner(ref, 'SYSTEM_ADMIN, FINANCE_OFFICER');
    route();
  });
}

/* ---------- Excess fare ---------- */
PAGES['excess-fare'] = (param) => {
  if (!session.can('excess_fare.read')) {
    setHeader('Excess Fare Office', 'System Flow s.10.');
    $('#content').innerHTML = `<div class="card"><div class="pad">
      <p style="font-weight:600;color:var(--danger)">You are not authorised to view excess fare cases</p>
      <p style="color:var(--b-ink-faint);margin-top:6px">This screen needs the ${mono('excess_fare.read')} permission, which none of your roles (${esc(session.user.role)}) grant.</p></div></div>`;
    return;
  }
  if (param === 'new') return efNew();
  if (param) return efDetail(param);
  setHeader('Excess Fare Office', 'System Flow s.10. Cases opened at this station, and what each of them collected. A passenger is never released without a recorded case and a reason.');
  const db = store.db;
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const monthEnd = new Date(monthStart); monthEnd.setMonth(monthEnd.getMonth() + 1); monthEnd.setDate(0);
  const cases = db.efCases;
  const monthCases = cases.filter(c => c.openedAt >= monthStart.getTime());
  const fareCollected = monthCases.reduce((a, c) => a + (c.farePaise || 0), 0);
  const fineCollected = monthCases.reduce((a, c) => a + (c.finePaise || 0), 0);
  const waived = monthCases.filter(c => c.outcome === 'waived').length;
  const canCase = session.can('excess_fare.case') && !session.isReadOnly();
  const loc = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const win = `${loc(monthStart)} to ${loc(monthEnd)}`;
  $('#content').innerHTML = `
    <div class="tiles-b">
      <div class="tile-b"><div class="ic">${I.appr}</div><div class="tv"><b>${monthCases.length}</b><span>Cases this month — ${win}</span></div></div>
      <div class="tile-b"><div class="ic">${I.rupee}</div><div class="tv"><b>${fmtP(fareCollected)}</b><span>Fare collected — Revenue</span></div></div>
      <div class="tile-b"><div class="ic">${I.rupee}</div><div class="tv"><b>${fmtP(fineCollected)}</b><span>Fines collected — Penalty, not revenue</span></div></div>
      <div class="tile-b"><div class="ic">${I.audit}</div><div class="tv"><b>${waived}</b><span>Waived — Closed without charge</span></div></div>
    </div>
    <div class="card">
      <header><h2>${cases.length} cases</h2><div class="hspace"></div>${canCase ? `<a class="btn btn-primary" href="#/excess-fare/new">Open a case</a>` : ''}</header>
      ${cases.length === 0 ? `<div class="empty">No excess fare cases at your station.<div class="hint">A case is opened when a passenger cannot pass a gate.</div></div>` : `
      <div class="tscroll"><table class="grid">
        <thead><tr><th>Case</th><th>Type</th><th>Medium</th><th>Reason</th><th>Status</th><th class="num">Fare</th><th class="num">Fine</th><th>Tender</th><th>Released</th><th>Opened</th></tr></thead>
        <tbody>${cases.map(c => `<tr>
          <td><a class="mono" href="#/excess-fare/${c.id}" style="text-decoration:underline">${esc(c.caseRef)}</a></td>
          <td>${EF_TYPES[c.caseType]}</td>
          <td>${c.mediumType === 'none' ? '—' : esc(c.mediumRef || '—')}</td>
          <td>${c.reason ? mono(c.reason) : '—'}</td>
          <td>${badge(c.outcome || c.status)}</td>
          <td class="num">${fmtP(c.farePaise || 0)}</td><td class="num">${fmtP(c.finePaise || 0)}</td>
          <td>${c.tender || '—'}</td><td>${c.releasedAt ? 'yes' : 'no'}</td>
          <td style="color:var(--b-ink-faint)">${fmtDT(c.openedAt)}</td></tr>`).join('')}</tbody>
      </table></div>`}
    </div>
    <div class="card">
      <header><h2>Excess fare report</h2></header>
      <div class="pad" style="padding-top:4px;font-size:12.5px;color:var(--b-ink-faint)">BOS-EF-08. Grouped by cause, with fare and fine totalled apart so revenue and penalty are reported separately, and waivers counted against collections.</div>
      ${monthCases.length === 0 ? `<div class="empty">No cases in this period.</div>` : `
      <div class="tscroll"><table class="grid">
        <thead><tr><th>Case type</th><th>Reason</th><th class="num">Cases</th><th class="num">Fare</th><th class="num">Fine</th><th class="num">Collected</th><th class="num">Waived</th></tr></thead>
        <tbody>${(() => {
          const groups = {};
          monthCases.forEach(c => {
            const k = `${c.caseType}|${c.reason || ''}`;
            groups[k] = groups[k] || { type: c.caseType, reason: c.reason, n: 0, fare: 0, fine: 0, collected: 0, waived: 0 };
            const g = groups[k]; g.n++; g.fare += c.farePaise || 0; g.fine += c.finePaise || 0;
            if (c.outcome === 'collected') g.collected++; if (c.outcome === 'waived') g.waived++;
          });
          const rows = Object.values(groups);
          const tot = rows.reduce((a, g) => ({ n: a.n + g.n, fare: a.fare + g.fare, fine: a.fine + g.fine, collected: a.collected + g.collected, waived: a.waived + g.waived }), { n: 0, fare: 0, fine: 0, collected: 0, waived: 0 });
          return rows.map(g => `<tr><td>${EF_TYPES[g.type]}</td><td>${g.reason ? mono(g.reason) : '—'}</td><td class="num">${g.n}</td><td class="num">${fmtP(g.fare)}</td><td class="num">${fmtP(g.fine)}</td><td class="num">${g.collected}</td><td class="num">${g.waived}</td></tr>`).join('')
            + `<tr style="font-weight:700"><td>Total</td><td></td><td class="num">${tot.n}</td><td class="num">${fmtP(tot.fare)}</td><td class="num">${fmtP(tot.fine)}</td><td class="num">${tot.collected}</td><td class="num">${tot.waived}</td></tr>`;
        })()}</tbody>
      </table></div>`}
    </div>`;
};

function efNew() {
  if (!session.can('excess_fare.case') || session.isReadOnly()) { location.hash = '#/excess-fare'; return; }
  setHeader('Open an excess fare case', 'System Flow s.10. Opening records the situation. Payment, the outcome and the release come at resolution, which is what carries the reason.');
  const myStation = session.user.station;
  const stations = myStation ? store.db.stations.filter(s => s.code === myStation) : store.db.stations;
  $('#content').innerHTML = `
    <div class="card"><div class="pad" style="max-width:640px">
      <h3 style="font-size:13px;margin-bottom:4px">The situation</h3>
      <div class="hint" style="margin-bottom:12px">Section 10. A case records why the passenger could not pass a gate. No money moves and nobody is released until the case is resolved.</div>
      <div class="field"><label>Case type <i class="req">*</i></label><select id="efType">
        <option value="over_travel" selected>Over-travel — travelled beyond the ticketed destination</option>
        <option value="insufficient_card_balance">Card balance short of the fare at exit</option>
        <option value="exit_at_entry_station">Exit at the station of entry — did not travel</option>
        <option value="lost_ticket">Lost ticket inside the paid area</option>
        <option value="no_entry_record">No entry record at exit</option>
        <option value="fault_assisted_passage">Fault-assisted passage — a device failed</option>
        <option value="disputed_transaction">Disputed transaction</option></select></div>
      <div class="field"><label>Station <i class="req">*</i></label><select id="efStation">
        ${stations.map(s => `<option value="${s.code}">${s.code} — ${esc(s.en)}</option>`).join('')}</select>
        <div class="hint">Only the stations you hold the permission at are offered.</div></div>
      <h3 style="font-size:13px;margin:16px 0 4px">What the passenger presented</h3>
      <div class="hint" style="margin-bottom:12px">A lost ticket leaves no reference at all, which is why 'none' is a real answer rather than an empty field.</div>
      <div class="field"><label>Medium <i class="req">*</i></label><select id="efMedium">
        <option value="none" selected>None presented (a lost ticket leaves no reference)</option>
        <option value="ticket">Printed ticket</option><option value="ncmc">NCMC card</option></select></div>
      <div class="field" id="efRefWrap" style="display:none"><label>Medium reference <i class="req">*</i></label><input id="efRef" maxlength="200"><div class="hint">Ticket number, or the card's masked reference.</div></div>
      <div id="efJourney">
        <h3 style="font-size:13px;margin:16px 0 4px">The journey</h3>
        <div class="hint" style="margin-bottom:12px">Over-travel is priced between the ticketed destination and the station actually reached (s.10.1), so both are required.</div>
        <div class="field"><label>Ticketed origin <i class="req">*</i></label><select id="efO"><option value="">Select a station</option>${STN.map(s => `<option value="${s.code}">${s.code} — ${esc(s.en)}</option>`).join('')}</select></div>
        <div class="field"><label>Ticketed destination <i class="req">*</i></label><select id="efD"><option value="">Select a station</option>${STN.map(s => `<option value="${s.code}">${s.code} — ${esc(s.en)}</option>`).join('')}</select></div>
        <div class="field"><label>Station actually reached <i class="req">*</i></label><select id="efR"><option value="">Select a station</option>${STN.map(s => `<option value="${s.code}">${s.code} — ${esc(s.en)}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label>Notes</label><textarea id="efNotes" rows="2" maxlength="2000"></textarea><div class="hint">What happened, in the officer's own words. Some reason codes require this at resolution.</div></div>
      <div style="display:flex;gap:10px"><button class="btn btn-primary" id="efOpen">Open case</button><a class="btn btn-quiet" href="#/excess-fare">Cancel</a></div>
    </div></div>`;
  const upd = () => {
    $('#efRefWrap').style.display = $('#efMedium').value === 'none' ? 'none' : '';
    $('#efJourney').style.display = $('#efType').value === 'over_travel' ? '' : 'none';
  };
  $('#efMedium').addEventListener('change', upd); $('#efType').addEventListener('change', upd); upd();
  $('#efOpen').addEventListener('click', () => {
    const type = $('#efType').value;
    if (type === 'over_travel' && (!$('#efO').value || !$('#efD').value || !$('#efR').value)) return toast('One field needs correcting — see the message below it.');
    if ($('#efMedium').value !== 'none' && !$('#efRef').value.trim()) return toast('One field needs correcting — see the message below it.');
    const n = store.nextRef('efCase');
    const c = { id: 'ef' + Date.now(), caseRef: `EFC-2026-${String(n).padStart(6, '0')}`, caseType: type,
      station: $('#efStation').value, mediumType: $('#efMedium').value, mediumRef: $('#efMedium').value === 'none' ? null : $('#efRef').value.trim(),
      journey: type === 'over_travel' ? { o: $('#efO').value, d: $('#efD').value, r: $('#efR').value } : null,
      notes: $('#efNotes').value.trim() || null, status: 'open', outcome: null, reason: null,
      farePaise: 0, finePaise: 0, tender: null, receiptRef: null, ottRef: null, disputeRef: null,
      openedAt: Date.now(), openedBy: session.user.username, resolvedAt: null, releasedAt: null };
    store.db.efCases.unshift(c);
    store.logAudit('excess_fare.open', 'excess_fare_case', null, session.user.name); store.save();
    location.hash = `#/excess-fare/${c.id}`;
  });
}

function efDetail(id) {
  const db = store.db;
  const c = db.efCases.find(x => x.id === id);
  if (!c) { location.hash = '#/excess-fare'; return; }
  setHeader(c.caseRef, `System Flow s.10. Opened ${fmtDT(c.openedAt)}.`);
  /* fare-difference quote (s.10.1) — priced against SINGLE_JOURNEY on the published version */
  let quote = null;
  if (c.caseType === 'over_travel' && c.journey) {
    const tq = fareQuote('SINGLE_JOURNEY', c.journey.o, c.journey.d, 1);
    const rq = fareQuote('SINGLE_JOURNEY', c.journey.o, c.journey.r, 1);
    if (tq && rq) quote = { ticketed: tq.gross, reached: rq.gross, diff: Math.max(0, rq.gross - tq.gross) };
  }
  const fine = store.db.config.find(k => k.key === 'fare.over_travel_fine_paise');
  const canCase = session.can('excess_fare.case') && !session.isReadOnly();
  const open = c.status === 'open';
  const reasons = EF_REASONS.filter(r => r.caseType === c.caseType);
  $('#content').innerHTML = `
    <div class="card"><header><h2>Case</h2></header><div class="pad" style="font-size:13.5px">
      <div class="two-col" style="gap:0 32px">
        <div><div class="kv"><span>Type</span><b>${c.caseType}</b></div>
        <div class="kv"><span>Medium</span><b>${c.mediumType === 'none' ? 'none presented' : esc(c.mediumRef)}</b></div>
        <div class="kv"><span>Fare</span><b>${fmtP(c.farePaise || 0)}</b></div>
        <div class="kv"><span>Collected</span><b>${fmtP((c.farePaise || 0) + (c.finePaise || 0))}</b></div>
        <div class="kv"><span>Released</span><b>${c.releasedAt ? fmtDT(c.releasedAt) : 'no'}</b></div></div>
        <div><div class="kv"><span>Status</span><b>${badge(c.outcome || c.status)}</b></div>
        <div class="kv"><span>Reason</span><b>${c.reason ? mono(c.reason) : '—'}</b></div>
        <div class="kv"><span>Fine</span><b>${fmtP(c.finePaise || 0)}</b></div>
        <div class="kv"><span>Tender</span><b>${c.tender || '—'}</b></div>
        <div class="kv"><span>Resolved</span><b>${c.resolvedAt ? fmtDT(c.resolvedAt) : '—'}</b></div></div>
      </div></div></div>
    ${quote ? `<div class="card"><header><h2>Fare difference</h2></header><div class="pad">
      <div style="font-size:12.5px;color:var(--b-ink-faint);margin-bottom:12px">s.10.1. Priced against the fare version in force. Never negative — travelling short of the ticketed destination is not a refund.</div>
      <div class="tiles-b" style="grid-template-columns:repeat(3,1fr)">
        <div class="tile-b"><div class="tv"><b>${fmtP(quote.ticketed)}</b><span>Ticketed fare</span></div></div>
        <div class="tile-b"><div class="tv"><b>${fmtP(quote.reached)}</b><span>Fare actually reached</span></div></div>
        <div class="tile-b"><div class="tv"><b>${fmtP(quote.diff)}</b><span>Difference due</span></div></div>
      </div>
      ${fine && fine.value == null ? `<p class="hint" style="margin-top:10px">The over-travel fine is not configured. It is reported as absent rather than as zero, because zero would read as "no fine due".</p>` : ''}
    </div></div>` : ''}
    ${open && canCase ? `
    <div class="card"><header><h2>Resolve</h2></header><div class="pad" style="max-width:640px">
      <div style="font-size:12.5px;color:var(--b-ink-faint);margin-bottom:12px">Take any amount due, record the outcome and the reason, and authorise the release.</div>
      <h3 style="font-size:13px;margin-bottom:4px">Outcome and reason</h3>
      <div class="hint" style="margin-bottom:10px">A reason is required for every outcome. The system refuses a release without one.</div>
      <div class="field"><label>Outcome <i class="req">*</i></label><select id="rOutcome">
        <option value="collected" selected>Collected — fare and/or fine taken</option>
        <option value="waived" ${session.can('excess_fare.waive') ? '' : 'disabled'}>Waived — released without charge (requires excess_fare.waive)</option>
        <option value="no_charge">No charge — nothing was due</option>
        <option value="raised">Raised — dispute passed to the Back Office</option>
        <option value="refused">Refused — the officer declined to release</option></select></div>
      <div class="field"><label>Reason <i class="req">*</i></label><select id="rReason"><option value="">Select a reason</option>
        ${reasons.map(r => `<option value="${r.code}">${r.code} — ${esc(r.description)}</option>`).join('')}</select>
        <div class="hint">Only reasons belonging to this case type are offered.</div></div>
      <h3 style="font-size:13px;margin:14px 0 4px">Amounts</h3>
      <div class="hint" style="margin-bottom:10px">Two amounts, never one. A fine is a penalty rather than revenue, and a single figure would misstate both.</div>
      <div class="field"><label>Fare difference (₹)</label><input id="rFare" type="number" step="0.01" min="0" value="${quote ? (quote.diff / 100).toFixed(2) : ''}"><div class="hint">${quote ? `Quoted difference: ${fmtP(quote.diff)}` : 'Nothing is due unless the outcome is a collection.'}</div></div>
      <div class="field"><label>Fine (₹)</label><input id="rFine" type="number" step="0.01" min="0" ${c.caseType === 'fault_assisted_passage' ? 'disabled' : ''} value="${c.caseType !== 'fault_assisted_passage' && fine && fine.value != null && EF_REASONS.find(r => r.caseType === c.caseType && r.chargesFine) ? (fine.value / 100).toFixed(2) : ''}">
        ${c.caseType === 'fault_assisted_passage' ? '<div class="hint">A fault-assisted passage carries no fine — the device failed, not the passenger.</div>' : ''}</div>
      <div class="field"><label>Tender</label><select id="rTender"><option value="">Select a tender</option><option>Cash</option><option>UPI</option><option>Card</option><option>Netbanking</option></select><div class="hint">Money taken must name the tender, or it cannot be reconciled.</div></div>
      ${c.caseType === 'over_travel' ? `<div class="field"><label>Over-Travel Ticket reference</label><input id="rOtt" maxlength="200"><div class="hint">Issued on payment, and only for an over-travel.</div></div>` : ''}
      <div class="field" id="rDisputeWrap" style="display:none"><label>Dispute reference <i class="req">*</i></label><input id="rDispute" maxlength="200"><div class="hint">A raised dispute must carry the reference it was raised under.</div></div>
      <label class="chk" style="display:flex;gap:8px;align-items:flex-start;font-size:13.5px;margin:10px 0"><input type="checkbox" id="rRelease" style="margin-top:3px"> <span>Authorise the passenger's release<br><span class="hint">Recorded against your identity, with the reason above. The system refuses a release without both.</span></span></label>
      <div class="field"><label>Notes</label><textarea id="rNotes" rows="2" maxlength="2000"></textarea></div>
      <div style="display:flex;gap:10px"><button class="btn btn-primary" id="rGo">Resolve case</button><a class="btn btn-quiet" href="#/excess-fare">Cancel</a></div>
    </div></div>` : ''}
    ${!open ? `<div class="card"><header><h2>Resolved</h2></header><div class="pad" style="font-size:13.5px">This case is ${esc(c.outcome || c.status)} and cannot be resolved again. The record above is what the audit trail holds.</div></div>` : ''}`;
  $('#rOutcome')?.addEventListener('change', () => {
    const o = $('#rOutcome').value;
    ['rFare', 'rFine', 'rTender'].forEach(idn => { const el = $('#' + idn); if (el && !(idn === 'rFine' && c.caseType === 'fault_assisted_passage')) el.disabled = o !== 'collected'; });
    $('#rDisputeWrap').style.display = o === 'raised' ? '' : 'none';
  });
  $('#rGo')?.addEventListener('click', () => {
    const outcome = $('#rOutcome').value, reason = $('#rReason').value;
    if (!reason) return toast('A reason is required for every outcome. The system refuses a release without one.');
    const rd = EF_REASONS.find(r => r.code === reason);
    if (rd.requiresNotes && !$('#rNotes').value.trim()) return toast('This reason requires notes at resolution.');
    if (outcome === 'raised' && !$('#rDispute').value.trim()) return toast('A raised dispute must carry the reference it was raised under.');
    c.outcome = outcome; c.reason = reason; c.status = 'resolved'; c.resolvedAt = Date.now();
    if (outcome === 'collected') {
      c.farePaise = Math.round((+$('#rFare').value || 0) * 100);
      c.finePaise = c.caseType === 'fault_assisted_passage' ? 0 : Math.round((+$('#rFine').value || 0) * 100);
      c.tender = $('#rTender').value || null;
      c.ottRef = $('#rOtt') ? $('#rOtt').value.trim() || null : null;
    }
    if (outcome === 'raised') c.disputeRef = $('#rDispute').value.trim();
    if ($('#rRelease').checked) c.releasedAt = Date.now();
    c.notes = $('#rNotes').value.trim() || c.notes;
    store.logAudit('excess_fare.resolve', 'excess_fare_case', reason, session.user.name); store.save();
    route();
  });
}

/* ---------- Alarms ---------- */
/* ---------- Reports ---------- */
const REPORT_CATEGORY_ORDER = ['revenue', 'reconciliation', 'statutory', 'operations', 'audit'];
const REPORT_CATEGORY_LABEL = { revenue: 'Revenue', reconciliation: 'Reconciliation', statutory: 'Statutory', operations: 'Operations', audit: 'Audit' };

/* What each report was last run with, kept per report so going back to one
   returns to the period you were looking at rather than to the default. */
const REPORT_PARAMS = {};

const isMoneyKey = (k) => /(_paise|Paise)$/.test(k);

/* A cell, rendered from whatever the report put there. Amounts are paise and
   are shown in rupees; everything else is printed as it came. This screen
   deliberately knows nothing about any particular report. */
function reportCell(key, value) {
  if (value === null || value === undefined || value === '') return '—';
  if (isMoneyKey(key)) {
    const n = Number(value);
    /* Signed, because a short drawer and a long one are not the same event. */
    if (Number.isFinite(n)) return (n < 0 ? '−' : '') + fmtP(Math.abs(n));
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return esc(String(value));
}

/* The financial year an ISO date falls in, as 'yyyy-yy'. */
function fyOf(iso) {
  const y = Number(iso.slice(0, 4)), m = Number(iso.slice(5, 7));
  const start = m >= 4 ? y : y - 1;
  return start + '-' + String((start + 1) % 100).padStart(2, '0');
}

function reportDefaults(def) {
  const today = isoDate(Date.now());
  const d = {};
  for (const x of def.parameters) {
    if (x.name === 'from') d.from = isoDate(Date.now() - 6 * 86400e3);
    else if (x.name === 'to') d.to = today;
    else if (x.kind === 'financial_year') d.financialYear = fyOf(today);
    else d[x.name] = '';
  }
  return d;
}

PAGES.reports = (param) => {
  if (!session.can('report.read')) { setHeader('Reports'); $('#content').innerHTML = accessDenied('report.read'); return; }
  if (param) return reportDetail(param);

  setHeader('Reports', 'BOS-RP-01. Every figure is computed when the report is run and states the stations it covers — two people running the same report can legitimately get different totals, and a number that does not say what it covers will eventually be compared with one that covers something else.');

  const groups = REPORT_CATEGORY_ORDER
    .map(c => ({ c, list: REPORTS.filter(r => r.category === c) }))
    .filter(g => g.list.length);

  /* Named rather than hidden. A report that is simply absent reads
     as one that does not exist, and somebody then asks for it. */
  $('#content').innerHTML = groups.map(g => `
    <div>
      <h3 class="repcat">${esc(REPORT_CATEGORY_LABEL[g.c])}</h3>
      <div class="repgrid">${g.list.map(r => `
        <div class="repcard">
          <b>${esc(r.title)}</b>
          <p>${esc(r.description)}</p>
          <div class="rc-foot">
            ${r.requirements.map(q => `<span class="chip dim">${esc(q)}</span>`).join('')}
            <span class="hsp"></span>
            ${session.can(r.permission)
              ? `<a class="btn btn-primary rc-run" href="#/reports/${esc(r.id)}">Run</a>`
              : `<span style="color:var(--b-ink-faint);font-size:12px">Needs ${mono(r.permission)}</span>`}
          </div>
        </div>`).join('')}</div>
    </div>`).join('');
};

function reportDetail(id) {
  const def = REPORTS.find(r => r.id === id);
  if (!def) { location.hash = '#/reports'; return; }
  setHeader(def.title, def.description);

  const back = '<p style="margin-bottom:14px"><a href="#/reports">← All reports</a></p>';
  if (!session.can(def.permission)) { $('#content').innerHTML = back + accessDenied(def.permission); return; }

  const p = REPORT_PARAMS[id] || (REPORT_PARAMS[id] = reportDefaults(def));
  const missing = def.parameters.filter(x => x.required && !p[x.name]);
  const res = missing.length ? null : runReport(id, p);
  const stations = store.db.stations || STN;

  const field = (x) => {
    const v = p[x.name] == null ? '' : p[x.name];
    if (x.kind === 'station') {
      return `<select id="rp-${x.name}">
        <option value="">Everything I may see</option>
        ${stations.map(s => `<option value="${esc(s.code)}"${v === s.code ? ' selected' : ''}>${esc(s.code)} — ${esc(s.en)}</option>`).join('')}
      </select>`;
    }
    if (x.kind === 'date') return `<input id="rp-${x.name}" type="date" value="${esc(v)}">`;
    return `<input id="rp-${x.name}" value="${esc(v)}" placeholder="${x.kind === 'financial_year' ? '2026-27' : ''}">`;
  };

  let results = '';
  if (missing.length) {
    results = `<div class="card"><div class="empty"><b>This report needs a period before it can be run.</b>
      <div class="hint">Fill in ${esc(missing.map(x => x.label).join(', '))} and run it.</div></div></div>`;
  } else if (res && res.rows.length === 0) {
    results = `<div class="card"><div class="empty"><b>Nothing in that period.</b>
      <div class="hint">That is an answer, not a failure — there were no matching records.</div></div></div>`;
  } else if (res) {
    results = `<div class="card">
      <header>
        <h2>${res.rows.length.toLocaleString('en-IN')} row${res.rows.length === 1 ? '' : 's'}</h2>
        <div style="font-size:12.5px;color:var(--b-ink-faint);margin-top:3px">Covering ${
          esc(res.scope[0] === 'all' ? 'every station' : res.scope.join(', '))} · generated ${esc(fmtDT(Date.now()))}</div>
      </header>
      <div class="pad" style="padding-bottom:0">
        <button class="btn btn-quiet" id="rpCsv">Download CSV</button>
        ${res.truncated ? '<span class="chip warn" style="margin-left:10px">Truncated</span><span style="font-size:12.5px;color:var(--b-ink-faint);margin-left:8px">Only the first rows are shown. Narrow the period, or take the CSV.</span>' : ''}
      </div>
      <div class="tscroll"><table class="grid">
        <thead><tr>${res.columns.map(c => `<th${isMoneyKey(c.key) ? ' class="num"' : ''}>${esc(c.label)}</th>`).join('')}</tr></thead>
        <tbody>${res.rows.map(r => `<tr>${res.columns.map(c =>
          `<td${isMoneyKey(c.key) ? ' class="num"' : ''}>${reportCell(c.key, r[c.key])}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>
    </div>`;
  }

  $('#content').innerHTML = back + `
    <div class="card">
      <header><h2>Parameters</h2></header>
      <div class="pad">
        ${def.parameters.length === 0
          ? '<p style="color:var(--b-ink-faint);font-size:13.5px">This report takes no parameters. It covers everything you are allowed to see.</p>'
          : `<div style="display:flex;flex-wrap:wrap;gap:16px;align-items:flex-end">
              ${def.parameters.map(x => `<div class="field" style="margin:0">
                <label>${esc(x.label)}${x.required ? ' <i class="req">*</i>' : ''}</label>${field(x)}
              </div>`).join('')}
              <button class="btn btn-primary" id="rpRun">Run</button>
            </div>`}
      </div>
    </div>` + results;

  $('#rpRun')?.addEventListener('click', () => {
    for (const x of def.parameters) REPORT_PARAMS[id][x.name] = $('#rp-' + x.name).value;
    reportDetail(id);
  });

  $('#rpCsv')?.addEventListener('click', () => {
    const line = (cols) => cols.map(v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"').join(',');
    const body = [line(res.columns.map(c => c.label))]
      .concat(res.rows.map(r => line(res.columns.map(c => r[c.key]))))
      .join('\r\n');
    /* BOM, or Excel opens the Devanagari in the station names as mojibake. */
    const url = URL.createObjectURL(new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = def.id + '.csv'; a.click();
    URL.revokeObjectURL(url);
    toast('CSV downloaded');
  });
}

/* ---------- Alarms ---------- */
const ALARM_LABELS = { device_offline: 'Device offline', device_late: 'Device late', printer_paper_low: 'Paper low', printer_paper_out: 'Paper out', printer_fault: 'Printer fault', printer_absent: 'Printer absent', reader_fault: 'Reader fault', reader_absent: 'Reader absent', clock_drift: 'Clock drift', queue_backlog: 'Queue backlog', device_reported: 'Reported by device' };
PAGES.alarms = () => {
  if (!session.can('alarm.read')) { setHeader('Alarms', 'Operational alarms across the estate.'); $('#content').innerHTML = accessDenied('alarm.read'); return; }
  setHeader('Alarm console', 'BOS-MO-01. Conditions currently true of a device, computed from its last heartbeat every time this page is read. A fault that clears stops being an alarm on its own.');
  const db = store.db;
  const alarms = db.alarms;
  const crit = alarms.filter(a => a.severity === 'critical').length;
  const high = alarms.filter(a => a.severity === 'high').length;
  const unack = alarms.filter(a => !a.acknowledgedAt).length;
  const escd = alarms.filter(a => a.escalated).length;
  const escCfg = db.config.find(k => k.key === 'alarm.escalate_after_seconds');
  const canAck = session.can('alarm.acknowledge') && !session.isReadOnly();
  const sevBadge = (s) => `<span class="chip ${s === 'critical' || s === 'high' ? 'danger' : s === 'medium' ? 'warn' : 'dim'}">${s}</span>`;
  $('#content').innerHTML = `
    <div class="tiles-b" style="grid-template-columns:repeat(5,1fr)">
      <div class="tile-b"><div class="tv"><b>${alarms.length}</b><span>Open alarms — Across the estate</span></div></div>
      <div class="tile-b"><div class="tv"><b>${crit}</b><span>Critical — Device not operating</span></div></div>
      <div class="tile-b"><div class="tv"><b>${high}</b><span>High — Position cannot serve</span></div></div>
      <div class="tile-b"><div class="tv"><b>${unack}</b><span>Unacknowledged — Nobody has taken these on</span></div></div>
      <div class="tile-b"><div class="tv"><b>${escd}</b><span>Escalated — ${escCfg && escCfg.value != null ? `After ${Math.round(escCfg.value / 60)}m` : 'Window unset'}</span></div></div>
    </div>
    ${!escCfg || escCfg.value == null ? `<div class="notice-stale">Escalation is inactive: ${mono('alarm.escalate_after_seconds')} is not set, so nothing escalates. Escalating everything because a number is missing would teach an operator to ignore the flag.</div>` : ''}
    <div class="card">
      <header><h2>${alarms.length} raised</h2></header>
      ${alarms.length === 0 ? `<div class="empty">Nothing is raised.<div class="hint">Every device that has reported is healthy. Devices that have never reported are not alarms — they have not been commissioned.</div></div>` : `
      <div class="tscroll"><table class="grid">
        <thead><tr><th>Severity</th><th>Device</th><th>Station</th><th>Condition</th><th>Detail</th><th>Since</th><th>Acknowledged</th>${canAck ? '<th></th>' : ''}</tr></thead>
        <tbody>${alarms.map((a, i) => `<tr>
          <td>${sevBadge(a.severity)}${a.escalated ? ' <span class="chip danger">escalated</span>' : ''}</td>
          <td>${mono(a.deviceCode)}<div style="font-size:11.5px;color:var(--b-ink-faint)">${a.deviceType}</div></td>
          <td>${a.stationCode}</td><td>${ALARM_LABELS[a.alarmType] || a.alarmType}</td>
          <td>${esc(a.message)}</td><td style="color:var(--b-ink-faint)">${fmtDT(a.observedAt)}</td>
          <td>${a.acknowledgedBy ? esc(a.acknowledgedBy) : 'no'}</td>
          ${canAck ? `<td style="text-align:right">${a.acknowledgedAt ? '<span style="color:var(--b-ink-faint)">taken</span>' : `<button class="btn btn-ghost" style="height:34px" data-ack="${i}" aria-label="Acknowledge ${ALARM_LABELS[a.alarmType]} on ${a.deviceCode}">Acknowledge</button>`}</td>` : ''}</tr>`).join('')}</tbody>
      </table></div>`}
    </div>
    <div class="card">
      <header><h2>Incident log</h2></header>
      <div class="pad" style="padding-top:4px;font-size:12.5px;color:var(--b-ink-faint)">BOS-MO-05. Who took each alarm on, and what they found. Acknowledgement and resolution are separate events, which is the only way this can answer how long anything took.</div>
      ${db.incidents.length === 0 ? `<div class="empty">No incidents recorded yet.</div>` : `
      <div class="tscroll"><table class="grid">
        <thead><tr><th>Device</th><th>Condition</th><th>Acknowledged</th><th>By</th><th>Resolved</th><th>Took</th><th>What was found</th><th></th></tr></thead>
        <tbody>${db.incidents.map((inc, i) => {
          const took = inc.resolvedAt ? (() => { const s = Math.round((inc.resolvedAt - inc.acknowledgedAt) / 1000); return s < 90 ? s + 's' : s < 5400 ? Math.round(s / 60) + 'm' : (s / 3600).toFixed(1) + 'h'; })() : '—';
          return `<tr><td>${mono(inc.deviceCode)}</td><td>${ALARM_LABELS[inc.alarmType] || inc.alarmType}</td>
            <td style="color:var(--b-ink-faint)">${fmtDT(inc.acknowledgedAt)}</td><td>${esc(inc.acknowledgedBy)}</td>
            <td>${inc.resolvedAt ? esc(inc.resolvedBy) : 'open'}</td><td>${took}</td>
            <td>${esc(inc.resolutionNote || inc.note || '—')}</td>
            <td style="text-align:right">${inc.resolvedAt ? '<span style="color:var(--b-ink-faint)">closed</span>' : canAck ? `
              <div style="display:flex;gap:6px;align-items:center"><input data-note="${i}" placeholder="Replaced the paper roll" maxlength="2000" style="height:34px;border:1.5px solid var(--b-line-mid);border-radius:8px;padding:0 10px;font-size:12.5px">
              <button class="btn btn-ghost" style="height:34px" data-resolve="${i}">Resolve</button></div>` : ''}</td></tr>`;
        }).join('')}</tbody>
      </table></div>`}
    </div>`;
  $('#content').addEventListener('click', e => {
    const ack = e.target.closest('[data-ack]');
    if (ack) {
      const a = store.db.alarms[+ack.dataset.ack];
      a.acknowledgedAt = Date.now(); a.acknowledgedBy = session.user.username;
      store.db.incidents.unshift({ id: 'in' + Date.now(), deviceCode: a.deviceCode, alarmType: a.alarmType, acknowledgedAt: a.acknowledgedAt, acknowledgedBy: session.user.username, resolvedAt: null, resolvedBy: null, resolutionNote: null, note: null });
      store.logAudit('alarm.acknowledge', 'alarm', null, session.user.name); store.save(); route();
    }
    const res = e.target.closest('[data-resolve]');
    if (res) {
      const inc = store.db.incidents[+res.dataset.resolve];
      const note = ($(`[data-note="${res.dataset.resolve}"]`).value || '').trim();
      if (!note) return toast('What was wrong is required.');
      inc.resolvedAt = Date.now(); inc.resolvedBy = session.user.username; inc.resolutionNote = note;
      /* the condition also clears from the live alarm list on resolution in the demo */
      store.db.alarms = store.db.alarms.filter(a => !(a.deviceCode === inc.deviceCode && a.alarmType === inc.alarmType));
      store.logAudit('alarm.resolve', 'alarm', note, session.user.name); store.save(); route();
    }
  });
};

/* ---------- Hotlist ---------- */
PAGES.hotlist = () => {
  if (!session.can('hotlist.read')) { setHeader('Hotlist'); $('#content').innerHTML = accessDenied('hotlist.read'); return; }
  setHeader('Hotlist', 'BOS-BL-01. Card references a gate must refuse. Every change is a new entry carrying a version, so a gate can ask for only what it has not already seen.');
  const db = store.db;
  const w = session.can('hotlist.write') && !session.isReadOnly();
  const ovr = w && session.can('hotlist.override');
  $('#content').innerHTML = `
    ${w ? `<div class="card"><header><h2>Block a card</h2></header><div class="pad" style="max-width:560px">
      <div style="font-size:12.5px;color:var(--b-ink-faint);margin-bottom:12px">Takes effect at every gate on its next pull.</div>
      <div class="field"><label>Card reference <i class="req">*</i></label><input id="hlRef" maxlength="128" placeholder="NCMC-TOKEN-4f9a2c"><div class="hint">The token or reference, never the card number itself. A card number would put payment data in the Back Office, and is refused.</div></div>
      <div class="field"><label>Why it is being blocked <i class="req">*</i></label><textarea id="hlWhy" rows="2" maxlength="500"></textarea><div class="hint">A gate will refuse this card. Someone will ask why.</div></div>
      <div id="hlOut"></div>
      <button class="btn btn-danger" id="hlBlock">Block this card</button>
    </div></div>` : ''}
    ${ovr ? `<div class="card"><header><h2>Take a card off</h2></header><div class="pad" style="max-width:560px">
      <div style="font-size:12.5px;color:var(--b-ink-faint);margin-bottom:10px">Dual authorised — a second administrator decides (BOS-BL-03).</div>
      <button class="btn btn-ghost" id="hlOpenOff">Propose taking a card off the hotlist</button>
      <div id="hlOffForm" style="display:none;margin-top:12px">
        <p style="font-size:13px;margin-bottom:10px">This does not lift the block. A second person holding SYSTEM_ADMIN must approve it, within 24 hours, before the card is accepted at a gate again.</p>
        <div class="field"><label>Card reference <i class="req">*</i></label><input id="hlOffRef" placeholder="NCMC-TOKEN-4f9a2c"></div>
        <div class="field"><label>Why it should come off <i class="req">*</i></label><textarea id="hlOffWhy" rows="2" maxlength="500"></textarea><div class="hint">The checker reads this before deciding.</div></div>
        <div id="hlOffOut"></div>
        <div style="display:flex;gap:10px"><button class="btn btn-primary" id="hlOffGo">Submit for approval</button><button class="btn btn-quiet" id="hlOffCancel">Cancel</button></div>
      </div>
    </div></div>` : ''}
    <div class="card">
      <header><h2>${db.hotlist.length ? `${db.hotlist.length} entries` : 'Entries'}</h2></header>
      ${db.hotlist.length === 0 ? `<div class="empty">Nothing has been listed.<div class="hint">A blocked card is refused at every gate on the line.</div></div>` : `
      <div class="tscroll"><table class="grid">
        <thead><tr><th class="num">Version</th><th>Card reference</th><th>State</th><th>Reason</th><th>Source</th><th>Listed</th><th>By</th></tr></thead>
        <tbody>${db.hotlist.map(h => `<tr>
          <td class="num">${h.version}</td><td>${mono(h.ref)}</td>
          <td><span class="chip ${h.state === 'blocked' ? 'danger' : 'dim'}">${h.state}</span></td>
          <td>${esc(h.reason)}</td><td>${h.source}</td>
          <td style="color:var(--b-ink-faint)">${fmtDT(h.listedAt)}</td><td>${esc(h.by || '—')}</td></tr>`).join('')}</tbody>
      </table></div>`}
    </div>`;
  $('#hlBlock')?.addEventListener('click', () => {
    const ref = ($('#hlRef').value || '').trim(), why = ($('#hlWhy').value || '').trim();
    if (/^\d{13,19}$/.test(ref)) return $('#hlOut').innerHTML = `<div class="notice-stale" style="background:var(--danger-bg);color:var(--danger);border-color:var(--danger)">That looks like a card number. The hotlist holds a token or reference, never the number itself — storing one would put payment data in the Back Office.</div>`;
    if (!ref) return toast('One field needs correcting — see the message below it.');
    if (why.length < 10) return $('#hlOut').innerHTML = `<div class="notice-stale" style="background:var(--danger-bg);color:var(--danger);border-color:var(--danger)">Say why, in enough words to mean something to whoever reads this later.</div>`;
    if (store.db.hotlist.some(h => h.ref === ref && h.state === 'blocked'))
      return $('#hlOut').innerHTML = `<div class="notice-stale" style="background:var(--danger-bg);color:var(--danger);border-color:var(--danger)">That reference is already on the hotlist. Listing it twice would tell a gate nothing new and would hide the original reason behind a second one.</div>`;
    store.db.hotlist.unshift({ version: store.nextRef('hotlist'), ref, state: 'blocked', reason: why, source: 'internal', listedAt: Date.now(), by: session.user.name });
    store.logAudit('hotlist.block', 'hotlist_entry', why, session.user.name); store.save();
    $('#hlOut').innerHTML = savedBanner('The card is on the hotlist and every gate will refuse it.');
    setTimeout(route, 900);
  });
  $('#hlOpenOff')?.addEventListener('click', () => { $('#hlOffForm').style.display = ''; $('#hlOpenOff').style.display = 'none'; });
  $('#hlOffCancel')?.addEventListener('click', () => { $('#hlOffForm').style.display = 'none'; $('#hlOpenOff').style.display = ''; });
  $('#hlOffGo')?.addEventListener('click', () => {
    const ref = ($('#hlOffRef').value || '').trim(), why = ($('#hlOffWhy').value || '').trim();
    const entry = store.db.hotlist.find(h => h.ref === ref);
    if (!entry) return $('#hlOffOut').innerHTML = `<div class="notice-stale" style="background:var(--danger-bg);color:var(--danger);border-color:var(--danger)">That reference is not on the hotlist, so there is nothing to lift.</div>`;
    if (entry.state !== 'blocked') return $('#hlOffOut').innerHTML = `<div class="notice-stale" style="background:var(--danger-bg);color:var(--danger);border-color:var(--danger)">That reference is not currently blocked.</div>`;
    if (why.length < 10) return toast('Say why, in enough words to mean something to whoever reads this later.');
    const apr = `APR-2026-${String(store.nextRef('approval')).padStart(6, '0')}`;
    store.db.approvals.unshift({ id: 'ap' + Date.now(), requestRef: apr, operation: 'hotlist.whitelist_override', entityType: 'hotlist_entry',
      summary: `Take ${ref} off the hotlist`, payload: { cardReference: ref }, amountPaise: null, risk: 'critical', status: 'pending',
      maker: session.user.username, makerDisplay: session.user.name, makerReason: why, madeAt: Date.now(), expiresAt: Date.now() + 86400e3, checker: null, checkerDisplay: null, checkerReason: null, decidedAt: null });
    store.logAudit('hotlist.whitelist_override', 'hotlist_entry', why, session.user.name); store.save();
    $('#hlOffOut').innerHTML = approvalBanner(apr, 'SYSTEM_ADMIN');
  });
};

/* ---------- Labels ---------- */
PAGES.labels = () => {
  if (!session.can('label.read')) { setHeader('Labels'); $('#content').innerHTML = accessDenied('label.read'); return; }
  setHeader('Label master', 'BOS-MD-04 and rule 16. Station names, product names and receipt text in Hindi and English, distributed to the counter and the kiosk alongside the fare table.');
  const grouped = new Map();
  for (const l of store.db.labels) {
    const k = `${l.namespace}/${l.labelKey}`;
    grouped.set(k, [...(grouped.get(k) || []), l]);
  }
  const w = session.can('label.write') && !session.isReadOnly();
  $('#content').innerHTML = `
    <div class="two-col" style="grid-template-columns:2fr 1fr">
      <div class="card">
        <header><h2>${grouped.size} labels</h2></header>
        <div class="tscroll"><table class="grid">
          <thead><tr><th>Namespace</th><th>Key</th><th>English</th><th>Hindi</th><th>Receipt</th></tr></thead>
          <tbody>${[...grouped.entries()].map(([k, entries]) => {
            const en = entries.find(e => e.locale === 'en-IN'), hi = entries.find(e => e.locale === 'hi-IN');
            const [ns, key] = k.split('/');
            return `<tr><td style="color:var(--b-ink-faint)">${ns}</td><td>${mono(key)}</td>
              <td>${en ? esc(en.value) : '<span style="color:var(--danger)">missing</span>'}</td>
              <td>${hi ? `<span lang="hi-IN">${esc(hi.value)}</span>` : '<span style="color:var(--warn)">missing</span>'}</td>
              <td>${hi && !hi.printerSafe ? '<span class="chip warn">falls back</span>' : '<span class="chip ok">prints</span>'}</td></tr>`;
          }).join('')}</tbody>
        </table></div>
      </div>
      ${w ? `<div class="card"><header><h2>Add or amend a label</h2></header><div class="pad">
        <div style="font-size:12.5px;color:var(--b-ink-faint);margin-bottom:12px">Saving an existing namespace, key and language replaces its value.</div>
        <div class="field"><label>Namespace <i class="req">*</i></label><select id="lbNs"><option>station</option><option>product</option><option>receipt</option><option>ticket</option></select></div>
        <div class="field"><label>Key <i class="req">*</i></label><input id="lbKey"></div>
        <div class="field"><label>Language <i class="req">*</i></label><select id="lbLoc"><option value="en-IN">English</option><option value="hi-IN">Hindi</option></select></div>
        <div class="field"><label>Value <i class="req">*</i></label><input id="lbVal"></div>
        <button class="btn btn-primary" id="lbSave">Save label</button>
      </div></div>` : ''}
    </div>
    <p style="font-size:12.5px;color:var(--b-ink-faint);max-width:760px">A label marked as not printing falls back to its transliteration on a thermal receipt while screens keep the correct script. Devanagari conjuncts do not render on every printer's resident font set, and a receipt of boxes is a passenger complaint.</p>`;
  $('#lbSave')?.addEventListener('click', () => {
    const ns = $('#lbNs').value, key = ($('#lbKey').value || '').trim(), loc = $('#lbLoc').value, val = ($('#lbVal').value || '').trim();
    if (!key || !val) return toast('One field needs correcting — see the message below it.');
    const ex = store.db.labels.find(l => l.namespace === ns && l.labelKey === key && l.locale === loc);
    if (ex) ex.value = val;
    else store.db.labels.push({ namespace: ns, labelKey: key, locale: loc, value: val, printerSafe: loc === 'en-IN', transliteration: null });
    store.logAudit('label.upsert', 'label', null, session.user.name); store.save(); route();
  });
};

/* ---------- Approvals ---------- */
const APPROVAL_CHECKERS = {
  'fare_version.publish': ['SYSTEM_ADMIN', 'FINANCE_OFFICER'], 'fare_version.rollback': ['SYSTEM_ADMIN', 'FINANCE_OFFICER'],
  'tax_config.change': ['SYSTEM_ADMIN', 'FINANCE_OFFICER'], 'promotion.publish': ['SYSTEM_ADMIN', 'FINANCE_OFFICER'],
  'hotlist.whitelist_override': ['SYSTEM_ADMIN'], 'refund.authorise': ['FINANCE_OFFICER'], 'user.role_grant': ['SYSTEM_ADMIN'],
  'device.decommission': ['SYSTEM_ADMIN', 'STATION_CONTROLLER'], 'station.deactivate': ['SYSTEM_ADMIN'],
  'reconciliation.variance_writeoff': ['FINANCE_OFFICER'], 'system_config.change': ['SYSTEM_ADMIN'],
};
PAGES.approvals = (param) => {
  if (!session.can('approval.read')) { setHeader('Approvals'); $('#content').innerHTML = accessDenied('approval.read'); return; }
  setHeader('Approval queue', 'BOS-SC-04. Privileged changes are proposals until a second person decides on them. You cannot decide a request you raised.');
  const filter = ['pending', 'applied', 'rejected', 'expired', 'withdrawn'].includes(param) ? param : 'pending';
  const rows = store.db.approvals.filter(a => a.status === filter);
  $('#content').innerHTML = `
    <nav style="display:flex;gap:8px;margin-bottom:4px">
      ${['pending', 'applied', 'rejected', 'expired', 'withdrawn'].map(f => `<a class="chip ${f === filter ? 'info' : 'dim'}" style="text-decoration:none;text-transform:capitalize" href="#/approvals/${f}">${f}</a>`).join('')}
    </nav>
    ${rows.length === 0 ? `<div class="card"><div class="empty">No ${filter} requests.</div></div>` : rows.map((a, i) => {
      const mayDecide = session.can('approval.decide') && (APPROVAL_CHECKERS[a.operation] || []).includes(session.user.role);
      const raisedByYou = a.maker === session.user.username;
      return `<div class="card apr-card">
        <header><h2 style="max-width:none">${esc(a.summary)}</h2><div class="hspace"></div>${riskBadge(a.risk)} ${badge(a.status)}</header>
        <div class="pad" style="font-size:13.5px">
          <div style="color:var(--b-ink-faint);font-size:12.5px;margin-bottom:10px">${esc(a.operation)} · raised ${fmtDT(a.madeAt)} by ${esc(a.makerDisplay || a.maker)}</div>
          <div class="kv"><span>Reference</span><b class="mono">${esc(a.requestRef)}</b></div>
          <div class="kv"><span>Expires</span><b>${fmtDT(a.expiresAt)}</b></div>
          ${a.amountPaise != null ? `<div class="kv"><span>Amount</span><b>${fmtP(a.amountPaise)}</b></div>` : ''}
          ${a.makerReason ? `<p style="margin-top:10px">Stated reason: ${esc(a.makerReason)}</p>` : ''}
          <details style="margin-top:10px"><summary style="cursor:pointer;font-size:12.5px;color:var(--b-ink-faint)">Exact change that will be applied</summary>
            <pre style="background:var(--b-dark);color:#f3e6d2;border-radius:10px;padding:12px;font-size:11.5px;overflow-x:auto;margin-top:8px">${esc(JSON.stringify(a.payload, null, 2))}</pre></details>
          ${a.status === 'pending' ? (
            raisedByYou ? `
              <p style="color:var(--warn);margin-top:12px">You raised this request. Segregation of duties requires a different person to decide it (BOS-SC-04).</p>
              <div style="margin-top:8px"><button class="btn-linklike" style="text-decoration:underline" data-wd="${i}">Withdraw this request</button>
              <div data-wdform="${i}" style="display:none;margin-top:10px">
                <div class="field"><label>Reason for withdrawing ${esc(a.requestRef)} <i class="req">*</i></label><textarea data-wdreason="${i}" rows="2" maxlength="1000"></textarea><div class="hint">The request is closed rather than deleted, and the reason is kept with it.</div></div>
                <div style="display:flex;gap:10px"><button class="btn btn-danger" data-wdgo="${i}">Withdraw</button><button class="btn btn-quiet" data-wdkeep="${i}">Keep it open</button></div>
              </div></div>`
            : !session.can('approval.decide') ? `<p style="color:var(--b-ink-faint);margin-top:12px">You do not hold the permission to decide this.</p>`
            : !mayDecide ? `<p style="color:var(--b-ink-faint);margin-top:12px">Deciding ${esc(a.operation)} is reserved to another role. It is waiting for someone who holds it, not for you.</p>`
            : `<div style="margin-top:12px">
              <div class="field"><label>Reason for your decision on ${esc(a.requestRef)}</label><textarea data-reason="${i}" rows="2" maxlength="1000"></textarea><div class="hint">Required to reject — an unexplained refusal cannot be reviewed later. Optional to approve.</div></div>
              <div style="display:flex;gap:10px">
                <button class="btn btn-primary" data-approve="${i}">Approve and apply</button>
                <button class="btn btn-danger" data-reject="${i}" disabled title="Give a reason first">Reject</button>
              </div></div>`
          ) : a.decidedAt ? `<p style="color:var(--b-ink-faint);margin-top:12px">Decided ${fmtDT(a.decidedAt)} by ${esc(a.checkerDisplay || 'unknown')}${a.checkerReason ? ` — ${esc(a.checkerReason)}` : ''}</p>` : ''}
        </div>
      </div>`;
    }).join('')}`;
  $('#content').addEventListener('input', e => {
    const t = e.target.closest('[data-reason]');
    if (t) { const b = $(`[data-reject="${t.dataset.reason}"]`); if (b) b.disabled = !t.value.trim(); }
  });
  $('#content').addEventListener('click', e => {
    const idx = (attr) => { const el = e.target.closest(`[data-${attr}]`); return el ? +el.dataset[attr] : null; };
    const ap = idx('approve');
    if (ap != null) { decideApproval(rows[ap], 'approve', ($(`[data-reason="${ap}"]`).value || '').trim()); return; }
    const rj = idx('reject');
    if (rj != null) { decideApproval(rows[rj], 'reject', ($(`[data-reason="${rj}"]`).value || '').trim()); return; }
    const wd = idx('wd');
    if (wd != null) { $(`[data-wdform="${wd}"]`).style.display = ''; e.target.style.display = 'none'; return; }
    const keep = idx('wdkeep');
    if (keep != null) { $(`[data-wdform="${keep}"]`).style.display = 'none'; $(`[data-wd="${keep}"]`).style.display = ''; return; }
    const go = idx('wdgo');
    if (go != null) {
      const a = rows[go]; const r = ($(`[data-wdreason="${go}"]`).value || '').trim();
      if (r.length < 5) return toast('The request is closed rather than deleted, and the reason is kept with it.');
      a.status = 'withdrawn'; a.makerReason = `${a.makerReason} | withdrawn: ${r}`;
      store.logAudit('approval.withdraw', 'approval_request', r, session.user.name); store.save(); route();
    }
  });
};
function decideApproval(a, decision, reason) {
  if (decision === 'reject' && !reason) return;
  a.checker = session.user.username; a.checkerDisplay = session.user.name; a.checkerReason = reason || null; a.decidedAt = Date.now();
  if (decision === 'reject') { a.status = 'rejected'; }
  else {
    a.status = 'applied';
    /* apply the change */
    if (a.operation === 'fare_version.publish') {
      const v = store.db.fareVersions.find(x => x.id === a.payload.fareVersionId);
      if (v) {
        const prev = publishedVersion(); if (prev && prev !== v) { prev.status = 'superseded'; prev.effectiveTo = Date.now(); }
        v.status = 'published'; v.approvedBy = `dev-token:${session.user.username}`; v.publishedBy = v.approvedBy;
        v.effectiveFrom = Date.parse(a.payload.effectiveFrom) || Date.now();
        v.contentHash = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
      }
    }
    if (a.operation === 'user.role_grant') {
      const u = store.db.users.find(x => x.username === a.payload.username);
      if (u) { u.role = a.payload.role; u.station = a.payload.station || null; }
    }
    if (a.operation === 'hotlist.whitelist_override') {
      const h = store.db.hotlist.find(x => x.ref === a.payload.cardReference && x.state === 'blocked');
      if (h) h.state = 'lifted';
    }
  }
  store.logAudit(`approval.${decision}`, 'approval_request', reason || null, session.user.name); store.save(); route();
}

/* ---------- Users ---------- */
const ROLE_DISPLAY = { SYSTEM_ADMIN: 'System Administrator', AUDITOR: 'Auditor', FINANCE_OFFICER: 'Finance / Reconciliation Officer', EXCESS_FARE_OFFICER: 'Excess Fare Officer', STATION_CONTROLLER: 'Station Controller', TOM_OPERATOR: 'Counter Operator' };
PAGES.users = (param) => {
  if (!session.can('user.read')) { setHeader('Staff'); $('#content').innerHTML = accessDenied('user.read'); return; }
  if (param) return userEdit(param);
  setHeader('Staff and roles', 'BOS-UM-01 and BOS-UM-02. Authorisation records only — passwords, MFA enrolment and lockout state live in the identity provider.');
  const w = session.can('user.write') && !session.isReadOnly();
  const rows = store.db.users;
  $('#content').innerHTML = `
    <div class="notice-stale"><b>Role grants are dual-authorised</b><br>Granting a role hands someone authority over fares, money or gates, so it goes through the approval queue like any other privileged change. Revocation takes effect immediately — permissions are read from the database on every request, not from the access token.</div>
    <div class="card">
      <header><h2>${rows.length} staff accounts</h2><div class="hspace"></div>${w ? '<button class="btn btn-primary" id="newUser">Invite user</button>' : ''}</header>
      <div class="tscroll"><table class="grid">
        <thead><tr><th>Username</th><th>Name</th><th>Employee code</th><th>Roles</th><th>Status</th><th>Last sign-in</th>${w ? '<th></th>' : ''}</tr></thead>
        <tbody>${rows.map(u => `<tr>
          <td>${mono(u.username)}</td><td>${esc(u.name)}</td><td>${u.emp || '—'}</td>
          <td><span class="chip ${u.role === 'AUDITOR' ? 'info' : 'dim'}">${u.role}${u.station ? ' · ' + u.station : ''}</span></td>
          <td>${badge(u.status)}</td><td style="color:var(--b-ink-faint)">${u.lastSignIn ? fmtDT(u.lastSignIn) : '—'}</td>
          ${w ? `<td style="text-align:right"><a href="#/users/${u.username}" style="text-decoration:underline">Manage</a></td>` : ''}</tr>`).join('')}</tbody>
      </table></div>
    </div>`;
  $('#newUser')?.addEventListener('click', () => {
    openDrawer('Invite a member of staff', 'BOS-UM-01. This creates the authorisation record. The person signs in through the identity provider; their password and MFA never live here.', `
      <div class="field"><label>Username <i class="req">*</i></label><input id="nuUser" maxlength="64" placeholder="asha.verma" spellcheck="false" autocapitalize="off"><div class="hint">Lower case, digits and dots. Bound to their identity-provider account.</div></div>
      <div class="field"><label>Full name <i class="req">*</i></label><input id="nuName"></div>
      <div class="field"><label>Employee code</label><input id="nuEmp" maxlength="32" placeholder="VR-STN-002"></div>
      <div class="field"><label>Role <i class="req">*</i></label><select id="nuRole"><option value="">Select a role</option>
        <option value="SYSTEM_ADMIN">System Administrator</option><option value="FINANCE_OFFICER">Finance Officer</option>
        <option value="STATION_CONTROLLER">Station Controller — one station</option><option value="TOM_OPERATOR">Counter Operator — one station</option>
        <option value="EXCESS_FARE_OFFICER">Excess Fare Officer — one station</option><option value="AUDITOR">Auditor — read only</option></select></div>
      <div class="field"><label>Station</label><select id="nuStation" disabled><option value="">Not applicable — system-wide</option></select>
        <div class="hint">Required for station-bound roles.</div></div>
      <div class="notice-stale">The account is created as <b>invited</b> and holds its role from the first sign-in. Further role changes go through the approval queue.</div>
      <div class="drawer-actions"><button class="btn btn-primary" id="nuGo">Invite</button><button class="btn btn-quiet" id="nuCancel">Cancel</button></div>`);
    $('#nuCancel').addEventListener('click', closeDrawer);
    $('#nuRole').addEventListener('change', () => {
      const scoped = ['STATION_CONTROLLER', 'TOM_OPERATOR', 'EXCESS_FARE_OFFICER'].includes($('#nuRole').value);
      const sel = $('#nuStation'); sel.disabled = !scoped;
      sel.innerHTML = scoped
        ? '<option value="">Select a station</option>' + store.db.stations.map(s => `<option value="${s.code}">${s.code} — ${esc(s.en)}</option>`).join('')
        : '<option value="">Not applicable — system-wide</option>';
    });
    $('#nuGo').addEventListener('click', () => {
      const un = ($('#nuUser').value || '').trim().toLowerCase();
      const name = ($('#nuName').value || '').trim();
      const role = $('#nuRole').value;
      if (!/^[a-z0-9.]{3,64}$/.test(un)) return toast('Username: lower case, digits and dots, at least three characters.');
      if (!name || !role) return toast('One field needs correcting — see the message below it.');
      if (store.db.users.some(x => x.username === un)) return toast(`"${un}" already exists. Usernames are bound to identities and cannot be reused.`);
      const scoped = ['STATION_CONTROLLER', 'TOM_OPERATOR', 'EXCESS_FARE_OFFICER'].includes(role);
      if (scoped && !$('#nuStation').value) return toast('Granted without a station, the authority would apply at every station on the line.');
      store.db.users.push({ username: un, name, emp: ($('#nuEmp').value || '').trim() || null, role, station: scoped ? $('#nuStation').value : null, status: 'invited', lastSignIn: null });
      store.logAudit('user.invite', 'staff_user', null, session.user.name); store.save();
      toast(`${name} is invited. The account activates on their first sign-in.`);
      closeDrawer(); route();
    });
  });
};
function userEdit(username) {
  const u = store.db.users.find(x => x.username === username);
  if (!u || !session.can('user.write') || session.isReadOnly()) { location.hash = '#/users'; return; }
  setHeader(u.name, u.emp ? `${u.username} · ${u.emp}` : u.username);
  $('#content').innerHTML = `
    <div class="two-col">
      <div class="card"><header><h2>Account</h2></header><div class="pad">
        <div class="field"><label>Username</label><input value="${esc(u.username)}" disabled><div class="hint">The username is bound to this person's identity and cannot be changed.</div></div>
        <div class="field"><label>Full name <i class="req">*</i></label><input id="uName" value="${esc(u.name)}"></div>
        <div class="field"><label>Employee code</label><input id="uEmp" maxlength="32" value="${esc(u.emp || '')}"></div>
        <div class="field"><label>Status</label><select id="uStatus">
          <option value="invited" ${u.status === 'invited' ? 'selected' : ''}>Invited — has not signed in yet</option>
          <option value="active" ${u.status === 'active' ? 'selected' : ''}>Active</option>
          <option value="suspended" ${u.status === 'suspended' ? 'selected' : ''}>Suspended</option>
          <option value="deactivated" ${u.status === 'deactivated' ? 'selected' : ''}>Deactivated</option></select>
          <div class="hint">Suspending takes effect at once — permissions are checked on every request rather than read from a login token, so the person does not keep working until their session expires.</div></div>
        <div id="uOut"></div>
        <button class="btn btn-primary" id="uSave">Save changes</button>
        <div class="dsec" style="margin-top:20px">Delete this account</div>
        ${u.lastSignIn == null && u.username !== session.user.username
          ? `<p style="font-size:12.5px;color:var(--b-ink-faint);margin:0 0 10px">For an account invited in error, before it has ever signed in. An account that has worked a shift is suspended or deactivated instead — deleting it would orphan the audit trail.</p><button class="btn btn-danger" id="uDelete">Delete account</button>`
          : `<p style="font-size:12.5px;color:var(--b-ink-faint);margin:0">${u.username === session.user.username ? 'You cannot delete the account you are signed in with.' : 'This account has signed in, so its actions are on the audit trail. Suspend or deactivate it instead — deleting it would leave those records pointing at nobody.'}</p>`}
      </div></div>
      <div>
        <div class="card"><header><h2>Roles held</h2></header><div class="pad">
          <div style="font-size:12.5px;color:var(--b-ink-faint);margin-bottom:12px">Revoking takes effect immediately. The assignment is closed rather than deleted, so a report covering last quarter still shows who held what.</div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <span class="chip ${u.role === 'AUDITOR' ? 'info' : 'dim'}">${u.role}</span>
            ${u.station ? `<span style="font-size:13px">at ${u.station}</span>` : ''}
            <span style="font-size:12px;color:var(--b-ink-faint)">Since ${fmtD(Date.now() - 30 * 86400e3)} · granted by seed</span>
          </div>
        </div></div>
        <div class="card"><header><h2>Grant a role</h2></header><div class="pad">
          <div class="field"><label>Role <i class="req">*</i></label><select id="gRole"><option value="">Select a role</option>
            <option value="SYSTEM_ADMIN">System Administrator</option><option value="FINANCE_OFFICER">Finance Officer</option>
            <option value="STATION_CONTROLLER">Station Controller — one station</option><option value="TOM_OPERATOR">Counter Operator — one station</option>
            <option value="EXCESS_FARE_OFFICER">Excess Fare Officer — one station</option><option value="MAINTENANCE">Maintenance Engineer</option>
            <option value="AUDITOR">Auditor — read only</option></select></div>
          <div class="field"><label>Station</label><select id="gStation" disabled><option value="">Not applicable — system-wide</option></select>
            <div class="hint">Granted without a station, the authority would apply at every station on the line.</div></div>
          <div class="field"><label>Reason <i class="req">*</i></label><textarea id="gReason" rows="2" maxlength="1000"></textarea><div class="hint">At least ten characters. Shown to the approver and recorded in the audit trail.</div></div>
          <div class="notice-stale">A role grant needs a second person's approval. Submitting this does not give the person the role — it raises a request that someone else must decide.</div>
          <div id="gOut"></div>
          <button class="btn btn-primary" id="gGo">Submit for approval</button>
        </div></div>
      </div>
    </div>`;
  $('#uDelete')?.addEventListener('click', () => {
    if (!confirm(`Delete ${u.username} — ${u.name}? This cannot be undone.`)) return;
    store.db.users = store.db.users.filter(x => x.username !== u.username);
    store.logAudit('user.delete', 'staff_user', 'Invited in error — removed before first sign-in', session.user.name); store.save();
    toast(`${u.name} has been removed.`);
    location.hash = '#/users';
  });
  $('#uSave').addEventListener('click', () => {
    u.name = $('#uName').value.trim() || u.name; u.emp = $('#uEmp').value.trim() || null; u.status = $('#uStatus').value;
    store.logAudit('user.update', 'staff_user', null, session.user.name); store.save();
    $('#uOut').innerHTML = savedBanner('');
  });
  $('#gRole').addEventListener('change', () => {
    const scoped = ['STATION_CONTROLLER', 'TOM_OPERATOR', 'EXCESS_FARE_OFFICER'].includes($('#gRole').value);
    const sel = $('#gStation'); sel.disabled = !scoped;
    sel.innerHTML = scoped
      ? `<option value="">Select a station</option>` + STN.map(s => `<option value="${s.code}">${s.code} — ${s.en}</option>`).join('')
      : `<option value="">Not applicable — system-wide</option>`;
  });
  $('#gGo').addEventListener('click', () => {
    const role = $('#gRole').value, reason = ($('#gReason').value || '').trim();
    if (!role) return toast('One field needs correcting — see the message below it.');
    if (reason.length < 10) return toast('At least ten characters. Shown to the approver and recorded in the audit trail.');
    const scoped = ['STATION_CONTROLLER', 'TOM_OPERATOR', 'EXCESS_FARE_OFFICER'].includes(role);
    if (scoped && !$('#gStation').value) return toast('Granted without a station, the authority would apply at every station on the line.');
    const ref = `APR-2026-${String(store.nextRef('approval')).padStart(6, '0')}`;
    store.db.approvals.unshift({ id: 'ap' + Date.now(), requestRef: ref, operation: 'user.role_grant', entityType: 'staff_user',
      summary: `Grant ${role}${scoped ? ' at ' + $('#gStation').value : ''} to ${u.username}`,
      payload: { username: u.username, role, station: scoped ? $('#gStation').value : null },
      amountPaise: null, risk: 'high', status: 'pending', maker: session.user.username, makerDisplay: session.user.name,
      makerReason: reason, madeAt: Date.now(), expiresAt: Date.now() + 7 * 86400e3, checker: null, checkerDisplay: null, checkerReason: null, decidedAt: null });
    store.logAudit('user.role_grant', 'staff_user', reason, session.user.name); store.save();
    $('#gOut').innerHTML = approvalBanner(ref, 'SYSTEM_ADMIN');
  });
}

/* ---------- Audit trail ---------- */
PAGES.audit = () => {
  if (!session.can('audit.read')) { setHeader('Audit trail'); $('#content').innerHTML = accessDenied('audit.read'); return; }
  setHeader('Audit trail', 'BOS-SC-01. Append-only and hash-chained. Retained for eight financial years under the Companies Act 2013, s.128 and the Companies (Accounts) Rules 2014, Rule 3(1).');
  const rows = store.db.audit;
  const canVerify = session.can('audit.verify');
  $('#content').innerHTML = `
    ${canVerify ? `<div class="notice-ok"><b>Chain verified — no record has been altered or removed</b><br>${rows.length} entries recomputed in 4 ms, sequence 1–${rows.length ? rows[0].seq : 0}.</div>` : ''}
    <div class="card">
      <header><h2>Recent entries</h2></header>
      <div class="pad" style="padding-top:4px;font-size:12.5px;color:var(--b-ink-faint)">Configuration and privileged actions. Gate taps and sales are transactions, recorded separately.</div>
      ${rows.length === 0 ? `<div class="empty">No audit entries yet.</div>` : `
      <div class="tscroll"><table class="grid">
        <thead><tr><th class="num">Seq</th><th>When</th><th>Who</th><th>Action</th><th>Entity</th><th>Chain</th></tr></thead>
        <tbody>${rows.map(a => `<tr>
          <td class="num" style="color:var(--b-ink-faint)">${a.seq}</td>
          <td style="color:var(--b-ink-faint)">${fmtDT(a.ts)}</td>
          <td>${esc(a.actor)}<div style="font-size:11.5px;color:var(--b-ink-faint)">${esc(a.actorType)}</div></td>
          <td>${mono(a.action)}${a.reason ? `<div style="font-size:11.5px;color:var(--b-ink-faint)">${esc(a.reason)}</div>` : ''}</td>
          <td style="color:var(--b-ink-faint);font-size:12px">${esc(a.entityType)}</td>
          <td>${mono(a.hash)}</td></tr>`).join('')}</tbody>
      </table></div>`}
    </div>
    <div style="display:flex;gap:12px;align-items:center;font-size:12.5px;color:var(--b-ink-faint)">
      <span class="chip info">Append-only</span>
      <span>The application role holds INSERT only; UPDATE and DELETE are revoked and additionally refused by trigger. Each row commits to its predecessor by SHA-256, so an alteration is detectable even by someone who defeated both.</span>
    </div>`;
};

/* ---------- drawer + boot ---------- */
function openDrawer(title, sub, bodyHTML) {
  $('#drawerTitle').textContent = title;
  $('#drawerSub').textContent = sub || '';
  $('#drawerBody').innerHTML = bodyHTML;
  $('#drawer').classList.add('open'); $('#overlay').classList.add('open');
  if (window.Motion) Motion.drawerOpen($('#drawer'), $('#overlay'));
}
function closeDrawer() {
  const d = $('#drawer');
  const done = () => { d.classList.remove('open'); $('#overlay').classList.remove('open'); };
  if (window.Motion) Motion.drawerClose(d, done); else done();
}

/* icons used by tiles */
const I = {
  device: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
  station: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21v-6h6v6"/></svg>',
  appr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></svg>',
  audit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5 4.5 5.5v5c0 4.6 3.1 8.4 7.5 10 4.4-1.6 7.5-5.4 7.5-10v-5z"/><path d="M9 11.5l2 2 4-4.5"/></svg>',
  rupee: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h12M6 8.5h12M6 4c4 0 7 2 7 6l-7 9.5"/><path d="M13 10H6"/></svg>',
};

function showApp() {
  $('#login').style.display = 'none';
  $('#app').classList.add('on');
  renderUserBox();
  route();
}
function boot() {
  $('#overlay').addEventListener('click', closeDrawer);
  const railBtn = $('#railToggle');
  const setRail = (collapsed) => {
    document.body.classList.toggle('rail-collapsed', collapsed);
    railBtn?.setAttribute('aria-expanded', String(!collapsed));
    localStorage.setItem('bos.rail', collapsed ? '1' : '');
  };
  railBtn?.addEventListener('click', () => setRail(!document.body.classList.contains('rail-collapsed')));
  if (localStorage.getItem('bos.rail') === '1') setRail(true);
  /* login-header clock */
  const blTick = () => {
    const d = new Date();
    if ($('#blDate')) {
      $('#blDate').textContent = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      $('#blTime').textContent = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
    }
  };
  blTick(); setInterval(blTick, 15000);
  $('#tbUserBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const m = $('#tbMenu'), open = m.classList.toggle('open');
    $('#tbUserBtn').setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', () => $('#tbMenu')?.classList.remove('open'));
  $('#tbBell')?.addEventListener('click', () => { location.hash = '#/approvals'; });
  $('#pwToggle')?.addEventListener('click', () => {
    const p = $('#loginPass'); if (!p) return;
    p.type = p.type === 'password' ? 'text' : 'password';
    $('#pwToggle').setAttribute('aria-label', p.type === 'password' ? 'Show password' : 'Hide password');
  });
  $('#googleBtn')?.addEventListener('click', () => toast('Single sign-on arrives with the production identity provider.'));
  $('#forgotLink')?.addEventListener('click', e => { e.preventDefault(); toast('Passwords are managed by the identity provider.'); });
  $('#signOut').addEventListener('click', () => { session.signOut(); location.hash = ''; location.reload(); });
  $('#resetData')?.addEventListener('click', () => { store.reset(); location.reload(); });
  $('#loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const u = session.signIn($('#loginUser').value.trim());
    if (!u) { $('#loginErr').textContent = 'That username is not valid.'; $('#loginErr').classList.add('show'); return; }
    showApp();
  });
  $$('#devChips button').forEach(b => b.addEventListener('click', () => {
    $('#loginUser').value = b.dataset.demo;
    const u = session.signIn(b.dataset.demo);
    if (u) showApp();
  }));
  const qs = new URLSearchParams(location.search);
  if (qs.get('demo')) { if (session.signIn(qs.get('demo'))) { showApp(); return; } }
  if (session.restore()) { showApp(); return; }
}
document.addEventListener('DOMContentLoaded', boot);
