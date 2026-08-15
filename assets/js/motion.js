/* ============================================================
   Motion layer — GSAP, used sparingly. Everything here is
   decoration: every function no-ops if GSAP failed to load or
   the user prefers reduced motion, and the apps run identically
   without it.
   ============================================================ */

const Motion = (() => {
  const off = () =>
    typeof gsap === 'undefined' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const EASE = 'power3.out';

  /* page-level entry: content blocks rise in, rows settle, charts grow */
  function page(root = document.getElementById('content')) {
    if (off() || !root) return;
    document.body.classList.add('gsap');

    const blocks = Array.from(root.children).slice(0, 12);
    if (blocks.length) {
      gsap.fromTo(blocks,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: .45, ease: EASE, stagger: .05, clearProps: 'transform,opacity' });
    }
    const rows = Array.from(root.querySelectorAll('tbody tr')).slice(0, 18);
    if (rows.length) {
      gsap.fromTo(rows,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: .35, ease: EASE, stagger: .022, delay: .12, clearProps: 'transform,opacity' });
    }
    const bars = root.querySelectorAll('.chart .bar');
    if (bars.length) {
      gsap.fromTo(bars,
        { scaleY: 0, transformOrigin: 'bottom' },
        { scaleY: 1, duration: .6, ease: EASE, stagger: .05, delay: .15, clearProps: 'transform' });
    }
    const pills = root.querySelectorAll('.pillbars .pbar');
    if (pills.length) {
      gsap.fromTo(pills,
        { scaleY: 0, transformOrigin: 'bottom' },
        { scaleY: 1, duration: .55, ease: EASE, stagger: .08, delay: .2, clearProps: 'transform' });
    }
    root.querySelectorAll('.tile-b .tv b, .modegrid .m b').forEach(countUp);
  }

  /* ₹12,340 / 58 / 61 — animate digits, keep every non-numeric part */
  function countUp(el) {
    if (off()) return;
    const text = el.textContent;
    const m = text.match(/[\d,]+/);
    if (!m) return;
    const target = Number(m[0].replace(/,/g, ''));
    if (!Number.isFinite(target) || target === 0) return;
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: .8, ease: 'power2.out',
      onUpdate() {
        el.textContent = text.replace(m[0], Math.round(obj.v).toLocaleString('en-IN'));
      },
      onComplete() { el.textContent = text; },
    });
  }

  /* terminal views (login → float → workspace → issued) */
  function view(el) {
    if (off() || !el) return;
    const kids = Array.from(el.querySelectorAll(
      ':scope > * > .card, :scope > .shift-wrap > .card, :scope .tlogin-card, :scope > .wsbody > .card'
    ));
    const targets = kids.length ? kids : [el];
    gsap.fromTo(targets,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: .45, ease: EASE, stagger: .07, clearProps: 'transform,opacity' });
    const cards = el.querySelectorAll('.ticket-card, .case-tile, .pick, .tile');
    if (cards.length) {
      gsap.fromTo(Array.from(cards).slice(0, 16),
        { opacity: 0, y: 10, scale: .98 },
        { opacity: 1, y: 0, scale: 1, duration: .35, ease: EASE, stagger: .03, delay: .1, clearProps: 'transform,opacity' });
    }
  }

  /* tab pane crossfade */
  function pane(el) {
    if (off() || !el) return;
    gsap.fromTo(el, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .32, ease: EASE, clearProps: 'transform,opacity' });
  }

  /* drawer: buttery slide instead of the CSS transition */
  function drawerOpen(drawer, overlay) {
    if (off()) return;
    gsap.fromTo(drawer, { x: 80, opacity: 0 }, { x: 0, opacity: 1, duration: .45, ease: EASE, clearProps: 'opacity' });
    if (overlay) gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: .3, ease: 'power2.out' });
  }
  function drawerClose(drawer, done) {
    if (off() || !drawer) { done(); return; }
    gsap.to(drawer, {
      x: 90, opacity: 0, duration: .3, ease: 'power3.in',
      onComplete() { gsap.set(drawer, { clearProps: 'transform,opacity' }); done(); },
    });
  }

  /* modal / flash pop */
  function pop(el) {
    if (off() || !el) return;
    gsap.fromTo(el,
      { opacity: 0, y: 22, scale: .96 },
      { opacity: 1, y: 0, scale: 1, duration: .38, ease: 'back.out(1.4)', clearProps: 'transform,opacity' });
  }

  /* toast: small spring in */
  function toast(el) {
    if (off() || !el) return;
    gsap.fromTo(el, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: .4, ease: 'back.out(1.6)', clearProps: 'transform' });
  }

  return { page, view, pane, drawerOpen, drawerClose, pop, toast, countUp };
})();
