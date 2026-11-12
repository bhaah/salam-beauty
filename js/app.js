/* ==========================================================================
   Salam Beauty Therapy — storefront interactions
   ========================================================================== */
(() => {
  'use strict';

  /* ---------- Helpers ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const EASE = 'cubic-bezier(.2,.8,.2,1)';
  const fmt = n => '₪' + Number(n).toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const store = {
    get(k, d) { try { const v = localStorage.getItem('salam.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('salam.' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };
  const tween = (from, to, dur, cb, done) => {
    const t0 = performance.now();
    const f = t => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      cb(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(f); else if (done) done();
    };
    requestAnimationFrame(f);
  };
  const restartAnim = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  function shade(hex, amt) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(x => x + x).join('');
    const n = parseInt(h, 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const t = amt < 0 ? 0 : 255, p = Math.abs(amt) / 100;
    r = Math.round((t - r) * p) + r; g = Math.round((t - g) * p) + g; b = Math.round((t - b) * p) + b;
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  const ICON = {
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/></svg>',
    bag: '<svg viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    truck: '<svg viewBox="0 0 24 24"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>',
    leaf: '<svg viewBox="0 0 24 24"><path d="M5 19c0-8 6-13 14-14-1 8-6 14-14 14Z"/><path d="M5 19 13 11"/></svg>',
    return: '<svg viewBox="0 0 24 24"><path d="M4 9h11a5 5 0 0 1 0 10H8"/><path d="m8 5-4 4 4 4"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/></svg>',
    move: '<svg viewBox="0 0 24 24" width="14" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 12h14M8 9l-3 3 3 3M16 9l3 3-3 3"/></svg>'
  };

  /* ---------- Product illustrations (SVG) ---------- */
  let uid = 0;
  function art(type, c, opts = {}) {
    const id = 'pa' + (uid++);
    const label = (opts.label || '').toUpperCase();
    const body = `url(#${id}b)`, gold = `url(#${id}g)`, plum = `url(#${id}p)`, hl = `url(#${id}h)`;
    const defs = `<defs>
      <linearGradient id="${id}b" x1="0" x2="1"><stop offset="0" stop-color="${shade(c, -22)}"/><stop offset=".35" stop-color="${shade(c, 14)}"/><stop offset=".7" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, -30)}"/></linearGradient>
      <linearGradient id="${id}g" x1="0" x2="1"><stop offset="0" stop-color="#9C7A45"/><stop offset=".45" stop-color="#F1DCAA"/><stop offset=".62" stop-color="#D6B577"/><stop offset="1" stop-color="#8E6C38"/></linearGradient>
      <linearGradient id="${id}p" x1="0" x2="1"><stop offset="0" stop-color="#2A1620"/><stop offset=".45" stop-color="#5A3647"/><stop offset="1" stop-color="#24131B"/></linearGradient>
      <linearGradient id="${id}h" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <radialGradient id="${id}s"><stop offset="0" stop-color="#3B2230" stop-opacity=".3"/><stop offset="1" stop-color="#3B2230" stop-opacity="0"/></radialGradient>
    </defs>`;
    const brand = (y, size = 11, fill = '#3B2230') => `<text x="100" y="${y}" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="${size}" font-style="italic" letter-spacing="2" fill="${fill}">Salam</text>`;
    const sub = (y, fill = '#7D6670') => label ? `<text x="100" y="${y}" text-anchor="middle" font-family="Jost, sans-serif" font-size="5.6" letter-spacing="1.3" fill="${fill}">${label}</text>` : '';
    let g = '';
    switch (type) {
      case 'serum': g = `
        <rect x="88" y="16" width="24" height="46" rx="12" fill="#2A1620"/>
        <rect x="92" y="21" width="5" height="34" rx="2.5" fill="#fff" opacity=".18"/>
        <rect x="78" y="58" width="44" height="42" rx="6" fill="${gold}"/>
        <rect x="66" y="98" width="68" height="146" rx="18" fill="${body}"/>
        <rect x="72" y="108" width="8" height="126" rx="4" fill="${hl}"/>
        <rect x="76" y="154" width="48" height="58" rx="3" fill="#FFF8F4" opacity=".93"/>
        ${brand(180, 13)}${sub(194)}
        <line x1="90" y1="202" x2="110" y2="202" stroke="#C6A266" stroke-width=".8"/>`; break;
      case 'jar': g = `
        <rect x="34" y="150" width="132" height="94" rx="24" fill="${body}"/>
        <rect x="44" y="160" width="10" height="74" rx="5" fill="${hl}"/>
        <rect x="40" y="114" width="120" height="42" rx="10" fill="${gold}"/>
        <rect x="40" y="148" width="120" height="6" fill="#000" opacity=".08"/>
        ${brand(200, 17)}${sub(215)}`; break;
      case 'lipstick': g = `
        <path d="M80 132 V72 Q80 50 100 36 L120 52 V132 Z" fill="${body}"/>
        <path d="M86 126 V74 Q86 60 96 50" stroke="#fff" stroke-opacity=".35" stroke-width="3" fill="none" stroke-linecap="round"/>
        <rect x="74" y="126" width="52" height="34" rx="3" fill="${gold}"/>
        <rect x="68" y="158" width="64" height="86" rx="6" fill="${plum}"/>
        <rect x="74" y="164" width="6" height="74" rx="3" fill="#fff" opacity=".12"/>
        ${brand(208, 13, '#E9CF98')}`; break;
      case 'gloss': g = `
        <rect x="82" y="26" width="36" height="82" rx="8" fill="${gold}"/>
        <rect x="86" y="32" width="5" height="68" rx="2.5" fill="#fff" opacity=".45"/>
        <rect x="78" y="104" width="44" height="140" rx="14" fill="${c}"/>
        <rect x="78" y="104" width="44" height="140" rx="14" fill="${body}" opacity=".55"/>
        <rect x="84" y="112" width="7" height="122" rx="3.5" fill="${hl}"/>
        <g transform="rotate(-90 104 178)">${brand(182, 13, '#fff')}</g>`; break;
      case 'palette': {
        const pans = opts.pans || [c, shade(c, 25), shade(c, -25), '#C9A46A', '#8E5A4E', '#E9C9B8'];
        const circles = pans.map((p, i) => {
          const cx = 60 + (i % 3) * 40, cy = 170 + Math.floor(i / 3) * 42;
          return `<circle cx="${cx}" cy="${cy}" r="16" fill="${p}"/><circle cx="${cx - 5}" cy="${cy - 5}" r="5" fill="#fff" opacity=".28"/>`;
        }).join('');
        g = `
        <rect x="24" y="30" width="152" height="100" rx="18" fill="${gold}"/>
        <rect x="34" y="40" width="132" height="80" rx="12" fill="#F6EEE9"/>
        <path d="M46 40 h48 l-40 80 h-20 V52z" fill="#fff" opacity=".55"/>
        ${brand(86, 16, '#C6A266')}
        <rect x="24" y="128" width="152" height="116" rx="18" fill="${plum}"/>
        <rect x="32" y="138" width="136" height="98" rx="12" fill="#1E0F16" opacity=".35"/>
        ${circles}`;
        break;
      }
      case 'mist': g = `
        <rect x="82" y="40" width="36" height="16" rx="6" fill="${gold}"/>
        <rect x="88" y="54" width="24" height="30" rx="3" fill="${gold}"/>
        <rect x="112" y="60" width="10" height="6" rx="2" fill="#8E6C38"/>
        <rect x="58" y="82" width="84" height="162" rx="34" fill="${body}"/>
        <rect x="66" y="96" width="9" height="132" rx="4.5" fill="${hl}"/>
        ${brand(166, 15)}${sub(180)}`; break;
      case 'perfume': g = `
        <rect x="70" y="26" width="60" height="64" rx="10" fill="${plum}"/>
        <rect x="76" y="32" width="10" height="52" rx="5" fill="#fff" opacity=".14"/>
        <rect x="86" y="88" width="28" height="18" fill="${gold}"/>
        <path d="M50 104 H150 L160 128 V230 Q160 244 146 244 H54 Q40 244 40 230 V128 Z" fill="${body}"/>
        <path d="M56 116 H144 L150 132 V226 Q150 234 142 234 H58 Q50 234 50 226 V132 Z" fill="#fff" opacity=".12"/>
        <rect x="54" y="132" width="8" height="96" rx="4" fill="${hl}"/>
        <rect x="70" y="160" width="60" height="44" rx="2" fill="#FFF8F4" opacity=".9"/>
        ${brand(183, 14)}${sub(196)}`; break;
      case 'oil': g = `
        <rect x="90" y="18" width="20" height="40" rx="10" fill="#2A1620"/>
        <rect x="82" y="56" width="36" height="40" rx="5" fill="${gold}"/>
        <rect x="88" y="94" width="24" height="16" fill="${shade(c, -30)}"/>
        <circle cx="100" cy="176" r="68" fill="${body}"/>
        <path d="M52 150 Q60 124 86 114" stroke="#fff" stroke-opacity=".55" stroke-width="7" fill="none" stroke-linecap="round"/>
        <rect x="66" y="158" width="68" height="42" rx="3" fill="#FFF8F4" opacity=".9"/>
        ${brand(180, 14)}${sub(193)}`; break;
      case 'mascara': g = `
        <rect x="80" y="20" width="40" height="120" rx="20" fill="${plum}"/>
        <rect x="86" y="30" width="6" height="100" rx="3" fill="#fff" opacity=".15"/>
        <rect x="78" y="136" width="44" height="12" fill="${gold}"/>
        <rect x="80" y="146" width="40" height="98" rx="12" fill="${body}"/>
        <rect x="86" y="154" width="6" height="82" rx="3" fill="${hl}"/>
        <g transform="rotate(-90 104 80)">${brand(84, 13, '#E9CF98')}</g>`; break;
      case 'pump': g = `
        <rect x="72" y="40" width="64" height="16" rx="5" fill="${gold}"/>
        <rect x="128" y="44" width="16" height="8" rx="3" fill="#8E6C38"/>
        <rect x="92" y="54" width="16" height="28" fill="#8E6C38"/>
        <rect x="82" y="80" width="36" height="26" rx="4" fill="${gold}"/>
        <rect x="56" y="104" width="88" height="140" rx="12" fill="${body}"/>
        <rect x="62" y="114" width="9" height="120" rx="4.5" fill="${hl}"/>
        <rect x="72" y="150" width="56" height="54" rx="2" fill="#FFF8F4" opacity=".9"/>
        ${brand(175, 14)}${sub(189)}`; break;
      default: g = `
        <rect x="80" y="30" width="40" height="40" rx="6" fill="${gold}"/>
        <rect x="86" y="36" width="5" height="28" rx="2.5" fill="#fff" opacity=".4"/>
        <rect x="62" y="68" width="76" height="176" rx="18" fill="${body}"/>
        <rect x="69" y="80" width="8" height="152" rx="4" fill="${hl}"/>
        <rect x="74" y="140" width="52" height="64" rx="3" fill="#FFF8F4" opacity=".9"/>
        ${brand(167, 14)}${sub(181)}`;
    }
    return `<svg viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs}<ellipse cx="100" cy="248" rx="70" ry="10" fill="url(#${id}s)"/>${g}</svg>`;
  }

  /* ---------- Data ---------- */
  const CATS = [['all', 'All'], ['skincare', 'Skincare'], ['makeup', 'Makeup'], ['fragrance', 'Fragrance'], ['hair', 'Hair'], ['body', 'Body']];
  const CAT_LABEL = Object.fromEntries(CATS);

  const PRODUCTS = [
    { id: 'rose-serum', name: 'Rose Glow Serum', short: 'Rose Glow', cat: 'skincare', type: 'serum', price: 149, rating: 4.9, reviews: 412, badge: 'Bestseller', color: '#E7A3A9', tint: '#F6E1DF',
      desc: 'A weightless daily serum with cold-pressed damask rose and three weights of hyaluronic acid. Skin looks plumper, brighter and more even from the first week.',
      ingredients: 'Damask Rose Water, Sodium Hyaluronate, Niacinamide (4%), Glycerin, Panthenol, Rosa Damascena Flower Oil.',
      how: 'Press 3–4 drops into clean skin morning and night, before moisturiser.' },
    { id: 'velvet-lip', name: 'Velvet Matte Lipstick', cat: 'makeup', type: 'lipstick', price: 89, rating: 4.8, reviews: 986, badge: 'New shades', tint: '#F3E2DC',
      shades: [{ n: 'Desert Rose', c: '#C46F75' }, { n: 'Rosewood', c: '#9A4A55' }, { n: 'Crimson Silk', c: '#A3192F' }, { n: 'Nude Sand', c: '#C08B76' }, { n: 'Midnight Plum', c: '#5E2340' }],
      desc: 'Creamy-matte colour that glides on in one swipe and stays comfortable for eight hours. Enriched with argan oil and shea so lips never feel dry.',
      ingredients: 'Argania Spinosa Kernel Oil, Butyrospermum Parkii (Shea) Butter, Tocopherol, Candelilla Wax, Mica.',
      how: 'Apply from the centre of the lips outward. Blot and reapply for deeper intensity.' },
    { id: 'hydra-cream', name: 'Hydra Cloud Cream', short: 'Hydra Cloud', cat: 'skincare', type: 'jar', price: 127, oldPrice: 159, rating: 4.7, reviews: 538, badge: '−20%', color: '#F3ECE6', tint: '#E6EEEC',
      desc: 'A whipped gel-cream that melts into skin and locks in moisture for 72 hours. Dead Sea minerals help strengthen the barrier without a heavy feel.',
      ingredients: 'Aqua, Squalane, Dead Sea Salt, Sodium Hyaluronate, Ceramide NP, Aloe Barbadensis Leaf Juice.',
      how: 'Smooth a pearl-sized amount over face and neck as the last step of your routine.' },
    { id: 'golden-palette', name: 'Golden Hour Palette', cat: 'makeup', type: 'palette', price: 179, rating: 4.9, reviews: 267, badge: 'Limited', color: '#C98E6B', tint: '#F5E8DA',
      pans: ['#E9C9B8', '#D6A07E', '#B86F55', '#C9A46A', '#8E5A4E', '#5A3647'],
      desc: 'Six buttery shades — from champagne shimmer to deep plum matte — inspired by desert light at dusk. Highly pigmented, easy to blend.',
      ingredients: 'Mica, Talc-free base, Jojoba Esters, Tocopherol, Iron Oxides.',
      how: 'Sweep the lightest shade across the lid, deepen the crease, and press shimmer onto the centre with a fingertip.' },
    { id: 'oud-mist', name: 'Oud & Amber Mist', short: 'Oud Amber', cat: 'fragrance', type: 'mist', price: 119, rating: 4.8, reviews: 301, color: '#D9B48A', tint: '#F2E6D6',
      desc: 'A warm, softly smoky hair and body mist. Agarwood and amber, brightened with a little bergamot.',
      ingredients: 'Alcohol Denat., Aqua, Parfum (Oud Accord, Amber, Bergamot), Glycerin.',
      how: 'Mist over hair and body from 20 cm away. Layer with Jasmine Night for evenings.' },
    { id: 'argan-elixir', name: 'Argan Hair Elixir', short: 'Argan', cat: 'hair', type: 'oil', price: 109, rating: 4.8, reviews: 644, badge: 'Bestseller', color: '#D99A3E', tint: '#F5EAD8',
      desc: 'Pure cold-pressed argan oil with camellia for frizz-free, glossy lengths. Two drops is all it takes.',
      ingredients: 'Argania Spinosa Kernel Oil, Camellia Japonica Seed Oil, Tocopherol.',
      how: 'Warm 2–3 drops between palms and smooth over mid-lengths and ends, damp or dry.' },
    { id: 'lash-mascara', name: 'Lash Lift Mascara', cat: 'makeup', type: 'mascara', price: 79, rating: 4.6, reviews: 455, color: '#3B2230', tint: '#ECE3E7',
      desc: 'A curling, lengthening formula with a tapered brush that reaches every lash. Smudge-proof, flake-free, removes with warm water.',
      ingredients: 'Aqua, Beeswax-free polymer blend, Castor Seed Oil, Panthenol, Black Iron Oxide.',
      how: 'Wiggle the brush at the root and sweep upward. Add a second coat while still wet.' },
    { id: 'deadsea-butter', name: 'Dead Sea Body Butter', short: 'Dead Sea', cat: 'body', type: 'jar', price: 99, rating: 4.7, reviews: 356, color: '#E3D9CC', tint: '#E3ECEF',
      desc: 'A rich, slow-melting butter for dry skin, with shea, cocoa and mineral-rich Dead Sea salt. Absorbs without a greasy finish.',
      ingredients: 'Butyrospermum Parkii Butter, Theobroma Cacao Seed Butter, Maris Sal, Sweet Almond Oil.',
      how: 'Massage into slightly damp skin after showering, focusing on elbows, knees and heels.' },
    { id: 'silk-foundation', name: 'Silk Skin Foundation', short: 'Silk Skin', cat: 'makeup', type: 'pump', price: 159, rating: 4.6, reviews: 721, tint: '#F3E7DD',
      shades: [{ n: 'Porcelain', c: '#F1D3BE' }, { n: 'Sand', c: '#E0B594' }, { n: 'Honey', c: '#C99168' }, { n: 'Caramel', c: '#A86F48' }, { n: 'Mocha', c: '#7A4B2E' }],
      desc: 'A medium-coverage, serum-light foundation with a soft-focus satin finish. Breathable, buildable and true to tone all day.',
      ingredients: 'Aqua, Squalane, Niacinamide, Sodium Hyaluronate, Iron Oxides. SPF 15.',
      how: 'Shake well. Apply one pump with fingertips or a damp sponge, working from the centre of the face outward.' },
    { id: 'jasmine-perfume', name: 'Jasmine Night Eau de Parfum', short: 'Jasmine', cat: 'fragrance', type: 'perfume', price: 289, rating: 4.9, reviews: 189, badge: 'New', color: '#E9C7CF', tint: '#F1E4EA',
      desc: 'Night-blooming jasmine, Taif rose and a trail of white musk. Intimate, luminous and long-lasting.',
      ingredients: 'Alcohol Denat., Parfum (Jasmine Sambac, Rose, White Musk, Sandalwood), Aqua.',
      how: 'Apply to pulse points — wrists, neck and behind the ears. Don\'t rub.' },
    { id: 'vitc-toner', name: 'Vitamin C Glow Toner', short: 'Vitamin C', cat: 'skincare', type: 'bottle', price: 87, oldPrice: 109, rating: 4.7, reviews: 498, badge: '−20%', color: '#F2B66B', tint: '#FBEBD6',
      desc: 'A gentle brightening toner with stabilised vitamin C and lactic acid that smooths texture and fades dullness over time.',
      ingredients: 'Aqua, Ascorbyl Glucoside, Lactic Acid, Kakadu Plum Extract, Glycerin.',
      how: 'Sweep over clean skin with a cotton pad or pat in with palms, morning and evening.' },
    { id: 'lip-oil', name: 'Rose Lip Oil Tint', cat: 'makeup', type: 'gloss', price: 69, rating: 4.8, reviews: 612, tint: '#F7E2E2',
      shades: [{ n: 'Petal', c: '#E58C98' }, { n: 'Berry', c: '#B0405F' }, { n: 'Coral', c: '#E6765E' }, { n: 'Clear Glow', c: '#EBBDB5' }],
      desc: 'A non-sticky lip oil with a sheer wash of colour and a glassy shine. Rosehip and jojoba keep lips soft for hours.',
      ingredients: 'Simmondsia Chinensis Seed Oil, Rosa Canina Fruit Oil, Tocopherol, Mica.',
      how: 'Glide on alone or over lipstick for a glossy, blurred finish.' }
  ];
  const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
  const colorOf = (p, s) => p.shades ? p.shades[s || 0].c : p.color;
  const artOf = (p, s) => art(p.type, colorOf(p, s), { label: p.short, pans: p.pans });

  /* ---------- Toasts ---------- */
  const toastBox = $('#toasts');
  function toast(msg, action) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span class="t-ico">✓</span><span>${msg}</span>`;
    let timer;
    const close = () => {
      if (t.classList.contains('out')) return;
      t.classList.add('out');
      setTimeout(() => t.remove(), 400);
    };
    if (action) {
      const b = document.createElement('button');
      b.textContent = action.label;
      b.addEventListener('click', () => { action.fn(); close(); });
      t.appendChild(b);
    }
    toastBox.appendChild(t);
    while (toastBox.children.length > 3) toastBox.firstElementChild.remove();
    timer = setTimeout(close, action ? 5000 : 3000);
    t.addEventListener('mouseenter', () => clearTimeout(timer));
    t.addEventListener('mouseleave', () => { timer = setTimeout(close, 2000); });
  }

  /* ---------- Layers (overlay / scroll lock) ---------- */
  const overlay = $('#overlay');
  const layers = new Set();
  function lock(name, on) {
    if (on) layers.add(name); else layers.delete(name);
    const locked = layers.size > 0;
    if (locked && !document.body.classList.contains('no-scroll')) {
      document.body.style.paddingRight = (innerWidth - document.documentElement.clientWidth) + 'px';
    }
    if (!locked) document.body.style.paddingRight = '';
    document.body.classList.toggle('no-scroll', locked);
    overlay.classList.toggle('is-open', layers.has('drawer') || layers.has('search') || layers.has('modal'));
  }

  /* ---------- Segmented / chip indicator ---------- */
  function moveIndicator(ind, active) {
    if (!ind || !active) return;
    ind.style.width = active.offsetWidth + 'px';
    ind.style.transform = `translateX(${active.offsetLeft}px)`;
  }

  /* ---------- Preloader ---------- */
  function initPreloader() {
    const pre = $('#preloader');
    let seen = false;
    try { seen = sessionStorage.getItem('salam.seen') === '1'; sessionStorage.setItem('salam.seen', '1'); } catch (e) { /* ignore */ }
    const finish = () => {
      pre.classList.add('is-done');
      document.body.classList.add('is-loaded');
      setTimeout(() => pre.remove(), 1200);
      setTimeout(initCookie, 2600);
    };
    if (seen || RM) { pre.style.display = 'none'; finish(); return; }
    const start = performance.now();
    let done = false;
    const go = () => { if (done) return; done = true; setTimeout(finish, Math.max(0, 1500 - (performance.now() - start))); };
    if (document.readyState === 'complete') go(); else addEventListener('load', go);
    setTimeout(go, 3500);
  }

  /* ---------- Announcement bar ---------- */
  function initAnnounce() {
    const bar = $('#announce');
    const items = $$('.announce-track p', bar);
    let i = 0;
    if (store.get('announceClosed', false)) bar.classList.add('is-closed');
    setInterval(() => {
      const cur = items[i];
      cur.classList.remove('is-active'); cur.classList.add('is-leaving');
      setTimeout(() => cur.classList.remove('is-leaving'), 700);
      i = (i + 1) % items.length;
      items[i].classList.add('is-active');
    }, 4200);
    $('.announce-close', bar).addEventListener('click', () => { bar.classList.add('is-closed'); store.set('announceClosed', true); });
  }

  /* ---------- Scroll: header, progress, spy, back-to-top ---------- */
  const header = $('#header');
  let headerPinnedUntil = 0;
  function pinHeader(ms = 1400) { headerPinnedUntil = performance.now() + ms; header.classList.remove('is-hidden'); }
  function initScroll() {
    const prog = $('.scroll-progress');
    const toTop = $('#toTop'), ring = $('#toTopRing');
    const links = $$('.nav-link');
    const sections = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
    let lastY = scrollY, ticking = false;
    const update = () => {
      ticking = false;
      const y = scrollY;
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? y / max : 0;
      prog.style.transform = `scaleX(${p})`;
      ring.style.strokeDashoffset = 163.4 * (1 - p);
      toTop.classList.toggle('is-on', y > 700);
      header.classList.toggle('is-scrolled', y > 10);
      if (!layers.size && performance.now() > headerPinnedUntil) {
        if (y > lastY + 4 && y > 400) header.classList.add('is-hidden');
        else if (y < lastY - 4) header.classList.remove('is-hidden');
      }
      lastY = y;
      let active = null;
      sections.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight * .35) active = links[i]; });
      links.forEach(l => l.classList.toggle('is-active', l === active));
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
    toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }));
  }

  /* ---------- Mobile menu ---------- */
  function initMenu() {
    const burger = $('#burger'), menu = $('#mobileMenu');
    const set = open => {
      burger.classList.toggle('is-open', open);
      menu.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open);
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.setAttribute('aria-hidden', !open);
      document.body.classList.toggle('menu-open', open);
      lock('menu', open);
    };
    burger.addEventListener('click', () => set(!menu.classList.contains('is-open')));
    $$('a', menu).forEach(a => a.addEventListener('click', () => set(false)));
    return () => set(false);
  }

  /* ---------- Custom cursor ---------- */
  function initCursor() {
    if (!FINE || RM) return;
    const dot = $('.cursor'), ring = $('.cursor-ring'), label = $('span', ring);
    let mx = -100, my = -100, rx = -100, ry = -100;
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate3d(${mx}px,${my}px,0)`;
      document.body.classList.add('has-cursor');
    }, { passive: true });
    document.addEventListener('mouseleave', () => document.body.classList.remove('has-cursor'));
    const loop = () => {
      rx += (mx - rx) * .18; ry += (my - ry) * .18;
      ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener('pointerover', e => {
      const hov = e.target.closest('a, button, [role="button"], [role="slider"], label, .swatch, input, textarea');
      let lab = e.target.closest('[data-cursor]');
      if (lab && hov && hov !== lab && lab.contains(hov)) lab = null;
      ring.classList.toggle('is-label', !!lab);
      ring.classList.toggle('is-hover', !lab && !!hov);
      dot.classList.toggle('is-hidden', !!lab);
      if (lab) label.textContent = lab.dataset.cursor;
    });
  }

  /* ---------- Magnetic buttons & ripple ---------- */
  function initButtons() {
    if (FINE && !RM) {
      $$('[data-magnetic]').forEach(el => {
        el.addEventListener('pointermove', e => {
          const r = el.getBoundingClientRect();
          el.style.translate = `${(e.clientX - r.left - r.width / 2) * .22}px ${(e.clientY - r.top - r.height / 2) * .32}px`;
        });
        el.addEventListener('pointerleave', () => { el.style.translate = ''; });
      });
    }
    document.addEventListener('pointerdown', e => {
      const b = e.target.closest('.btn');
      if (!b || RM) return;
      const r = b.getBoundingClientRect();
      const s = document.createElement('span');
      const size = Math.max(r.width, r.height) * 2.2;
      s.className = 'ripple';
      s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
      b.appendChild(s);
      setTimeout(() => s.remove(), 750);
    });
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href="#"]');
      if (a) e.preventDefault();
    });
  }

  /* ---------- Reveal, split text, counters ---------- */
  function splitText(el) {
    let i = 0;
    const out = [];
    el.childNodes.forEach(n => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) out.push(' ');
          else out.push(`<span class="w"><span style="--i:${i++}">${part.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span></span>`);
        });
      } else if (n.nodeType === 1) {
        const tag = n.tagName.toLowerCase();
        const words = n.textContent.trim().split(/\s+/);
        words.forEach((w, k) => {
          out.push(`<span class="w"><span style="--i:${i++}"><${tag}>${w.replace(/&/g, '&amp;')}</${tag}></span></span>`);
          if (k < words.length - 1) out.push(' ');
        });
      }
    });
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    el.innerHTML = out.join('');
  }
  function countUp(el) {
    const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), suf = el.dataset.suffix || '';
    tween(0, to, 2000, v => { el.textContent = v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf; });
  }
  const observed = new Map();
  let io;
  function initReveal() {
    $$('[data-split]').forEach(splitText);
    io = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.classList.add('is-in');
      if (el.dataset.count !== undefined) countUp(el);
      const cb = observed.get(el);
      if (cb) cb();
      io.unobserve(el);
    }), { threshold: .18, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal, [data-split], [data-count], .metrics').forEach(el => io.observe(el));
  }
  const onVisible = (el, cb) => { observed.set(el, cb); io.observe(el); };

  /* ---------- Hero ---------- */
  function initHero() {
    $('#heroMain').innerHTML = artOf(byId['rose-serum']);
    $('#heroSide1').innerHTML = art('lipstick', '#C46F75');
    $('#heroSide2').innerHTML = artOf(byId['hydra-cream']);
    $('#heroThumb').innerHTML = art('serum', '#E7A3A9');

    // rotating word
    const words = $$('#rotator span');
    let wi = 0;
    setInterval(() => {
      const cur = words[wi];
      cur.classList.remove('is-active'); cur.classList.add('is-out');
      setTimeout(() => cur.classList.remove('is-out'), 900);
      wi = (wi + 1) % words.length;
      words[wi].classList.add('is-active');
    }, 2600);

    if (RM) return;
    const hero = $('#home');
    const layersEls = $$('[data-depth]', $('#heroVisual'));
    let tx = 0, ty = 0, cx = 0, cy = 0, running = true;
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - .5;
      ty = (e.clientY - r.top) / r.height - .5;
    });
    hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; });
    new IntersectionObserver(([en]) => { running = en.isIntersecting; if (running) loop(); }).observe(hero);
    function loop() {
      if (!running) return;
      cx += (tx - cx) * .07; cy += (ty - cy) * .07;
      layersEls.forEach(l => { const d = +l.dataset.depth; l.style.translate = `${-cx * d * 44}px ${-cy * d * 44}px`; });
      requestAnimationFrame(loop);
    }
    initParticles(hero);
  }

  function initParticles(hero) {
    const c = $('#particles'), ctx = c.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    let w = 0, h = 0, running = true;
    const mouse = { x: -999, y: -999 };
    const P = [];
    const resize = () => {
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    addEventListener('resize', resize);
    const N = w < 700 ? 18 : 38;
    for (let i = 0; i < N; i++) {
      const bvy = -.12 - Math.random() * .35;
      P.push({ x: Math.random() * w, y: Math.random() * h, r: 1.5 + Math.random() * 5, vx: 0, vy: bvy, bvx: (Math.random() - .5) * .2, bvy,
        a: .18 + Math.random() * .4, col: Math.random() < .55 ? '196,122,130' : '198,162,102' });
    }
    hero.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
    new IntersectionObserver(([en]) => { running = en.isIntersecting; if (running) tick(); }).observe(hero);
    function tick() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of P) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < 130 && d > 0) { const f = (130 - d) / 130; p.vx += dx / d * f * .6; p.vy += dy / d * f * .6; }
        p.vx += (p.bvx - p.vx) * .04; p.vy += (p.bvy - p.vy) * .04;
        p.x += p.vx; p.y += p.vy;
        if (p.y < -12) { p.y = h + 12; p.x = Math.random() * w; }
        if (p.y > h + 14) p.y = -10;
        if (p.x < -12) p.x = w + 10; if (p.x > w + 12) p.x = -10;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 2.6, 0, Math.PI * 2); ctx.fillStyle = `rgba(${p.col},${p.a * .18})`; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(${p.col},${p.a})`; ctx.fill();
      }
      requestAnimationFrame(tick);
    }
  }

  /* ---------- Cart & wishlist state ---------- */
  let cart = store.get('cart', []).filter(l => byId[l.id]);
  let wish = new Set(store.get('wish', []).filter(id => byId[id]));
  let promo = null;
  const PROMOS = { SALAM10: { pct: 10, label: 'Welcome 10%' }, GLOW20: { pct: 20, label: 'Winter Glow 20%' } };
  const FREE_SHIP = 250, SHIP = 25;
  const saveCart = () => store.set('cart', cart);
  const saveWish = () => store.set('wish', [...wish]);
  const cartQty = () => cart.reduce((s, l) => s + l.qty, 0);

  function updateBadges(bump) {
    const cc = $('#cartCount'), wc = $('#wishCount');
    const q = cartQty();
    cc.textContent = q; cc.classList.toggle('has', q > 0);
    wc.textContent = wish.size; wc.classList.toggle('has', wish.size > 0);
    $('#tabBagCount').textContent = q || '';
    $('#tabWishCount').textContent = wish.size || '';
    if (bump === 'cart') { restartAnim(cc, 'bump'); restartAnim($('#cartBtn'), 'shake'); }
    if (bump === 'wish') restartAnim(wc, 'bump');
  }

  function addToCart(id, shadeIdx = null, qty = 1, fromEl = null, opts = {}) {
    const p = byId[id];
    const s = p.shades ? (shadeIdx ?? 0) : null;
    const key = id + ':' + s;
    const line = cart.find(l => l.key === key);
    if (line) line.qty = Math.min(10, line.qty + qty);
    else cart.push({ key, id, shade: s, qty });
    saveCart();
    const after = () => { updateBadges('cart'); if (drawer.classList.contains('is-open')) renderDrawer(); };
    if (fromEl) flyToCart(fromEl, artOf(p, s), after); else after();
    if (!opts.silent) toast(`<b>${p.name}</b>${s !== null ? ' · ' + p.shades[s].n : ''} added to your bag`, { label: 'View bag', fn: () => openDrawer('bag') });
  }

  function flyToCart(fromEl, html, done) {
    if (RM) { done(); return; }
    const wasHidden = header.classList.contains('is-hidden');
    pinHeader();
    const r = fromEl.getBoundingClientRect();
    const t = $('#cartBtn').getBoundingClientRect();
    const tTop = t.top + (wasHidden ? header.offsetHeight : 0);
    const size = clamp(Math.min(r.width, r.height) * .8, 60, 150);
    const f = document.createElement('div');
    f.className = 'flyer';
    f.innerHTML = html;
    Object.assign(f.style, { left: r.left + r.width / 2 - size / 2 + 'px', top: r.top + r.height / 2 - size / 2 + 'px', width: size + 'px', height: size * 1.3 + 'px' });
    document.body.appendChild(f);
    const dx = t.left + t.width / 2 - (r.left + r.width / 2);
    const dy = tTop + t.height / 2 - (r.top + r.height / 2);
    f.animate([
      { transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 },
      { transform: `translate(${dx * .45}px, ${dy * .45 - 140}px) scale(.75) rotate(-12deg)`, opacity: 1, offset: .5 },
      { transform: `translate(${dx}px, ${dy}px) scale(.1) rotate(-30deg)`, opacity: .4 }
    ], { duration: 950, easing: 'cubic-bezier(.45,0,.4,1)' }).onfinish = () => { f.remove(); done(); };
  }

  function burst(el) {
    if (RM) return;
    const r = el.getBoundingClientRect();
    for (let i = 0; i < 12; i++) {
      const d = document.createElement('span');
      d.className = 'burst';
      const a = (i / 12) * Math.PI * 2, dist = 24 + Math.random() * 18;
      d.style.left = r.left + r.width / 2 + 'px';
      d.style.top = r.top + r.height / 2 + 'px';
      d.style.background = i % 2 ? '#A85A66' : '#C6A266';
      document.body.appendChild(d);
      d.animate([
        { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * dist}px), calc(-50% + ${Math.sin(a) * dist}px)) scale(0)`, opacity: 0 }
      ], { duration: 650, easing: EASE }).onfinish = () => d.remove();
    }
  }

  function toggleWish(id, btn) {
    const p = byId[id];
    const on = !wish.has(id);
    if (on) wish.add(id); else wish.delete(id);
    saveWish();
    $$(`[data-wish="${id}"]`).forEach(b => { b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
    if (on && btn) burst(btn);
    updateBadges('wish');
    toast(on ? `Saved <b>${p.name}</b> to your wishlist` : `Removed <b>${p.name}</b> from your wishlist`, on ? { label: 'View', fn: () => openDrawer('wish') } : null);
    if (drawer.classList.contains('is-open')) renderDrawer();
  }

  /* ---------- Shared product helpers ---------- */
  const cardShade = {};
  const stars = r => `<span class="stars" style="--r:${r}" aria-label="${r} out of 5 stars">★★★★★</span>`;

  /* ---------- Modal ---------- */
  const modal = $('#modal'), modalCard = $('#modalCard'), modalBody = $('#modalBody');
  let lastFocus = null;
  function openModal(html, size = '') {
    if (!modal.classList.contains('is-open')) lastFocus = document.activeElement;
    modalCard.className = 'modal-card ' + size;
    modalBody.innerHTML = html;
    modalCard.scrollTop = 0;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    lock('modal', true);
    setTimeout(() => $('#modalClose').focus({ preventScroll: true }), 60);
  }
  function closeModal() {
    if (!modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    lock('modal', false);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  $('#modalClose').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  /* ---------- Quick view ---------- */
  function openQV(id) {
    const p = byId[id];
    let s = p.shades ? (cardShade[id] ?? 0) : null;
    let qty = 1;
    const save = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    openModal(`<div class="qv">
      <div class="qv-media" style="--tint:${p.tint}">
        <div class="qv-art" id="qvArt">${artOf(p, s)}</div>
        <span class="qv-hint">${ICON.move} Move to rotate</span>
      </div>
      <div class="qv-info">
        <p class="eyebrow">${CAT_LABEL[p.cat]}${p.badge ? ' · ' + p.badge : ''}</p>
        <h2>${p.name}</h2>
        <div class="qv-rating">${stars(p.rating)} <span>${p.rating} · ${p.reviews} reviews</span></div>
        <div class="qv-price">${fmt(p.price)}${p.oldPrice ? `<s>${fmt(p.oldPrice)}</s><span class="save">SAVE ${save}%</span>` : ''}</div>
        <p class="qv-desc">${p.desc}</p>
        ${p.shades ? `<div class="qv-shades"><div class="label">Shade: <b id="qvShadeName">${p.shades[s].n}</b></div>
          <div class="swatches">${p.shades.map((sh, i) => `<button class="swatch ${i === s ? 'is-active' : ''}" style="--c:${sh.c}" data-shade="${i}" aria-label="${sh.n}" title="${sh.n}"></button>`).join('')}</div></div>` : ''}
        <div class="qv-buy">
          <div class="qty qty-lg"><button data-q="-1" aria-label="Decrease quantity">−</button><span id="qvQty">1</span><button data-q="1" aria-label="Increase quantity">+</button></div>
          <button class="btn btn-primary" id="qvAdd">Add to bag · <span id="qvTotal">${fmt(p.price)}</span></button>
          <button class="wish ${wish.has(id) ? 'is-on' : ''}" data-wish="${id}" aria-pressed="${wish.has(id)}" aria-label="Save to wishlist">${ICON.heart}</button>
        </div>
        <ul class="qv-perks">
          <li>${ICON.truck} Free delivery over ₪250 · ships today if ordered before 14:00</li>
          <li>${ICON.return} 30-day happy-skin returns, even if opened</li>
          <li>${ICON.star} Earn ${Math.round(p.price / 10)} Salam points with this order</li>
        </ul>
        <div class="tabs">
          <div class="tabs-head" role="tablist"><span class="tab-ind"></span>
            <button class="tab-btn is-active" role="tab" data-t="desc">Details</button>
            <button class="tab-btn" role="tab" data-t="ing">Ingredients</button>
            <button class="tab-btn" role="tab" data-t="how">How to use</button>
          </div>
          <div class="tab-panel" id="qvPanel">${p.desc}</div>
        </div>
      </div>
    </div>`);

    const root = modalBody;
    const qvArt = $('#qvArt', root);
    const qtyEl = $('#qvQty', root), total = $('#qvTotal', root);
    const syncTotal = () => { qtyEl.textContent = qty; restartAnim(qtyEl, 'tick'); total.textContent = fmt(p.price * qty); };
    $$('[data-q]', root).forEach(b => b.addEventListener('click', () => { qty = clamp(qty + +b.dataset.q, 1, 10); syncTotal(); }));
    $$('.qv-shades .swatch', root).forEach(b => b.addEventListener('click', () => {
      s = +b.dataset.shade;
      $$('.qv-shades .swatch', root).forEach(x => x.classList.toggle('is-active', x === b));
      $('#qvShadeName', root).textContent = p.shades[s].n;
      qvArt.innerHTML = artOf(p, s);
      restartAnim(qvArt, 'swap');
    }));
    $('#qvAdd', root).addEventListener('click', () => { addToCart(id, s, qty, qvArt); setTimeout(closeModal, 250); });
    $('.wish', root).addEventListener('click', e => toggleWish(id, e.currentTarget));
    // tabs
    const tabInd = $('.tab-ind', root), panel = $('#qvPanel', root);
    const texts = { desc: p.desc, ing: p.ingredients, how: p.how };
    const tabs = $$('.tab-btn', root);
    requestAnimationFrame(() => moveIndicator(tabInd, tabs[0]));
    tabs.forEach(t => t.addEventListener('click', () => {
      tabs.forEach(x => x.classList.toggle('is-active', x === t));
      moveIndicator(tabInd, t);
      panel.textContent = texts[t.dataset.t];
      restartAnim(panel, 'tab-panel');
    }));
    // 3D rotate
    const media = $('.qv-media', root);
    media.addEventListener('pointermove', e => {
      const r = media.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      qvArt.style.transform = `rotateY(${x * 40}deg) rotateX(${-y * 20}deg) scale(1.05)`;
    });
    media.addEventListener('pointerleave', () => { qvArt.style.transform = ''; });
  }
  document.addEventListener('click', e => {
    const q = e.target.closest('[data-qv]');
    if (q) { e.preventDefault(); closeSearch(); openQV(q.dataset.qv); }
  });

  /* ---------- Drawer (bag + wishlist) ---------- */
  const drawer = $('#drawer'), dBody = $('#drawerBody'), dFoot = $('#drawerFoot');
  let drawerTab = 'bag', lastShip = 0;

  function totals() {
    const sub = cart.reduce((s, l) => s + byId[l.id].price * l.qty, 0);
    const disc = promo ? Math.round(sub * promo.pct) / 100 : 0;
    const ship = sub === 0 ? 0 : (sub - disc >= FREE_SHIP ? 0 : SHIP);
    return { sub, disc, ship, total: sub - disc + ship };
  }

  function renderDrawer() {
    $$('#drawerTabs button').forEach(b => b.classList.toggle('is-active', b.dataset.tab === drawerTab));
    moveIndicator($('#drawerTabs .seg-indicator'), $('#drawerTabs .is-active'));
    if (drawerTab === 'bag') renderBag(); else renderWish();
  }

  function renderBag() {
    if (!cart.length) {
      dBody.innerHTML = `<div class="drawer-empty"><div class="ico">${ICON.bag}</div><h4>Your bag is empty</h4><p>Your next ritual is waiting — start with a bestseller.</p>
        <button class="btn btn-primary" data-close-go="#try-on">Find your shade</button></div>`;
      dFoot.hidden = true;
      lastShip = 0;
      return;
    }
    const t = totals();
    const net = t.sub - t.disc;
    const left = Math.max(0, FREE_SHIP - net);
    const pct = Math.min(100, net / FREE_SHIP * 100);
    const suggestion = PRODUCTS.find(p => !cart.some(l => l.id === p.id) && ['rose-serum', 'lip-oil', 'argan-elixir', 'vitc-toner', 'hydra-cream'].includes(p.id));
    dBody.innerHTML = `
      <div class="ship-progress">${left > 0 ? `You're <b>${fmt(left)}</b> away from free delivery` : `<b>You've unlocked free delivery ✓</b>`}
        <div class="ship-bar"><i style="width:${lastShip}%"></i></div></div>
      ${cart.map(l => {
        const p = byId[l.id];
        return `<div class="line" data-key="${l.key}">
          <div class="line-thumb" style="--tint:${p.tint}" data-qv="${p.id}">${artOf(p, l.shade)}</div>
          <div><h4>${p.name}</h4>
            <small>${l.shade !== null ? `<i style="--c:${p.shades[l.shade].c}"></i>${p.shades[l.shade].n}` : CAT_LABEL[p.cat]}</small>
            <div class="qty"><button data-dq="-1" aria-label="Decrease">−</button><span>${l.qty}</span><button data-dq="1" aria-label="Increase">+</button></div></div>
          <div class="line-right"><span class="price">${fmt(p.price * l.qty)}</span><button class="remove" data-remove>Remove</button></div>
        </div>`;
      }).join('')}
      ${suggestion ? `<p class="upsell-label">Complete your ritual</p>
        <div class="upsell"><div class="line-thumb" style="--tint:${suggestion.tint}" data-qv="${suggestion.id}">${artOf(suggestion, 0)}</div>
        <div><strong>${suggestion.name}</strong><small>${fmt(suggestion.price)}</small></div>
        <button class="mini-add" data-upsell="${suggestion.id}" aria-label="Add ${suggestion.name}">+</button></div>` : ''}`;
    requestAnimationFrame(() => requestAnimationFrame(() => { const bar = $('.ship-bar i', dBody); if (bar) bar.style.width = pct + '%'; }));
    lastShip = pct;

    dFoot.hidden = false;
    dFoot.innerHTML = `
      ${promo ? `<div class="promo-applied"><span>✓ ${promo.code} — ${promo.label}</span><button data-promo-remove>Remove</button></div>`
        : `<form class="promo" id="promoForm"><input id="promoInput" placeholder="Promo code" aria-label="Promo code"><button class="btn btn-ghost btn-sm">Apply</button></form>`}
      <div class="totals">
        <div><span>Subtotal</span><span>${fmt(t.sub)}</span></div>
        ${t.disc ? `<div class="disc"><span>Discount</span><span>−${fmt(t.disc)}</span></div>` : ''}
        <div><span>Delivery</span><span>${t.ship ? fmt(t.ship) : 'Free'}</span></div>
        <div class="grand"><span>Total</span><span>${fmt(t.total)}</span></div>
      </div>
      <button class="btn btn-primary btn-block" id="checkoutBtn">Checkout securely ${ICON.arrow}</button>`;
    const form = $('#promoForm', dFoot);
    if (form) form.addEventListener('submit', e => {
      e.preventDefault();
      const code = $('#promoInput', dFoot).value.trim().toUpperCase();
      if (PROMOS[code]) { promo = { code, ...PROMOS[code] }; toast(`Code <b>${code}</b> applied — ${PROMOS[code].pct}% off`); renderBag(); }
      else { restartAnim(form, 'is-invalid'); toast(code ? `Sorry, “${code.replace(/</g, '')}” isn't a valid code` : 'Enter a promo code first'); }
    });
  }

  function renderWish() {
    dFoot.hidden = true;
    if (!wish.size) {
      dBody.innerHTML = `<div class="drawer-empty"><div class="ico">${ICON.heart}</div><h4>No favourites yet</h4><p>Tap the heart on any product to save it for later.</p>
        <button class="btn btn-primary" data-close-go="#quiz">Take the skin quiz</button></div>`;
      return;
    }
    dBody.innerHTML = [...wish].map(id => {
      const p = byId[id];
      return `<div class="line" data-wid="${id}">
        <div class="line-thumb" style="--tint:${p.tint}" data-qv="${id}">${artOf(p, 0)}</div>
        <div><h4>${p.name}</h4><small>${stars(p.rating)} ${p.reviews}</small>
          <div class="wish-actions"><button class="btn btn-primary" data-wadd="${id}">Move to bag</button><button class="remove" data-wremove="${id}">Remove</button></div></div>
        <div class="line-right"><span class="price">${fmt(p.price)}</span></div>
      </div>`;
    }).join('');
  }

  dBody.addEventListener('click', e => {
    const go = e.target.closest('[data-close-go]');
    if (go) { closeDrawer(); setTimeout(() => $(go.dataset.closeGo).scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }), 300); return; }
    const line = e.target.closest('.line[data-key]');
    const dq = e.target.closest('[data-dq]');
    if (dq && line) {
      const l = cart.find(x => x.key === line.dataset.key);
      const nq = l.qty + +dq.dataset.dq;
      if (nq < 1) { removeLine(line); return; }
      l.qty = Math.min(10, nq); saveCart(); updateBadges(); renderBag();
      const span = $(`.line[data-key="${l.key}"] .qty span`, dBody);
      if (span) restartAnim(span, 'tick');
      return;
    }
    if (e.target.closest('[data-remove]') && line) { removeLine(line); return; }
    const up = e.target.closest('[data-upsell]');
    if (up) { addToCart(up.dataset.upsell, 0, 1, null, { silent: true }); toast(`<b>${byId[up.dataset.upsell].name}</b> added`); return; }
    const wa = e.target.closest('[data-wadd]');
    if (wa) {
      const id = wa.dataset.wadd;
      addToCart(id, 0, 1, $(`.line[data-wid="${id}"] .line-thumb`, dBody), { silent: true });
      wish.delete(id); saveWish();
      $$(`[data-wish="${id}"]`).forEach(b => { b.classList.remove('is-on'); b.setAttribute('aria-pressed', false); });
      updateBadges();
      toast(`<b>${byId[id].name}</b> moved to your bag`);
      const el = wa.closest('.line'); el.classList.add('is-removing'); setTimeout(renderWish, 380);
      return;
    }
    const wr = e.target.closest('[data-wremove]');
    if (wr) {
      const id = wr.dataset.wremove;
      wish.delete(id); saveWish(); updateBadges();
      $$(`[data-wish="${id}"]`).forEach(b => { b.classList.remove('is-on'); b.setAttribute('aria-pressed', false); });
      const el = wr.closest('.line'); el.classList.add('is-removing'); setTimeout(renderWish, 380);
    }
  });
  dFoot.addEventListener('click', e => {
    if (e.target.closest('[data-promo-remove]')) { promo = null; renderBag(); }
    if (e.target.closest('#checkoutBtn')) openCheckout();
  });

  function removeLine(el) {
    const idx = cart.findIndex(x => x.key === el.dataset.key);
    if (idx < 0) return;
    const [removed] = cart.splice(idx, 1);
    saveCart(); updateBadges();
    el.classList.add('is-removing');
    setTimeout(renderBag, 380);
    toast(`Removed <b>${byId[removed.id].name}</b>`, { label: 'Undo', fn: () => { cart.splice(idx, 0, removed); saveCart(); updateBadges('cart'); renderDrawer(); } });
  }

  function openDrawer(tab = 'bag') {
    drawerTab = tab;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    lock('drawer', true);
    renderDrawer();
    setTimeout(() => $('#drawerClose').focus({ preventScroll: true }), 80);
  }
  function closeDrawer() {
    if (!drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    lock('drawer', false);
  }
  $('#cartBtn').addEventListener('click', () => openDrawer('bag'));
  $('#wishBtn').addEventListener('click', () => openDrawer('wish'));
  $('#drawerClose').addEventListener('click', closeDrawer);
  $('#drawerTabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { drawerTab = b.dataset.tab; renderDrawer(); } });
  overlay.addEventListener('click', () => { closeDrawer(); closeSearch(); });

  /* ---------- Checkout ---------- */
  function openCheckout() {
    closeDrawer();
    let method = 'delivery', pay = 'card';
    const render = () => {
      const t = totals();
      const ship = method === 'pickup' ? 0 : t.ship;
      return { t, ship, total: t.sub - t.disc + ship };
    };
    const summaryHTML = () => {
      const { t, ship, total } = render();
      return `<div class="totals">
        <div><span>Subtotal</span><span>${fmt(t.sub)}</span></div>
        ${t.disc ? `<div class="disc"><span>Discount (${promo.code})</span><span>−${fmt(t.disc)}</span></div>` : ''}
        <div><span>${method === 'pickup' ? 'Studio pickup' : 'Delivery'}</span><span>${ship ? fmt(ship) : 'Free'}</span></div>
        <div class="grand"><span>Total</span><span>${fmt(total)}</span></div></div>`;
    };
    setTimeout(() => {
      openModal(`<div class="checkout">
      <div class="co-main">
        <h2>Checkout</h2>
        <p>Secure checkout · Takes less than a minute</p>
        <div class="co-label">How would you like it?</div>
        <div class="choice-row" data-group="method">
          <button class="choice is-selected" data-v="delivery"><strong>Home delivery</strong><small>1–3 business days</small></button>
          <button class="choice" data-v="pickup"><strong>Studio pickup</strong><small>Ready in 2 hours · free</small></button>
        </div>
        <div class="co-label">Your details</div>
        <form id="coForm" novalidate>
          <div class="form-grid">
            <div class="field"><input id="coName" placeholder=" " autocomplete="name"><label for="coName">Full name</label><div class="err">Please enter your name.</div></div>
            <div class="field"><input id="coPhone" type="tel" placeholder=" " autocomplete="tel"><label for="coPhone">Mobile number</label><div class="err">Please enter a valid phone number.</div></div>
            <div class="field full" id="coAddrField"><input id="coAddr" placeholder=" " autocomplete="street-address"><label for="coAddr">Street address &amp; city</label><div class="err">We need an address to deliver to.</div></div>
          </div>
        </form>
        <div class="co-label">Payment</div>
        <div class="choice-row" data-group="pay">
          <button class="choice is-selected" data-v="card"><strong>Card on delivery</strong><small>Pay when it arrives</small></button>
          <button class="choice" data-v="bit"><strong>Bit / Apple Pay</strong><small>We'll send a payment link</small></button>
        </div>
      </div>
      <div class="co-side">
        <h4>Order summary</h4>
        <div class="co-items">${cart.map(l => { const p = byId[l.id]; return `<div class="co-item"><div class="line-thumb" style="--tint:${p.tint}">${artOf(p, l.shade)}<b>${l.qty}</b></div><div>${p.name}${l.shade !== null ? `<br><small style="color:var(--muted)">${p.shades[l.shade].n}</small>` : ''}</div><span>${fmt(p.price * l.qty)}</span></div>`; }).join('')}</div>
        <div id="coSummary">${summaryHTML()}</div>
        <button class="btn btn-primary btn-block" id="placeOrder">Place order</button>
        <p style="font-size:.76rem;color:var(--muted);text-align:center;margin:14px 0 0">By placing your order you agree to our Terms &amp; Privacy Policy.</p>
      </div>
    </div>`);
      wire();
    }, 200);

    function wire() {
      const root = modalBody;
      $$('[data-group]', root).forEach(g => g.addEventListener('click', e => {
        const c = e.target.closest('.choice'); if (!c) return;
        $$('.choice', g).forEach(x => x.classList.toggle('is-selected', x === c));
        if (g.dataset.group === 'method') {
          method = c.dataset.v;
          $('#coAddrField', root).hidden = method === 'pickup';
          $('#coSummary', root).innerHTML = summaryHTML();
        } else pay = c.dataset.v;
      }));
      $('#placeOrder', root).addEventListener('click', e => {
        const ok = [
          validate($('#coName', root), v => v.length > 1),
          validate($('#coPhone', root), v => /^[0-9+\-\s()]{9,16}$/.test(v)),
          method === 'pickup' || validate($('#coAddr', root), v => v.length > 5)
        ].every(Boolean);
        if (!ok) return;
        const btn = e.currentTarget;
        btn.classList.add('is-loading');
        setTimeout(() => {
          const { total } = render();
          const order = 'SB-' + Math.floor(100000 + Math.random() * 900000);
          const name = $('#coName', root).value.trim().split(' ')[0];
          cart = []; promo = null; saveCart(); updateBadges();
          openModal(`<div class="order-success">
            <svg class="check-anim" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44"/><path d="M30 52 l14 14 l26 -30"/></svg>
            <h3>Thank you, ${name.replace(/</g, '')}!</h3>
            <p>Order <b>${order}</b> is confirmed. ${pay === 'bit' ? 'A payment link is on its way to your phone.' : `You'll pay ${fmt(total)} on ${method === 'pickup' ? 'pickup' : 'delivery'}.`}</p>
            <div class="timeline"><div class="on"><i>✓</i>Confirmed</div><div class="on"><i>2</i>Packing</div><div><i>3</i>${method === 'pickup' ? 'Ready' : 'On the way'}</div><div><i>4</i>${method === 'pickup' ? 'Collected' : 'Delivered'}</div></div>
            <button class="btn btn-primary" id="successClose">Continue shopping</button>
          </div>`, 'sm');
          $('#successClose', modalBody).addEventListener('click', closeModal);
          confetti();
        }, 1300);
      });
    }
  }

  function validate(input, test) {
    const field = input.closest('.field');
    const ok = test(input.value.trim());
    field.classList.remove('is-invalid');
    if (!ok) { void field.offsetWidth; field.classList.add('is-invalid'); }
    field.classList.toggle('is-valid', ok);
    if (!ok) input.addEventListener('input', () => field.classList.remove('is-invalid'), { once: true });
    return ok;
  }

  /* ---------- Confetti ---------- */
  function confetti() {
    if (RM) return;
    const c = $('#confetti'), ctx = c.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const colors = ['#C47A82', '#C6A266', '#EFD3CF', '#5A3647', '#F2B66B', '#E9CF98'];
    const parts = Array.from({ length: 170 }, () => ({
      x: innerWidth / 2 + (Math.random() - .5) * 120, y: innerHeight * .45,
      vx: (Math.random() - .5) * 18, vy: -Math.random() * 16 - 4,
      s: 5 + Math.random() * 7, r: Math.random() * 6.28, vr: (Math.random() - .5) * .35,
      c: colors[Math.floor(Math.random() * colors.length)], rect: Math.random() < .6
    }));
    let frame = 0;
    (function f() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts.forEach(p => {
        p.vy += .38; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
        if (p.rect) ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        else { ctx.beginPath(); ctx.arc(0, 0, p.s / 2.6, 0, 7); ctx.fill(); }
        ctx.restore();
      });
      if (++frame < 200) requestAnimationFrame(f); else ctx.clearRect(0, 0, innerWidth, innerHeight);
    })();
  }

  /* ---------- Search overlay ---------- */
  const search = $('#search'), sInput = $('#searchInput');
  function openSearch() {
    search.classList.add('is-open');
    search.setAttribute('aria-hidden', 'false');
    lock('search', true);
    renderSearch('');
    setTimeout(() => sInput.focus(), 350);
  }
  function closeSearch() {
    if (!search.classList.contains('is-open')) return;
    search.classList.remove('is-open');
    search.setAttribute('aria-hidden', 'true');
    lock('search', false);
  }
  function highlight(text, q) {
    if (!q) return text;
    const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
    return text.replace(re, '<mark>$1</mark>');
  }
  function renderSearch(raw) {
    const q = raw.trim().toLowerCase();
    const res = q
      ? PRODUCTS.filter(p => [p.name, CAT_LABEL[p.cat], p.ingredients, ...(p.shades || []).map(s => s.n)].join(' ').toLowerCase().includes(q))
      : PRODUCTS.filter(p => ['Bestseller', 'New', 'Limited'].includes(p.badge));
    const safe = raw.replace(/[<>&]/g, '');
    $('#searchLabel').textContent = q ? `${res.length} result${res.length === 1 ? '' : 's'} for “${safe}”` : 'Trending now';
    $('#searchResults').innerHTML = res.length
      ? res.map((p, i) => `<button class="sr-item" data-qv="${p.id}" style="animation-delay:${i * 40}ms">
          <div class="line-thumb" style="--tint:${p.tint}">${artOf(p, 0)}</div>
          <div><strong>${highlight(p.name, safe.trim())}</strong><small>${CAT_LABEL[p.cat]} · ${fmt(p.price)}</small></div></button>`).join('')
      : `<p class="sr-empty">No matches. Try “serum”, “rose” or a shade like “Berry”.</p>`;
  }
  $('#searchBtn').addEventListener('click', openSearch);
  $('#searchClose').addEventListener('click', closeSearch);
  sInput.addEventListener('input', () => renderSearch(sInput.value));
  sInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { const first = $('#searchResults .sr-item'); if (first) first.click(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); const first = $('#searchResults .sr-item'); if (first) first.focus(); }
  });
  $$('.search-suggest button').forEach(b => b.addEventListener('click', () => { sInput.value = b.dataset.s; renderSearch(b.dataset.s); sInput.focus(); }));

  /* ---------- Countdown ---------- */
  function initCountdown() {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + ((6 - now.getDay() + 7) % 7), 23, 59, 59);
    if (end - now < 6 * 3600e3) end.setDate(end.getDate() + 7);
    const nums = $$('#countdown .cd-num');
    const prev = [];
    const tick = () => {
      const s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60]
        .map(v => String(v).padStart(2, '0'))
        .forEach((v, i) => { if (prev[i] !== v) { nums[i].innerHTML = `<span>${v}</span>`; prev[i] = v; } });
    };
    tick();
    setInterval(tick, 1000);
    const code = $('#copyCode');
    code.addEventListener('click', () => {
      const done = () => toast('Code <b>GLOW20</b> copied — paste it at checkout');
      if (navigator.clipboard) navigator.clipboard.writeText('GLOW20').then(done, done); else done();
    });
  }

  /* ---------- Virtual try-on ---------- */
  function initTryOn() {
    const SKINS = [
      { n: 'Fair', s: '#F3D6C4', d: '#E0B8A2', lip: '#D99A95' },
      { n: 'Light', s: '#E8C0A2', d: '#D2A283', lip: '#C9857F' },
      { n: 'Medium', s: '#C99772', d: '#B27F5B', lip: '#A9675F' },
      { n: 'Tan', s: '#A97553', d: '#8F5F40', lip: '#8A4F48' },
      { n: 'Deep', s: '#714631', d: '#5A3624', lip: '#5E3430' }
    ];
    const LIPS = [];
    ['velvet-lip', 'lip-oil'].forEach(pid => byId[pid].shades.forEach((sh, i) => LIPS.push({ pid, i, ...sh, finish: pid === 'lip-oil' ? 'gloss' : 'matte' })));
    const st = { skin: 2, lip: 0, finish: 'matte', int: 85 };
    const face = $('#tryFace'), stage = $('#tryStage');
    const finishSeg = $('#finishSeg'), segInd = $('.seg-indicator', finishSeg);

    $('#skinTones').innerHTML = SKINS.map((s, i) => `<button class="shade-btn skin-btn ${i === st.skin ? 'is-active' : ''}" style="--c:${s.s}" data-i="${i}" role="radio" aria-checked="${i === st.skin}" aria-label="${s.n}" title="${s.n}"></button>`).join('');
    $('#lipShades').innerHTML = ['velvet-lip', 'lip-oil'].map(pid =>
      `<p class="shade-sub">${byId[pid].name}</p><div class="shade-grid" role="radiogroup" aria-label="${byId[pid].name} shades">${LIPS.map((l, i) => l.pid === pid
        ? `<button class="shade-btn ${i === st.lip ? 'is-active' : ''}" style="--c:${l.c}" data-i="${i}" role="radio" aria-checked="${i === st.lip}" aria-label="${l.n}" title="${l.n}"></button>` : '').join('')}</div>`).join('');

    const apply = scan => {
      const S = SKINS[st.skin], L = LIPS[st.lip];
      face.style.setProperty('--skin', S.s);
      face.style.setProperty('--skin-d', S.d);
      face.style.setProperty('--lip-n', S.lip);
      face.style.setProperty('--lip', L.c);
      const f = st.finish;
      face.style.setProperty('--lip-o', (st.int / 100) * (f === 'gloss' ? .82 : f === 'satin' ? .92 : 1));
      face.style.setProperty('--gl', f === 'gloss' ? .85 : f === 'satin' ? .35 : 0);
      $('#skinName').textContent = S.n;
      $('#lipName').textContent = L.n;
      $('#tryTagColor').style.setProperty('--c', L.c);
      $('#tryTagName').textContent = L.n;
      $('#tryTagProduct').textContent = byId[L.pid].name;
      $('#tryPrice').textContent = fmt(byId[L.pid].price);
      $('#intensityOut').textContent = st.int + '%';
      if (scan && !RM) restartAnim(stage, 'is-scanning');
    };
    const setFinish = v => {
      st.finish = v;
      $$('button', finishSeg).forEach(b => { const on = b.dataset.v === v; b.classList.toggle('is-active', on); b.setAttribute('aria-checked', on); });
      moveIndicator(segInd, $('.is-active', finishSeg));
    };

    $('#skinTones').addEventListener('click', e => {
      const b = e.target.closest('.shade-btn'); if (!b) return;
      st.skin = +b.dataset.i;
      $$('#skinTones .shade-btn').forEach(x => { x.classList.toggle('is-active', x === b); x.setAttribute('aria-checked', x === b); });
      apply(true);
    });
    $('#lipShades').addEventListener('click', e => {
      const b = e.target.closest('.shade-btn'); if (!b) return;
      st.lip = +b.dataset.i;
      $$('#lipShades .shade-btn').forEach(x => { x.classList.toggle('is-active', x === b); x.setAttribute('aria-checked', x === b); });
      setFinish(LIPS[st.lip].finish);
      apply(true);
    });
    finishSeg.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { setFinish(b.dataset.v); apply(); } });
    const range = $('#intensity');
    const syncRange = () => range.style.setProperty('--p', ((range.value - 20) / 80 * 100) + '%');
    range.addEventListener('input', () => { st.int = +range.value; syncRange(); apply(); });
    syncRange();

    // hold to compare
    const cmp = $('#compareBtn');
    const bare = on => stage.classList.toggle('is-bare', on);
    cmp.addEventListener('pointerdown', () => bare(true));
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => cmp.addEventListener(ev, () => bare(false)));
    cmp.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); bare(true); } });
    cmp.addEventListener('keyup', () => bare(false));

    $('#tryAdd').addEventListener('click', () => {
      const L = LIPS[st.lip];
      addToCart(L.pid, L.i, 1, $('.tryon-tag', stage));
    });

    // subtle head follow
    if (FINE && !RM) {
      stage.addEventListener('pointermove', e => {
        const r = stage.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        face.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 6}deg)`;
      });
      stage.addEventListener('pointerleave', () => { face.style.transform = ''; });
    }
    requestAnimationFrame(() => moveIndicator(segInd, $('.is-active', finishSeg)));
    if (document.fonts) document.fonts.ready.then(() => moveIndicator(segInd, $('.is-active', finishSeg)));
    apply();
  }

  /* ---------- Skin quiz ---------- */
  function initQuiz() {
    const Q = [
      { key: 'skin', q: 'How does your skin feel by midday?', opts: [
        ['dry', 'Tight & dry', 'Flaky patches, craves moisture', '❋'], ['oily', 'Shiny all over', 'Visible shine, enlarged pores', '◍'],
        ['combination', 'Shiny T-zone only', 'Dry cheeks, oily centre', '◐'], ['sensitive', 'Easily irritated', 'Redness, reacts to new products', '✿']] },
      { key: 'concern', q: 'What would you love to change first?', opts: [
        ['dullness', 'Dullness', 'Bring back the glow', '☼'], ['acne', 'Breakouts', 'Clearer, calmer skin', '◌'],
        ['aging', 'Fine lines', 'Firmer, smoother look', '❍'], ['hydration', 'Dehydration', 'Plump, bouncy skin', '◉']] },
      { key: 'routine', q: 'How many steps do you enjoy?', opts: [
        ['minimal', 'The essentials', '2 steps, under 2 minutes', 'I'], ['balanced', 'Balanced', '3 steps, morning & night', 'II'],
        ['full', 'The full ritual', '4 steps — it\'s my me-time', 'III']] },
      { key: 'scent', q: 'Pick a scent mood for your ritual', opts: [
        ['floral', 'Soft florals', 'Rose, jasmine, white musk', '✿'], ['woody', 'Warm & woody', 'Oud, amber, sandalwood', '✦'],
        ['none', 'Fragrance-free', 'Keep it pure and simple', '○']] }
    ];
    const answers = {};
    let step = 0;
    const body = $('#quizBody'), prog = $('#quizProgress'), label = $('#quizStepLabel'), time = $('#quizTime');

    const render = (dir = 1) => {
      prog.style.width = (step / Q.length) * 100 + '%';
      label.textContent = `Question ${step + 1} of ${Q.length}`;
      time.textContent = `≈ ${(Q.length - step) * 12} sec left`;
      const s = Q[step];
      body.innerHTML = `<div class="quiz-step ${dir < 0 ? 'back' : ''}">
        <h3>${s.q}</h3>
        <div class="options ${s.opts.length === 3 ? 'three' : ''}" role="radiogroup" aria-label="${s.q}">
          ${s.opts.map(([v, t, sub, ico]) => `<button class="option ${answers[s.key] === v ? 'is-selected' : ''}" data-v="${v}" role="radio" aria-checked="${answers[s.key] === v}">
            <span class="option-ico">${ico}</span><span><strong>${t}</strong><small>${sub}</small></span></button>`).join('')}
        </div>
        <div class="quiz-nav">
          ${step > 0 ? '<button class="btn btn-ghost btn-sm" data-back>← Back</button>' : '<span class="hint">Tap an answer to continue</span>'}
          ${answers[s.key] ? '<button class="btn btn-primary btn-sm" data-next>Next →</button>' : '<span></span>'}
        </div>
      </div>`;
    };
    const next = () => { if (step < Q.length - 1) { step++; render(1); } else finish(); };
    body.addEventListener('click', e => {
      const opt = e.target.closest('.option');
      if (opt && !body.dataset.busy) {
        answers[Q[step].key] = opt.dataset.v;
        $$('.option', body).forEach(o => { o.classList.toggle('is-selected', o === opt); o.setAttribute('aria-checked', o === opt); });
        body.dataset.busy = '1';
        setTimeout(() => { delete body.dataset.busy; next(); }, 420);
        return;
      }
      if (e.target.closest('[data-back]')) { step--; render(-1); }
      if (e.target.closest('[data-next]')) next();
      if (e.target.closest('[data-retake]')) { Object.keys(answers).forEach(k => delete answers[k]); step = 0; render(-1); }
      if (e.target.closest('[data-addall]')) {
        const ids = JSON.parse(e.target.closest('[data-addall]').dataset.addall);
        ids.forEach(id => addToCart(id, 0, 1, null, { silent: true }));
        toast(`Your ritual (${ids.length} products) was added to your bag`, { label: 'View bag', fn: () => openDrawer('bag') });
        openDrawer('bag');
      }
    });

    function recommend(a) {
      const base = {
        dullness: ['vitc-toner', 'rose-serum', 'hydra-cream'], acne: ['vitc-toner', 'hydra-cream', 'rose-serum'],
        aging: ['rose-serum', 'hydra-cream', 'vitc-toner'], hydration: ['rose-serum', 'hydra-cream', 'deadsea-butter']
      }[a.concern];
      let list = [...base];
      if (a.skin === 'sensitive') list = list.filter(x => x !== 'vitc-toner');
      if (a.skin === 'dry' || a.skin === 'sensitive') list.push('deadsea-butter');
      list.push('argan-elixir');
      list = [...new Set(list)].slice(0, { minimal: 2, balanced: 3, full: 4 }[a.routine]);
      if (a.scent === 'floral') list.push('jasmine-perfume');
      if (a.scent === 'woody') list.push('oud-mist');
      return list;
    }
    const WHY = {
      'vitc-toner': 'Brightens and smooths texture to prep skin', 'rose-serum': 'Hydrates deeply and restores glow',
      'hydra-cream': 'Locks in moisture and calms the barrier', 'deadsea-butter': 'Rich minerals for dry, tight areas',
      'argan-elixir': 'A finishing touch for glossy hair', 'jasmine-perfume': 'Your soft floral signature',
      'oud-mist': 'A warm veil for hair and body'
    };
    const TITLE = { dullness: 'Radiance', acne: 'Clarity', aging: 'Renewal', hydration: 'Hydration' };
    const SKIN = { dry: 'dry', oily: 'oily', combination: 'combination', sensitive: 'sensitive' };

    function finish() {
      prog.style.width = '100%';
      label.textContent = 'Analysing';
      time.textContent = '';
      body.innerHTML = `<div class="quiz-step quiz-loading"><div class="spinner"></div><p>Building your ritual…</p></div>`;
      setTimeout(() => {
        const ids = recommend(answers);
        const sum = ids.reduce((s, id) => s + byId[id].price, 0);
        const match = 92 + (ids.length % 3) * 2 + (answers.skin === 'combination' ? 1 : 0);
        label.textContent = 'Your result';
        body.innerHTML = `<div class="quiz-step">
          <div class="quiz-result-head">
            <div class="match-ring"><svg viewBox="0 0 110 110"><circle class="bg" cx="55" cy="55" r="48"/><circle class="fg" cx="55" cy="55" r="48"/></svg><span>${match}%<small>match</small></span></div>
            <div><p class="eyebrow" style="margin-bottom:8px">Made for ${SKIN[answers.skin]} skin</p><h3>The ${TITLE[answers.concern]} Ritual</h3>
            <p>${ids.length} steps, chosen by our therapists for your skin and the time you like to spend.</p></div>
          </div>
          <div class="ritual-list">${ids.map((id, i) => {
            const p = byId[id];
            return `<div class="ritual-item" style="animation-delay:${.15 + i * .12}s"><div class="ritual-thumb" style="--tint:${p.tint}">${artOf(p, 0)}</div>
              <div><strong>${p.name}</strong><small>${WHY[id]}</small></div><button class="btn btn-ghost btn-sm" data-qv="${id}">${fmt(p.price)}</button></div>`;
          }).join('')}</div>
          <div class="ritual-foot">
            <div class="sum">Ritual total <b>${fmt(sum)}</b></div>
            <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-ghost btn-sm" data-retake>Retake quiz</button>
            <button class="btn btn-primary" data-addall='${JSON.stringify(ids)}'>Add ritual to bag ${ICON.arrow}</button></div>
          </div>
        </div>`;
        requestAnimationFrame(() => requestAnimationFrame(() => { $('.match-ring .fg', body).style.strokeDashoffset = 302 * (1 - match / 100); }));
      }, 1500);
    }
    render();
  }

  /* ---------- Before / after slider ---------- */
  function initBA() {
    const ba = $('#ba'), handle = $('#baHandle');
    let pos = 50, dragging = false, touched = false;
    const set = p => { pos = clamp(p, 2, 98); ba.style.setProperty('--pos', pos + '%'); handle.setAttribute('aria-valuenow', Math.round(pos)); };
    const fromX = x => { const r = ba.getBoundingClientRect(); set((x - r.left) / r.width * 100); };
    ba.addEventListener('pointerdown', e => {
      touched = true; dragging = true; ba.classList.add('is-dragging');
      ba.setPointerCapture(e.pointerId); fromX(e.clientX);
    });
    ba.addEventListener('pointermove', e => { if (dragging) fromX(e.clientX); });
    const stop = () => { dragging = false; ba.classList.remove('is-dragging'); };
    ba.addEventListener('pointerup', stop);
    ba.addEventListener('pointercancel', stop);
    handle.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); touched = true; set(pos + (e.key === 'ArrowRight' ? 5 : -5)); }
      if (e.key === 'Home') set(0); if (e.key === 'End') set(100);
    });
    ba.setAttribute('data-cursor', 'Drag');
    if (!RM) onVisible(ba, () => setTimeout(() => {
      if (touched) return;
      tween(50, 24, 700, v => !touched && set(v), () => tween(24, 76, 1000, v => !touched && set(v), () => tween(76, 50, 700, v => !touched && set(v))));
    }, 400));
  }

  /* ---------- Ingredients ---------- */
  function initIngredients() {
    const ING = [
      { n: 'Damask Rose', o: 'Taif valleys', b: 'Calms the look of redness and leaves a soft, dewy radiance. Naturally rich in antioxidants that help protect skin from daily stress.', p: ['rose-serum', 'lip-oil', 'jasmine-perfume'], x: 30, y: 28, s: 31 },
      { n: 'Argan Oil', o: 'Southwest Morocco', b: 'A vitamin E–rich oil that nourishes, softens and adds shine without weight. Cold-pressed by women-led cooperatives.', p: ['argan-elixir', 'velvet-lip'], x: 67, y: 22, s: 27 },
      { n: 'Dead Sea Minerals', o: 'The Dead Sea', b: 'Magnesium, calcium and potassium that support the skin barrier and smooth rough, dry texture.', p: ['deadsea-butter', 'hydra-cream'], x: 74, y: 64, s: 33 },
      { n: 'Hyaluronic Acid', o: 'Plant-fermented', b: 'Holds up to 1,000 times its weight in water for instantly plumper, bouncier-looking skin.', p: ['rose-serum', 'hydra-cream', 'silk-foundation'], x: 26, y: 69, s: 29 },
      { n: 'Vitamin C', o: 'Kakadu plum & citrus', b: 'Brightens a dull complexion and visibly fades dark spots with consistent use.', p: ['vitc-toner'], x: 50, y: 47, s: 23 },
      { n: 'Oud', o: 'Ethically sourced agarwood', b: 'A warm, resinous note at the heart of our signature fragrances. Deep, smoky and long-lasting.', p: ['oud-mist', 'jasmine-perfume'], x: 49, y: 86, s: 22 }
    ];
    const wrap = $('#bubbles'), panel = $('#ingPanel');
    wrap.innerHTML = ING.map((g, i) => `<button class="bubble ${i === 0 ? 'is-active' : ''}" role="tab" aria-selected="${i === 0}" data-i="${i}"
      style="left:${g.x}%;top:${g.y}%;width:${g.s}%;height:${g.s}%;animation-delay:${-i * 1.3}s">${g.n}</button>`).join('');
    const show = i => {
      const g = ING[i];
      $$('.bubble', wrap).forEach((b, k) => { b.classList.toggle('is-active', k === i); b.setAttribute('aria-selected', k === i); });
      panel.innerHTML = `<div class="swap-in"><h3>${g.n}</h3><div class="ing-origin">${g.o}</div><p>${g.b}</p>
        <div class="ing-found"><small>Found in</small><div>${g.p.map(id => `<button class="tag-btn" data-qv="${id}">${byId[id].name}</button>`).join('')}</div></div></div>`;
    };
    wrap.addEventListener('click', e => { const b = e.target.closest('.bubble'); if (b) show(+b.dataset.i); });
    if (FINE) wrap.addEventListener('mouseover', e => { const b = e.target.closest('.bubble'); if (b && !b.classList.contains('is-active')) show(+b.dataset.i); });
    show(0);
  }

  /* ---------- Booking ---------- */
  function initBooking() {
    const SERVICES = [
      { id: 'rose-facial', n: 'Signature Rose Facial', d: 60, p: 280, desc: 'Double cleanse, enzyme peel, rose-quartz massage and mask.' },
      { id: 'hydra-facial', n: 'Hydra Glow Facial', d: 75, p: 340, desc: 'Deep hydration infusion with hyaluronic acid and Dead Sea minerals.' },
      { id: 'lash-lift', n: 'Lash Lift & Tint', d: 45, p: 190, desc: 'A natural, wide-awake curl that lasts up to eight weeks.' },
      { id: 'brow', n: 'Brow Sculpt', d: 30, p: 120, desc: 'Shaping, tint and lamination for fuller-looking brows.' },
      { id: 'makeup', n: 'Event Makeup', d: 60, p: 320, desc: 'Full glam or a soft glow for your special occasion.' },
      { id: 'stone', n: 'Hot Stone Ritual', d: 90, p: 360, desc: 'Warm basalt stones, argan oil and a scalp massage.' }
    ];
    const THER = [
      { id: 'any', n: 'First available', r: 'Fastest booking', i: '✦', c: '#C6A266' },
      { id: 'lina', n: 'Lina', r: 'Facial specialist', i: 'L', c: '#C47A82', rt: 5 },
      { id: 'maya', n: 'Maya', r: 'Lash & brow artist', i: 'M', c: '#A3785A', rt: 4.9 },
      { id: 'noor', n: 'Noor', r: 'Makeup artist', i: 'N', c: '#5A3647', rt: 4.9 }
    ];
    const TIMES = ['10:00', '10:45', '11:30', '12:15', '13:30', '14:15', '15:00', '15:45', '16:30', '17:15', '18:00', '18:45'];
    const bk = { step: 0, svc: null, th: null, date: null, time: null };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + 60);
    let calMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const steps = $$('.bstep', $('#booking'));
    const nextBtn = $('#bkNext'), backBtn = $('#bkBack');
    const hash = s => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
    const dKey = d => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    const longDate = d => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

    $('#services').innerHTML = SERVICES.map(s => `<button class="service" data-id="${s.id}" role="radio" aria-checked="false">
      <span class="radio"></span><h4>${s.n}</h4><p>${s.desc}</p><div class="meta"><span>${s.d} min</span><span>${fmt(s.p)}</span></div></button>`).join('');
    $('#therapists').innerHTML = THER.map(t => `<button class="therapist ${t.id === 'any' ? 'any' : ''}" data-id="${t.id}" role="radio" aria-checked="false">
      <span class="av" style="--c:${t.c}">${t.i}</span><strong>${t.n}</strong><small>${t.r}</small>${t.rt ? stars(t.rt) : ''}</button>`).join('');

    const isBooked = (d, t) => hash(dKey(d) + '|' + t + '|' + (bk.th || 'any')) % 10 < (bk.th === 'any' ? 2 : 4);
    const isPast = (d, t) => {
      if (d.getTime() !== today.getTime()) return false;
      const [h, m] = t.split(':').map(Number);
      const now = new Date();
      return h * 60 + m <= now.getHours() * 60 + now.getMinutes() + 30;
    };

    function renderCal(anim) {
      const y = calMonth.getFullYear(), m = calMonth.getMonth();
      $('#calTitle').textContent = calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const first = new Date(y, m, 1).getDay();
      const days = new Date(y, m + 1, 0).getDate();
      let html = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => `<span class="cal-dow">${d}</span>`).join('');
      for (let i = 0; i < first; i++) html += '<span></span>';
      for (let d = 1; d <= days; d++) {
        const dt = new Date(y, m, d);
        const dis = dt < today || dt > maxDate || dt.getDay() === 1 || TIMES.every(t => isPast(dt, t));
        const sel = bk.date && dt.getTime() === bk.date.getTime();
        html += `<button class="cal-day ${dt.getTime() === today.getTime() ? 'is-today' : ''} ${sel ? 'is-selected' : ''}" data-d="${d}" ${dis ? 'disabled' : ''} aria-label="${dt.toDateString()}">${d}</button>`;
      }
      const g = $('#calGrid');
      g.innerHTML = html;
      if (anim) restartAnim(g, 'anim');
      $('#calPrev').disabled = y === today.getFullYear() && m === today.getMonth();
      $('#calNext').disabled = new Date(y, m + 1, 1) > maxDate;
    }
    function renderSlots() {
      const box = $('#slots');
      if (!bk.date) { box.innerHTML = '<div class="slots-empty">Pick a date to see available times.</div>'; $('#slotsDate').textContent = ''; return; }
      $('#slotsDate').textContent = longDate(bk.date);
      box.innerHTML = `<div class="slots">${TIMES.map((t, i) => {
        const dis = isBooked(bk.date, t) || isPast(bk.date, t);
        return `<button class="slot ${bk.time === t ? 'is-selected' : ''}" data-t="${t}" ${dis ? 'disabled' : ''} style="animation-delay:${i * 25}ms">${t}</button>`;
      }).join('')}</div>`;
    }
    function renderSummary() {
      const s = SERVICES.find(x => x.id === bk.svc), t = THER.find(x => x.id === bk.th);
      const row = (k, v) => `<div><dt>${k}</dt><dd class="${v ? '' : 'empty'}">${v || '—'}</dd></div>`;
      $('#bkSummary').innerHTML = row('Treatment', s && s.n) + row('Specialist', t && t.n) + row('Date', bk.date && longDate(bk.date))
        + row('Time', bk.time && `${bk.time}${s ? ` · ${s.d} min` : ''}`)
        + `<div class="bk-total"><dt>Total</dt><dd>${s ? fmt(s.p) : '—'}</dd></div>`;
    }
    const valid = () => [!!bk.svc, !!bk.th, !!(bk.date && bk.time), true][bk.step];
    function go(n, dir = 1) {
      bk.step = n;
      steps.forEach(s => { const on = +s.dataset.step === n; s.classList.toggle('is-active', on); s.classList.toggle('back', on && dir < 0); });
      $$('#bkSteps li').forEach((li, i) => {
        li.classList.toggle('is-active', i === n);
        li.classList.toggle('is-done', i < n);
        $('button', li).disabled = i > n || n === 4;
      });
      $('#bkNav').hidden = n === 4;
      backBtn.hidden = n === 0;
      nextBtn.innerHTML = n === 3 ? 'Confirm booking' : `Continue ${ICON.arrow}`;
      nextBtn.disabled = !valid();
      if (n === 2) { renderCal(); renderSlots(); }
      renderSummary();
    }
    const refresh = () => { nextBtn.disabled = !valid(); renderSummary(); };

    $('#services').addEventListener('click', e => {
      const b = e.target.closest('.service'); if (!b) return;
      bk.svc = b.dataset.id;
      $$('.service').forEach(x => { x.classList.toggle('is-selected', x === b); x.setAttribute('aria-checked', x === b); });
      refresh();
    });
    $('#therapists').addEventListener('click', e => {
      const b = e.target.closest('.therapist'); if (!b) return;
      bk.th = b.dataset.id; bk.time = null;
      $$('.therapist').forEach(x => { x.classList.toggle('is-selected', x === b); x.setAttribute('aria-checked', x === b); });
      refresh();
    });
    $('#calGrid').addEventListener('click', e => {
      const b = e.target.closest('.cal-day'); if (!b || b.disabled) return;
      bk.date = new Date(calMonth.getFullYear(), calMonth.getMonth(), +b.dataset.d);
      if (bk.time && (isBooked(bk.date, bk.time) || isPast(bk.date, bk.time))) bk.time = null;
      renderCal(); renderSlots(); refresh();
    });
    $('#calPrev').addEventListener('click', () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1); renderCal(true); });
    $('#calNext').addEventListener('click', () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1); renderCal(true); });
    $('#slots').addEventListener('click', e => {
      const b = e.target.closest('.slot'); if (!b || b.disabled) return;
      bk.time = b.dataset.t;
      $$('.slot').forEach(x => x.classList.toggle('is-selected', x === b));
      refresh();
    });
    $('#bkSteps').addEventListener('click', e => { const b = e.target.closest('button'); if (b && !b.disabled && +b.dataset.go < bk.step) go(+b.dataset.go, -1); });
    backBtn.addEventListener('click', () => go(bk.step - 1, -1));
    nextBtn.addEventListener('click', () => {
      if (bk.step < 3) { go(bk.step + 1); return; }
      const ok = [
        validate($('#bkName'), v => v.length > 1),
        validate($('#bkPhone'), v => /^[0-9+\-\s()]{9,16}$/.test(v)),
        validate($('#bkEmail'), v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v))
      ].every(Boolean);
      if (!ok) return;
      nextBtn.classList.add('is-loading');
      setTimeout(() => { nextBtn.classList.remove('is-loading'); success(); }, 1200);
    });

    function success() {
      const s = SERVICES.find(x => x.id === bk.svc);
      const t = THER.find(x => x.id === bk.th);
      const ref = 'SBT-' + Math.random().toString(36).slice(2, 7).toUpperCase();
      const name = $('#bkName').value.trim().split(' ')[0].replace(/</g, '');
      $('#bkSuccess').innerHTML = `
        <svg class="check-anim" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44"/><path d="M30 52 l14 14 l26 -30"/></svg>
        <h3>See you soon, ${name}</h3>
        <p>Your <b>${s.n}</b>${t.id !== 'any' ? ` with ${t.n}` : ''} is booked for <b>${longDate(bk.date)} at ${bk.time}</b>. A confirmation is on its way.</p>
        <div class="ref">${ref}</div>
        <div class="success-actions"><button class="btn btn-primary" id="icsBtn">Add to calendar</button><button class="btn btn-ghost" id="bkAgain">Book another</button></div>`;
      go(4);
      confetti();
      $('#icsBtn').addEventListener('click', () => {
        const [h, m] = bk.time.split(':').map(Number);
        const start = new Date(bk.date); start.setHours(h, m);
        const end = new Date(start.getTime() + s.d * 60000);
        const f = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Salam Beauty Therapy//Booking//EN', 'BEGIN:VEVENT',
          `UID:${ref}@salam-beauty`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(start)}`, `DTEND:${f(end)}`,
          `SUMMARY:${s.n} — Salam Beauty Therapy`, `DESCRIPTION:Booking reference ${ref}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
        const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
        const a = Object.assign(document.createElement('a'), { href: url, download: `salam-${ref}.ics` });
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast('Calendar invite downloaded');
      });
      $('#bkAgain').addEventListener('click', () => {
        Object.assign(bk, { svc: null, th: null, date: null, time: null });
        $$('.service, .therapist').forEach(x => { x.classList.remove('is-selected'); x.setAttribute('aria-checked', false); });
        $('#bkForm').reset();
        $$('#bkForm .field').forEach(f => f.classList.remove('is-valid', 'is-invalid'));
        go(0, -1);
      });
    }
    go(0);
  }

  /* ---------- Reviews carousel ---------- */
  function initReviews() {
    const R = [
      { n: 'Lana A.', c: '#C47A82', t: 'The Rose Glow Serum is the first thing that actually made my skin look awake. People keep asking what I\'m using.', p: 'Rose Glow Serum', d: '2 weeks ago' },
      { n: 'Maryam K.', c: '#C6A266', t: 'Booked the Signature Rose Facial for my birthday. The most relaxing hour of my year — and my skin glowed for days.', p: 'Signature Rose Facial', d: '1 month ago' },
      { n: 'Rana H.', c: '#5A3647', t: 'Finally a matte lipstick that doesn\'t dry my lips out. Desert Rose is my everyday shade now.', p: 'Velvet Matte Lipstick', d: '3 weeks ago' },
      { n: 'Dana S.', c: '#A3785A', t: 'Used the virtual try-on to pick a shade and it was spot on. Delivery was next day, beautifully wrapped.', p: 'Rose Lip Oil Tint', d: '5 days ago' },
      { n: 'Yasmin T.', c: '#B0405F', t: 'Two drops of the argan elixir and my hair has never been so soft. One bottle has lasted me three months.', p: 'Argan Hair Elixir', d: '2 months ago' },
      { n: 'Noa B.', c: '#7A4B2E', t: 'Maya did my lash lift and it looks so natural. The studio is calm, spotless and smells incredible.', p: 'Lash Lift & Tint', d: '1 week ago' }
    ];
    const track = $('#revTrack'), vp = $('#revViewport'), dotsEl = $('#revDots');
    track.innerHTML = R.map(r => `<article class="review">
      <div class="review-top">${stars(5)}<small>${r.d}</small></div>
      <blockquote>“${r.t}”</blockquote>
      <div class="review-author"><span class="av" style="--c:${r.c}">${r.n.split(' ').map(x => x[0]).join('')}</span>
        <div><strong>${r.n}</strong><span class="verified">✓ Verified ${/Facial|Lash/.test(r.p) ? 'client' : 'buyer'}</span></div>
        <span class="review-product">${r.p}</span></div>
    </article>`).join('');
    let idx = 0, timer = null;
    const per = () => innerWidth <= 640 ? 1 : innerWidth <= 900 ? 2 : 3;
    const maxI = () => Math.max(0, R.length - per());
    const stepW = () => track.children[0].offsetWidth + 24;
    const dots = () => {
      const n = maxI() + 1;
      if (dotsEl.children.length !== n) dotsEl.innerHTML = Array.from({ length: n }, (_, i) => `<button class="dot" aria-label="Go to slide ${i + 1}"></button>`).join('');
      [...dotsEl.children].forEach((d, i) => d.classList.toggle('is-active', i === idx));
    };
    const go = (i, anim = true) => {
      idx = i > maxI() ? 0 : i < 0 ? maxI() : i;
      track.style.transition = anim ? '' : 'none';
      track.style.transform = `translateX(${-idx * stepW()}px)`;
      dots();
    };
    const play = () => { stop(); if (!RM) timer = setInterval(() => go(idx + 1), 5500); };
    const stop = () => clearInterval(timer);
    $('#revPrev').addEventListener('click', () => { go(idx - 1); play(); });
    $('#revNext').addEventListener('click', () => { go(idx + 1); play(); });
    dotsEl.addEventListener('click', e => { const d = e.target.closest('.dot'); if (d) { go([...dotsEl.children].indexOf(d)); play(); } });
    vp.addEventListener('mouseenter', stop);
    vp.addEventListener('mouseleave', play);
    vp.addEventListener('focusin', stop);
    // drag / swipe
    let sx = 0, sy = 0, dx = 0, drag = false, axis = null;
    vp.addEventListener('pointerdown', e => { drag = true; axis = null; sx = e.clientX; sy = e.clientY; dx = 0; stop(); });
    vp.addEventListener('pointermove', e => {
      if (!drag) return;
      dx = e.clientX - sx;
      if (!axis) { if (Math.abs(dx) > 6 || Math.abs(e.clientY - sy) > 6) axis = Math.abs(dx) > Math.abs(e.clientY - sy) ? 'x' : 'y'; if (axis === 'x') { vp.setPointerCapture(e.pointerId); vp.classList.add('is-dragging'); } }
      if (axis !== 'x') return;
      track.style.transition = 'none';
      track.style.transform = `translateX(${-idx * stepW() + dx}px)`;
    });
    const end = () => {
      if (!drag) return;
      drag = false; vp.classList.remove('is-dragging');
      if (axis === 'x') { if (dx < -60) go(Math.min(idx + 1, maxI())); else if (dx > 60) go(Math.max(idx - 1, 0)); else go(idx); }
      play();
    };
    vp.addEventListener('pointerup', end);
    vp.addEventListener('pointercancel', end);
    addEventListener('resize', () => go(Math.min(idx, maxI()), false));
    go(0, false);
    play();
  }

  /* ---------- Gallery ---------- */
  function initGallery() {
    const G = [['rose-serum', '#F3D9D5', '2.4k'], ['golden-palette', '#EFE0CF', '1.8k'], ['lip-oil', '#F6DADC', '3.1k'],
      ['jasmine-perfume', '#EADBE3', '1.2k'], ['argan-elixir', '#F2E3CB', '980'], ['velvet-lip', '#EFD9D3', '2.7k']];
    $('#galleryGrid').innerHTML = G.map(([id, bg, likes], i) => {
      const p = byId[id];
      return `<button class="g-tile reveal" style="--bg:${bg};--rd:${i * .07}s" data-qv="${id}" data-cursor="Shop" aria-label="Shop ${p.name}">
        <div class="art">${artOf(p, i % 3 === 2 && p.shades ? 1 : 0)}</div>
        <div class="g-over">${ICON.heart.replace('<svg', '<svg style="fill:#fff;stroke:none"')}<span>${likes}</span></div></button>`;
    }).join('');
    $$('#galleryGrid .reveal').forEach(el => io.observe(el));
  }

  /* ---------- FAQ ---------- */
  function initFAQ() {
    const items = $$('.faq-item');
    items.forEach(item => $('.faq-q', item).addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      items.forEach(i => { i.classList.remove('is-open'); $('.faq-q', i).setAttribute('aria-expanded', false); });
      item.classList.toggle('is-open', open);
      $('.faq-q', item).setAttribute('aria-expanded', open);
    }));
  }

  /* ---------- Newsletter ---------- */
  function initNewsletter() {
    const form = $('#nlForm'), input = $('#nlEmail'), row = $('#nlRow'), msg = $('#nlMsg'), btn = $('#nlBtn');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const v = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
        restartAnim(row, 'is-invalid');
        msg.textContent = v ? 'Hmm, that email doesn\'t look quite right.' : 'Please enter your email address.';
        input.focus();
        return;
      }
      row.classList.remove('is-invalid');
      msg.textContent = '';
      btn.classList.add('is-loading');
      setTimeout(() => {
        form.innerHTML = `<div class="nl-success"><span style="font-size:1.6rem">✿</span><div><strong>Welcome to the ritual!</strong><br><small>Here's 10% off your first order.</small></div><span class="code" id="nlCode" title="Click to copy">SALAM10</span></div>`;
        $('#nlCode').addEventListener('click', () => {
          const done = () => toast('Code <b>SALAM10</b> copied');
          if (navigator.clipboard) navigator.clipboard.writeText('SALAM10').then(done, done); else done();
        });
      }, 1000);
    });
    input.addEventListener('input', () => { row.classList.remove('is-invalid'); msg.textContent = ''; });
  }

  /* ---------- Cookie banner ---------- */
  function initCookie() {
    if (store.get('cookies', null)) return;
    const c = $('#cookie');
    c.classList.add('is-open');
    const close = v => { store.set('cookies', v); c.classList.remove('is-open'); };
    $('#cookieAccept').addEventListener('click', () => close('all'));
    $('#cookieDecline').addEventListener('click', () => close('essential'));
  }

  /* ---------- Keyboard ---------- */
  let closeMenu = () => {};
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (modal.classList.contains('is-open')) closeModal();
      else if (search.classList.contains('is-open')) closeSearch();
      else if (drawer.classList.contains('is-open')) closeDrawer();
      else closeMenu();
    }
    if (e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName) && !layers.size) { e.preventDefault(); openSearch(); }
  });

  /* ---------- Boot ---------- */
  $('#year').textContent = new Date().getFullYear();
  initPreloader();
  initAnnounce();
  initScroll();
  closeMenu = initMenu();
  initCursor();
  initButtons();
  initReveal();
  initHero();
  initCountdown();
  initTryOn();
  initQuiz();
  initBA();
  initIngredients();
  initBooking();
  initReviews();
  initGallery();
  initFAQ();
  initNewsletter();
  updateBadges();
})();
