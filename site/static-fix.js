// Hamburger drawer: theme shows it via .point-menu.show
(function () {
  function menu() { return document.querySelector('.point-menu'); }

  document.addEventListener('click', function (e) {
    var closest = e.target.closest ? e.target.closest.bind(e.target) : function () { return null; };
    var m = menu();

    // hamburger opens/closes the drawer
    if (m && closest('.menu-button-mobile')) {
      e.preventDefault();
      m.classList.toggle('show');
      return;
    }

    // bootstrap-style dropdowns (sports submenus): toggle sibling .dropdown-menu
    var t = closest('.dropdown-toggle');
    if (t) {
      var dm = t.nextElementSibling;
      if (dm && dm.classList.contains('dropdown-menu')) {
        e.preventDefault();
        dm.classList.toggle('show');
        return;
      }
    }

    // hero carousel arrows scroll the snap strip
    var ctrl = closest('.carousel-control-prev') || closest('.carousel-control-next');
    if (ctrl) {
      e.preventDefault();
      var inner = ctrl.getAttribute('aria-controls')
        ? document.getElementById(ctrl.getAttribute('aria-controls'))
        : null;
      if (!inner) {
        var c = ctrl.closest('.carousel');
        inner = c && c.querySelector('.carousel-inner');
      }
      if (inner) {
        var dir = ctrl.classList.contains('carousel-control-prev') ? -1 : 1;
        inner.scrollBy({ left: dir * inner.clientWidth, behavior: 'smooth' });
      }
      return;
    }

    // lion chat bubble (left) -> WhatsApp
    if (closest('.woot-widget-bubble') || closest('.woot--bubble-holder')) {
      e.preventDefault();
      window.location.href = WHATSAPP_URL;
      return;
    }

    // game tiles / matches -> login modal
    var modal = document.getElementById('mgLoginModal');
    if (modal) {
      if (e.target === modal || closest('.mg-login-close')) {
        e.preventDefault();
        modal.classList.remove('open');
        document.body.classList.remove('mg-modal-open');
        return;
      }
      if (!closest('.mg-login-dialog')) {
        var gameSel = '.home-casiono-icons a, .home-casiono-icons img, .home-casiono-icons li, .point-casino-list a, .point-casino-list img, .our-casino a, .our-casino img, .casino-img, .game-title, .game-name, .game-icons, .game-icon, .match-odd, .sport-tabs a, .carousel-item, .dropdown-menu a, .mg-game-tile, .pg-tab, .pg-provider';
        if (closest(gameSel) && !closest('.dropdown-toggle')) {
          e.preventDefault();
          modal.classList.add('open');
          document.body.classList.add('mg-modal-open');
          return;
        }
      }
    }

    // click outside the open drawer closes it
    if (m && m.classList.contains('show') && !closest('.point-menu')) {
      m.classList.remove('show');
    }
  });

  // Register / Login / Demo / APK -> WhatsApp
  var WHATSAPP_URL = 'https://wa.link/ultra';
  document.querySelectorAll('.register-btn,.login-btn,.btn-demo').forEach(function (b) {
    b.removeAttribute('disabled');
    b.addEventListener('click', function (e) { e.preventDefault(); window.location.href = WHATSAPP_URL; });
  });
  // header login button has no dedicated class: match by label
  document.querySelectorAll('button').forEach(function (b) {
    if (/^\s*login\s*$/i.test(b.textContent)) {
      b.removeAttribute('disabled');
      b.addEventListener('click', function (e) { e.preventDefault(); window.location.href = WHATSAPP_URL; });
    }
  });
  document.querySelectorAll('a').forEach(function (a) {
    if (a.querySelector('.dwld-apk')) a.href = WHATSAPP_URL;
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var m = menu();
      if (m) m.classList.remove('show');
      var modal = document.getElementById('mgLoginModal');
      if (modal) {
        modal.classList.remove('open');
        document.body.classList.remove('mg-modal-open');
      }
    }
  });
})();
