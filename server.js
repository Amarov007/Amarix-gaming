/* AMARIX007 — Back-End (Node + Express + MongoDB)
   npm i express mongoose bcryptjs jsonwebtoken cors dotenv
   node server.js */
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const {
  PORT = 5000,
  MONGO_URI = 'mongodb://127.0.0.1:27017/amarix007',
  JWT_SECRET = 'change_me_amarix007',
  USDT_TRC20 = 'TXk9AmARiX007dEmoAddrEsS4Usdt7Trc20xyz',
  USDT_BEP20 = '0xA7amarix0071bDeMo9AddrEsS4Usdt5Bep20',
  SEED_KEY = 'amarix123',
  RAWG_API_KEY,
} = process.env;

/* ── 1) DB ───────────────────────────────────────────── */
// مهلة أطول للاستعلامات وللبحث عن السيرفر، عشان Cold Start في Vercel أحياناً بياخد وقت
mongoose.set('bufferTimeoutMS', 30000);

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 30000 })
  .then(() => console.log('MongoDB connected'))
  .catch(e => console.error('DB error:', e.message));

/* ── 2) MODELS ───────────────────────────────────────── */
const UserSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
  role:     { type: String, enum: ['user', 'admin'], default: 'user' },
  library:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }],
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
UserSchema.methods.match = function (p) { return bcrypt.compare(p, this.password); };

const GameSchema = new mongoose.Schema({
  title:    { type: String, required: true, trim: true },
  slug:     { type: String, unique: true, index: true },
  platform: { type: String, enum: ['pc', 'android'], default: 'pc', index: true },
  genres:   [{ type: String, index: true }],
  desc:     String,
  price:    { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  rating:   { type: Number, default: 0, min: 0, max: 5 },
  cover:    String,
  hero:     String,
  keys:     [{ code: String, used: { type: Boolean, default: false } }],
  featured: { type: Boolean, default: false },
  isNew:    { type: Boolean, default: false },
  active:   { type: Boolean, default: true },
}, { timestamps: true, toJSON: { virtuals: true } });

GameSchema.virtual('finalPrice').get(function () {
  return +(this.price * (1 - this.discount / 100)).toFixed(2);
});
GameSchema.pre('validate', function (next) {
  if (!this.slug && this.title)
    this.slug = this.title.toLowerCase().replace(/[^\w\u0600-\u06FF]+/g, '-').replace(/^-|-$/g, '');
  next();
});

const OrderSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:   [{ game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' }, title: String, price: Number }],
  total:   { type: Number, required: true },
  method:  { type: String, enum: ['card', 'usdt'], required: true },
  network: String,
  txid:    String,
  status:  { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  keys:    [{ title: String, code: String }],
}, { timestamps: true });

const User  = mongoose.model('User', UserSchema);
const Game  = mongoose.model('Game', GameSchema);
const Order = mongoose.model('Order', OrderSchema);

/* ── APP ─────────────────────────────────────────────── */
const app = express();
app.use(cors());
app.use(express.json());

const sign = u => jwt.sign({ id: u._id, role: u.role }, JWT_SECRET, { expiresIn: '30d' });
const ok   = (res, data, code = 200) => res.status(code).json(data);
const wrap = fn => (req, res) => fn(req, res).catch(e => res.status(400).json({ error: e.message }));

const protect = wrap(async (req, res, next) => {
  const t = (req.headers.authorization || '').startsWith('Bearer ') && req.headers.authorization.split(' ')[1];
  if (!t) return res.status(401).json({ error: 'غير مصرّح' });
  try {
    const d = jwt.verify(t, JWT_SECRET);
    req.user = await User.findById(d.id);
    if (!req.user) throw new Error();
    next();
  } catch { res.status(401).json({ error: 'توكن غير صالح' }); }
});
const admin = (req, res, next) =>
  req.user?.role === 'admin' ? next() : res.status(403).json({ error: 'للمسؤول فقط' });

/* ── 3) AUTH API ─────────────────────────────────────── */
app.post('/api/auth/register', wrap(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 8)
    return res.status(400).json({ error: 'بيانات ناقصة أو كلمة مرور قصيرة' });
  if (await User.findOne({ email })) return res.status(409).json({ error: 'البريد مستخدم مسبقاً' });
  const u = await User.create({ name, email, password });
  ok(res, { token: sign(u), user: { id: u._id, name: u.name, email: u.email, role: u.role } }, 201);
}));

app.post('/api/auth/login', wrap(async (req, res) => {
  const { email, password } = req.body;
  const u = await User.findOne({ email }).select('+password');
  if (!u || !(await u.match(password))) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
  ok(res, { token: sign(u), user: { id: u._id, name: u.name, email: u.email, role: u.role } });
}));

app.get('/api/auth/me', protect, wrap(async (req, res) => {
  const u = await User.findById(req.user._id).populate('library');
  ok(res, { user: u });
}));

/* ── 4) GAMES API (عام + لوحة التحكم) ────────────────── */
app.get('/api/games', wrap(async (req, res) => {
  const { platform, genre, search, featured, isNew, maxPrice, sort = '-rating', page = 1, limit = 24 } = req.query;
  const q = { active: true };
  if (platform) q.platform = platform;
  if (genre)    q.genres = genre;
  if (featured) q.featured = featured === 'true';
  if (isNew)    q.isNew = isNew === 'true';
  if (maxPrice) q.price = { $lte: +maxPrice };
  if (search)   q.title = { $regex: search, $options: 'i' };
  const [games, total] = await Promise.all([
    Game.find(q).select('-keys').sort(sort).skip((page - 1) * limit).limit(+limit),
    Game.countDocuments(q),
  ]);
  ok(res, { total, page: +page, pages: Math.ceil(total / limit), games });
}));

app.get('/api/games/:slug', wrap(async (req, res) => {
  const g = await Game.findOne({ slug: req.params.slug }).select('-keys');
  g ? ok(res, g) : res.status(404).json({ error: 'اللعبة غير موجودة' });
}));

app.post('/api/admin/games', protect, admin, wrap(async (req, res) =>
  ok(res, await Game.create(req.body), 201)));

app.post('/api/admin/games/bulk', protect, admin, wrap(async (req, res) =>
  ok(res, await Game.insertMany(req.body.games, { ordered: false }), 201)));

app.put('/api/admin/games/:id', protect, admin, wrap(async (req, res) => {
  const g = await Game.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  g ? ok(res, g) : res.status(404).json({ error: 'غير موجودة' });
}));

app.delete('/api/admin/games/:id', protect, admin, wrap(async (req, res) => {
  await Game.findByIdAndDelete(req.params.id);
  ok(res, { deleted: req.params.id });
}));

app.get('/api/admin/stats', protect, admin, wrap(async (req, res) => ok(res, {
  games:  await Game.countDocuments(),
  users:  await User.countDocuments(),
  orders: await Order.countDocuments({ status: 'paid' }),
  revenue: (await Order.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, s: { $sum: '$total' } } }]))[0]?.s || 0,
})));

app.get('/api/admin/orders', protect, admin, wrap(async (req, res) =>
  ok(res, await Order.find().populate('user', 'name email').sort('-createdAt').limit(100))));

/* ── 5) PAYMENT API ──────────────────────────────────── */
const buildOrder = async (userId, gameIds, method, extra = {}) => {
  const games = await Game.find({ _id: { $in: gameIds }, active: true });
  if (!games.length) throw new Error('لا توجد منتجات صالحة في الطلب');
  const items = games.map(g => ({ game: g._id, title: g.title, price: g.finalPrice }));
  const total = +items.reduce((s, i) => s + i.price, 0).toFixed(2);
  return Order.create({ user: userId, items, total, method, ...extra });
};

const fulfill = async (order) => {
  const rnd = () => Math.random().toString(36).slice(2, 7).toUpperCase();
  order.keys = order.items.map(i => ({ title: i.title, code: `AMX7-${rnd()}-${rnd()}-${rnd()}` }));
  order.status = 'paid';
  await order.save();
  await User.findByIdAndUpdate(order.user, { $addToSet: { library: { $each: order.items.map(i => i.game) } } });
  return order;
};

app.post('/api/pay/card', protect, wrap(async (req, res) => {
  const { gameIds = [], paymentMethodId } = req.body;
  const order = await buildOrder(req.user._id, gameIds, 'card');
  if (!paymentMethodId) return res.status(400).json({ error: 'paymentMethodId مطلوب' });
  await fulfill(order);
  ok(res, { ok: true, orderId: order._id, total: order.total, keys: order.keys }, 201);
}));

app.post('/api/pay/usdt', protect, wrap(async (req, res) => {
  const { gameIds = [], network = 'TRC20' } = req.body;
  const order = await buildOrder(req.user._id, gameIds, 'usdt', { network });
  ok(res, {
    orderId: order._id, amount: order.total, network,
    address: network === 'TRC20' ? USDT_TRC20 : USDT_BEP20,
  }, 201);
}));

app.post('/api/pay/usdt/verify', protect, wrap(async (req, res) => {
  const { orderId, txid } = req.body;
  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) return res.status(404).json({ error: 'الطلب غير موجود' });
  if (order.status === 'paid') return ok(res, { ok: true, keys: order.keys });
  if (!txid || txid.length < 10) return res.status(400).json({ error: 'TxID غير صالح' });
  order.txid = txid;
  await fulfill(order);
  ok(res, { ok: true, orderId: order._id, keys: order.keys, confirmations: 3 });
}));

app.post('/api/webhooks/crypto', wrap(async (req, res) => {
  const { order_id, payment_status } = req.body;
  if (payment_status === 'finished') {
    const order = await Order.findById(order_id);
    if (order && order.status !== 'paid') await fulfill(order);
  }
  res.sendStatus(200);
}));

app.get('/api/orders', protect, wrap(async (req, res) =>
  ok(res, await Order.find({ user: req.user._id }).sort('-createdAt'))));

/* ── SEED أول مسؤول ──────────────────────────────────── */
app.post('/api/setup/admin', wrap(async (req, res) => {
  if (await User.exists({ role: 'admin' })) return res.status(403).json({ error: 'المسؤول موجود مسبقاً' });
  const { name = 'AMARIX007', email, password } = req.body;
  const u = await User.create({ name, email, password, role: 'admin' });
  ok(res, { token: sign(u), user: { id: u._id, email: u.email, role: u.role } }, 201);
}));

/* ── SEED ألعاب من قاعدة بيانات RAWG العالمية (مجانية) ── */
app.get('/api/setup/seed-rawg', wrap(async (req, res) => {
  const { key, pages = 1, platform = 'pc' } = req.query;
  if (!key || key !== SEED_KEY) return res.status(403).json({ error: 'مفتاح غير صحيح' });
  if (!RAWG_API_KEY) return res.status(500).json({ error: 'RAWG_API_KEY غير مضافة في Environment Variables' });

  let inserted = 0, skipped = 0;
  for (let p = 1; p <= +pages; p++) {
    const url = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&page=${p}&page_size=40&ordering=-rating`;
    const r = await fetch(url);
    const data = await r.json();
    if (!data.results) break;

    for (const g of data.results) {
      const exists = await Game.findOne({ title: g.name });
      if (exists) { skipped++; continue; }
      const price = +(Math.random() * 50 + 9.99).toFixed(2);
      const discount = Math.floor(Math.random() * 50);
      try {
        await Game.create({
          title: g.name,
          platform,
          genres: (g.genres || []).map(x => x.name),
          desc: `تقييم ${g.rating} من 5 — ${g.name}`,
          price,
          discount,
          rating: g.rating || 4,
          cover: g.background_image || '',
          hero: g.background_image || '',
          featured: (g.rating || 0) >= 4.3,
          isNew: false,
          active: true,
        });
        inserted++;
      } catch (e) { skipped++; }
    }
  }
  ok(res, { inserted, skipped });
}));

/* ── الملفات الثابتة + الصفحة الرئيسية ───────────────── */
const path = require('path');
app.use(express.static('.'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use((req, res) => res.status(404).json({ error: 'المسار غير موجود' }));

if (require.main === module) {
  app.listen(PORT, () => console.log(`AMARIX007 API on :${PORT}`));
}
module.exports = app;
