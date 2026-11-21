/* Raheen Cake Corner — shared behaviour */
(() => {
  const WA = '919251296090';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* open now (IST, 11:00–23:00) */
  function paint(){
    let t; try{ const p = new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());
      t = (+p.find(x=>x.type==='hour').value % 24) * 60 + +p.find(x=>x.type==='minute').value; }
    catch(e){ const d = new Date(); t = d.getHours()*60 + d.getMinutes(); }
    const on = t >= 660 && t < 1380;
    $$('[data-open]').forEach(el => el.textContent = on ? 'Open now · till 11 PM' : 'Closed · opens 11 AM');
    $$('.dot').forEach(d => d.classList.toggle('on', on));
  }
  paint(); setInterval(paint, 60000);

  /* mobile drawer */
  const drawer = $('#drawer');
  if (drawer){
    const open = () => { drawer.classList.add('open'); drawer.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; $('.x', drawer).focus(); };
    const close = () => { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden','true'); document.body.style.overflow=''; };
    $('#burger')?.addEventListener('click', open);
    $('.x', drawer).addEventListener('click', close);
    $$('a', drawer).forEach(a => a.addEventListener('click', close));
    addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  /* lazy videos: load near the viewport, play only while visible */
  const vids = $$('video[data-src]');
  if ('IntersectionObserver' in window){
    const io = new IntersectionObserver(es => es.forEach(e => {
      const v = e.target;
      if (e.isIntersecting){ if (!v.src) { v.src = v.dataset.src; } if (!reduce) v.play().catch(()=>{}); }
      else v.pause();
    }), {rootMargin:'250px 0px'});
    vids.forEach(v => io.observe(v));
  } else vids.forEach(v => { v.src = v.dataset.src; });

  /* rails */
  $$('[data-rail]').forEach(btn => btn.addEventListener('click', () => {
    const r = document.getElementById(btn.dataset.rail); if (!r) return;
    const w = (r.firstElementChild?.offsetWidth || 280) + 16;
    r.scrollBy({left: btn.dataset.dir === 'prev' ? -w : w, behavior:'smooth'});
  }));

  /* lightbox for galleries */
  const items = $$('[data-full]');
  if (items.length){
    const lb = document.createElement('div'); lb.className = 'lb'; lb.hidden = true; lb.setAttribute('role','dialog'); lb.setAttribute('aria-modal','true'); lb.setAttribute('aria-label','Gallery');
    lb.innerHTML = '<button class="c" type="button" aria-label="Close">✕</button><button class="p" type="button" aria-label="Previous">‹</button><figure style="margin:0" id="lbBox"></figure><button class="n" type="button" aria-label="Next">›</button>';
    document.body.appendChild(lb);
    let i = 0, from = null;
    const show = () => { const it = items[i], src = it.dataset.full, cap = it.dataset.cap || '';
      $('#lbBox', lb).innerHTML = (it.dataset.type === 'video' ? `<video src="${esc(src)}" autoplay loop playsinline controls></video>` : `<img src="${esc(src)}" alt="${esc(cap)}">`) + `<p>${esc(cap)} · ${i+1} / ${items.length}</p>`; };
    const close = () => { lb.hidden = true; $('#lbBox', lb).innerHTML = ''; document.body.style.overflow=''; from && from.focus(); };
    items.forEach((it, k) => it.addEventListener('click', () => { i = k; from = it; show(); lb.hidden = false; document.body.style.overflow='hidden'; $('.c', lb).focus(); }));
    $('.c', lb).onclick = close;
    $('.p', lb).onclick = () => { i = (i - 1 + items.length) % items.length; show(); };
    $('.n', lb).onclick = () => { i = (i + 1) % items.length; show(); };
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    addEventListener('keydown', e => { if (lb.hidden) return; if (e.key==='Escape') close(); if (e.key==='ArrowLeft') $('.p', lb).click(); if (e.key==='ArrowRight') $('.n', lb).click(); });
  }

  /* pill groups (single choice) */
  $$('.pills[data-name]').forEach(g => {
    g.addEventListener('click', e => { const b = e.target.closest('.pill'); if (!b) return;
      $$('.pill', g).forEach(p => p.setAttribute('aria-pressed', String(p === b))); g.dataset.value = b.dataset.v || b.textContent.trim(); g.dispatchEvent(new Event('change')); });
    const sel = $('.pill[aria-pressed="true"]', g); if (sel) g.dataset.value = sel.dataset.v || sel.textContent.trim();
  });

  /* date inputs: no past dates */
  const pad = n => String(n).padStart(2,'0'), now = new Date();
  $$('input[type="date"]').forEach(d => d.min = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`);

  /* WhatsApp booking forms */
  $$('form[data-wa]').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      let ok = true; const lines = [];
      $$('[data-label]', form).forEach(el => {
        let v = (el.classList.contains('pills') ? el.dataset.value : el.value || '').trim();
        const err = el.closest('.f')?.querySelector('.err');
        let bad = el.hasAttribute('required') && !v;
        if (!bad && el.type === 'tel') bad = v.replace(/\D/g,'').length < 10;
        if (err) err.textContent = bad ? (el.dataset.err || 'Please fill this in.') : '';
        if (bad) ok = false;
        if (v && el.type === 'date') v = new Date(v + 'T00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
        if (v) lines.push(`${el.dataset.label}: ${v}`);
      });
      const ready = $('.ready', form);
      if (!ok){ ready.hidden = true; return; }
      const extra = form.dataset.extra ? window[form.dataset.extra]?.() : '';
      const msg = `${form.dataset.wa}\n\n${extra ? extra + '\n' : ''}${lines.join('\n')}`;
      $('pre', ready).textContent = msg;
      $('a', ready).href = `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
      ready.hidden = false; ready.scrollIntoView({behavior:'smooth', block:'nearest'});
    });
  });

  /* ---------- café menu (from the café's Zomato listing) ---------- */
  const MENU = [
    ['Waffles',[['Mango Waffle',119],['Blueberry Waffle',199],['Strawberry Waffle',199],['Banana Honey Waffle',219],['Lotus Biscoff Waffle',219],['Chocolate Chip Waffle',219],['Dark Chocolate Waffle',219],['KitKat Waffle',219],['Triple Chocolate Waffle',219],['Nutella Waffle',229],['Oreo Chocolate Waffle',229]]],
    ['Pastries & Brownies',[['Pineapple Pastry',80],['Butterscotch Pastry',90],['Black Forest Pastry',90],['Fresh Fruit Pastry',100],['Chocolate Truffle Pastry',110],['Red Velvet Pastry',120],['Lotus Biscoff Cheese Pastry',129],['Dutch Chocolate Pastry',130],['White Chocolate Brownie Bowl',149],['Chocolate Truffle Brownie',210],['Triple Chocolate Brownie Bowl',229],['Milk Chocolate Brownie Bowl',229],['Oreo Chocolate Brownie Bowl',239],['Lotus Biscoff Brownie Bowl',259],['Nutella Chocolate Brownie Bowl',259],['KitKat Brownie Bowl',269],['Blueberry Cheesecake (slice)',240]]],
    ['Coffee & Frappes',[['Black Coffee',64],['Plain Cold Coffee',78],['Cappuccino',94],['Iced Coffee',96],['Iced Americano',96],['Vanilla Cappuccino',96],['Hazelnut Cappuccino',96],['Hot Nutella Coffee',96],['Hot Chocolate',96],['Choco Chips Frappe',96],['Brownie Frappe',96],['Biscoff Frappe',96],['Nutella Frappe',96],['Oreo Frappe',96],['Caramel Frappe',96],['Hazelnut Frappe',96],['Tiramisu Frappe',96],['Iced Caramel',112],['Iced Mocha',112],['Vietnamese Coffee',112],['Hot Rocher',112]]],
    ['Shakes, Mojitos & Teas',[['Blueberry Shake',96],['KitKat Shake',96],['Strawberry Shake',96],['Oreo Shake',96],['Biscoff Shake',110],['Brownie Shake',110],['Nutella Shake',110],['Ferrero Rocher Shake',144],['Watermelon Mojito',59],['Blackcurrant Mojito',60],['Virgin Mojito',96],['Watermelon Lychee Punch',96],['Red Bull Mojito (large)',256],['Lemon Iced Tea',112],['Peach Iced Tea',112],['Cranberry Iced Tea',112],['Watermelon Iced Tea',112],['Tea',46],['Ginger, Elaichi or Rose Tea',46],['Green Tea',62]]],
    ['Pizza',[['Bread Pizza',158],['Margherita Pizza',190],['Mushroom Pizza',222],['Olive Pizza',222],['Double Cheese Pizza',238],['Hell Spicy Pizza',238],['Farm House Pizza',270],['Paneer Tikka Pizza',286],['Achari Paneer Tikka Pizza',286],['Boom Cheese Pizza',318],['Mediterranean Pizza',318]],'7-inch'],
    ['Burgers, Sandwiches & Rolls',[['Aloo Tikki Burger',110],['Cheese Burger',126],['Paneer Burger',126],['Royal Paneer Burger',158],['HOB Special Burger',190],['Plain Sandwich',158],['Bombay Sandwich',190],['Paneer Sandwich',222],['Falafel Sandwich',222],['Potato Roll',190],['Veg Roll',206],['Cigar Roll',222],['Afghani Chaap Roll',238],['Paneer Roll',254]]],
    ['Snacks & Momos',[['Paneer Pakoda (8)',119],['Mix Veg Pakoda (8)',119],['Veg Nuggets',139],['Cheese Nuggets',163],['Tandoori Aloo Tikki',158],['Garlic Bread',158],['Cheese Garlic Bread',206],['Corn Garlic Bread',238],['Stuffed Garlic Bread',254],['Classic Garlic Bread',260],['Crispy Corn',254],['Kurkure Bhel',270],['Chinese Bhel',286],['Spring Roll',238],['Veg Steamed Momos (8)',158],['Veg Fried Momos (8)',192],['Tandoori Momos (8)',206],['White Gravy Momos (8)',222]]],
    ['Chinese, Maggi & Pasta',[['Crispy Chilli Potato',238],['Chilli Mushroom',254],['Chilli Paneer Dry',286],['Fried Rice',190],['Schezwan Fried Rice',206],['Corn Fried Rice',222],['Veg Chowmein',222],['Hakka Noodles',238],['Schezwan Noodles',254],['Chilli Garlic Noodles',270],['Singapuri Noodles',270],['Plain Maggi',110],['Masala Maggi',126],['Veg Maggi',158],['Cheese Maggi',190],['Tandoori Maggi',206],['White Sauce Pasta',350]]],
  ];
  const ml = $('#menuList');
  if (ml){
    const tabs = $('#menuTabs'), q = $('#menuQ'); let cur = 0;
    const total = MENU.reduce((n, c) => n + c[1].length, 0); $$('[data-menu-count]').forEach(e => e.textContent = total);
    tabs.innerHTML = MENU.map(([n], i) => `<button class="mtab" type="button" role="tab" data-i="${i}">${esc(n)}</button>`).join('');
    tabs.addEventListener('click', e => { const b = e.target.closest('.mtab'); if (!b) return; cur = +b.dataset.i; q.value = ''; render(); });
    const row = ([n, p], cat) => `<div class="mi"><span class="veg" title="Vegetarian"></span><b>${esc(n)}</b><span class="pr">₹${p}</span>${cat ? `<small>${esc(cat)}</small>` : ''}</div>`;
    function render(){
      const s = q.value.trim().toLowerCase();
      $$('.mtab', tabs).forEach((b, i) => b.setAttribute('aria-selected', String(!s && i === cur)));
      if (s){ const hits = []; MENU.forEach(([c, l]) => l.forEach(it => { if ((it[0] + ' ' + c).toLowerCase().includes(s)) hits.push(row(it, c)); }));
        ml.innerHTML = hits.length ? `<h3 class="mhead">${hits.length} matches</h3>` + hits.join('') : `<p class="muted" style="grid-column:1/-1">Nothing matches “${esc(s)}”. Try “waffle”, “brownie” or “pizza”.</p>`; }
      else { const [c, l, sub] = MENU[cur]; ml.innerHTML = `<h3 class="mhead">${esc(c)}${sub ? ` <small class="muted" style="font:400 .9rem var(--sans)">· ${esc(sub)}</small>` : ''}</h3>` + l.map(it => row(it)).join(''); }
    }
    q.addEventListener('input', render); render();
  }

  /* ---------- cake builder ---------- */
  const svg = $('#cakeSvg');
  if (svg){
    const FL = { 'Vanilla':[399,'#F7E9C8','#FFFFFF'], 'Pineapple':[449,'#F7D774','#FFF8DD'], 'Strawberry':[499,'#F3B3C3','#FFFFFF'], 'Black Forest':[499,'#4A2418','#FFFFFF'],
      'White Forest':[550,'#F3EADB','#7A5A48'], 'Choco Chips':[600,'#5A2E1F','#F3E6D6'], 'Chocolate Truffle':[650,'#3A1A12','#6E4434'], 'KitKat':[800,'#7A4428','#C98A54'], 'Oreo':[850,'#2B2B2B','#FFFFFF'], 'Ferrero Rocher':[1000,'#A0662B','#3A1A12'] };
    const KG = { '½ kg':1, '1 kg':2, '1½ kg':3, '2 kg':4 };
    const t1 = $('#t1'), t2 = $('#t2'), d1 = $('#drip1'), d2 = $('#drip2'), msgT = $('#msgTxt'), est = $('#est'), cand = $('#candles'), tops = $('#toppers');
    const gF = $('[data-name="flavour"]'), gS = $('[data-name="weight"]'), gC = $('[data-name="candles"]'), msg = $('#cMsg');
    function draw(){
      const f = gF.dataset.value || 'Vanilla', [price, base, drip] = FL[f], w = gS.dataset.value || '½ kg';
      [t1, t2].forEach(t => t.setAttribute('fill', base)); [d1, d2].forEach(d => d.setAttribute('fill', drip));
      let tp = '';
      if (/Forest|Chips|Truffle/.test(f)) for (let i = 0; i < 5; i++) tp += `<circle cx="${140+i*30}" cy="116" r="8" fill="#9E1B32"/>`;
      if (f === 'Strawberry') for (let i = 0; i < 5; i++) tp += `<path d="M${132+i*34} 118 q8 -14 16 0 q-8 14 -16 0z" fill="#C93A52"/>`;
      if (f === 'Oreo') for (let i = 0; i < 4; i++) tp += `<circle cx="${148+i*35}" cy="114" r="11" fill="#1E1E1E" stroke="#fff" stroke-width="3"/>`;
      if (f === 'KitKat') for (let i = 0; i < 6; i++) tp += `<rect x="${125+i*26}" y="92" width="18" height="34" rx="3" fill="#A61C1C"/>`;
      if (f === 'Ferrero Rocher') for (let i = 0; i < 4; i++) tp += `<circle cx="${150+i*33}" cy="112" r="11" fill="#C8A04A" stroke="#7A5418" stroke-width="2"/>`;
      if (f === 'Pineapple') for (let i = 0; i < 4; i++) tp += `<circle cx="${150+i*33}" cy="114" r="10" fill="#E7A21B" stroke="#fff" stroke-width="4"/>`;
      if (f === 'Vanilla' || f === 'White Forest') for (let i = 0; i < 5; i++) tp += `<circle cx="${140+i*30}" cy="116" r="6" fill="#B48A4A"/>`;
      tops.innerHTML = tp;
      const n = ({'None':0,'1':1,'2':2,'3':3,'5':5})[gC.dataset.value] ?? 0; let c = '';
      for (let i = 0; i < n; i++){ const x = 200 + (i - (n-1)/2) * 26;
        c += `<rect x="${x-3.5}" y="72" width="7" height="32" rx="3" fill="${['#B48A4A','#0F3B3A','#E8B7A8'][i%3]}"/><path d="M${x} 54 q7 9 0 16 q-7 -7 0 -16z" fill="#F2B33D"><animate attributeName="d" dur=".7s" repeatCount="indefinite" values="M${x} 54 q7 9 0 16 q-7 -7 0 -16z;M${x} 52 q5 11 0 18 q-6 -9 0 -18z;M${x} 54 q7 9 0 16 q-7 -7 0 -16z"/></path>`; }
      cand.innerHTML = c;
      msgT.textContent = (msg.value || ' ').slice(0, 22); msgT.setAttribute('font-size', msgT.textContent.length > 14 ? 16 : 21);
      est.innerHTML = `₹${(price * KG[w]).toLocaleString('en-IN')}<small>approx. for ${esc(w)} · ${esc(f)}</small>`;
    }
    [gF, gS, gC].forEach(g => g.addEventListener('change', draw)); msg.addEventListener('input', draw); draw();
    window.cakeSummary = () => { const f = gF.dataset.value, w = gS.dataset.value; return `Approx. price: ₹${(FL[f][0] * KG[w]).toLocaleString('en-IN')}`; };
  }

  /* copy number */
  $$('[data-copy]').forEach(b => b.addEventListener('click', () => { const o = b.textContent;
    try { navigator.clipboard.writeText(b.dataset.copy).then(() => { b.textContent = 'Copied'; setTimeout(() => b.textContent = o, 1500); }).catch(() => { b.textContent = 'Select the number'; setTimeout(() => b.textContent = o, 1800); }); }
    catch(e){ b.textContent = 'Select the number'; } }));
})();

/* stacking cards: covered cards shrink and dim as the next one slides over */
(() => {
  const cards = [...document.querySelectorAll('#stack .sc')];
  if (!cards.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let ticking = false;
  function update(){
    ticking = false;
    const vh = innerHeight;
    cards.forEach((c, i) => {
      const next = cards[i + 1];
      if (!next){ c.style.transform = ''; c.style.filter = ''; return; }
      const top = parseFloat(getComputedStyle(c).top) || 0;
      const nt = next.getBoundingClientRect().top;
      const p = Math.min(1, Math.max(0, (vh - nt) / (vh - top)));
      c.style.transform = `scale(${1 - p * 0.09})`;
      c.style.filter = `brightness(${1 - p * 0.38})`;
    });
  }
  addEventListener('scroll', () => { if (!ticking){ ticking = true; requestAnimationFrame(update); } }, {passive:true});
  addEventListener('resize', update); update();
})();
