import { db } from './app.js';
import { seedCategories } from './pages/categories.js';

const SESSION_KEY = 'si_session';
const USERS_KEY   = 'si_users';
const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 horas en ms

// ── Tabla de permisos ──────────────────────────────────────────
// Fuente única de verdad para qué puede hacer cada rol
const PERMISSIONS = {
  admin: [
    'products.view',
    'products.create',
    'products.edit',
    'products.delete',
    'categories.manage',
    'movements.view',
    'movements.create',
    'reports.view',
  ],
  empleado: [
    'products.view',
    'movements.view',
    'movements.create',
  ],
};

// ── Rutas permitidas por rol ───────────────────────────────────
export const ROUTE_PERMISSIONS = {
  '#/':           ['admin', 'empleado'],
  '#/products':   ['admin', 'empleado'],
  '#/movements':  ['admin', 'empleado'],
  '#/reports':    ['admin'],
};

// ── Seed de usuarios ───────────────────────────────────────────
function seedUsers() {
  if (db.get(USERS_KEY).length) return;
  db.set(USERS_KEY, [
    { id: '1', name: 'Admin',    email: 'admin@store.com',    password: 'admin123',    role: 'admin'    },
    { id: '2', name: 'Empleado', email: 'empleado@store.com', password: 'empleado123', role: 'empleado' },
  ]);
}

export function initAuth() {
  seedUsers();
  seedCategories();
}

// ── Sesión ─────────────────────────────────────────────────────
export function getSession() {
  try {
    const raw     = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);

    // Validar estructura mínima
    if (!session?.id || !session?.role || !session?.loginAt) return _clearSession();

    // Validar que el rol sea conocido
    if (!PERMISSIONS[session.role]) return _clearSession();

    // Validar expiración
    if (Date.now() - session.loginAt > SESSION_TTL) return _clearSession();

    // Validar que el usuario aún exista en la BD con el mismo rol
    const user = db.get(USERS_KEY).find(u => u.id === session.id);
    if (!user || user.role !== session.role) return _clearSession();

    return session;
  } catch {
    return _clearSession();
  }
}

function _clearSession() {
  localStorage.removeItem(SESSION_KEY);
  return null;
}

// ── Login / Logout ─────────────────────────────────────────────
export function login(email, password) {
  const user = db.get(USERS_KEY).find(u => u.email === email && u.password === password);
  if (!user) return false;
  const { password: _, ...safe } = user;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ...safe, loginAt: Date.now() }));
  return true;
}

export function logout() {
  _clearSession();
  location.hash = '#/login';
}

// ── Permisos ───────────────────────────────────────────────────
// Verifica si el usuario activo tiene un permiso específico
export function can(action) {
  const session = getSession();
  if (!session) return false;
  return PERMISSIONS[session.role]?.includes(action) ?? false;
}

// Verifica si el usuario activo tiene alguno de los roles dados
export function hasRole(...roles) {
  return roles.includes(getSession()?.role);
}

// Guard de ruta: redirige si no hay sesión o el rol no tiene acceso
export function guard(requiredRole) {
  const session = getSession();
  if (!session) { location.hash = '#/login'; return false; }
  if (requiredRole && session.role !== requiredRole) { location.hash = '#/'; return false; }
  return true;
}

// Guard basado en la tabla ROUTE_PERMISSIONS
export function guardRoute(hash) {
  const session = getSession();
  if (!session) { location.hash = '#/login'; return false; }
  const allowed = ROUTE_PERMISSIONS[hash];
  if (allowed && !allowed.includes(session.role)) { location.hash = '#/'; return false; }
  return true;
}
