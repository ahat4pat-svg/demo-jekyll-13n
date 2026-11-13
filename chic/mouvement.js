/* Le Jekyll's Barbier : les gestes de la page. Le moteur scroll-craft fait les entrées, la profondeur et le pointeur ;
   ce fichier fait le héros, le plongeon dans le miroir, les lignes qui montent et les traits qui se tirent.
   La classe « js » est posée sur <html> par un script dans le <head>, avant le premier rendu. */
(function () {
  var doc = document.documentElement;
  var moins = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (window.ScrollCraft) ScrollCraft.mount(document.body);

  // La hauteur réelle de la barre du haut : pour que les ancres s'arrêtent juste dessous.
  var barre = document.querySelector('.tete');
  function mesure() { if (barre) doc.style.setProperty('--barre', barre.offsetHeight + 'px'); }
  mesure();

  // 1. Une seule fois, à l'entrée : les éléments marqués data-vu ou data-lignes reçoivent la classe « vu ».
  var cibles = [].slice.call(document.querySelectorAll('[data-vu], [data-lignes]'));
  function voir(el) { el.classList.add('vu'); }
  if (!('IntersectionObserver' in window) || moins) cibles.forEach(voir);
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { voir(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.2 });
    cibles.forEach(function (el) { if (!el.classList.contains('seuil')) io.observe(el); });
  }

  // 2. Le héros : la vidéo joue une fois. Quand elle a fini : le reflet de chrome, la lente avancée, puis Réserver.
  var film = document.querySelector('.heros__film');
  var vid = document.querySelector('.heros__video');
  var seuil = document.querySelector('.seuil');
  var fait = false;
  function fini() { if (fait) return; fait = true; if (film) film.classList.add('fini'); if (seuil) seuil.classList.add('vu'); }
  if (!vid || moins) fini();
  else {
    vid.addEventListener('ended', fini);
    vid.addEventListener('error', fini);
    var p = vid.play();
    if (p && p.catch) p.catch(fini);
    setTimeout(fini, 9000); // filet de sécurité
  }

  // 3. Les lignes qui montent : on découpe la phrase selon ses vraies lignes à l'écran.
  //    Le texte complet reste dans un span lisible par les lecteurs d'écran ; seules les lignes animées sont cachées pour eux.
  function lignes(el) {
    var texte = el.getAttribute('data-texte');
    if (!texte) { texte = el.textContent.trim(); el.setAttribute('data-texte', texte); }
    var mots = texte.split(/\s+/);
    el.innerHTML = mots.map(function (m) { return '<span class="mot">' + m + '</span>'; }).join(' ');
    var rangs = [], haut = null;
    [].forEach.call(el.querySelectorAll('.mot'), function (m) {
      if (m.offsetTop !== haut) { rangs.push([]); haut = m.offsetTop; }
      rangs[rangs.length - 1].push(m.textContent);
    });
    el.innerHTML = '<span class="cache">' + texte + '</span>' + rangs.map(function (r, i) {
      return '<span class="ligne" aria-hidden="true"><span style="transition-delay:' + (i * 0.12) + 's">' + r.join(' ') + '</span></span>';
    }).join('');
  }
  var aLignes = [].slice.call(document.querySelectorAll('[data-lignes]'));
  function decoupe() { aLignes.forEach(lignes); }
  if (aLignes.length && !moins) {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(decoupe); else decoupe();
  }

  // Au redimensionnement : la barre et les lignes sont remesurées, seulement si la largeur a changé.
  var largeur = innerWidth, minuterie = null;
  addEventListener('resize', function () {
    clearTimeout(minuterie);
    minuterie = setTimeout(function () {
      mesure();
      if (innerWidth !== largeur) { largeur = innerWidth; if (aLignes.length && !moins) decoupe(); }
    }, 150);
  });

  // 4. Le plongeon dans le miroir. L'image se contient elle-même : son miroir montre l'image entière, 2,37 fois plus petite,
  //    autour d'un point fixe. On grossit le tout à vitesse constante ; arrivé à 2,37, on est revenu au départ. Sans fin.
  var plongeon = document.querySelector('[data-plongeon]');
  if (plongeon && !moins) {
    // Ça va en accélérant, comme une chute : on part lentement (9 s par niveau) et on finit vite (2 s par niveau).
    // L'accélération prend 14 secondes, puis la vitesse tient. Quand on quitte la section et qu'on revient, on repart lentement.
    // Puis, d'un coup, ça arrête : la chaise apparaît seule dans la lumière, comme un roi sur son trône, et elle reste.
    var K = 2.37, LENT = 3500, VITE = 350, ACCEL = 4500, FIN = 4750; // 13 nov : deux fois plus court (Pat)
    var images = plongeon.querySelectorAll('.plongeon__image'); // niveaux 0, 1, 2
    var orns = plongeon.querySelectorAll('.plongeon__orn');     // les coins dorés des niveaux 0 et 1
    var enVue = false, raf = null, dernier = null, depuis = 0, avance = 0; // avance : niveaux traversés
    function trame(t) {
      var dt = dernier === null ? 0 : Math.min(t - dernier, 100); // jamais de saut après une pause
      dernier = t; depuis += dt;
      if (depuis >= FIN) { plongeon.classList.add('roi'); raf = null; return; } // l'arrêt : la chaise, seule
      var r = Math.min(depuis / ACCEL, 1);
      var vitesse = 1 / LENT + (1 / VITE - 1 / LENT) * r * r; // niveaux par milliseconde ; monte de plus en plus vite
      avance += dt * vitesse;
      var s = Math.pow(K, avance % 1);
      for (var i = 0; i < images.length; i++) images[i].style.transform = 'scale(' + (s / Math.pow(K, i)).toFixed(5) + ')';
      for (var j = 0; j < orns.length; j++) orns[j].style.transform = 'scale(' + (s / Math.pow(K, j)).toFixed(5) + ')';
      raf = requestAnimationFrame(trame);
    }
    function marche() { if (raf === null && enVue && !document.hidden) { dernier = null; depuis = 0; avance = 0; plongeon.classList.remove('roi'); plongeon.classList.add('marche'); raf = requestAnimationFrame(trame); } }
    function arret() { if (raf !== null) { cancelAnimationFrame(raf); raf = null; } }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { enVue = es[es.length - 1].isIntersecting; if (enVue) marche(); else arret(); }, { threshold: 0.25 }).observe(plongeon);
    } else { enVue = true; marche(); }
    document.addEventListener('visibilitychange', function () { if (document.hidden) arret(); else marche(); });
  }
})();
