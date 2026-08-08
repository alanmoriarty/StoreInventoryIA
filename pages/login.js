import { login } from '../auth.js';
import { toast } from '../components/toast.js';

export function renderLogin(root) {
  // Ocultar navbar en login
  document.getElementById('navbar-root').classList.add('hidden');

  root.innerHTML = `
    <div class="min-h-screen flex items-center justify-center -mt-6">
      <div class="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div class="text-center mb-6">
          <span class="text-4xl">📦</span>
          <h1 class="text-xl font-bold text-brand-darkest mt-2">StoreInventory</h1>
          <p class="text-sm text-brand-base">Inicia sesión para continuar</p>
        </div>

        <form id="login-form" class="space-y-4">
          <div>
            <label class="text-xs font-medium text-brand-dark block mb-1">Correo electrónico</label>
            <input id="f-email" type="email" placeholder="usuario@store.com" required
              class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-base" />
          </div>
          <div>
            <label class="text-xs font-medium text-brand-dark block mb-1">Contraseña</label>
            <input id="f-password" type="password" placeholder="••••••••" required
              class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-base" />
          </div>
          <button type="submit"
            class="w-full bg-brand-base text-white py-2 rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors">
            Ingresar
          </button>
        </form>

        <div class="mt-6 p-3 bg-brand-muted/20 rounded-lg text-xs text-brand-dark space-y-1">
          <p class="font-medium text-brand-dark">Cuentas de prueba:</p>
          <p>👑 admin@store.com / admin123</p>
          <p>👤 empleado@store.com / empleado123</p>
        </div>
      </div>
    </div>`;

  root.querySelector('#login-form').addEventListener('submit', e => {
    e.preventDefault();
    const email    = root.querySelector('#f-email').value.trim();
    const password = root.querySelector('#f-password').value;

    if (login(email, password)) {
      document.getElementById('navbar-root').classList.remove('hidden');
      location.hash = '#/';
    } else {
      toast('Credenciales incorrectas', 'error');
    }
  });
}
