/**
 * CauseLabs — homepage behaviour.
 *
 * Vanilla ES2020, no dependencies, no build step. Everything here is
 * progressive enhancement: with JS disabled the page is fully readable and
 * navigable, it just doesn't animate.
 */

(function () {
  'use strict';

  /* --- Mobile navigation ------------------------------------------------ */

  function initNav() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var nav = document.getElementById('site-nav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.classList.toggle('is-open', open);
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Close on Escape, returning focus to the control that opened it.
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    // Close when a destination is chosen.
    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });

    // Reset state if the viewport grows past the mobile breakpoint.
    var desktop = window.matchMedia('(min-width: 721px)');
    var onChange = function (event) { if (event.matches) setOpen(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onChange);
    else desktop.addListener(onChange);
  }

  /* --- Scroll reveal ---------------------------------------------------- */

  function initReveal() {
    var targets = document.querySelectorAll('[data-reveal]');
    if (!targets.length) return;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // No IntersectionObserver, or the user prefers less motion: show it all.
    if (reduced || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-revealed'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: '0px 0px -8% 0px',
      // threshold:0 fires as soon as any pixel of the target is visible.
      // A fractional threshold (e.g. 0.12) requires that fraction of the
      // element's *total* area to be on-screen at once — fine for small
      // blocks, but a tall block (a long article body, say) can be many
      // viewport-heights tall and never have 12% of itself visible in a
      // single frame, so it would silently never reveal. 0 works at any
      // element size.
      threshold: 0
    });

    targets.forEach(function (el) { observer.observe(el); });
  }

  /* --- Approach page: nav-dot tracking -----------------------------------
     One dot per [data-chapter] section. As each chapter's midline crosses
     the viewport center, its dot gets .is-active. Clicking a dot still uses
     the plain #anchor href (works with JS off); this just adds the
     highlight. */

  function initApproachScroll() {
    var dotsNav = document.querySelector('[data-approach-dots]');
    var chapters = document.querySelectorAll('[data-chapter]');
    if (!dotsNav || !chapters.length) return;

    var dots = dotsNav.querySelectorAll('[data-dot]');

    function setActive(id) {
      dots.forEach(function (dot) {
        dot.classList.toggle('is-active', dot.getAttribute('data-dot') === id);
      });
    }

    if (!('IntersectionObserver' in window)) {
      // No observer support: just mark the first chapter active and stop.
      if (chapters[0]) setActive(chapters[0].getAttribute('data-chapter-id'));
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          setActive(entry.target.getAttribute('data-chapter-id'));
        }
      });
    }, {
      // A thin horizontal band through the viewport center — whichever
      // chapter occupies that band "wins" the active dot.
      rootMargin: '-45% 0px -45% 0px',
      threshold: 0
    });

    chapters.forEach(function (chapter) { observer.observe(chapter); });
  }

  /* --- Ideas archive: category filter -------------------------------------
     Chips toggle a data-category match against each card; everything is
     visible with JS off (chips just do nothing, all cards show — a valid
     browsing experience, just unfiltered). Reads ?category= from the URL on
     load so links like idea-post.php's category tag can deep-link into a
     pre-filtered view. */

  function initIdeasFilter() {
    var bar = document.querySelector('[data-ideas-filter]');
    var grid = document.querySelector('[data-ideas-grid]');
    var empty = document.querySelector('[data-ideas-empty]');
    if (!bar || !grid) return;

    var chips = bar.querySelectorAll('[data-filter]');
    var cards = grid.querySelectorAll('.ideas-card');

    function applyFilter(category) {
      var anyVisible = false;
      cards.forEach(function (card) {
        var match = category === 'all' || card.getAttribute('data-category') === category;
        card.hidden = !match;
        if (match) anyVisible = true;
      });
      chips.forEach(function (chip) {
        chip.classList.toggle('is-active', chip.getAttribute('data-filter') === category);
      });
      if (empty) empty.hidden = anyVisible;
    }

    bar.addEventListener('click', function (event) {
      var chip = event.target.closest('[data-filter]');
      if (!chip) return;
      applyFilter(chip.getAttribute('data-filter'));
    });

    var params = new URLSearchParams(window.location.search);
    var initial = params.get('category');
    if (initial) {
      var known = Array.prototype.some.call(chips, function (chip) {
        return chip.getAttribute('data-filter') === initial;
      });
      if (known) applyFilter(initial);
    }
  }

  /* --- Contact form ------------------------------------------------------
     No backend is wired up yet (static export). This validates client-side
     with the browser's own constraint API and swaps in a confirmation
     message on submit, so the page demonstrates the intended flow. Point
     the form's `action` at a real endpoint and delete the preventDefault()
     below to go live. */

  function initContactForm() {
    var form = document.querySelector('[data-contact-form]');
    if (!form) return;

    var note = form.querySelector('[data-contact-note]');

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      form.hidden = true;
      if (note) {
        note.textContent = "Thanks for reaching out — we'll get back to you soon.";
      }
    });
  }

  /* --- Boot ------------------------------------------------------------- */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initNav();
      initReveal();
      initApproachScroll();
      initIdeasFilter();
      initContactForm();
    });
  } else {
    initNav();
    initReveal();
    initApproachScroll();
    initIdeasFilter();
    initContactForm();
  }
})();
