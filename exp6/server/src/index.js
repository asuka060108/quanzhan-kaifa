import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { attractionCategories, attractions } from './data/attractions.js';
import { foodCategories, foods } from './data/foods.js';
import { itineraryDays, packingItems, travelTips } from './data/itinerary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CLIENT_DIST = path.resolve(ROOT, '..', 'client', 'dist');
const DATA_DIR = path.join(ROOT, 'data');
const FAVORITES_FILE = path.join(DATA_DIR, 'favorites.json');
const PORT = Number(process.env.PORT || 3000);

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: true, allowedHeaders: ['Content-Type', 'X-Client-Id'] }));
app.use(express.json({ limit: '100kb' }));

const stats = [
  { value: 1300.2, decimals: 1, suffix: 'm', label: '祝融峰海拔' },
  { value: 2200, suffix: '+', label: '年建城史' },
  { value: 6, suffix: '处', label: '精选目的地' },
  { value: 8, suffix: '味', label: '从早吃到夜' },
];

const budgetStyles = [
  { value: 'economy', label: '经济', perDay: 280, note: '青旅 / 民宿 + 本地小馆' },
  { value: 'comfort', label: '舒适', perDay: 520, note: '舒适酒店 + 正经餐馆' },
  { value: 'premium', label: '品质', perDay: 860, note: '山景酒店 + 精选餐厅' },
];

const transport = [
  {
    type: '高铁',
    title: '衡阳东站',
    text: '长沙南约 30–40 分钟，广州南约 2 小时。出站后可打车或坐旅游专线去南岳。',
  },
  {
    type: '飞机',
    title: '衡阳南岳机场',
    text: '机场到市区约 30 分钟，航班较少，适合远距离出发。',
  },
  {
    type: '自驾',
    title: '南岳景区',
    text: '节假日停车位紧张，建议早上 8 点前到。山路多弯，雨天慢行。',
  },
];

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

function clientId(req) {
  const value = String(req.get('x-client-id') || '').trim();
  return /^[a-zA-Z0-9_-]{8,64}$/.test(value) ? value : 'demo';
}

function readFavorites() {
  try {
    const text = fs.readFileSync(FAVORITES_FILE, 'utf8');
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeFavorites(store) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FAVORITES_FILE, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
}

function favoriteIds(req) {
  const store = readFavorites();
  const ids = store[clientId(req)];
  return Array.isArray(ids) ? ids.filter((id) => foods.some((food) => food.id === id)) : [];
}

function saveFavoriteIds(req, ids) {
  const store = readFavorites();
  store[clientId(req)] = [...new Set(ids)];
  writeFavorites(store);
}

function filterAttractions(query) {
  const keyword = normalize(query.q);
  const category = String(query.category || 'all');
  let list = attractions.filter((spot) => {
    const matchesCategory = category === 'all' || spot.category === category;
    const haystack = [
      spot.name,
      spot.en,
      spot.category,
      spot.summary,
      spot.location,
      ...spot.highlights,
    ]
      .join(' ')
      .toLowerCase();
    return matchesCategory && (!keyword || haystack.includes(keyword));
  });

  if (query.sort === 'rating') {
    list = [...list].sort((a, b) => Number(b.rating) - Number(a.rating));
  } else if (query.sort === 'name') {
    list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  }
  return list;
}

function filterFoods(query) {
  const keyword = normalize(query.q);
  const category = String(query.category || 'all');
  let list = foods.filter((food) => {
    const matchesCategory = category === 'all' || food.category === category;
    const haystack = [food.name, food.en, food.category, food.summary, food.description, ...food.tags]
      .join(' ')
      .toLowerCase();
    return matchesCategory && (!keyword || haystack.includes(keyword));
  });

  if (query.sort === 'spicy-asc') {
    list = [...list].sort((a, b) => a.spice - b.spice);
  } else if (query.sort === 'spicy-desc') {
    list = [...list].sort((a, b) => b.spice - a.spice);
  }
  return list;
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'hengyang-travel-api', time: new Date().toISOString() });
});

app.get('/api/home', (req, res) => {
  res.json({
    ok: true,
    data: {
      stats,
      featuredSpots: attractions.slice(0, 3),
      featuredFoods: foods.slice(0, 3),
      itineraryDays,
      travelTips,
    },
  });
});

app.get('/api/attractions', (req, res) => {
  const items = filterAttractions(req.query);
  res.json({ ok: true, data: { items, total: items.length, categories: attractionCategories } });
});

app.get('/api/attractions/categories', (req, res) => {
  res.json({ ok: true, data: attractionCategories });
});

app.get('/api/attractions/:id', (req, res) => {
  const spot = attractions.find((item) => item.id === req.params.id);
  if (!spot) return res.status(404).json({ ok: false, message: '景点不存在' });
  res.json({ ok: true, data: spot });
});

app.get('/api/foods', (req, res) => {
  const items = filterFoods(req.query);
  res.json({ ok: true, data: { items, total: items.length, categories: foodCategories } });
});

app.get('/api/foods/categories', (req, res) => {
  res.json({ ok: true, data: foodCategories });
});

app.get('/api/foods/:id', (req, res) => {
  const food = foods.find((item) => item.id === req.params.id);
  if (!food) return res.status(404).json({ ok: false, message: '美食不存在' });
  res.json({ ok: true, data: food });
});

app.get('/api/itinerary', (req, res) => {
  res.json({ ok: true, data: { days: itineraryDays, packingItems, travelTips } });
});

app.get('/api/config', (req, res) => {
  res.json({ ok: true, data: { budgetStyles, ticketPerPerson: 160, transport } });
});

app.get('/api/favorites', (req, res) => {
  const ids = favoriteIds(req);
  res.json({
    ok: true,
    data: {
      ids,
      items: foods.filter((food) => ids.includes(food.id)),
    },
  });
});

app.post('/api/favorites/:id', (req, res) => {
  const food = foods.find((item) => item.id === req.params.id);
  if (!food) return res.status(404).json({ ok: false, message: '美食不存在' });
  const ids = favoriteIds(req);
  if (!ids.includes(food.id)) ids.push(food.id);
  saveFavoriteIds(req, ids);
  res.json({ ok: true, data: { ids } });
});

app.delete('/api/favorites/:id', (req, res) => {
  const ids = favoriteIds(req).filter((id) => id !== req.params.id);
  saveFavoriteIds(req, ids);
  res.json({ ok: true, data: { ids } });
});

app.delete('/api/favorites', (req, res) => {
  saveFavoriteIds(req, []);
  res.json({ ok: true, data: { ids: [] } });
});

app.use('/images', express.static(path.join(ROOT, 'public', 'images'), {
  maxAge: '7d',
  immutable: true,
}));

app.use('/images', (req, res) => {
  res.status(404).json({ ok: false, message: '图片不存在' });
});

if (fs.existsSync(path.join(CLIENT_DIST, 'index.html'))) {
  app.use(express.static(CLIENT_DIST, { maxAge: '1h' }));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

app.use('/api', (req, res) => {
  res.status(404).json({ ok: false, message: '接口不存在' });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ ok: false, message: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`Hengyang API running at http://localhost:${PORT}`);
  console.log(`Client dist: ${CLIENT_DIST}`);
});
