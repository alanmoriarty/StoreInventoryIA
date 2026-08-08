import { getSession, logout } from '../auth.js';

const NAV_LINKS = [
  { href: '#/',          label: 'Dashboard',   roles: ['admin', 'empleado'] },
  { href: '#/products',  label: 'Productos',   roles: ['admin', 'empleado'] },
  { href: '#/movements', label: 'Movimientos', roles: ['admin', 'empleado'] },
  { href: '#/reports',   label: 'Reportes',    roles: ['admin']             },
];

export function renderNavbar(root) {
  const session = getSession();
  if (!session) { root.innerHTML = ''; return; }

  const visibleLinks = NAV_LINKS.filter(l => l.roles.includes(session.role));
  const roleBadge    = session.role === 'admin'
    ? 'bg-yellow-400 text-yellow-900'
    : 'bg-indigo-300 text-indigo-900';
  const roleLabel    = session.role === 'admin' ? '👑 Admin' : '👤 Empleado';

  root.innerHTML = `
    <nav class="bg-indigo-700 text-white shadow">
      <div class="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <div class="flex items-center gap-8">
          <span class="font-bold text-lg tracking-wide">📦 StoreInventory</span>
          <div class="flex gap-4">
            ${visibleLinks.map(l => `
              <a href="${l.href}"
                 class="nav-link text-sm font-medium hover:text-indigo-200 transition-colors"
                 data-href="${l.href}">
                ${l.label}
              </a>`).join('')}
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm">${session.name}</span>
          <span class="text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge}">${roleLabel}</span>
          <button id="btn-logout" class="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors">
            Salir
          </button>
        </div>
      </div>
    </nav>`;

  root.querySelector('#btn-logout').addEventListener('click', logout);

  function setActive() {
    const hash = location.hash || '#/';
    root.querySelectorAll('.nav-link').forEach(a => {
      a.classList.toggle('underline', a.dataset.href === hash);
      a.classList.toggle('text-indigo-200', a.dataset.href === hash);
    });
  }

  setActive();
  window.addEventListener('hashchange', setActive);
}
