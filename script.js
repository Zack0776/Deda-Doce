/* ===== DEDA DOCES ===== */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WA = '5511989060602';

  /* fotos do MODAL diferentes das usadas no card/hero, para dar sensação de vários ângulos */
  var IMGS = {
    'Bolo de Café': 'assets/images/galeria-fatia.jpg',
    'Bolo de Cenoura': 'assets/images/galeria-milho.jpg',
    'Bolo de Milho': 'assets/images/cena-cinema.jpg',
    'Encomendas especiais': 'assets/images/galeria-embalagem.jpg'
  };
  var fineHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- INTRO ---------- */
  var intro = $('#intro');
  function endIntro() {
    if (!intro || intro.dataset.done) return;
    intro.dataset.done = '1';
    intro.classList.add('out');
    document.body.classList.remove('lock');
    setTimeout(function () { if (intro.parentNode) intro.parentNode.removeChild(intro); }, 1000);
  }
  if (intro) {
    document.body.classList.add('lock');
    setTimeout(endIntro, reduced ? 400 : 2700);
    intro.addEventListener('click', endIntro);
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape' || e.key === 'Enter') endIntro(); }, { once: true });
  }

  /* ---------- NAV ---------- */
  var nav = $('#nav'), burger = $('#navBurger');
  function onScroll() { nav.classList.toggle('stick', window.scrollY > 40); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  });
  $$('#navLinks a').forEach(function (a) {
    a.addEventListener('click', function () {
      nav.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------- REVEAL ---------- */
  var reveals = $$('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('on'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('on'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- CONTADOR ---------- */
  var num = $('#impactNum');
  if (num) {
    var target = parseInt(num.dataset.to, 10) || 25;
    var run = function () {
      if (reduced) { num.textContent = target; return; }
      var t0 = null;
      var step = function (t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / 1400, 1);
        num.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window) {
      var io2 = new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { run(); io2.disconnect(); }
      }, { threshold: 0.5 });
      io2.observe(num);
    } else { run(); }
  }

  /* ---------- MODAL ---------- */
  var modal = $('#modal'), pick = $('#pick'), order = $('#order');
  var orderImg = $('#orderImg'), orderTitle = $('#modalTitle'), form = $('#orderForm');
  var orderMedia = $('#orderMedia'), orderTilt = $('#orderTilt'), orderShadow = $('#orderShadow'), orderGlow = $('#orderGlow');
  var fNome = $('#fNome'), fData = $('#fData'), fHora = $('#fHora'), fQtd = $('#fQtd'), fObs = $('#fObs');
  var err = $('#formErr');
  var lastFocus = null, current = '';

  /* ---- experiência 3D (só no Bolo de Chocolate) ---- */
  function onTiltMove(e) {
    var r = orderMedia.getBoundingClientRect();
    var px = (e.clientX - r.left) / r.width - 0.5;
    var py = (e.clientY - r.top) / r.height - 0.5;
    orderTilt.style.transform = 'rotateY(' + (px * 14) + 'deg) rotateX(' + (py * -14) + 'deg)';
  }
  function onTiltLeave() {
    orderMedia.classList.remove('tracking');
    orderTilt.style.transform = '';
  }
  function setup3D(isChoc) {
    orderMedia.classList.toggle('is-3d', isChoc);
    orderShadow.hidden = !isChoc;
    orderGlow.hidden = !isChoc;
    orderTilt.style.transform = '';
    orderTilt.classList.remove('auto');
    orderMedia.removeEventListener('mousemove', onTiltMove);
    orderMedia.removeEventListener('mouseenter', onEnter);
    orderMedia.removeEventListener('mouseleave', onTiltLeave);
    if (!isChoc || reduced) return;
    if (fineHover) {
      orderMedia.addEventListener('mouseenter', onEnter);
      orderMedia.addEventListener('mousemove', onTiltMove);
      orderMedia.addEventListener('mouseleave', onTiltLeave);
    } else {
      orderTilt.classList.add('auto');
    }
  }
  function onEnter() { orderMedia.classList.add('tracking'); }

  // horários
  (function () {
    var out = '';
    for (var h = 8; h <= 20; h++) {
      out += '<option value="' + pad(h) + ':00">' + pad(h) + ':00</option>';
      if (h < 20) out += '<option value="' + pad(h) + ':30">' + pad(h) + ':30</option>';
    }
    fHora.insertAdjacentHTML('beforeend', out);
  })();
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // data mínima = hoje
  (function () {
    var d = new Date();
    var iso = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    fData.min = iso;
  })();

  function openModal(product) {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('lock');
    if (product && IMGS[product]) { showOrder(product); }
    else { pick.hidden = false; order.hidden = true; setTimeout(function () { $('.pick__opt', pick).focus(); }, 60); }
  }
  function showOrder(product) {
    current = product;
    pick.hidden = true;
    order.hidden = false;
    orderTitle.textContent = product;
    orderImg.src = IMGS[product];
    orderImg.alt = product;
    orderImg.style.animation = 'none'; void orderImg.offsetWidth; orderImg.style.animation = '';
    setup3D(product === 'Bolo de Chocolate');
    hideErr();
    setTimeout(function () { fNome.focus(); }, 60);
  }
  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove('lock');
    onTiltLeave();
    if (lastFocus) lastFocus.focus();
  }
  function hideErr() { err.hidden = true; err.textContent = ''; $$('.bad', form).forEach(function (el) { el.classList.remove('bad'); }); }
  function showErr(msg, field) {
    err.textContent = msg;
    err.hidden = false;
    if (field) { field.classList.add('bad'); field.focus(); }
  }

  $$('[data-order-open]').forEach(function (btn) {
    btn.addEventListener('click', function () { openModal(btn.dataset.product || ''); });
  });
  $$('[data-pick]', pick).forEach(function (b) {
    b.addEventListener('click', function () { showOrder(b.dataset.pick); });
  });
  $$('[data-close]', modal).forEach(function (b) { b.addEventListener('click', closeModal); });

  // quantidade
  function setQty(v) { fQtd.value = Math.min(99, Math.max(1, v || 1)); }
  $('#qMinus').addEventListener('click', function () { setQty(parseInt(fQtd.value, 10) - 1); });
  $('#qPlus').addEventListener('click', function () { setQty(parseInt(fQtd.value, 10) + 1); });
  fQtd.addEventListener('change', function () { setQty(parseInt(fQtd.value, 10)); });

  // envio
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    hideErr();
    var nome = fNome.value.trim();
    var qtd = parseInt(fQtd.value, 10);
    if (nome.length < 2) return showErr('Escreva seu nome para a Deda saber quem está pedindo.', fNome);
    if (!fData.value) return showErr('Escolha a data da encomenda.', fData);
    if (fData.min && fData.value < fData.min) return showErr('Escolha uma data de hoje em diante.', fData);
    if (!fHora.value) return showErr('Escolha o horário da retirada ou entrega.', fHora);
    if (!qtd || qtd < 1) return showErr('A quantidade precisa ser pelo menos 1.', fQtd);

    var p = fData.value.split('-');
    var dataBR = p[2] + '/' + p[1] + '/' + p[0];
    var obs = fObs.value.trim();

    var msg = 'Olá! Vim pelo site da Deda Doces e gostaria de fazer uma encomenda. 🍰\n\n' +
      'Produto: ' + current + '\n' +
      'Quantidade: ' + qtd + '\n\n' +
      'Nome: ' + nome + '\n' +
      'Data desejada: ' + dataBR + '\n' +
      'Horário desejado: ' + fHora.value + '\n';
    if (obs) msg += '\nObservações:\n' + obs + '\n';
    msg += '\nGostaria de saber se está disponível.';

    window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    closeModal();
  });

  /* ---------- LIGHTBOX ---------- */
  var lb = $('#lb'), lbImg = $('#lbImg'), lbFocus = null;
  $$('.mosaic__i').forEach(function (fig) {
    var img = $('img', fig);
    fig.setAttribute('tabindex', '0');
    fig.setAttribute('role', 'button');
    fig.setAttribute('aria-label', 'Ampliar: ' + img.alt);
    var open = function () {
      lbFocus = document.activeElement;
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt;
      lb.hidden = false;
      document.body.classList.add('lock');
      $('.lb__x', lb).focus();
    };
    fig.addEventListener('click', open);
    fig.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });
  function closeLb() {
    lb.hidden = true;
    lbImg.src = '';
    document.body.classList.remove('lock');
    if (lbFocus) lbFocus.focus();
  }
  $('.lb__x', lb).addEventListener('click', closeLb);
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });

  /* ---------- ESC GLOBAL ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!lb.hidden) closeLb();
    else if (!modal.hidden) closeModal();
    else if (nav.classList.contains('open')) { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
  });

  /* ---------- FOCO PRESO NO MODAL ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || modal.hidden) return;
    var f = $$('button, [href], input, select, textarea', modal).filter(function (el) {
      return el.offsetParent !== null && !el.disabled;
    });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---------- CENA CINEMATOGRÁFICA ---------- */
  var cena = $('#cena');
  if (cena && !reduced) {
    var cenaImg = $('.cena__media img', cena);
    var cenaVeil = $('.cena__veil', cena);
    var cenaText = $('.cena__text', cena);
    var cenaTicking = false;
    var cenaActive = false;

    function cenaFrame() {
      cenaTicking = false;
      var r = cena.getBoundingClientRect();
      var vh = window.innerHeight;
      var total = r.height - vh;
      var p = total > 0 ? Math.min(Math.max((-r.top) / total, 0), 1) : 0;
      // zoom sutil na imagem conforme avança
      var scale = 1.12 + p * 0.1;
      cenaImg.style.transform = 'scale(' + scale + ')';
      // escurece progressivamente
      cenaVeil.style.background = 'rgba(9,5,5,' + (0.3 + p * 0.4) + ')';
      // texto entra no meio do trecho e sai perto do fim
      var textP = Math.min(Math.max((p - 0.18) / 0.5, 0), 1);
      var fadeOut = p > 0.82 ? (p - 0.82) / 0.18 : 0;
      var op = textP * (1 - fadeOut);
      cenaText.style.opacity = op;
      cenaText.style.transform = 'translateY(' + (28 * (1 - textP)) + 'px)';
    }
    function onCenaScroll() {
      if (cenaTicking) return;
      cenaTicking = true;
      requestAnimationFrame(cenaFrame);
    }
    if ('IntersectionObserver' in window) {
      var cenaIO = new IntersectionObserver(function (entries) {
        var on = entries[0].isIntersecting;
        if (on && !cenaActive) {
          cenaActive = true;
          window.addEventListener('scroll', onCenaScroll, { passive: true });
          cenaFrame();
        } else if (!on && cenaActive) {
          cenaActive = false;
          window.removeEventListener('scroll', onCenaScroll);
        }
      }, { threshold: 0 });
      cenaIO.observe(cena);
    } else {
      window.addEventListener('scroll', onCenaScroll, { passive: true });
    }
  }

  /* ---------- PARALLAX HERO ---------- */
  var heroImg = $('#heroImg');
  if (heroImg && !reduced) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y < window.innerHeight * 1.2) heroImg.style.translate = '0 ' + (y * 0.18) + 'px';
        ticking = false;
      });
    }, { passive: true });
  }

  $('#year').textContent = new Date().getFullYear();
})();
