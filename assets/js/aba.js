/* Asociación del Bridge Argentino — comportamiento de la interfaz.
   Sin dependencias. Todo lo que anima respeta prefers-reduced-motion. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Tema claro / oscuro ------------------------------------------- */
  var root = document.documentElement;

  function storedTheme() {
    try { return localStorage.getItem('aba-theme'); } catch (e) { return null; }
  }

  function systemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  var saved = storedTheme();
  if (saved === 'dark' || saved === 'light') root.setAttribute('data-theme', saved);

  function syncToggles() {
    var mode = root.getAttribute('data-theme') || systemTheme();
    var labels = { dark: 'Cambiar a modo claro', light: 'Cambiar a modo oscuro' };
    Array.prototype.forEach.call(document.querySelectorAll('.theme-toggle'), function (btn) {
      btn.setAttribute('data-mode', mode);
      btn.setAttribute('aria-label', labels[mode]);
      btn.setAttribute('title', labels[mode]);
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('.theme-toggle'), function (btn) {
    btn.addEventListener('click', function () {
      var next = (root.getAttribute('data-theme') || systemTheme()) === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('aba-theme', next); } catch (e) { /* modo privado */ }
      syncToggles();
    });
  });
  syncToggles();

  /* --- Menú lateral en pantallas chicas ------------------------------- */
  var drawer = document.getElementById('drawer');
  var openBtn = document.querySelector('.icon-btn--menu');
  var lastFocus = null;

  function focusables() {
    if (!drawer) return [];
    return Array.prototype.filter.call(
      drawer.querySelectorAll('a[href], button:not([disabled])'),
      function (el) { return el.offsetParent !== null; }
    );
  }

  function openDrawer() {
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.setAttribute('data-open', 'true');
    if (openBtn) openBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    var f = focusables();
    if (f.length) f[0].focus();
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.setAttribute('data-open', 'false');
    if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  if (openBtn) openBtn.addEventListener('click', openDrawer);

  if (drawer) {
    Array.prototype.forEach.call(drawer.querySelectorAll('[data-close]'), function (el) {
      el.addEventListener('click', closeDrawer);
    });
    // Al elegir un destino el panel se cierra: la navegación no debe quedar tapada.
    Array.prototype.forEach.call(drawer.querySelectorAll('.drawer__nav a'), function (a) {
      a.addEventListener('click', closeDrawer);
    });
    // Escape siempre ofrece una salida, y el foco no se escapa del panel abierto.
    document.addEventListener('keydown', function (e) {
      if (drawer.getAttribute('data-open') !== 'true') return;
      if (e.key === 'Escape') { closeDrawer(); return; }
      if (e.key !== 'Tab') return;
      var f = focusables();
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* --- Aparición progresiva de bloques --------------------------------
     Cubre tanto el marcado con class="reveal" como los componentes
     repetidos habituales (tarjetas, descargas, hitos, noticias,
     afiliaciones), para que el efecto sea consistente en todo el sitio
     sin tener que anotar cada instancia a mano. */
  var revealSelector = '.reveal, .card-grid > .card, .downloads > li, .timeline > li, .news-item, a.affil__item';
  var revealTargets = Array.prototype.slice.call(document.querySelectorAll(revealSelector));

  if (!reduced && revealTargets.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        // Escalonado suave entre hermanos que también revelan: 50 ms, tope 300 ms.
        var siblings = entry.target.parentNode
          ? Array.prototype.filter.call(entry.target.parentNode.children,
              function (n) { return n.matches && n.matches(revealSelector); })
          : [];
        var i = siblings.indexOf(entry.target);
        entry.target.style.transitionDelay = Math.min(i < 0 ? 0 : i * 50, 300) + 'ms';
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* --- Índice lateral: marca la sección en pantalla -------------------- */
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.toc__list a[href^="#"]'));
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var targets = tocLinks
      .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
      .filter(Boolean);

    var visible = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
      var current = null;
      targets.forEach(function (t) { if (!current && visible[t.id]) current = t.id; });
      if (!current) return;
      tocLinks.forEach(function (a) {
        a.classList.toggle('is-active', a.getAttribute('href') === '#' + current);
      });
    }, { rootMargin: '-132px 0px -62% 0px', threshold: 0 });

    targets.forEach(function (t) { spy.observe(t); });
  }

  /* --- Año actual en el pie ------------------------------------------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-year]'), function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
