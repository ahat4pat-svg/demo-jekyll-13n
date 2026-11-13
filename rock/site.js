/* Le Jekyll's, site rock : les gestes de la page.
   - le héros : projecteur, poussière, la chaise éclate, ses pièces sortent de l'écran, fondu vers le nom (une fois, de lui-même) ;
   - les entrées des sections, une fois ;
   - les flèches des services, le nom énorme du pied ajusté à la largeur, la musique (si une piste existe), la galerie.
   Jamais de défilement automatique de la page. */
(function () {
  var doc = document.documentElement;
  var moins = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. les entrées, une fois ---------- */
  var cibles = [].slice.call(document.querySelectorAll('[data-vu]'));
  function voir(el) { el.classList.add('vu'); }
  if (!doc.classList.contains('js-anime') || !('IntersectionObserver' in window)) cibles.forEach(voir);
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { voir(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    cibles.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 2. les flèches des services (la piste défile, pas la page) ---------- */
  var piste = document.querySelector('.piste');
  [].forEach.call(document.querySelectorAll('[data-piste]'), function (b) {
    b.addEventListener('click', function () {
      if (!piste) return;
      var carte = piste.querySelector('.carte-s');
      var pas = carte ? carte.getBoundingClientRect().width + 16 : 300;
      piste.scrollBy({ left: pas * Number(b.getAttribute('data-piste')), behavior: moins ? 'auto' : 'smooth' });
    });
  });

  /* ---------- 3. le nom énorme du pied : il prend toute la largeur, sans déborder ---------- */
  var nomPied = document.querySelector('.pied__nom span');
  function ajuste() {
    if (!nomPied) return;
    var boite = nomPied.parentNode.clientWidth;
    nomPied.style.fontSize = '100px';
    var w = nomPied.getBoundingClientRect().width;
    if (w) nomPied.style.fontSize = Math.floor(100 * boite / w * 0.985) + 'px';
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajuste); else ajuste();
  var largeur = innerWidth;
  addEventListener('resize', function () { if (innerWidth !== largeur) { largeur = innerWidth; ajuste(); } });

  /* ---------- 4. la musique : le bouton n'existe que s'il y a une piste (balise <audio id="musique">) ---------- */
  var audio = document.getElementById('musique'), boiteM = document.querySelector('.musique');
  if (audio && boiteM) {
    boiteM.hidden = false;
    var bVersions = boiteM.querySelectorAll('button');
    [].forEach.call(bVersions, function (b) {
      b.addEventListener('click', function () {
        var deja = audio.getAttribute('src') === b.getAttribute('data-src');
        [].forEach.call(bVersions, function (x) { x.setAttribute('aria-pressed', 'false'); });
        if (deja && !audio.paused) { audio.pause(); return; }
        if (!deja) audio.setAttribute('src', b.getAttribute('data-src'));
        var p = audio.play(); if (p && p.catch) p.catch(function () {});
        b.setAttribute('aria-pressed', 'true');
      });
    });
  }

  /* ---------- 5. la galerie : une photo en grand ---------- */
  var d = document.querySelector('dialog.grande');
  if (d && d.showModal) {
    var gi = d.querySelector('img'), gp = d.querySelector('p');
    [].forEach.call(document.querySelectorAll('.mosaique button'), function (b) {
      b.addEventListener('click', function () { var i = b.querySelector('img'); gi.src = i.src; gi.alt = i.alt; gp.textContent = b.getAttribute('data-t'); d.showModal(); });
    });
    d.querySelector('.fermer').addEventListener('click', function () { d.close(); });
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
  }

  /* ---------- 5 bis. la galerie : les pastilles filtrent (vrais boutons, donc au clavier aussi) ---------- */
  var mosaique = document.querySelector('.mosaique'), etat = document.getElementById('filtre-etat');
  var filtres = [].slice.call(document.querySelectorAll('.pastilles [data-filtre]'));
  if (mosaique && filtres.length) {
    filtres.forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.getAttribute('data-filtre'), n = 0;
        filtres.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        [].forEach.call(mosaique.children, function (el) {
          var cats = (el.getAttribute('data-cat') || '').split(' ');
          var garde = f === 'tout' || cats.indexOf(f) > -1;
          el.hidden = !garde; if (garde && el.tagName === 'BUTTON') n++;
        });
        mosaique.classList.toggle('filtree', f !== 'tout');
        if (etat) etat.textContent = n + ' photos : ' + b.textContent;
      });
    });
  }

  /* ---------- 6. le héros ---------- */
  var heros = document.querySelector('.heros');
  if (!heros) return;
  var boite = heros.querySelector('.chaise__boite'), entiere = heros.querySelector('.chaise__entiere');
  var canvas = heros.querySelector('.poussiere');

  // Sans GSAP, ou en « moins de mouvement » : la scène finale, chaise entière, rien ne bouge.
  if (!doc.classList.contains('js-anime') || !window.gsap) { doc.classList.remove('js-anime'); return; }

  // Les 14 pièces : left, top, width, height (% de l'image 1376 × 768) ; dx, dy (direction d'écart, reprise de throne-chaise) ; r ; délai
  // les 6 grosses pièces viennent vers nous (échelle finale 2,4 à 3,6) ; les autres finissent à 1,4
  var GROSSES = ['dossier', 'coussin', 'jupe', 'cadre', 'repose-pieds', 'appui-tete'];
  var PIECES = [
    ['piston',      46.802,56.510, 6.759,14.323,  11, 10,  0, .10],
    ['dossier',     42.224,17.969,21.657,38.151,   9, -8,  6, .00],
    ['tige',        56.977, 6.901, 4.142,12.500, 4.5,-13,  0, .05],
    ['appui-tete',  54.142, 6.250, 7.631,12.891,   6,-20, -8, .02],
    ['mecanisme',   43.023,52.734,13.299, 7.943,   5,  7,  0, .12],
    ['jupe',        36.991,49.349,24.346,18.750,   2,  4,  0, .14],
    ['cadre',       33.140,54.297,19.331,25.781, -10,  7, -3, .16],
    ['supports-d',  56.831,31.380, 6.831,23.698,  17, -1,  5, .06],
    ['accoudoir-d', 51.599,33.073,11.555, 7.161,  15,-10,  6, .04],
    ['coussin',     36.628,44.141,23.692,14.974,  -4, -5, -2, .08],
    ['supports-c',  46.730,35.938, 8.939,23.958,   4, -3,  0, .07],
    ['supports-g',  34.884,36.068, 5.015,20.312, -15, -2, -5, .06],
    ['accoudoir-g', 35.901,31.771,12.863, 7.422, -13, -9, -6, .04],
    ['repose-pieds',25.145,68.880,21.802,17.578, -13, 10, -4, .18]
  ];
  var VIS = [[58.285,14.453,0,-21],[59.157,14.453,0,-21],[36.410,37.109,-75,-24],[47.674,37.109,-75,-24],
    [52.616,38.802,75,-29],[61.483,37.630,75,-29],[40.407,55.078,-8,-26],[49.855,55.339,-8,-26],[57.122,53.516,-8,-26],
    [34.738,57.943,-70,14],[49.855,57.682,-70,14],[34.884,82.422,-70,14],[37.500,77.474,-75,25],[40.116,83.724,-75,25],
    [50.945,50.911,35,-6],[61.628,48.568,35,-6],[49.855,60.547,18,20],[51.672,60.547,18,20]];

  var aCharger = [], els = [];
  function image(nom, classe, css) {
    var im = new Image(); im.className = classe; im.alt = ''; im.decoding = 'async';
    aCharger.push(new Promise(function (ok, non) { im.onload = ok; im.onerror = non; }));
    im.src = 'img/chaise/' + nom + '.webp';
    if (css) im.style.cssText = css;
    return im;
  }
  var socle = image('fond', 'socle');
  els.push({ el: socle, dx: 0, dy: 1, r: 0, d: .02, socle: true });
  PIECES.forEach(function (p) {
    els.push({ el: image(p[0], 'piece', 'left:' + p[1] + '%;top:' + p[2] + '%;width:' + p[3] + '%;height:' + p[4] + '%'), dx: p[5], dy: p[6], r: p[7], d: p[8], gros: GROSSES.indexOf(p[0]) > -1 });
  });
  VIS.forEach(function (v) {
    els.push({ el: image('vis', 'vis', 'left:' + v[0] + '%;top:' + v[1] + '%;width:1.1%;height:3.4%'), dx: v[2], dy: v[3], r: 0, d: .03, vis: true });
  });

  /* La poussière dans le faisceau, et les étincelles de l'éclatement : un seul canvas. */
  var ctx = canvas.getContext && canvas.getContext('2d');
  var lum = { v: 0 }, grains = [], etincelles = [], W = 0, H = 0, dpr = 1, raf = 0, visible = true, avant = 0;
  var tel = innerWidth < 700;
  function geo() {
    var f = heros.querySelector('.faisceau').getBoundingClientRect(), h = heros.getBoundingClientRect();
    return { cx: f.left - h.left + f.width / 2, haut: f.top - h.top, bas: f.bottom - h.top, demi: f.width / 2 };
  }
  var G = null;
  function taille() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = heros.clientWidth; H = heros.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    G = geo();
  }
  function grain(neuf) {
    var y = G.haut + Math.random() * (G.bas - G.haut);
    var demi = G.demi * (0.12 + 0.88 * (y - G.haut) / (G.bas - G.haut));
    return { x: G.cx + (Math.random() * 2 - 1) * demi * 0.9, y: y, vx: (Math.random() - .5) * 6, vy: -2 - Math.random() * 8,
      t: Math.random() * 6.28, s: (tel ? .8 : .6) + Math.random() * (tel ? 1.8 : 1.6), a: .25 + Math.random() * .6, neuf: neuf };
  }
  function dessine(t) {
    raf = 0;
    var dt = avant ? Math.min(.05, (t - avant) / 1000) : .016; avant = t;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (lum.v > 0.01) {
      for (var i = 0; i < grains.length; i++) {
        var g = grains[i];
        g.t += dt * 1.3; g.x += (g.vx + Math.sin(g.t) * 5) * dt; g.y += g.vy * dt;
        var demi = G.demi * (0.12 + 0.88 * Math.max(0, (g.y - G.haut) / (G.bas - G.haut)));
        if (g.y < G.haut + 10 || Math.abs(g.x - G.cx) > demi) grains[i] = grain(false);
        var a = g.a * lum.v * (0.6 + 0.4 * Math.sin(g.t * 2.1));
        ctx.fillStyle = 'rgba(255,236,200,' + a.toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(g.x, g.y, g.s, 0, 6.283); ctx.fill();
      }
    }
    for (var j = etincelles.length - 1; j >= 0; j--) {
      var e = etincelles[j];
      e.vie -= dt; if (e.vie <= 0) { etincelles.splice(j, 1); continue; }
      e.vy += 520 * dt; e.vx *= (1 - 1.2 * dt); e.x += e.vx * dt; e.y += e.vy * dt;
      ctx.globalAlpha = Math.min(1, e.vie / e.max * 1.6);
      ctx.strokeStyle = e.c; ctx.lineWidth = e.s;
      ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x - e.vx * .03, e.y - e.vy * .03); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (visible) raf = requestAnimationFrame(dessine);
  }
  function lance() { if (!raf && visible && ctx) raf = requestAnimationFrame(dessine); }
  function etincelle(x, y) {
    var couleurs = ['#ffe9b8', '#ecc77a', '#d9a441', '#ffffff', '#e2353b'];
    for (var i = 0; i < (tel ? 70 : 110); i++) {
      var a = Math.random() * 6.283, v = 300 + Math.random() * (tel ? 700 : 900);
      etincelles.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 200, vie: .5 + Math.random() * .8, max: 1.3, s: 1 + Math.random() * 2, c: couleurs[i % couleurs.length] });
    }
  }
  if (ctx) {
    taille();
    for (var k = 0; k < (tel ? 70 : 110); k++) grains.push(grain(true));
    addEventListener('resize', function () { taille(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[es.length - 1].isIntersecting; if (visible) lance(); }, { threshold: 0 }).observe(heros);
    }
    lance();
  }

  /* L'éclatement : chaque pièce part dans sa direction, assez loin pour sortir de l'écran (calculé sur sa vraie place). */
  function trajectoires() {
    var h = heros.getBoundingClientRect(), b = boite.getBoundingClientRect();
    var cx = b.left + b.width * .4475, cy = b.top + b.height * .5;
    return els.map(function (o) {
      var r = o.el.getBoundingClientRect();
      var px = r.left + r.width / 2, py = r.top + r.height / 2;
      var ux = (px - cx) / b.width + o.dx / 60, uy = (py - cy) / b.height + o.dy / 60;
      if (o.vis) { ux = o.dx / 75 + (Math.random() - .5) * .6; uy = o.dy / 25 + (Math.random() - .5) * .6; }
      if (o.socle) { ux = (Math.random() - .5) * .2; uy = 1; }
      var n = Math.hypot(ux, uy) || 1; ux /= n; uy /= n;
      var sc = o.gros ? 2.4 + Math.random() * 1.2 : 1.4;
      // la marge tient compte de l'échelle finale : la pièce grossie doit sortir en entier
      var marge = Math.hypot(r.width, r.height) / 2 * sc + 40;
      // distance pour que la pièce entière soit hors de la scène (donc hors de l'écran)
      var tx = ux > 0 ? (h.right - (px - marge)) / ux : ux < 0 ? ((px + marge) - h.left) / -ux : Infinity;
      var ty = uy > 0 ? (h.bottom - (py - marge)) / uy : uy < 0 ? ((py + marge) - h.top) / -uy : Infinity;
      var t = Math.min(tx, ty) * 1.1;
      var sens = (o.r || (Math.random() - .5)) >= 0 ? 1 : -1;
      return { x: ux * t, y: uy * t, rot: o.socle ? 25 * sens : sens * (140 + Math.random() * 260), sc: sc };
    });
  }

  var faisceaux = heros.querySelectorAll('.faisceau'), lampe = heros.querySelector('.lampe'), flaque = heros.querySelector('.flaque');
  var eclair = heros.querySelector('.eclair'), texte = heros.querySelectorAll('.heros__texte > *'), ia = heros.querySelector('.ia');
  var scene = heros.querySelector('.scene');
  var vide = false, fini = false;
  // la lumière quitte la place de la chaise et descend sur le nom (faisceau allongé, flaque sous le nom)
  function scenevide() {
    if (vide) return; vide = true; doc.classList.add('heros-vide');
    setTimeout(function () { if (ctx) G = geo(); }, 1000); // la poussière suit le nouveau faisceau
  }
  function finale() { scenevide(); if (fini) return; fini = true; doc.classList.add('heros-fin'); }
  function secours() { // une pièce manque : on allume la scène et on montre le nom, la chaise reste entière
    gsap.to([lampe, flaque].concat([].slice.call(faisceaux)), { opacity: 1, duration: .8 });
    gsap.to(entiere, { filter: 'brightness(1)', duration: 1 });
    gsap.to(texte, { opacity: 1, duration: .8, stagger: .1 });
    gsap.to(ia, { opacity: .75, duration: .6 });
    gsap.to(lum, { v: 1, duration: 1 });
  }

  // On attend les pièces (et les polices, au plus 1,2 s, pour que le nom arrive dans sa vraie lettre).
  var polices = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(function (ok) { setTimeout(ok, 1200); })]) : Promise.resolve();
  var depart = Promise.all(aCharger.concat([polices]));
  var delai = new Promise(function (ok, non) { setTimeout(non, 4000); });
  Promise.race([depart, delai]).then(function () {
    els.forEach(function (o) { boite.appendChild(o.el); });
    var TREMBLE = 2.05;                 // la chaise reste allumée 0,5 s de plus avant de trembler
    var E = TREMBLE + .035 * 12 + .03;  // l'éclatement, juste après le tremblement (2,5 s)
    var DETENTE = .35, DERIVE = .45, SORTIE = .7;
    var tl = gsap.timeline({ delay: .25, onComplete: finale });
    // le projecteur s'allume, avec un petit grésillement
    tl.to(lampe, { opacity: 1, duration: .12 }, 0)
      .to(faisceaux, { opacity: .55, duration: .06 }, .05)
      .to(faisceaux, { opacity: .1, duration: .08 }, .14)
      .to(faisceaux, { opacity: 1, duration: .35, ease: 'power2.out' }, .26)
      .to(flaque, { opacity: 1, duration: .6 }, .26)
      .to(lum, { v: 1, duration: .9 }, .26)
      .to(entiere, { filter: 'brightness(1)', duration: .9, ease: 'power2.out' }, .26)
      .to(ia, { opacity: .75, duration: .4 }, .7)
    // la chaise attend sous le projecteur : elle éclate seulement quand la personne bouge (défile, touche, clique, clavier)
      .addPause(TREMBLE - .05)
    // la tension : l'image de la chaise tremble. Jamais la boîte : un transform sur .chaise__boite
    // crée un contexte d'empilement, isole le mix-blend-mode et coupe le faisceau.
      .to(entiere, { x: 9, rotation: .5, duration: .035, yoyo: true, repeat: 11, ease: 'none' }, TREMBLE)
      .set(entiere, { clearProps: 'transform' }, E - .02)
    // l'éclatement
      .add(function () {
        boite.classList.add('eclatee');
        var b = boite.getBoundingClientRect(), h = heros.getBoundingClientRect();
        etincelle(b.left - h.left + b.width * .4475, b.top - h.top + b.height * .5);
      }, E)
      .fromTo(eclair, { opacity: 0 }, { opacity: .85, duration: .08, ease: 'none' }, E)
      .to(eclair, { opacity: 0, duration: .5, ease: 'power2.out' }, E + .08)
    // la scène est secouée (±8 px, 0,25 s), puis rien ne reste sur elle
      .to(scene, { keyframes: [{ x: 8, y: -6 }, { x: -7, y: 8 }, { x: 6, y: -8 }, { x: -8, y: 5 }, { x: 3, y: -3 }, { x: 0, y: 0 }], duration: .25, ease: 'none' }, E)
      .set(scene, { clearProps: 'transform' }, E + .26);
    // les pièces : détente (0,35 s, jusqu'à 22 %), vue éclatée qui dérive (0,45 s), puis sortie vers nous (0,7 s)
    var tr = trajectoires();
    els.forEach(function (o, i) {
      var t = tr[i], d = E + o.d * .5;
      tl.to(o.el, { x: t.x * .22, y: t.y * .22, rotation: t.rot * .12, scale: 1 + (t.sc - 1) * .06, duration: DETENTE, ease: 'power4.out', force3D: true }, d)
        .to(o.el, { x: t.x * .29, y: t.y * .29, rotation: t.rot * .2, scale: 1 + (t.sc - 1) * .12, duration: DERIVE, ease: 'sine.inOut' }, d + DETENTE)
        .to(o.el, { x: t.x, y: t.y, rotation: t.rot, scale: t.sc, duration: SORTIE, ease: 'power2.in' }, d + DETENTE + DERIVE);
    });
    // le fondu vers l'écran suivant : pendant la sortie, la lumière descend sur le nom ; le nom et Réserver arrivent
    var S = E + DETENTE + DERIVE;
    tl.add(scenevide, S)
      .to(faisceaux, { opacity: .85, duration: .8 }, S + .2)
      .fromTo(texte, { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 1, stagger: .14, ease: 'power3.out' }, S + .1)
      .fromTo(heros.querySelector('.heros__nom'), { scale: 1.08 }, { scale: 1, duration: 1.3, ease: 'power3.out' }, S + .1);
    var parti = false;
    function eclate() {
      if (parti) return; parti = true;
      ['wheel', 'touchstart', 'pointerdown', 'keydown', 'scroll'].forEach(function (n) { window.removeEventListener(n, eclate, true); });
      tl.resume();
      setTimeout(finale, 8000);
    }
    ['wheel', 'touchstart', 'pointerdown', 'keydown', 'scroll'].forEach(function (n) { window.addEventListener(n, eclate, { capture: true, passive: true }); });
  }).catch(function () {
    secours();
  });
})();
