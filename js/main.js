(function () {
  var header = document.getElementById('site-header');
  var onScroll = function () {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var toggle = document.getElementById('nav-toggle');
  var mobileNav = document.getElementById('mobile-nav');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', function () {
      var isOpen = mobileNav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var revealTargets = document.querySelectorAll('.reveal-on-scroll');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealTargets.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealTargets.forEach(function (el) {
      el.classList.add('in-view');
    });
  }

  var form = document.getElementById('contact-form');
  var note = document.getElementById('form-note');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = new URLSearchParams(new FormData(form)).toString();
      note.textContent = 'Enviando…';
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: data,
      })
        .then(function (response) {
          if (response.ok) {
            note.textContent = 'Gracias. Tu mensaje fue enviado — te responderé en un plazo máximo de 48 horas hábiles.';
            form.reset();
          } else {
            note.textContent = 'No se pudo enviar el mensaje. Intenta de nuevo o escribe a contacto@lunalaw.mx.';
          }
        })
        .catch(function () {
          note.textContent = 'No se pudo enviar el mensaje. Intenta de nuevo o escribe a contacto@lunalaw.mx.';
        });
    });
  }
})();
