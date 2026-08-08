import { renderNavbar } from './components/navbar.js';
import { renderLogin } from './pages/login.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderProducts } from './pages/products.js';
import { renderMovements } from './pages/movements.js';
import { renderReports } from './pages/reports.js';
import { initAuth, getSession, guardRoute } from './auth.js';

// ── Estado global ──────────────────────────────────────────────
export const DB_KEYS = {
  products:   'si_products',
  movements:  'si_movements',
  users:      'si_users',
  categories: 'si_categories',
};

export const db = {
  get:    (key) => {
    try { return JSON.parse(localStorage.getItem(key) ?? '[]'); }
    catch { localStorage.removeItem(key); return []; }   // auto-sanar dato corrupto
  },
  getOne: (key, id)        => db.get(key).find(i => i.id === id) ?? null,
  set:    (key, data)      => {
    if (!Array.isArray(data)) throw new Error(`db.set: '${key}' debe ser un array`);
    localStorage.setItem(key, JSON.stringify(data));
  },
  push:   (key, item)      => {
    const list = db.get(key);
    list.push({ ...item, id: crypto.randomUUID() });
    db.set(key, list);
  },
  update: (key, id, patch) => {
    db.set(key, db.get(key).map(i => i.id === id ? { ...i, ...patch } : i));
  },
  remove: (key, id)        => db.set(key, db.get(key).filter(i => i.id !== id)),
};

// ── Router ─────────────────────────────────────────────────────
const ROUTES = {
  '#/':           renderDashboard,
  '#/products':   renderProducts,
  '#/movements':  renderMovements,
  '#/reports':    renderReports,
};

function navigate() {
  const hash   = location.hash || '#/';
  const app    = document.getElementById('app');
  const navbar = document.getElementById('navbar-root');
  app.innerHTML = '';

  if (hash === '#/login') {
    navbar.classList.add('hidden');
    renderLogin(app);
    return;
  }

  // guardRoute verifica sesión activa + rol permitido para la ruta
  if (!guardRoute(hash)) return;

  navbar.classList.remove('hidden');
  renderNavbar(navbar);

  (ROUTES[hash] ?? renderDashboard)(app);
}

// ── Bootstrap ──────────────────────────────────────────────────
initAuth();
window.addEventListener('hashchange', navigate);
navigate();
