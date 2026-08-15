/* ============================================================
   BOS console v2 — feature parity with the live Next.js console:
   per-role navigation, fare versions with maker-checker,
   approvals queue, label master, hash-chained audit, rich forms.
   ============================================================ */

const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

/* ---------- icons ---------- */
const I = {
  dash:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/></svg>',
  station:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V8l7-4.5L19 8v13"/><path d="M9.5 21v-5h5v5"/><path d="M9 11h.01M15 11h.01"/></svg>',
  device: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="5" y="5" width="14" height="14" rx="2.5"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 2.5v2M15 2.5v2M9 19.5v2M15 19.5v2M2.5 9h2M2.5 15h2M19.5 9h2M19.5 15h2"/></svg>',
  product:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-4z"/><path d="M14 7v10" stroke-dasharray="2.5 3"/></svg>',
  fare:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h12M6 8.5h12M6 4c4 0 7 2 7 6l-7 9.5"/><path d="M13 10H6"/></svg>',
  label:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l8.5-8.5a2 2 0 0 1 1.4-.6H19a2 2 0 0 1 2 2v6.1a2 2 0 0 1-.6 1.4L12 21z"/><circle cx="16" cy="8" r="1.6"/></svg>',
  appr:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11.5l2 2 4.5-4.5"/><circle cx="12" cy="12" r="9"/></svg>',
  users:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9" r="2.6"/><path d="M15.5 20a5 5 0 0 1 6.5-4.7"/></svg>',
  hot:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19"/><path d="M5 3l14 18"/></svg>',
  tx:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
  audit:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5 4.5 5.5v5c0 4.6 3.1 8.4 7.5 10 4.4-1.6 7.5-5.4 7.5-10v-5z"/><path d="M9 11.5l2 2 4-4"/></svg>',
  cfg:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 12h2M10 12h10M4 17h14"/><circle cx="16" cy="7" r="2"/><circle cx="7" cy="12" r="2"/><circle cx="20" cy="17" r="2"/></svg>',
  plus:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  edit:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4.5L20 8.5a2.1 2.1 0 0 0-3-3L5.5 17z"/><path d="M14.5 7l3 3"/></svg>',
  trash:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4.5 7h15M9.5 7V4.8a1.3 1.3 0 0 1 1.3-1.3h2.4a1.3 1.3 0 0 1 1.3 1.3V7M7 7l1 13h8l1-13"/></svg>',
  eye:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/></svg>',
  cash:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5h.01M18 14.5h.01"/></svg>',
  upi:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>',
  card:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19"/></svg>',
  rupee:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h12M6 8.5h12M6 4c4 0 7 2 7 6l-7 9.5"/><path d="M13 10H6"/></svg>',
  gate:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16"/><path d="M4 21h16M12 3v18M8 8h.01M16 8h.01"/></svg>',
  link:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 14.5 14.5 9.5"/><path d="M7 17l-1.5 1.5a3.5 3.5 0 0 1-5-5l3-3a3.5 3.5 0 0 1 5 0" transform="translate(3 -1)"/><path d="M17 7l1.5-1.5a3.5 3.5 0 0 1 5 5l-3 3a3.5 3.5 0 0 1-5 0" transform="translate(-3 1)"/></svg>',
};

/* ---------- routes (visibility from the role's nav set) ---------- */
const ROUTES = [
  { id: 'dashboard',    title: 'Dashboard',      crumb: 'Operational overview — live position across the four stations', icon: I.dash,    grp: 'Overview' },
  { id: 'stations',     title: 'Stations',       crumb: 'Station master · ordered by position along the route (BOS-DM-01)', icon: I.station, grp: 'Masters' },
  { id: 'devices',      title: 'Devices',        crumb: 'Every ECU, ToM, TVM and station server, with its certificate identity (BOS-DM-02)', icon: I.device,  grp: 'Masters' },
  { id: 'products',     title: 'Products',       crumb: 'What can be sold, where, and how it becomes something a gate will accept (BOS-FP-02)', icon: I.product, grp: 'Masters' },
  { id: 'fares',        title: 'Fares',          crumb: 'A published version can never be edited — publish a new version, or a rollback (BOS-FP-01/03/06/08)', icon: I.fare, grp: 'Masters' },
  { id: 'labels',       title: 'Labels',         crumb: 'Hindi and English for stations, products and receipts, distributed with the fare table (BOS-MD-04, rule 16)', icon: I.label, grp: 'Masters' },
  { id: 'approvals',    title: 'Approvals',      crumb: 'Privileged changes are proposals until a second person decides. You cannot decide your own (BOS-SC-04)', icon: I.appr, grp: 'Access' },
  { id: 'users',        title: 'Users & Roles',  crumb: 'Authorisation records only — passwords and MFA live in the identity provider (BOS-UM-01/02)', icon: I.users, grp: 'Access' },
  { id: 'hotlist',      title: 'Hotlist',        crumb: 'Blocked NCMC cards — refused at every device', icon: I.hot, grp: 'Access' },
  { id: 'transactions', title: 'Transactions',   crumb: 'Consolidated, append-only sales ledger from all devices', icon: I.tx, grp: 'Operations' },
  { id: 'audit',        title: 'Audit Trail',    crumb: 'Append-only and hash-chained. Retained for eight financial years (Companies Act 2013, s.128)', icon: I.audit, grp: 'Operations' },
  { id: 'settings',     title: 'Configuration',  crumb: 'Operational values — System Flow §33', icon: I.cfg, grp: 'System' },
];

/* ---------- shell ---------- */
function boot() {
  store.load();
  session.load();
  const q = new URLSearchParams(location.search);
  if (q.get('demo')) session.signIn(q.get('demo'));
  if (session.user) enterApp();
  else { $('#fUser').value = 'admin.dev'; $('#fPass').value = 'demo'; }

  $('#loginForm').addEventListener('submit', e => { e.preventDefault(); tryLogin($('#fUser').value.trim()); });
  $$('.demo-chips button').forEach(b => b.addEventListener('click', () => {
    $('#fUser').value = b.dataset.demo; $('#fPass').value = 'demo'; tryLogin(b.dataset.demo);
  }));
  $('#signOut').addEventListener('click', () => { session.signOut(); location.hash = ''; location.reload(); });
  $('#resetData').addEventListener('click', async () => {
    if (await askConfirm('Reset demo data?', 'All your changes in this browser are discarded and the seed data is restored.', 'Reset')) {
      store.reset(); toast('Demo data reset'); route();
    }
  });
  $('#drawerClose').addEventListener('click', closeDrawer);
  $('#drawerCancel').addEventListener('click', closeDrawer);
  $('#overlay').addEventListener('click', closeDrawer);
  $('#searchBox').addEventListener('input', applySearch);
  window.addEventListener('hashchange', route);
}
function tryLogin(username) {
  const u = session.signIn(username);
  if (!u) { $('#loginErr').classList.add('show'); return; }
  enterApp();
}
function enterApp() {
  $('#login').style.display = 'none';
  $('#app').classList.add('on');
  const u = session.user;
  $('#whoName').textContent = u.name;
  $('#whoRole').textContent = u.username;
  $('#whoAv').textContent = u.name.split(' ').map(x => x[0]).slice(0, 2).join('');
  const rw = session.canWrite();
  const chip = $('#whoChip');
  chip.textContent = session.roleLabel() + (rw ? '' : ' · read-only');
  chip.classList.toggle('rw', rw);
  document.body.classList.toggle('readonly', !rw);
  route();
}
function allowedRoutes() {
  const nav = session.navFor();
  return ROUTES.filter(r => nav.includes(r.id));
}
function buildNav() {
  const db = store.db;
  const pend = db.approvals.filter(a => a.status === 'pending').length;
  const counts = {
    stations: db.stations.length, devices: db.devices.length, products: db.products.length,
    fares: db.fareVersions.length, labels: db.labels.length, approvals: pend || null,
    users: db.users.length, hotlist: db.hotlist.length,
    transactions: db.transactions.length, audit: db.audit.length, settings: db.config.length,
  };
  let html = '', grp = '';
  for (const r of allowedRoutes()) {
    if (r.grp !== grp) { grp = r.grp; html += `<h6>${grp}</h6>`; }
    html += `<a href="#/${r.id}" data-route="${r.id}">${r.icon}<span>${r.title}</span>${counts[r.id] != null ? `<span class="cnt">${counts[r.id]}</span>` : ''}</a>`;
  }
  $('#nav').innerHTML = html;
}
function route() {
  const id = (location.hash.replace(/^#\//, '') || 'dashboard').split('?')[0];
  const allowed = allowedRoutes();
  const r = allowed.find(x => x.id === id) || allowed[0];
  $('#pageTitle').textContent = r.title;
  $('#searchBox').value = '';
  $('#searchWrap').style.display = r.id === 'dashboard' ? 'none' : '';
  const oldC = $('#content'); const fresh = oldC.cloneNode(false);
  oldC.replaceWith(fresh);
  PAGES[r.id]();
  if (window.Motion) Motion.page();
  buildNav();
  $$('#nav a').forEach(a => a.classList.toggle('on', a.dataset.route === r.id));
}

/* ---------- primitives ---------- */
function toast(msg) {
  $('#toastMsg').textContent = msg;
  const t = $('#toast'); t.classList.add('show');
  if (window.Motion) Motion.toast(t);
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2800);
}
function guard() {
  if (!session.canWrite()) { toast('Your role is read-only — changes are disabled'); return false; }
  return true;
}
let drawerSaveFn = null;
function openDrawer(title, bodyHTML, onSave, saveLabel = 'Save') {
  $('#drawerTitle').textContent = title;
  $('#drawerBody').innerHTML = bodyHTML;
  $('#drawerSave').textContent = saveLabel;
  $('#drawerSave').style.display = onSave ? '' : 'none';
  drawerSaveFn = onSave;
  $('#overlay').classList.add('open');
  $('#drawer').classList.add('open');
  if (window.Motion) Motion.drawerOpen($('#drawer'), $('#overlay'));
  const f = $('#drawerBody input:not([disabled]), #drawerBody select'); if (f) f.focus();
}
function closeDrawer() {
  drawerSaveFn = null;
  const done = () => { $('#overlay').classList.remove('open'); $('#drawer').classList.remove('open'); };
  if (window.Motion) Motion.drawerClose($('#drawer'), done); else done();
}
document.addEventListener('DOMContentLoaded', () => {
  $('#drawerSave').addEventListener('click', () => { if (drawerSaveFn) drawerSaveFn(); });
});
const fld = (id, label, inner, help) =>
  `<div class="field"><label for="${id}">${label}</label>${inner}${help ? `<div class="fhelp">${help}</div>` : ''}</div>`;
const inputF = (id, label, value = '', type = 'text', attrs = '', help = '') =>
  fld(id, label, `<input id="${id}" type="${type}" value="${String(value ?? '').replace(/"/g, '&quot;')}" ${attrs}>`, help);
const selectF = (id, label, options, value, help = '') =>
  fld(id, label, `<select id="${id}">${options.map(o => `<option value="${o.v}" ${String(o.v) === String(value) ? 'selected' : ''}>${o.t}</option>`).join('')}</select>`, help);
const checkF = (id, label, checked) =>
  `<label class="chk"><input type="checkbox" id="${id}" ${checked ? 'checked' : ''}><span>${label}</span></label>`;
function askConfirm(title, body, yes = 'Delete') {
  return new Promise(res => {
    $('#confirmTitle').textContent = title;
    $('#confirmBody').textContent = body;
    $('#confirmYes').textContent = yes;
    const c = $('#confirm'); c.classList.add('open');
    const done = v => { c.classList.remove('open'); $('#confirmYes').onclick = $('#confirmNo').onclick = null; res(v); };
    $('#confirmYes').onclick = () => done(true);
    $('#confirmNo').onclick = () => done(false);
  });
}
function applySearch() {
  const q = $('#searchBox').value.trim().toLowerCase();
  $$('#content table.grid tbody tr').forEach(tr => {
    tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}
const statusChip = s => ({
  active: '<span class="chip ok">Active</span>',
  faulty: '<span class="chip bad">Faulty</span>', fault: '<span class="chip bad">Fault</span>',
  offline: '<span class="chip warn">Offline</span>',
  maintenance: '<span class="chip info">Maintenance</span>',
  suspended: '<span class="chip dim">Suspended</span>',
  inactive: '<span class="chip dim">Inactive</span>',
  invited: '<span class="chip info">Invited</span>',
  deactivated: '<span class="chip dim">Deactivated</span>',
  planned: '<span class="chip dim">Planned</span>',
  commissioning: '<span class="chip info">Commissioning</span>',
  decommissioned: '<span class="chip dim">Decommissioned</span>',
  registered: '<span class="chip dim">Registered</span>',
  provisioning: '<span class="chip info">Provisioning</span>',
}[s] || `<span class="chip dim">${s}</span>`);
const verChip = s => ({
  published: '<span class="chip ok">Published</span>',
  draft: '<span class="chip info">Draft</span>',
  pending: '<span class="chip warn">Awaiting approval</span>',
  superseded: '<span class="chip dim">Superseded</span>',
}[s] || `<span class="chip dim">${s}</span>`);
const aprChip = s => ({
  pending: '<span class="chip warn">Pending</span>',
  approved: '<span class="chip ok">Approved</span>',
  rejected: '<span class="chip bad">Rejected</span>',
  withdrawn: '<span class="chip dim">Withdrawn</span>',
}[s] || s);
const rowActs = (id, extra = '') => `<div class="rowact w-only">${extra}
  <button class="iconbtn" data-edit="${id}" aria-label="Edit">${I.edit}</button>
  <button class="iconbtn del" data-del="${id}" aria-label="Delete">${I.trash}</button></div>`;
const cardShell = (title, sub, toolbar, body) => `
  <div class="card"><header><h2>${title}</h2><div class="hspace"></div>${toolbar}${sub ? `<div class="sub">${sub}</div>` : ''}</header>${body}</div>`;
const listWrap = html => `<div class="listwrap">${html}</div>`;
const newBtn = (label, id = 'newBtn') => `<button class="btn btn-primary w-only" id="${id}">${I.plus}<span>${label}</span></button>`;
const stationOpts = (first) => [
  ...(first ? [first] : []),
  ...store.db.stations.map(s => ({ v: s.code, t: `${s.code} — ${s.en}` })),
];
const userName = un => (store.db.users.find(u => u.username === un) || { name: un }).name;

function wireCrud(coll, onNew, onEdit, onDel) {
  const cont = $('#content');
  const nb = $('#newBtn', cont);
  if (nb && onNew) nb.addEventListener('click', () => { if (guard()) onNew(); });
  cont.addEventListener('click', e => {
    const eb = e.target.closest('[data-edit]');
    const db = e.target.closest('[data-del]');
    if (eb && guard() && onEdit) onEdit(store.db[coll].find(r => r.id === eb.dataset.edit));
    if (db && guard() && onDel) onDel(store.db[coll].find(r => r.id === db.dataset.del));
  });
}

/* ============================================================ PAGES */
const PAGES = {

  /* ---------------- dashboard ---------------- */
  dashboard() {
    const db = store.db;
    const t0 = new Date(); t0.setHours(0, 0, 0, 0);
    const today = db.transactions.filter(t => t.ts >= t0.getTime());
    const revToday = today.reduce((a, t) => a + t.amount, 0);
    const tixToday = today.reduce((a, t) => a + t.qty * (t.product === 'RJT' ? 2 : 1), 0);
    const attention = db.devices.filter(d => !['active'].includes(d.status));
    const me = session.user.username;
    const pending = db.approvals.filter(a => a.status === 'pending');
    const mine = pending.filter(a => a.maker !== me && session.canApprove());
    const auditN = db.audit.length;

    const days = [];
    for (let d = 6; d >= 0; d--) {
      const a = new Date(t0.getTime() - d * 864e5);
      const b = a.getTime() + 864e5;
      const sum = db.transactions.filter(t => t.ts >= a.getTime() && t.ts < b).reduce((x, t) => x + t.amount, 0);
      days.push({ lab: a.toLocaleDateString('en-IN', { weekday: 'short' }), sum, today: d === 0 });
    }
    const gmax = Math.ceil(Math.max(...days.map(d => d.sum), 1) / 2000) * 2000;
    const mode = m => today.filter(t => t.mode === m).reduce((a, t) => a + t.amount, 0);

    $('#content').innerHTML = `
      <div class="dashgrid">
        <div class="tile-b"><div class="ic">${I.rupee}</div><div class="tv"><b>${fmtINR(revToday)}</b><span>Revenue today</span></div></div>
        <div class="tile-b"><div class="ic">${I.product}</div><div class="tv"><b>${tixToday}</b><span>Tickets issued today</span></div></div>
        <div class="tile-b"><div class="ic">${I.appr}</div><div class="tv"><b>${session.canApprove() ? mine.length : pending.length}</b><span>${session.canApprove() ? 'Awaiting your decision' : 'Pending approvals'}</span></div></div>
        <div class="tile-b"><div class="ic">${I.audit}</div><div class="tv"><b>Intact</b><span>Audit chain · ${auditN} entries verified</span></div></div>

        <div class="card dg-chart">
          <header><h2>Revenue — last 7 days</h2><div class="hspace"></div>
            <span class="chip dim" style="font-weight:600">All stations · all modes</span></header>
          <div class="chart">
            <div class="bars">
              <div class="gline" style="bottom:100%"><span>${fmtINR(gmax)}</span></div>
              <div class="gline" style="bottom:50%"><span>${fmtINR(gmax / 2)}</span></div>
              ${days.map(d => `
                <div class="bcol ${d.today ? 'today' : ''}">
                  <div class="bar" style="height:${Math.max(Math.round(d.sum / gmax * 100), 8)}%">
                    <span class="tip">${d.lab} · ${fmtINR(d.sum)}</span>
                    ${d.today ? `<span class="dlab">${fmtINR(d.sum)}</span>` : ''}
                  </div>
                  <div class="xlab">${d.lab}</div>
                </div>`).join('')}
            </div>
            <table class="sr-only"><caption>Revenue by day</caption>
              ${days.map(d => `<tr><th>${d.lab}</th><td>${fmtINR(d.sum)}</td></tr>`).join('')}</table>
          </div>
          <div class="modegrid">
            <div class="m"><span>${I.cash} Cash · counter</span><b>${fmtINR(mode('Cash'))}</b></div>
            <div class="m"><span>${I.upi} UPI</span><b>${fmtINR(mode('UPI'))}</b></div>
            <div class="m"><span>${I.card} Card · counter</span><b>${fmtINR(mode('Card'))}</b></div>
          </div>
        </div>

        <div class="dg-right">
          ${pending.length ? `
          <div class="card">
            <header><h2>Awaiting a decision</h2><div class="hspace"></div>
              <a href="#/approvals" class="chip warn" style="text-decoration:none">${pending.length} pending</a></header>
            <div class="tscroll"><table class="grid"><tbody>
              ${pending.slice(0, 3).map(a => `<tr>
                <td class="mono" style="white-space:nowrap">${a.ref}</td>
                <td>${a.summary.slice(0, 60)}${a.summary.length > 60 ? '…' : ''}</td></tr>`).join('')}
            </tbody></table></div>
          </div>` : ''}
          <div class="card">
            <header><h2>Top stations today</h2><div class="hspace"></div>
              <span class="chip dim">by revenue</span></header>
            ${(() => {
              const by = STN.map(st => ({ code: st.code, name: st.en, sum: today.filter(t => t.station === st.code).reduce((a, t) => a + t.amount, 0) }))
                .sort((a, b) => b.sum - a.sum).slice(0, 3);
              const mx = Math.max(...by.map(x => x.sum), 1);
              return `<div class="pillbars">${by.map((x, i) => `
                <div class="pb pb-${i}">
                  <div class="pbar" style="height:${Math.round(115 + (x.sum / mx) * 95)}px">
                    <span class="plabel">${x.name}</span><span class="pdot">${x.code}</span>
                  </div>
                  <span class="pval">${fmtINR(x.sum)}</span>
                </div>`).join('')}</div>`;
            })()}
          </div>
          <div class="card">
            <header><h2>Needs attention</h2><div class="hspace"></div>
              <span class="chip ${attention.length ? 'warn' : 'ok'}">${attention.length || 'None'}</span></header>
            ${attention.length ? `<div class="tscroll"><table class="grid"><tbody>
              ${attention.map(d => `<tr>
                <td class="mono">${d.code}</td>
                <td>${stationName(d.station)}</td>
                <td style="text-align:right">${statusChip(d.status)}</td></tr>`).join('')}
            </tbody></table></div>` : `<div class="empty">Every device is reporting normally.</div>`}
          </div>
        </div>

        <div class="dg-full">
      ${cardShell('Recent transactions', '', `<a href="#/transactions" class="btn btn-primary" style="height:40px">Open ledger</a>`, `
        <div class="tscroll"><table class="grid">
          <thead><tr><th>Time</th><th>Ref</th><th>Station</th><th>Device</th><th>Product</th><th>Journey</th><th class="num">Qty</th><th>Mode</th><th class="num">Amount</th></tr></thead>
          <tbody>${db.transactions.slice(0, 8).map(txRow).join('')}</tbody>
        </table></div>`)}
        </div>
      </div>`;
  },

  /* ---------------- stations ---------------- */
  stations() {
    const rows = store.db.stations.map((s, i) => `<tr>
      <td class="num" style="color:var(--b-ink-faint)">${s.seq}</td>
      <td><span class="av av-${i % 4}">${s.code}</span></td>
      <td><div class="cellmain"><span class="cm-t"><b>${s.en}</b><span>${s.hi} · ${s.short || s.code}</span></span></div></td>
      <td>${s.type}</td>
      <td>${statusChip(s.status)}</td>
      <td>${s.open} – ${s.close}</td>
      <td>${fmtD(s.commissioned)}</td>
      <td>${rowActs(s.id)}</td></tr>`).join('');

    $('#content').innerHTML = listWrap(cardShell('Station master',
      'Stations are ordered by their position along the route; that ordering drives every report and every distance-based fare (BOS-DM-01).',
      newBtn('Register a station'), `
      <div class="tscroll"><table class="grid">
        <thead><tr><th class="num">#</th><th>Code</th><th>Name</th><th>Type</th><th>Status</th><th>Operating hours</th><th>Commissioned</th><th></th></tr></thead>
        <tbody>${rows}</tbody></table></div>`));

    const form = (s = {}, isNew = true) =>
      inputF('f_code', 'Station code' + (isNew ? ' *' : ''), s.code || '', 'text',
        `maxlength="6" style="text-transform:uppercase" ${isNew ? '' : 'disabled'}`,
        isNew ? 'Two to six upper-case letters. Used in reports and clearing files, so it must be stable.' : 'The code cannot be changed — it appears in reports and clearing files.') +
      inputF('f_seq', 'Position on the route *', s.seq ?? store.db.stations.length + 1, 'number', 'min="1" max="20"',
        'Order along the line. Drives every report and every distance-based fare.') +
      inputF('f_en', 'Name (English) *', s.en || '') +
      inputF('f_hi', 'Name (Hindi)', s.hi || '', 'text', '', 'Shown on screens and receipts alongside the English name.') +
      inputF('f_short', 'Short name', s.short || '') +
      selectF('f_type', 'Type *', [{ v: 'Terminal', t: 'Terminal — end of the line' }, { v: 'Intermediate', t: 'Intermediate' }], s.type || 'Intermediate') +
      inputF('f_open', 'Opens', s.open || '05:00', 'time') +
      inputF('f_close', 'Closes', s.close || '21:00', 'time') +
      inputF('f_lat', 'Latitude', s.lat ?? '', 'number', 'step="any"') +
      inputF('f_lng', 'Longitude', s.lng ?? '', 'number', 'step="any"') +
      inputF('f_addr', 'Address', s.address ?? '') +
      (isNew ? '' : selectF('f_status', 'Status',
        ['planned', 'commissioning', 'active', 'suspended', 'decommissioned'].map(v => ({ v, t: v[0].toUpperCase() + v.slice(1) })), s.status));
    const read = (s = {}) => ({
      code: ($('#f_code').value || s.code || '').trim().toUpperCase(),
      seq: +$('#f_seq').value, en: $('#f_en').value.trim(), hi: $('#f_hi').value.trim(),
      short: $('#f_short').value.trim(), type: $('#f_type').value,
      open: $('#f_open').value, close: $('#f_close').value,
      lat: $('#f_lat').value || null, lng: $('#f_lng').value || null, address: $('#f_addr').value || null,
      status: $('#f_status') ? $('#f_status').value : (s.status || 'active'),
    });

    wireCrud('stations',
      () => openDrawer('Register a station', form(), () => {
        const v = read(); if (!v.code || !v.en) return toast('Code and name are required');
        v.commissioned = Date.now();
        store.insert('stations', v, 'Station', `${v.code} — ${v.en} registered`);
        closeDrawer(); toast('Station registered'); route();
      }, 'Create station'),
      s => openDrawer(`Edit ${s.en}`, form(s, false), () => {
        store.update('stations', s.id, read(s), 'Station', `${s.code} updated — values before and after recorded`);
        closeDrawer(); toast('Saved'); route();
      }, 'Save changes'),
      async s => {
        const used = store.db.devices.filter(d => d.station === s.code).length;
        if (used) return toast(`${used} devices are registered at ${s.code} — decommission them first`);
        if (await askConfirm(`Delete ${s.code}?`, `${s.en} is removed from the line. Fares that reference it stay in history.`)) {
          store.remove('stations', s.id, 'Station', `${s.code} deleted`);
          toast('Station deleted'); route();
        }
      });
  },

  /* ---------------- devices ---------------- */
  devices() {
    const db = store.db;
    const TYPES = ['Gate controller (ECU)', 'Counter (ToM)', 'Kiosk (TVM)', 'Excess Fare Office terminal', 'Station server', 'Handheld'];
    const TAV = { 'Gate controller (ECU)': [I.gate, 0], 'Kiosk (TVM)': [I.device, 1], 'Counter (ToM)': [I.cash, 2], 'Excess Fare Office terminal': [I.users, 3], 'Station server': [I.cfg, 2], 'Handheld': [I.upi, 1] };
    const f = PAGES._devFilter || { station: '', type: '', status: '' };
    const list = db.devices.filter(d =>
      (!f.station || d.station === f.station) && (!f.type || d.type === f.type) && (!f.status || d.status === f.status));

    $('#content').innerHTML = listWrap(cardShell('Device registry',
      `${list.length} of ${db.devices.length} devices. Certificate issue, configuration distribution and heartbeat arrive with the device plane in phase 2 — the columns are already here so the registry keeps its shape.`,
      newBtn('Register device'), `
      <div class="pad" style="padding-top:0;padding-bottom:8px"><div class="fbar">
        <select id="fSt"><option value="">All stations</option>${STN.map(s => `<option ${f.station === s.code ? 'selected' : ''}>${s.code}</option>`).join('')}</select>
        <select id="fTy"><option value="">All types</option>${TYPES.map(t => `<option ${f.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
        <select id="fSs"><option value="">Any status</option>${['active', 'faulty', 'offline', 'maintenance', 'registered', 'provisioning', 'decommissioned'].map(s => `<option ${f.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
      </div></div>
      <div class="tscroll"><table class="grid">
        <thead><tr><th>Device</th><th>Station</th><th>Lane / role</th><th>Status</th><th>Certificate</th><th>Fare / hotlist</th><th>Last seen</th><th></th></tr></thead>
        <tbody>${list.map(d => `<tr>
          <td><div class="cellmain"><span class="av av-${(TAV[d.type] || [0, 0])[1]}" style="width:36px;height:36px;border-radius:11px">${(TAV[d.type] || [I.device])[0]}</span><span class="cm-t"><b class="mono" style="font-family:var(--font-mono);font-size:12px">${d.code}</b><span>${d.type}</span></span></div></td>
          <td>${stationName(d.station)}</td>
          <td style="color:var(--b-ink-soft)">${d.role}</td>
          <td>${statusChip(d.status)}</td>
          <td><span class="chip dim">Pending · phase 2</span></td>
          <td style="color:var(--b-ink-faint)">v1 · current</td>
          <td style="white-space:nowrap;color:var(--b-ink-faint)">${fmtDT(d.lastSeen)}</td>
          <td>${rowActs(d.id)}</td></tr>`).join('') || `<tr><td colspan="8"><div class="empty">No devices match the filter.</div></td></tr>`}
        </tbody></table></div>`));

    ['fSt', 'fTy', 'fSs'].forEach((id, i) => $('#' + id).addEventListener('change', e => {
      PAGES._devFilter = { ...f, [['station', 'type', 'status'][i]]: e.target.value };
      PAGES.devices();
    }));

    const formNew = () =>
      selectF('f_type', 'Device type *', TYPES.map(t => ({ v: t, t })), TYPES[0]) +
      selectF('f_station', 'Station *', stationOpts(), 'VCT') +
      inputF('f_code', 'Device code *', '', 'text', 'placeholder="VCT-TYPE-01" style="text-transform:uppercase"',
        'Station code, then TYPE, then a suffix — for example VCT-ECU-06. It appears in clearing files and reports, so it must survive a restore unchanged.') +
      inputF('f_role', 'Lane / role', '', 'text', 'placeholder="Entry · tripod"') +
      inputF('f_manu', 'Manufacturer', '') + inputF('f_model', 'Model', '') +
      inputF('f_serial', 'Serial number', '') + inputF('f_asset', 'Asset tag', '') +
      inputF('f_ip', 'IP address', '') + inputF('f_loc', 'Location note', '') +
      inputF('f_inst', 'Installed on', new Date().toISOString().slice(0, 10), 'date');
    const formEdit = (d) =>
      `<div class="fhelp" style="margin-bottom:14px">${d.code} — ${d.type} at ${stationName(d.station)}. The code, type and station are fixed at registration; moving a device means decommissioning it and registering it at the other station.</div>` +
      inputF('f_manu', 'Manufacturer', d.manufacturer ?? '') + inputF('f_model', 'Model', d.model ?? '') +
      inputF('f_serial', 'Serial number', d.serial ?? '') + inputF('f_asset', 'Asset tag', d.assetTag ?? '') +
      inputF('f_ip', 'IP address', d.ip ?? '') + inputF('f_loc', 'Location note', d.locationNote ?? '') +
      selectF('f_status', 'Status', [
        { v: 'registered', t: 'Registered — no certificate issued yet' },
        { v: 'provisioning', t: 'Provisioning' }, { v: 'active', t: 'Active' },
        { v: 'maintenance', t: 'Maintenance' }, { v: 'faulty', t: 'Faulty' },
        { v: 'offline', t: 'Offline' }, { v: 'decommissioned', t: 'Decommissioned' },
      ], d.status);

    wireCrud('devices',
      () => openDrawer('Register a device', formNew(), () => {
        const code = $('#f_code').value.trim().toUpperCase();
        if (!code) return toast('Device code is required');
        store.insert('devices', {
          code, type: $('#f_type').value, station: $('#f_station').value, role: $('#f_role').value.trim() || '—',
          manufacturer: $('#f_manu').value || null, model: $('#f_model').value || null,
          serial: $('#f_serial').value || null, assetTag: $('#f_asset').value || null,
          ip: $('#f_ip').value || null, locationNote: $('#f_loc').value || null,
          installedOn: Date.now(), status: 'registered',
          cert: 'Pending — issued during provisioning (phase 2)', lastSeen: null,
        }, 'Device', `${code} registered at ${$('#f_station').value}`);
        closeDrawer(); toast('Device registered — certificate is issued during provisioning'); route();
      }, 'Register device'),
      d => openDrawer(`Edit ${d.code}`, formEdit(d), () => {
        store.update('devices', d.id, {
          manufacturer: $('#f_manu').value || null, model: $('#f_model').value || null,
          serial: $('#f_serial').value || null, assetTag: $('#f_asset').value || null,
          ip: $('#f_ip').value || null, locationNote: $('#f_loc').value || null,
          status: $('#f_status').value,
        }, 'Device', `${d.code} updated (${$('#f_status').value})`);
        closeDrawer(); toast('Saved'); route();
      }, 'Save changes'),
      async d => {
        if (await askConfirm(`Decommission ${d.code}?`, 'The device is withdrawn from the registry. Its transaction history is retained.', 'Decommission')) {
          store.remove('devices', d.id, 'Device', `${d.code} decommissioned and removed`);
          toast('Device removed'); route();
        }
      });
  },

  /* ---------------- products ---------------- */
  products() {
    $('#content').innerHTML = listWrap(cardShell('Fare products',
      'The SAC code classifies every invoice a product raises — the seeded value is a placeholder pending the project tax advisor (BOS-FP-02). Concession and Group are phase 2 and start disabled.',
      newBtn('Define a product'), `
      <div class="tscroll"><table class="grid">
        <thead><tr><th>Code</th><th>Name</th><th>Category</th><th>SAC</th><th class="num">Trips</th><th>Fulfilment</th><th>Channels</th><th>Status</th><th></th></tr></thead>
        <tbody>${store.db.products.slice().sort((a, b) => a.order - b.order).map(p => `<tr>
          <td><span class="pillcode">${p.code}</span></td>
          <td><div class="cellmain"><span class="cm-t"><b>${p.en}</b><span>${p.hi}</span></span></div></td>
          <td>${p.category}</td>
          <td class="mono">${p.sac}</td>
          <td class="num">${p.trips}</td>
          <td style="color:var(--b-ink-soft)">${p.fulfilment}</td>
          <td>${p.channels.map(c => `<span class="chip dim" style="margin-right:4px">${c}</span>`).join('')}</td>
          <td>${p.active ? '<span class="chip ok">Active</span>' : '<span class="chip dim">Disabled</span>'}</td>
          <td>${rowActs(p.id)}</td></tr>`).join('')}
        </tbody></table></div>`));

    const CATS = ['Single journey', 'Return journey', 'Group', 'Tourist pass', 'Concession', 'Season pass', 'Stored value', 'Penalty'];
    const form = (p = {}) =>
      inputF('f_code', 'Product code *', p.code || '', 'text', 'style="text-transform:uppercase"',
        'Upper case, digits and underscores. Appears on every ticket and in every report.') +
      selectF('f_cat', 'Category *', CATS.map(c => ({ v: c, t: c })), p.category || 'Single journey') +
      inputF('f_en', 'Name (English) *', p.en || '') +
      inputF('f_hi', 'Name (Hindi)', p.hi || '') +
      inputF('f_sac', 'SAC code *', p.sac || '996429', 'text', 'maxlength="6"',
        'Six digits. Classifies every invoice this product raises — confirm with the project tax advisor.') +
      inputF('f_trips', 'Trips per ticket *', p.trips ?? 1, 'number', 'min="1" max="4"') +
      inputF('f_printed', 'Printed tickets per sale *', p.printed ?? 1, 'number', 'min="1" max="12"') +
      selectF('f_ful', 'How a paid booking becomes a ticket *', [
        { v: 'Direct QR ticket', t: 'Direct QR ticket' },
        { v: 'Booking code, redeemed at a counter', t: 'Booking code, redeemed at a counter or kiosk' },
        { v: 'Either — the passenger chooses', t: 'Either — the passenger chooses' },
      ], p.fulfilment || 'Direct QR ticket') +
      fld('f_ch', 'Channels', ['ToM', 'TVM', 'Web portal', 'Mobile app'].map(c =>
        checkF('ch_' + c.replace(/\W/g, ''), c, (p.channels || ['ToM', 'TVM']).includes(c))).join('')) +
      fld('f_pt', 'Passenger types', ['Adult', 'Child', 'Senior', 'Differently abled', 'Student', 'Staff'].map(c =>
        checkF('pt_' + c.replace(/\W/g, ''), c, (p.passengers || ['Adult']).includes(c))).join('')) +
      inputF('f_max', 'Maximum per transaction *', p.maxPerTxn ?? 6, 'number', 'min="1" max="20"') +
      inputF('f_ord', 'Display order *', p.order ?? store.db.products.length + 1, 'number', 'min="1"') +
      checkF('f_active', 'Active — offered for sale', p.active !== false);
    const read = () => ({
      code: $('#f_code').value.trim().toUpperCase(), category: $('#f_cat').value,
      en: $('#f_en').value.trim(), hi: $('#f_hi').value.trim(),
      sac: $('#f_sac').value.trim(), trips: +$('#f_trips').value, printed: +$('#f_printed').value,
      fulfilment: $('#f_ful').value,
      channels: ['ToM', 'TVM', 'Web portal', 'Mobile app'].filter(c => $('#ch_' + c.replace(/\W/g, '')).checked),
      passengers: ['Adult', 'Child', 'Senior', 'Differently abled', 'Student', 'Staff'].filter(c => $('#pt_' + c.replace(/\W/g, '')).checked),
      maxPerTxn: +$('#f_max').value, order: +$('#f_ord').value, active: $('#f_active').checked,
    });

    wireCrud('products',
      () => openDrawer('Define a product', form(), () => {
        const v = read(); if (!v.code || !v.en || !v.sac) return toast('Code, name and SAC are required');
        store.insert('products', v, 'Product', `${v.code} — ${v.en} defined`);
        closeDrawer(); toast('Product defined'); route();
      }, 'Create product'),
      p => openDrawer(`Edit ${p.code}`, form(p), () => {
        store.update('products', p.id, read(), 'Product', `${p.code} updated`);
        closeDrawer(); toast('Saved'); route();
      }, 'Save changes'),
      async p => {
        if (await askConfirm(`Delete ${p.code}?`, `${p.en} is withdrawn. Sold tickets remain valid.`)) {
          store.remove('products', p.id, 'Product', `${p.code} deleted`);
          toast('Product deleted'); route();
        }
      });
  },

  /* ---------------- fares (versions + maker-checker) ---------------- */
  fares() {
    const db = store.db;
    const view = PAGES._fareView;
    if (view) { renderFareDetail(view); return; }

    const who = v => `${userName(v.draftedBy)}${v.approvedBy ? ' / ' + userName(v.approvedBy) : ''}`;
    $('#content').innerHTML = listWrap(cardShell('Fare versions',
      'A published version can never be edited. To change a fare, publish a new version; to revert, publish a rollback that carries the earlier contents forward. Two people are required (BOS-FP-06).',
      `<div style="display:flex;gap:10px" class="w-only">
        ${newBtn('Draft a fare version', 'draftBtn')}
        <button class="btn btn-ghost" id="rollBtn">Reinstate an earlier version…</button>
      </div>`, `
      <div class="tscroll"><table class="grid">
        <thead><tr><th>Version</th><th>Title</th><th>Model</th><th>Status</th><th class="num">Rules</th><th>NCMC disc.</th><th>Effective from</th><th>Drafted / approved by</th><th>Content hash</th><th></th></tr></thead>
        <tbody>${db.fareVersions.slice().sort((a, b) => b.version - a.version).map(v => `<tr>
          <td><span class="pillcode">v${v.version}</span></td>
          <td><b style="font-weight:600">${v.title}</b></td>
          <td>${v.model}</td>
          <td>${verChip(v.status)}</td>
          <td class="num">${v.rules.length}</td>
          <td class="num">${v.discountPct}%</td>
          <td>${fmtDT(v.effectiveFrom)}</td>
          <td style="color:var(--b-ink-soft)">${who(v)}</td>
          <td class="mono">${v.hash ? v.hash.slice(0, 10) : '—'}</td>
          <td><div class="rowact" style="opacity:1">
            <button class="iconbtn" data-view="${v.id}" aria-label="View">${I.eye}</button>
            ${v.status === 'draft' && session.canWrite() ? `
              <button class="iconbtn" data-editrules="${v.id}" aria-label="Edit rules">${I.edit}</button>
              <button class="btn btn-primary" data-submit="${v.id}" style="height:34px;padding:0 16px;font-size:12px">Submit</button>` : ''}
          </div></td></tr>`).join('')}
        </tbody></table></div>`));

    $('#content').addEventListener('click', e => {
      const v = e.target.closest('[data-view]');
      const er = e.target.closest('[data-editrules]');
      const sb = e.target.closest('[data-submit]');
      if (v) { PAGES._fareView = { id: v.dataset.view, edit: false }; PAGES.fares(); }
      if (er && guard()) { PAGES._fareView = { id: er.dataset.editrules, edit: true }; PAGES.fares(); }
      if (sb && guard()) submitVersion(sb.dataset.submit);
    });

    const draftBtn = $('#draftBtn');
    if (draftBtn) draftBtn.addEventListener('click', () => {
      if (!guard()) return;
      const pubs = db.fareVersions.filter(v => v.status === 'published' || v.status === 'superseded');
      openDrawer('Draft a fare version',
        inputF('f_title', 'Title *', '', 'text', '', 'Shown to the approver and in the version history.') +
        selectF('f_model', 'Fare model *', [
          { v: 'Station pair', t: 'Station pair — a price per journey (rule 2)' },
          { v: 'Flat', t: 'Flat — one price regardless of journey' },
          { v: 'Zone', t: 'Zone' }, { v: 'Distance band', t: 'Distance band' },
        ], 'Station pair') +
        inputF('f_disc', 'NCMC discount (%) *', 20, 'number', 'min="0" max="100"') +
        selectF('f_copy', 'Copy rules from', [{ v: '', t: 'Start empty' },
          ...pubs.map(v => ({ v: v.id, t: `Version ${v.version} — ${v.title}` }))], pubs[0]?.id || '') +
        inputF('f_notes', 'Notes', '', 'text'),
        () => {
          const src = db.fareVersions.find(x => x.id === $('#f_copy').value);
          const ver = Math.max(...db.fareVersions.map(v => v.version)) + 1;
          db.fareVersions.unshift({
            id: store.nextId('fv'), version: ver, title: $('#f_title').value.trim() || `Revision ${ver}`,
            model: $('#f_model').value, status: 'draft',
            discountPct: +$('#f_disc').value,
            rules: src ? src.rules.map(r => ({ ...r })) : [],
            tax: src ? src.tax.map(t => ({ ...t })) : [{ component: 'CGST', rate: 9, scope: 'on fare' }, { component: 'SGST', rate: 9, scope: 'on fare' }],
            draftedBy: session.user.username, submittedBy: null, approvedBy: null, publishedBy: null,
            createdAt: Date.now(), effectiveFrom: null, effectiveTo: null, hash: null,
            notes: $('#f_notes').value.trim() || null,
          });
          store.logAudit('create', 'Fare version', `v${ver} drafted — "${$('#f_title').value.trim()}"`);
          store.save(); closeDrawer(); toast(`Draft v${ver} created — edit the rules, then submit`); route();
        }, 'Create draft');
    });
    const rollBtn = $('#rollBtn');
    if (rollBtn) rollBtn.addEventListener('click', () => {
      if (!guard()) return;
      const pubs = db.fareVersions.filter(v => ['published', 'superseded'].includes(v.status));
      openDrawer('Reinstate an earlier version',
        selectF('f_target', 'Reinstate the contents of *', pubs.map(v => ({ v: v.id, t: `Version ${v.version} — ${v.title}` })), pubs[0]?.id) +
        inputF('f_eff', 'Takes effect on *', new Date(Date.now() + 86400000).toISOString().slice(0, 10), 'date') +
        inputF('f_reason', 'Reason *', '', 'text', '', 'Shown to the approver — a rollback without a reason is not reviewable.'),
        () => {
          const src = db.fareVersions.find(x => x.id === $('#f_target').value);
          const reason = $('#f_reason').value.trim();
          if (!src || !reason) return toast('Target and reason are required');
          const ver = Math.max(...db.fareVersions.map(v => v.version)) + 1;
          const nv = {
            id: store.nextId('fv'), version: ver, title: `Rollback to v${src.version} — ${src.title}`,
            model: src.model, status: 'pending', discountPct: src.discountPct,
            rules: src.rules.map(r => ({ ...r })), tax: src.tax.map(t => ({ ...t })),
            draftedBy: session.user.username, submittedBy: session.user.username,
            approvedBy: null, publishedBy: null, createdAt: Date.now(),
            effectiveFrom: null, effectiveTo: null, hash: null, notes: reason, rollbackOf: src.version,
          };
          db.fareVersions.unshift(nv);
          store.raiseApproval('fare_version.publish',
            `Publish fare version ${ver} (rollback to v${src.version}) with ${nv.rules.length} rules, effective ${$('#f_eff').value}`,
            { fareVersionId: nv.id, effectiveFrom: new Date($('#f_eff').value).getTime() }, reason);
          closeDrawer(); toast('Rollback submitted for approval'); route();
        }, 'Submit rollback for approval');
    });

    function submitVersion(id) {
      const v = db.fareVersions.find(x => x.id === id);
      openDrawer(`Submit v${v.version} for approval`,
        `<div class="fhelp" style="margin-bottom:14px">"${v.title}" — ${v.rules.length} rules, NCMC discount ${v.discountPct}%. A second person holding System Administrator or Finance Officer must approve before it takes effect (BOS-SC-04).</div>` +
        inputF('f_eff', 'Effective from *', new Date(Date.now() + 86400000).toISOString().slice(0, 10), 'date') +
        inputF('f_reason', 'Reason *', '', 'text'),
        () => {
          const reason = $('#f_reason').value.trim();
          if (!reason) return toast('A reason is required');
          v.status = 'pending'; v.submittedBy = session.user.username;
          store.raiseApproval('fare_version.publish',
            `Publish fare version ${v.version} ("${v.title}") with ${v.rules.length} rules, effective ${$('#f_eff').value}`,
            { fareVersionId: v.id, effectiveFrom: new Date($('#f_eff').value).getTime() }, reason);
          closeDrawer(); toast(`Submitted — a second person must approve (see Approvals)`); route();
        }, 'Submit for approval');
    }
  },

  /* ---------------- labels ---------------- */
  labels() {
    $('#content').innerHTML = listWrap(cardShell('Label master',
      'Station names, product names and receipt text in Hindi and English, distributed to the counter and the kiosk alongside the fare table. Saving an existing namespace and key replaces its value (BOS-MD-04, rule 16).',
      newBtn('Add or amend a label'), `
      <div class="tscroll"><table class="grid">
        <thead><tr><th>Namespace</th><th>Key</th><th>English</th><th>Hindi</th><th>Receipt</th><th></th></tr></thead>
        <tbody>${store.db.labels.map(l => `<tr>
          <td><span class="pillcode">${l.ns}</span></td>
          <td class="mono">${l.key}</td>
          <td>${l.en}</td>
          <td>${l.hi}</td>
          <td>${l.receipt ? '<span class="chip ok">Prints</span>' : '<span style="color:var(--b-ink-faint)">—</span>'}</td>
          <td>${rowActs(l.id)}</td></tr>`).join('')}
        </tbody></table></div>`));

    const form = (l = {}) =>
      selectF('f_ns', 'Namespace *', ['station', 'product', 'receipt', 'screen'].map(v => ({ v, t: v })), l.ns || 'receipt') +
      inputF('f_key', 'Key *', l.key || '', 'text', 'style="font-family:var(--font-mono)"') +
      inputF('f_en', 'English *', l.en || '') +
      inputF('f_hi', 'Hindi *', l.hi || '', 'text', '', 'Transliteration is not translation — have the Hindi reviewed.') +
      checkF('f_rc', 'Renders on the thermal printer', !!l.receipt);
    const read = () => ({
      ns: $('#f_ns').value, key: $('#f_key').value.trim(),
      en: $('#f_en').value.trim(), hi: $('#f_hi').value.trim(), receipt: $('#f_rc').checked,
    });

    wireCrud('labels',
      () => openDrawer('Add or amend a label', form(), () => {
        const v = read(); if (!v.key || !v.en || !v.hi) return toast('Key and both languages are required');
        const existing = store.db.labels.find(x => x.ns === v.ns && x.key === v.key);
        if (existing) {
          store.update('labels', existing.id, v, 'Label', `${v.ns}.${v.key} amended`);
        } else {
          store.insert('labels', v, 'Label', `${v.ns}.${v.key} added`);
        }
        closeDrawer(); toast('Label saved — distributed with the next master-data sync'); route();
      }, 'Save label'),
      l => openDrawer(`Amend ${l.ns}.${l.key}`, form(l), () => {
        store.update('labels', l.id, read(), 'Label', `${l.ns}.${l.key} amended`);
        closeDrawer(); toast('Label saved'); route();
      }, 'Save label'),
      async l => {
        if (await askConfirm(`Delete ${l.ns}.${l.key}?`, 'Devices keep their cached copy until the next sync.')) {
          store.remove('labels', l.id, 'Label', `${l.ns}.${l.key} deleted`);
          toast('Label deleted'); route();
        }
      });
  },

  /* ---------------- approvals ---------------- */
  approvals() {
    const db = store.db;
    const me = session.user.username;
    const pending = db.approvals.filter(a => a.status === 'pending');
    const history = db.approvals.filter(a => a.status !== 'pending');

    const pendingCards = pending.map(a => {
      const isMaker = a.maker === me;
      const canDecide = session.canApprove() && !isMaker;
      return `<div class="card apr-card" data-apr="${a.id}">
        <header>
          <h2 style="font-size:15px;max-width:60ch">${a.summary}</h2>
          <div class="hspace"></div>
          <span class="chip ${a.risk === 'critical' ? 'bad' : 'warn'}">${a.risk}</span>
        </header>
        <div class="pad" style="padding-top:6px">
          <div class="apr-meta">
            <div><dt>Reference</dt><dd class="mono">${a.ref}</dd></div>
            <div><dt>Raised</dt><dd>${a.operation} · ${fmtDT(a.madeAt)} by ${userName(a.maker)}</dd></div>
            <div><dt>Expires</dt><dd>${fmtDT(a.expiresAt)}</dd></div>
          </div>
          <p style="margin:10px 0 6px;font-size:13px"><b>Stated reason:</b> ${a.reason}</p>
          <pre class="apr-payload">${JSON.stringify(a.payload, null, 1)}</pre>
          ${isMaker ? `
            <div class="ro-note" style="display:flex;margin:12px 0">You raised this request. Segregation of duties requires a different person to decide it (BOS-SC-04).</div>
            <div style="display:flex;justify-content:flex-end"><button class="btn btn-danger" data-withdraw="${a.id}">Withdraw this request</button></div>`
          : canDecide ? `
            <div class="field" style="margin:12px 0"><label>Reason (required to reject — an unexplained refusal is not reviewable)</label>
              <input id="why_${a.id}" placeholder="Why is this being refused?"></div>
            <div style="display:flex;gap:10px;justify-content:flex-end">
              <button class="btn btn-danger" data-reject="${a.id}">Reject</button>
              <button class="btn btn-primary" data-approve="${a.id}">Approve and apply</button>
            </div>`
          : `<div class="ro-note" style="display:flex;margin-top:12px">Awaiting a decision by a System Administrator or Finance Officer who did not raise it.</div>`}
        </div>
      </div>`;
    }).join('');

    $('#content').innerHTML = `<div class="listwrap"><div class="card">
      <header><h2>Approval queue</h2><div class="hspace"></div>
        <span class="chip ${pending.length ? 'warn' : 'ok'}">${pending.length || 'No'} pending</span>
        <div class="sub">Privileged changes are proposals until a second person decides on them. You cannot decide a request you raised (BOS-SC-04).</div></header>
      ${pending.length ? '' : '<div class="empty">No pending requests.</div>'}
      </div></div>
      ${pendingCards}
      ${history.length ? listWrap(cardShell('Decided requests', '', '', `
        <div class="tscroll"><table class="grid">
          <thead><tr><th>Reference</th><th>Operation</th><th>Summary</th><th>Raised by</th><th>Decided</th><th>Status</th></tr></thead>
          <tbody>${history.map(a => `<tr>
            <td class="mono">${a.ref}</td>
            <td class="mono" style="font-size:12px">${a.operation}</td>
            <td>${a.summary.slice(0, 70)}${a.summary.length > 70 ? '…' : ''}</td>
            <td>${userName(a.maker)}</td>
            <td style="white-space:nowrap">${a.decidedBy ? userName(a.decidedBy) + ' · ' : ''}${fmtDT(a.decidedAt)}</td>
            <td>${aprChip(a.status)}</td></tr>`).join('')}
          </tbody></table></div>`)) : ''}`;

    $('#content').addEventListener('click', async e => {
      const ap = e.target.closest('[data-approve]');
      const rj = e.target.closest('[data-reject]');
      const wd = e.target.closest('[data-withdraw]');
      if (ap) {
        const r = store.decideApproval(ap.dataset.approve, true);
        if (r.err) return toast(r.err);
        toast(`${r.req.ref} approved and applied`); route();
      }
      if (rj) {
        const id = rj.dataset.reject;
        const why = ($('#why_' + id) || {}).value?.trim();
        const r = store.decideApproval(id, false, why);
        if (r.err) return toast(r.err);
        const v = store.db.fareVersions.find(x => x.id === r.req.payload.fareVersionId);
        if (v && v.status === 'pending') { v.status = 'draft'; store.save(); }
        toast(`${r.req.ref} rejected — returned to the maker`); route();
      }
      if (wd) {
        if (!(await askConfirm('Withdraw this request?', 'It is removed from the queue and recorded as withdrawn.', 'Withdraw'))) return;
        const req = store.db.approvals.find(a => a.id === wd.dataset.withdraw);
        const r = store.withdrawApproval(wd.dataset.withdraw, 'Withdrawn by maker');
        if (r.err) return toast(r.err);
        const v = store.db.fareVersions.find(x => x.id === req.payload.fareVersionId);
        if (v && v.status === 'pending') { v.status = 'draft'; store.save(); }
        toast('Request withdrawn'); route();
      }
    });
  },

  /* ---------------- users ---------------- */
  users() {
    $('#content').innerHTML = listWrap(cardShell('Staff and roles',
      'Authorisation records only — passwords, MFA enrolment and lockout state live in the identity provider. Role grants are dual-authorised (BOS-UM-01/02).',
      newBtn('Create a staff account'), `
      <div class="tscroll"><table class="grid">
        <thead><tr><th>Username</th><th>Name</th><th>Employee code</th><th>Roles</th><th>Status</th><th>Last sign-in</th><th></th></tr></thead>
        <tbody>${store.db.users.map((u, i) => `<tr>
          <td class="mono">${u.username}</td>
          <td><div class="cellmain"><span class="av round av-${i % 4}">${u.name.split(' ').map(x => x[0]).slice(0, 2).join('')}</span><span class="cm-t"><b>${u.name}</b><span>${u.designation || ''}</span></span></div></td>
          <td class="mono">${u.empCode || '—'}</td>
          <td><span class="chip dim">${ROLES[u.role]?.label || u.role}</span>${u.station !== '—' ? ` <span class="pillcode">${u.station}</span>` : ''}</td>
          <td>${statusChip(u.status)}</td>
          <td style="white-space:nowrap;color:var(--b-ink-faint)">${fmtDT(u.lastSignIn)}</td>
          <td>${rowActs(u.id)}</td></tr>`).join('')}
        </tbody></table></div>`));

    const ROLE_OPTS = Object.entries(ROLES).map(([v, r]) => ({ v, t: r.label }));
    const acctForm = (u = {}, isNew = true) =>
      inputF('f_un', 'Username' + (isNew ? ' *' : ''), u.username || '', 'text',
        isNew ? 'placeholder="name.dev" style="text-transform:lowercase"' : 'disabled',
        isNew ? 'Lower case. Must match the username held by the identity provider.' : 'The username is bound to this person’s identity and cannot be changed.') +
      inputF('f_emp', 'Employee code', u.empCode || '', 'text', 'placeholder="VR-OPR-0xx"') +
      inputF('f_nm', 'Full name *', u.name || '') +
      inputF('f_dg', 'Designation', u.designation || '') +
      inputF('f_em', 'Email', u.email || '', 'email') +
      inputF('f_mo', 'Mobile', u.mobile || '') +
      selectF('f_stn', 'Home station', stationOpts({ v: '—', t: 'None — works across the line' }), u.station || '—',
        'Drives console defaults and reporting. It does not itself grant access; that comes from the role.') +
      (isNew ? '' : selectF('f_status', 'Status', [
        { v: 'invited', t: 'Invited — has not signed in yet' }, { v: 'active', t: 'Active' },
        { v: 'suspended', t: 'Suspended' }, { v: 'deactivated', t: 'Deactivated' },
      ], u.status, 'Suspending takes effect at once — permissions are checked on every request.'));

    wireCrud('users',
      () => openDrawer('Create a staff account',
        `<div class="fhelp" style="margin-bottom:14px">The account is created without roles. Granting one is a separate step that a second person must approve (BOS-UM-02).</div>` + acctForm(),
        () => {
          const un = $('#f_un').value.trim().toLowerCase();
          if (!un || !$('#f_nm').value.trim()) return toast('Username and name are required');
          if (store.db.users.some(x => x.username === un)) return toast('That username already exists');
          store.insert('users', {
            username: un, name: $('#f_nm').value.trim(), empCode: $('#f_emp').value.trim() || null,
            designation: $('#f_dg').value.trim() || null, email: $('#f_em').value.trim() || null,
            mobile: $('#f_mo').value.trim() || null, station: $('#f_stn').value,
            role: 'TOM_OPERATOR', status: 'invited', lastSignIn: null,
          }, 'User', `${un} created (invited, no roles yet)`);
          closeDrawer(); toast('Account created — grant a role from its edit page'); route();
        }, 'Create account'),
      u => {
        const isSelf = u.username === session.user.username;
        openDrawer(u.name,
          `<h3 class="dsec">Account</h3>` + acctForm(u, false) +
          `<h3 class="dsec">Roles held</h3>
           <div class="roleheld">
             <span class="chip dim">${ROLES[u.role]?.label || u.role}</span>
             ${u.station !== '—' ? `<span class="pillcode">${u.station}</span>` : ''}
           </div>
           <h3 class="dsec">Grant a role</h3>
           <div class="fhelp" style="margin-bottom:10px">Dual-authorised — the grant is a proposal until a second person approves it.</div>` +
          selectF('g_role', 'Role *', [{ v: '', t: 'Select a role' }, ...ROLE_OPTS], '') +
          selectF('g_stn', 'Station', stationOpts({ v: '', t: 'Not applicable — system-wide' }), '') +
          inputF('g_reason', 'Reason *', '', 'text'),
          () => {
            store.update('users', u.id, {
              empCode: $('#f_emp').value.trim() || null, name: $('#f_nm').value.trim(),
              designation: $('#f_dg').value.trim() || null, email: $('#f_em').value.trim() || null,
              mobile: $('#f_mo').value.trim() || null, station: $('#f_stn').value,
              status: $('#f_status').value,
            }, 'User', `${u.username} account updated`);
            const gr = $('#g_role').value, reason = $('#g_reason').value.trim();
            if (gr && reason) {
              store.raiseApproval('user_role.grant',
                `Grant ${ROLES[gr].label} to ${u.username}${$('#g_stn').value ? ' at ' + $('#g_stn').value : ''}`,
                { userId: u.id, role: gr, station: $('#g_stn').value || null }, reason, 'high');
              toast('Saved — role grant submitted for approval');
            } else if (gr && !reason) { return toast('A reason is required to grant a role'); }
            else toast('Saved');
            closeDrawer(); route();
          }, 'Save changes');
      },
      async u => {
        if (u.username === session.user.username) return toast('You cannot delete your own account');
        if (await askConfirm(`Deactivate ${u.username}?`, `${u.name} loses access at every terminal immediately. Their audit history is retained.`, 'Deactivate')) {
          store.remove('users', u.id, 'User', `${u.username} deactivated and removed`);
          toast('Account removed'); route();
        }
      });
  },

  /* ---------------- hotlist ---------------- */
  hotlist() {
    $('#content').innerHTML = listWrap(cardShell('NCMC hotlist',
      'Supplied by the Bank in the real system; distributed to every gate, counter and kiosk. A listed card is refused at every touchpoint.',
      newBtn('Block a card'), `
      <div class="tscroll"><table class="grid">
        <thead><tr><th>Card</th><th>Reason</th><th>Raised by</th><th>Since</th><th></th></tr></thead>
        <tbody>${store.db.hotlist.map(h => `<tr>
          <td class="mono">${h.card}</td>
          <td>${h.reason}</td>
          <td>${h.by}</td>
          <td>${fmtDT(h.ts)}</td>
          <td><div class="rowact w-only"><button class="btn btn-danger" style="height:34px;padding:0 14px;font-size:12px" data-del="${h.id}">Remove</button></div></td></tr>`).join('')
        || `<tr><td colspan="5"><div class="empty">No cards are blocked.</div></td></tr>`}
        </tbody></table></div>`));

    const cont = $('#content');
    const nb = $('#newBtn', cont);
    if (nb) nb.addEventListener('click', () => {
      if (!guard()) return;
      openDrawer('Block a card',
        inputF('f_card', 'Card reference', '6080 ', 'text', 'placeholder="6080 12•• •••• 3456"') +
        selectF('f_reason', 'Reason', ['Reported lost', 'Reported stolen', 'Bank instruction', 'Dispute investigation'].map(r => ({ v: r, t: r })), 'Reported lost'),
        () => {
          const card = $('#f_card').value.trim();
          if (card.replace(/\D/g, '').length < 8) return toast('Enter a fuller card reference');
          store.insert('hotlist', { card, reason: $('#f_reason').value, by: session.user.username, ts: Date.now() },
            'Hotlist', `${card} — ${$('#f_reason').value}`);
          closeDrawer(); toast('Card blocked — distribution queued'); route();
        }, 'Block card');
    });
    cont.addEventListener('click', async e => {
      const del = e.target.closest('[data-del]');
      if (!del || !guard()) return;
      const h = store.db.hotlist.find(x => x.id === del.dataset.del);
      if (await askConfirm('Remove from hotlist?', `${h.card} will be accepted again after the next distribution cycle.`, 'Remove')) {
        store.remove('hotlist', h.id, 'Hotlist', `${h.card} removed (whitelisted)`);
        toast('Card removed from hotlist'); route();
      }
    });
  },

  /* ---------------- transactions ---------------- */
  transactions() {
    const f = PAGES._txFilter || { range: '7d', station: '', mode: '' };
    const t0 = new Date(); t0.setHours(0, 0, 0, 0);
    const from = f.range === 'today' ? t0.getTime() : f.range === '7d' ? t0.getTime() - 6 * 864e5 : 0;
    const list = store.db.transactions.filter(t =>
      t.ts >= from && (!f.station || t.station === f.station) && (!f.mode || t.mode === f.mode));
    const total = list.reduce((a, t) => a + t.amount, 0);

    $('#content').innerHTML = listWrap(cardShell('Transaction ledger',
      `${list.length} transactions · ${fmtINR(total)} — read-only; the ledger is append-only and corrections happen through reversal entries, never edits.`,
      `<div class="fbar">
        <div class="seg" id="segR">
          ${[['today', 'Today'], ['7d', '7 days'], ['all', 'All']].map(([v, t]) => `<button data-r="${v}" class="${f.range === v ? 'on' : ''}">${t}</button>`).join('')}
        </div>
        <select id="fSt"><option value="">All stations</option>${STN.map(s => `<option ${f.station === s.code ? 'selected' : ''}>${s.code}</option>`).join('')}</select>
        <select id="fMd"><option value="">All modes</option>${['UPI', 'Cash', 'Card'].map(m => `<option ${f.mode === m ? 'selected' : ''}>${m}</option>`).join('')}</select>
      </div>`, `
      <div class="tscroll"><table class="grid">
        <thead><tr><th>Time</th><th>Ref</th><th>Station</th><th>Device</th><th>Product</th><th>Journey</th><th class="num">Qty</th><th>Mode</th><th class="num">Amount</th></tr></thead>
        <tbody>${list.slice(0, 60).map(txRow).join('') || `<tr><td colspan="9"><div class="empty">Nothing in this range.</div></td></tr>`}</tbody>
      </table></div>
      ${list.length > 60 ? `<div class="pad" style="color:var(--b-ink-faint);font-size:13px">Showing the latest 60 of ${list.length}.</div>` : ''}`));

    $$('#segR button').forEach(b => b.addEventListener('click', () => { PAGES._txFilter = { ...f, range: b.dataset.r }; PAGES.transactions(); }));
    $('#fSt').addEventListener('change', e => { PAGES._txFilter = { ...f, station: e.target.value }; PAGES.transactions(); });
    $('#fMd').addEventListener('change', e => { PAGES._txFilter = { ...f, mode: e.target.value }; PAGES.transactions(); });
  },

  /* ---------------- audit ---------------- */
  audit() {
    const act = a => ({
      create: '<span class="chip ok">Create</span>', update: '<span class="chip info">Update</span>',
      delete: '<span class="chip bad">Delete</span>', publish: '<span class="chip warn">Publish</span>',
    }[a] || `<span class="chip dim">${a}</span>`);
    $('#content').innerHTML = listWrap(`
      <div class="ro-note" style="display:flex;background:var(--ok-bg);color:var(--ok);margin-bottom:16px">
        ${I.audit.replace('viewBox', 'width="18" height="18" viewBox')}
        Chain verified — no record has been altered or removed. ${store.db.audit.length} entries checked.
      </div>` +
      cardShell('Recent entries',
      'Append-only and hash-chained (BOS-SC-01). Retained for eight financial years under the Companies Act 2013, s.128 and the Companies (Accounts) Rules 2014, Rule 3(1).',
      '', `
      <div class="tscroll"><table class="grid">
        <thead><tr><th class="num">Seq</th><th>When</th><th>Who</th><th>Action</th><th>Entity</th><th>Change</th><th>Chain</th></tr></thead>
        <tbody>${store.db.audit.map(a => `<tr>
          <td class="num mono">${a.seq ?? '—'}</td>
          <td style="white-space:nowrap;color:var(--b-ink-faint)">${fmtDT(a.ts)}</td>
          <td class="mono">${a.user}</td>
          <td>${act(a.action)}</td>
          <td>${a.entity}</td>
          <td>${a.detail}</td>
          <td><span class="chip ok" title="Linked to the previous entry">✓ linked</span></td></tr>`).join('')}
        </tbody></table></div>`));
  },

  /* ---------------- settings ---------------- */
  settings() {
    $('#content').innerHTML = listWrap(cardShell('Configuration registry',
      'The open operational values from System Flow §33 — held as configuration so they change without a code release.',
      '', `
      <div class="tscroll"><table class="grid">
        <thead><tr><th>Setting</th><th class="num">Value</th><th>Basis</th><th></th></tr></thead>
        <tbody>${store.db.config.map(c => `<tr>
          <td><b style="font-weight:600">${c.label}</b><br><span class="mono" style="font-size:11px;color:var(--b-ink-faint)">${c.key}</span></td>
          <td class="num" style="font-size:15px;font-weight:700;font-variant-numeric:tabular-nums">${c.unit === '₹' ? '₹' + c.value : c.value + (c.unit && c.unit !== '₹' ? ' ' + c.unit : '')}</td>
          <td style="color:var(--b-ink-soft);font-size:12.5px">${c.note}</td>
          <td><div class="rowact w-only"><button class="iconbtn" data-editk="${c.key}" aria-label="Edit">${I.edit}</button></div></td></tr>`).join('')}
        </tbody></table></div>`));

    $('#content').addEventListener('click', e => {
      const b = e.target.closest('[data-editk]');
      if (!b || !guard()) return;
      const c = store.db.config.find(x => x.key === b.dataset.editk);
      openDrawer(c.label, inputF('f_val', `Value${c.unit ? ' (' + c.unit + ')' : ''}`, c.value, 'number', 'min="0" step="any"') +
        `<p style="font-size:12.5px;color:var(--b-ink-faint)">${c.note}</p>`, () => {
        const n = Number($('#f_val').value);
        if (!Number.isFinite(n) || n < 0) return toast('Enter a valid value');
        const old = c.value; c.value = n;
        store.logAudit('update', 'Configuration', `${c.key}: ${old} → ${n}`);
        store.save(); closeDrawer(); toast('Configuration updated'); route();
      });
    });
  },
};

/* ---------------- fare version detail / rules editor ---------------- */
function renderFareDetail(view) {
  const v = store.db.fareVersions.find(x => x.id === view.id);
  if (!v) { PAGES._fareView = null; PAGES.fares(); return; }
  const editable = view.edit && v.status === 'draft' && session.canWrite();
  const prodName = c => (store.db.products.find(p => p.code === c) || { en: c }).en;

  $('#content').innerHTML = `<div class="listwrap">
    <div class="card">
      <header>
        <button class="btn btn-quiet" id="fdBack" style="height:38px">← All versions</button>
        <h2 style="font-size:17px">Version ${v.version} — ${v.title}</h2>
        <div class="hspace"></div>
        ${verChip(v.status)}
        ${editable ? `<button class="btn btn-primary" id="fdSave" style="height:38px">Save rule changes</button>` : ''}
        <div class="sub">${v.notes || ''} ${v.status === 'published' && v.approvedBy ? '· Dual authorisation satisfied — drafted and approved by different people (BOS-FP-06).' : ''}</div>
      </header>
      <div class="fd-panels">
        <div class="fdp"><h4>Lifecycle</h4>
          <div class="kvrow"><span>Drafted</span><b>${userName(v.draftedBy)} · ${fmtDT(v.createdAt)}</b></div>
          <div class="kvrow"><span>Submitted</span><b>${v.submittedBy ? userName(v.submittedBy) : '—'}</b></div>
          <div class="kvrow"><span>Approved</span><b>${v.approvedBy ? userName(v.approvedBy) : '—'}</b></div>
        </div>
        <div class="fdp"><h4>Effect</h4>
          <div class="kvrow"><span>Model</span><b>${v.model}</b></div>
          <div class="kvrow"><span>Effective from</span><b>${fmtDT(v.effectiveFrom)}</b></div>
          <div class="kvrow"><span>NCMC discount</span><b>${v.discountPct}% at exit (rule 11)</b></div>
        </div>
        <div class="fdp"><h4>Integrity</h4>
          <div class="kvrow"><span>Content hash</span><b class="mono">${v.hash || '— set on publish'}</b></div>
          <div class="kvrow"><span>Rules</span><b>${v.rules.length}</b></div>
          <div class="kvrow"><span>Immutability</span><b>${v.status === 'published' ? 'Locked — publish a new version to change' : 'Draft — editable'}</b></div>
        </div>
      </div>
    </div>

    ${cardShell(`Fare rules (${v.rules.length})`,
      'Rule 2: fares are charged by station pair. Rule 5: a ticket permits exit at any station up to and including the destination. Adult fare only in phase 1 (rule 3).',
      '', `
      <div class="tscroll"><table class="grid fare-grid">
        <thead><tr><th>Product</th><th>Passenger</th><th>Journey</th><th>Exit permitted at</th><th class="num">Fare (₹)</th></tr></thead>
        <tbody>${v.rules.map((r, i) => `<tr>
          <td><span class="pillcode">${r.product === 'SINGLE_JOURNEY' ? 'SJT' : 'RJT'}</span> ${prodName(r.product)}</td>
          <td>${r.passenger}</td>
          <td>${stationName(r.origin)} → ${stationName(r.dest)}</td>
          <td style="color:var(--b-ink-soft)">${r.exits.join(', ')}</td>
          <td class="num">${editable ? `<input data-ri="${i}" value="${r.fare}" inputmode="numeric">` : `<b>${fmtINR(r.fare)}</b>`}</td>
        </tr>`).join('')}
        </tbody></table></div>`)}

    ${cardShell('Tax configuration',
      'The version carries the statutory split for invoices; passenger-facing prices remain tax-inclusive per rule 13.', '', `
      <div class="tscroll"><table class="grid">
        <thead><tr><th>Component</th><th class="num">Rate</th><th>Scope</th></tr></thead>
        <tbody>${v.tax.map(t => `<tr>
          <td><b style="font-weight:600">${t.component}</b></td>
          <td class="num">${t.rate}%</td>
          <td>${t.scope}</td></tr>`).join('')}
        </tbody></table></div>`)}
  </div>`;

  $('#fdBack').addEventListener('click', () => { PAGES._fareView = null; PAGES.fares(); });
  const save = $('#fdSave');
  if (save) save.addEventListener('click', () => {
    let bad = false, changed = 0;
    $$('.fare-grid input[data-ri]').forEach(inp => {
      const n = Number(inp.value);
      if (!Number.isFinite(n) || n <= 0) { bad = true; return; }
      const r = v.rules[+inp.dataset.ri];
      if (r.fare !== n) { r.fare = n; changed++; }
    });
    if (bad) return toast('Fares must be positive numbers');
    store.logAudit('update', 'Fare version', `v${v.version} draft — ${changed} rule value(s) changed`);
    store.save(); toast(changed ? `${changed} rule(s) updated in the draft` : 'No changes'); 
  });
}

/* transaction row */
function txRow(t) {
  const modeChip = { UPI: 'info', Cash: 'warn', Card: 'dim' }[t.mode];
  let journey = '—';
  if (t.pair && t.pair.includes('-')) {
    const [a, b] = t.pair.split('-');
    journey = `${t.station} → ${a === t.station ? b : a}`;
  }
  return `<tr>
    <td style="white-space:nowrap;color:var(--b-ink-faint)">${fmtDT(t.ts)}</td>
    <td class="mono">${t.id.toUpperCase()}</td>
    <td>${t.station}</td>
    <td class="mono" style="font-size:12px">${t.device}</td>
    <td><span class="pillcode">${t.product}</span></td>
    <td>${journey}</td>
    <td class="num">${t.qty}</td>
    <td><span class="chip ${modeChip}">${t.mode}</span></td>
    <td class="num" style="font-weight:700">${fmtINR(t.amount)}</td></tr>`;
}

document.addEventListener('DOMContentLoaded', boot);
