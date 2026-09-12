/* ============================================================
   AMARIX007 — Core Engine  (assets/js/app.js)
   يحتوي: طبقة API (قابلة للتبديل بالسيرفر) · السلة · المصادقة
   المحلية · محرّك العرض الديناميكي · السلايدر · البحث · الحركات
   ============================================================ */
const AMX = (() => {
'use strict';

/* ---------- 1) API LAYER -----------------------------------
   عند جهوزية الـ Back-End: بدّل جسم كل دالة بـ fetch فقط.
   مثال:  const r = await fetch(API+'/games?'+new URLSearchParams(q));
----------------------------------------------------------- */
const API_BASE = '/api';           // سيصبح https://api.amarix007.com
const api = {
  async getGames(q = {}) {
    // return (await fetch(`${API_BASE}/games?`+new URLSearchParams(q))).json();
    await wait(60);                                     // محاكاة زمن الشبكة
    let out = [...window.AMX_DATA.games];
    if (q.platform)  out = out.filter(g => g.platform === q.platform);
    if (q.genre)     out = out.filter(g => g.genres.includes(q.genre));
    if (q.featured)  out = out.filter(g => g.featured);
    if (q.hero)      out = out.filter(g => g.inHero);
    if (q.isNew)     out = out.filter(g => g.isNew);
    if (q.maxPrice)  out = out.filter(g => final(g) <= +q.maxPrice);
    if (q.search) {
      const s = q.search.toLowerCase().trim();
      out = out.filter(g => g.title.toLowerCase().includes(s) || g.genres.join(' ').includes(s));
    }
    const S = {
      'disc'  : (a,b) => b.discount - a.discount,
      'price' : (a,b) => final(a) - final(b),
      'price-': (a,b) => final(b) - final(a),
      'rate'  : (a,b) => b.rating - a.rating,
      'new'   : (a,b) => new Date(b.createdAt) - new Date(a.createdAt),
      'az'    : (a,b) => a.title.localeCompare(b.title),
    };
    if (q.sort && S[q.sort]) out.sort(S[q.sort]);
    const total = out.length, page = +q.page || 1, limit = +q.limit || total;
    return { total, page, pages: Math.ceil(total / limit), games: out.slice((page-1)*limit, page*limit) };
  },
  async getCategories(){ return window.AMX_DATA.categories; },
  async getUpcoming(){ return window.AMX_DATA.upcoming; },
};

const wait  = ms => new Promise(r => setTimeout(r, ms));
const final = g => +(g.price * (1 - g.discount/100)).toFixed(2);
const money = n => n === 0 ? 'مجاناً' : '$' + n.toFixed(2);
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- 2) STORE (localStorage) ---------------------- */
const LS = {
  get(k, d){ try { return JSON.parse(localStorage.getItem('amx_'+k)) ?? d; } catch { return d; } },
  set(k, v){ localStorage.setItem('amx_'+k, JSON.stringify(v)); },
};
const cart = {
  items(){ return LS.get('cart', []); },
  has(id){ return this.items().some(i => i.id === id); },
  count(){ return this.items().length; },
  total(){ return +this.items().reduce((s,i) => s + i.price, 0).toFixed(2); },
  add(g){
    const it = this.items();
    if (it.some(i => i.id === g._id)) { toast('موجود في السلة بالفعل 🛒'); return false; }
    it.push({ id:g._id, title:g.title, price:final(g), cover:g.cover, platform:g.platform });
    LS.set('cart', it); sync(); toast(`أُضيفت «${g.title}» للسلة`, 'ok'); return true;
  },
  remove(id){ LS.set('cart', this.items().filter(i => i.id !== id)); sync(); },
  clear(){ LS.set('cart', []); sync(); },
};
const auth = {
  user(){ return LS.get('user', null); },
  login(email, name){ LS.set('user', { email, name: name || email.split('@')[0], since:Date.now() }); },
  logout(){ localStorage.removeItem('amx_user'); location.href = 'index.html'; },
};
const library = {
  ids(){ return LS.get('lib', []); },
  addMany(ids){ LS.set('lib', [...new Set([...this.ids(), ...ids])]); },
};

/* ---------- 3) TOASTS ----------------------------------- */
function toast(msg, kind=''){
  let box = $('.toasts'); if (!box){ box = el('div','toasts'); document.body.append(box); }
  const t = el('div','toast '+kind); t.innerHTML = `<span>${kind==='ok'?'✅':'ℹ️'}</span><span>${esc(msg)}</span>`;
  box.append(t);
  setTimeout(() => { t.style.opacity=0; t.style.transform='translateY(10px)'; setTimeout(()=>t.remove(),350); }, 2600);
}
const el = (tag, cls='', html='') => { const n=document.createElement(tag); if(cls)n.className=cls; if(html)n.innerHTML=html; return n; };

/* ---------- 4) SHARED SHELL (navbar + footer + drawer) --- */
const NAV = [
  ['index.html','المتجر'],['store.html','كل الألعاب'],['android.html','ألعاب الأندرويد'],
  ['library.html','مكتبتي'],['support.html','الدعم'],
];
function shell(active=''){
  const u = auth.user();
  document.body.insertAdjacentHTML('afterbegin', `
  <nav class="nav"><div class="wrap">
    <button class="icon-btn burger" id="amxBurger" aria-label="القائمة">☰</button>
    <a href="index.html" class="logo"><span class="mark">A7</span><span class="txt">AMARIX007</span></a>
    <div class="nav-links" id="amxLinks">
      ${NAV.map(([h,t]) => `<a href="${h}" class="${h===active?'active':''}">${t}</a>`).join('')}
    </div>
    <div class="search" id="amxSearchBox">
      <input id="amxSearch" type="search" placeholder="ابحث عن لعبة، تصنيف، أو منتج…" autocomplete="off">
      <span class="ico">🔍</span>
      <div class="glass search-pop" id="amxPop"></div>
    </div>
    <div class="nav-actions">
      <button class="icon-btn" id="amxCartBtn" aria-label="السلة">🛒<span class="badge hide" id="amxBadge">0</span></button>
      ${u ? `<button class="icon-btn" id="amxUser" title="${esc(u.email)}">${esc(u.name[0].toUpperCase())}</button>`
           : `<a class="btn btn-primary btn-sm" href="login.html">دخول</a>`}
    </div>
  </div></nav>

  <div class="overlay" id="amxOverlay"></div>
  <aside class="drawer" id="amxDrawer" aria-label="سلة المشتريات">
    <header><b>سلة المشتريات</b><button class="icon-btn" id="amxClose">✕</button></header>
    <div class="items" id="amxItems"></div>
    <footer>
      <div class="row"><span class="muted">المجموع الفرعي</span><span id="amxSub">$0.00</span></div>
      <div class="row"><span class="muted">ضريبة/رسوم</span><span class="muted">تُحسب في الدفع</span></div>
      <div class="row total"><span>الإجمالي</span><span class="gtext" id="amxTot">$0.00</span></div>
      <a class="btn btn-primary btn-block" href="checkout.html">إتمام الشراء</a>
      <button class="btn btn-ghost btn-block btn-sm" id="amxClear">تفريغ السلة</button>
    </footer>
  </aside>`);

  document.body.insertAdjacentHTML('beforeend', `
  <footer><div class="wrap">
    <div class="fgrid">
      <div>
        <a href="index.html" class="logo"><span class="mark">A7</span><span class="txt">AMARIX007</span></a>
        <p class="muted" style="font-size:.88rem;line-height:1.8;max-width:34ch;margin:.9rem 0 0">
          منصتك العربية لشراء ألعاب الكمبيوتر والأندرويد والمنتجات الرقمية — تسليم فوري وأسعار تنافسية.</p>
        <div class="pays">
          <span class="pay">💳 Visa</span><span class="pay">💳 MasterCard</span>
          <span class="pay">🪙 USDT (TRC20)</span><span class="pay">🅿️ PayPal</span>
        </div>
        <div class="socials">
          <a href="#" aria-label="X">𝕏</a><a href="#" aria-label="Discord">🎮</a>
          <a href="#" aria-label="YouTube">▶</a><a href="#" aria-label="Telegram">✈</a>
        </div>
      </div>
      <div><h5>المتجر</h5><ul>
        <li><a href="store.html?sort=disc">أقوى الخصومات</a></li><li><a href="store.html?sort=new">إصدارات جديدة</a></li>
        <li><a href="store.html?maxPrice=10">أقل من 10$</a></li><li><a href="android.html">ألعاب الأندرويد</a></li>
        <li><a href="store.html?maxPrice=0">ألعاب مجانية</a></li></ul></div>
      <div><h5>حسابي</h5><ul>
        <li><a href="login.html">تسجيل الدخول</a></li><li><a href="signup.html">إنشاء حساب</a></li>
        <li><a href="library.html">مكتبة الألعاب</a></li><li><a href="checkout.html">السلة والدفع</a></li></ul></div>
      <div><h5>المساعدة</h5><ul>
        <li><a href="support.html">مركز الدعم</a></li><li><a href="support.html#faq">الأسئلة الشائعة</a></li>
        <li><a href="support.html#refund">سياسة الاستبدال</a></li><li><a href="support.html#terms">الشروط والخصوصية</a></li></ul></div>
    </div>
    <div class="fbottom">
      <span>© ${new Date().getFullYear()} AMARIX007 — جميع الحقوق محفوظة.</span>
      <span>صُنع بشغف للاعبين العرب 🎮</span>
    </div>
  </div></footer>`);

  /* أحداث الهيكل */
  const drawer = $('#amxDrawer'), ov = $('#amxOverlay');
  const open  = () => { drawer.classList.add('on'); ov.classList.add('on'); renderCart(); };
  const close = () => { drawer.classList.remove('on'); ov.classList.remove('on'); };
  $('#amxCartBtn').onclick = open; $('#amxClose').onclick = close; ov.onclick = close;
  $('#amxClear').onclick = () => { cart.clear(); toast('تم تفريغ السلة'); };
  $('#amxBurger').onclick = () => $('#amxLinks').classList.toggle('open');
  if ($('#amxUser')) $('#amxUser').onclick = () => { if (confirm('تسجيل الخروج؟')) auth.logout(); };
  addEventListener('scroll', () => $('.nav').classList.toggle('scrolled', scrollY > 12), { passive:true });
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  liveSearch(); sync(); reveal();
}

function sync(){
  const b = $('#amxBadge'); if (!b) return;
  b.textContent = cart.count(); b.classList.toggle('hide', !cart.count());
  if ($('#amxSub')) { $('#amxSub').textContent = money(cart.total()); $('#amxTot').textContent = money(cart.total()); }
  if (drawerOpen()) renderCart();
  $$('.add').forEach(a => a.classList.toggle('in-cart', cart.has(a.dataset.id)));
  document.dispatchEvent(new Event('amx:cart'));
}
const drawerOpen = () => $('#amxDrawer')?.classList.contains('on');

function renderCart(){
  const box = $('#amxItems'); if (!box) return;
  const it = cart.items();
  box.innerHTML = it.length ? it.map(i => `
    <div class="ci"><img src="${i.cover}" alt="">
      <div><b>${esc(i.title)}</b><span class="muted" style="font-size:.75rem">${i.platform==='pc'?'PC':'Android'}</span>
      <div class="p">${money(i.price)}</div></div>
      <button class="rm" data-rm="${i.id}" aria-label="حذف">🗑</button></div>`).join('')
    : `<div class="empty">🛒<br><br>سلتك فارغة.<br><a class="gtext" href="store.html">تصفّح المتجر</a></div>`;
  $$('[data-rm]', box).forEach(b => b.onclick = () => { cart.remove(b.dataset.rm); toast('تم الحذف'); });
}

/* ---------- 5) CARD + GRID RENDERER --------------------- */
function cardHTML(g){
  const f = final(g), fb = g.fallback.replace(/'/g,'%27');
  return `<article class="card reveal" data-slug="${g.slug}">
    <div class="card-media">
      <img src="${g.cover}" alt="${esc(g.title)}" loading="lazy" onerror="this.onerror=null;this.src='${fb}'">
      <div class="card-prev" style="background-image:url('${g.prev}')"></div>
      <div class="card-badges">
        ${g.discount ? `<span class="pill disc">-${g.discount}%</span>` : ''}
        ${g.isNew ? `<span class="pill new">جديد</span>` : ''}
        <span class="pill plat">${g.platform === 'pc' ? '🖥 PC' : '📱 Android'}</span>
      </div>
      <span class="card-play">▶</span>
    </div>
    <div class="card-body">
      <h3>${esc(g.title)}</h3>
      <div class="card-genre">${g.genres.map(k => genreName(k)).join(' · ')}</div>
      <div class="card-foot">
        <div class="card-price">
          ${g.discount ? `<span class="old">$${g.price.toFixed(2)}</span>` : ''}
          <span class="new ${f===0?'free':''}">${money(f)}</span>
        </div>
        <span class="rating">★ ${g.rating.toFixed(1)}</span>
        <button class="add ${cart.has(g._id)?'in-cart':''}" data-id="${g._id}" data-add="${g._id}"
                aria-label="إضافة للسلة">${f===0?'⭳':'＋'}</button>
      </div>
    </div>
    <div class="card-cta"><button class="btn btn-primary btn-sm btn-block" data-add="${g._id}">
      ${f===0?'الحصول مجاناً':'إضافة للسلة'}</button></div>
  </article>`;
}
const genreName = k => (window.AMX_DATA.categories.find(c => c.key === k) || {}).name || k;

function bindAdds(root=document){
  $$('[data-add]', root).forEach(b => b.onclick = e => {
    e.preventDefault(); e.stopPropagation();
    const g = window.AMX_DATA.games.find(x => x._id === b.dataset.add);
    if (g) cart.add(g);
  });
}

/** يرسم شبكة ألعاب في أي حاوية — هذه هي دالة العرض الديناميكي المطلوبة */
async function renderGrid(sel, query = {}, { rail=false, skeleton=true } = {}){
  const box = $(sel); if (!box) return null;
  if (skeleton) box.innerHTML = Array.from({length: query.limit || 8},
    () => `<div class="card" style="height:290px;opacity:.35"></div>`).join('');
  const res = await api.getGames(query);
  box.className = rail ? 'rail' : (box.dataset.cls || 'grid');
  box.innerHTML = res.games.length ? res.games.map(cardHTML).join('')
    : `<div class="empty" style="grid-column:1/-1">لا توجد نتائج مطابقة 🔍</div>`;
  bindAdds(box); reveal(); return res;
}

/* ---------- 6) HERO CAROUSEL ---------------------------- */
async function heroCarousel(sel){
  const box = $(sel); if (!box) return;
  const { games } = await api.getGames({ hero:1 });
  box.innerHTML = `
    ${games.map((g,i) => `
      <div class="slide ${i===0?'on':''}">
        <div class="slide-bg" style="background-image:url('${g.hero}')"></div>
        <div class="slide-inner"><div class="wrap"><div class="slide-copy">
          <span class="eyebrow"><i></i> ${g.isNew ? 'إصدار جديد' : 'الأكثر مبيعاً'}</span>
          <h1><span class="gtext">${esc(g.title)}</span></h1>
          <p>${esc(g.desc)}</p>
          <div class="slide-meta">
            <span class="tag">${g.platform === 'pc' ? '🖥 PC' : '📱 Android'}</span>
            ${g.genres.slice(0,2).map(k => `<span class="tag">${genreName(k)}</span>`).join('')}
            <span class="tag">★ ${g.rating.toFixed(1)}</span>
          </div>
          <div class="slide-meta price-row">
            ${g.discount ? `<span class="disc">-${g.discount}%</span><span class="price-old">$${g.price.toFixed(2)}</span>` : ''}
            <span class="price-new">${money(final(g))}</span>
          </div>
          <div class="hero-ctas">
            <button class="btn btn-primary btn-lg" data-add="${g._id}">🛒 Buy Now</button>
            <a class="btn btn-ghost btn-lg" href="store.html?search=${encodeURIComponent(g.title)}">تفاصيل اللعبة</a>
          </div>
        </div></div></div>
      </div>`).join('')}
    <div class="hero-nav"><button data-h="-1">❯</button><button data-h="1">❮</button></div>
    <div class="dots">${games.map((_,i) => `<button data-d="${i}" class="${i===0?'on':''}"></button>`).join('')}</div>`;

  let cur = 0, timer;
  const slides = $$('.slide', box), dots = $$('[data-d]', box);
  const go = n => {
    cur = (n + slides.length) % slides.length;
    slides.forEach((s,i) => s.classList.toggle('on', i === cur));
    dots.forEach((d,i) => d.classList.toggle('on', i === cur));
  };
  const play = () => { clearInterval(timer); timer = setInterval(() => go(cur+1), 6500); };
  $$('[data-h]', box).forEach(b => b.onclick = () => { go(cur + +b.dataset.h); play(); });
  dots.forEach(d => d.onclick = () => { go(+d.dataset.d); play(); });
  box.onmouseenter = () => clearInterval(timer); box.onmouseleave = play;
  let sx = 0;
  box.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive:true });
  box.addEventListener('touchend', e => { const d = e.changedTouches[0].clientX - sx;
    if (Math.abs(d) > 45) { go(cur + (d > 0 ? -1 : 1)); play(); } }, { passive:true });
  bindAdds(box); play();
}

/* ---------- 7) LIVE SEARCH ------------------------------ */
function liveSearch(){
  const inp = $('#amxSearch'), pop = $('#amxPop'); if (!inp) return;
  let t;
  const run = async () => {
    const s = inp.value.trim();
    if (s.length < 2) { pop.classList.remove('open'); return; }
    const { games, total } = await api.getGames({ search:s, limit:6 });
    pop.innerHTML = games.length ? games.map(g => `
      <a class="sp-row" href="store.html?search=${encodeURIComponent(g.title)}">
        <img src="${g.cover}" alt="" onerror="this.src='${g.fallback.replace(/'/g,'%27')}'">
        <div><b>${esc(g.title)}</b><br><span>${g.platform==='pc'?'PC':'Android'} · ${money(final(g))}</span></div>
      </a>`).join('') + (total > 6 ? `<a class="sp-row center" href="store.html?search=${encodeURIComponent(s)}"><b class="gtext">عرض كل النتائج (${total})</b></a>` : '')
      : `<div class="empty" style="padding:1.5rem">لا نتائج لـ «${esc(s)}»</div>`;
    pop.classList.add('open');
  };
  inp.oninput = () => { clearTimeout(t); t = setTimeout(run, 180); };
  inp.onkeydown = e => { if (e.key === 'Enter' && inp.value.trim()) location.href = 'store.html?search=' + encodeURIComponent(inp.value.trim()); };
  document.addEventListener('click', e => { if (!e.target.closest('#amxSearchBox')) pop.classList.remove('open'); });
}

/* ---------- 8) SCROLL REVEAL ---------------------------- */
let io;
function reveal(){
  io = io || new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.style.transitionDelay = (e.target.dataset.d || 0) + 'ms';
      e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold:.08, rootMargin:'0px 0px -40px' });
  $$('.reveal:not(.in)').forEach((n,i) => { n.dataset.d = (i % 8) * 55; io.observe(n); });
}

return { api, cart, auth, library, shell, renderGrid, heroCarousel, cardHTML, bindAdds,
         reveal, toast, sync, final, money, genreName, $, $$, esc, LS };
})();
document.addEventListener('DOMContentLoaded', () => AMX.sync());
