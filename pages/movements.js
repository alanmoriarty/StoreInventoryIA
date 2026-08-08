import { db, DB_KEYS } from '../app.js';
import { openModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { getSession, can } from '../auth.js';

const PAGE_SIZE = 10;

// Estado de filtros y página (persiste mientras la vista está activa)
let state = { type: 'todos', productId: '', dateFrom: '', dateTo: '', page: 1 };

export function renderMovements(root) {
  state = { type: 'todos', productId: '', dateFrom: '', dateTo: '', page: 1 };
  _render(root);
}

function _render(root) {
  const movements = db.get(DB_KEYS.movements);
  const products  = db.get(DB_KEYS.products);

  const filtered  = applyFilters(movements, state);
  const total     = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  state.page       = Math.min(state.page, totalPages);
  const paginated  = filtered.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);

  const productOptions = [
    `<option value="">Todos los productos</option>`,
    ...products.map(p => `<option value="${p.id}" ${state.productId === p.id ? 'selected' : ''}>${p.name}</option>`),
  ].join('');

  root.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-gray-800">Historial de Movimientos</h1>
      <button id="btn-add" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
        + Registrar movimiento
      </button>
    </div>

    <!-- Filtros -->
    <div class="bg-white rounded-xl shadow p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
      <!-- Tipo -->
      <div>
        <label class="text-xs text-gray-500 font-medium block mb-1">Tipo</label>
        <select id="f-type-filter" class="${cls}">
          ${['todos','entrada','salida'].map(t =>
            `<option value="${t}" ${state.type === t ? 'selected' : ''}>${t.charAt(0).toUpperCase()+t.slice(1)}</option>`
          ).join('')}
        </select>
      </div>
      <!-- Producto -->
      <div>
        <label class="text-xs text-gray-500 font-medium block mb-1">Producto</label>
        <select id="f-product-filter" class="${cls}">${productOptions}</select>
      </div>
      <!-- Desde -->
      <div>
        <label class="text-xs text-gray-500 font-medium block mb-1">Desde</label>
        <input id="f-date-from" type="date" value="${state.dateFrom}" class="${cls}" />
      </div>
      <!-- Hasta -->
      <div>
        <label class="text-xs text-gray-500 font-medium block mb-1">Hasta</label>
        <input id="f-date-to" type="date" value="${state.dateTo}" class="${cls}" />
      </div>
    </div>

    <!-- Resumen rápido -->
    <div class="grid grid-cols-3 gap-3 mb-4">
      ${summaryCard('Total filtrado', total, 'text-indigo-600 bg-indigo-50')}
      ${summaryCard('Entradas (uds)', filtered.filter(m=>m.type==='entrada').reduce((s,m)=>s+m.qty,0), 'text-green-600 bg-green-50')}
      ${summaryCard('Salidas (uds)',  filtered.filter(m=>m.type==='salida').reduce((s,m)=>s+m.qty,0),  'text-red-600 bg-red-50')}
    </div>

    <!-- Tabla -->
    <div class="bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
          <tr>
            <th class="px-4 py-3 text-left">Fecha y hora</th>
            <th class="px-4 py-3 text-left">Producto</th>
            <th class="px-4 py-3 text-left">Tipo</th>
            <th class="px-4 py-3 text-left">Motivo</th>
            <th class="px-4 py-3 text-right">Cantidad</th>
            <th class="px-4 py-3 text-right">Stock post</th>
            <th class="px-4 py-3 text-left">Usuario</th>
            <th class="px-4 py-3 text-left">Nota</th>
          </tr>
        </thead>
        <tbody id="movements-body">
          ${paginated.length
            ? paginated.map(m => movementRow(m, products)).join('')
            : `<tr><td colspan="8" class="px-4 py-8 text-center text-gray-400">Sin movimientos para los filtros aplicados.</td></tr>`}
        </tbody>
      </table>
    </div>

    <!-- Paginación -->
    <div class="flex items-center justify-between mt-3">
      <p class="text-xs text-gray-400">
        Mostrando ${paginated.length} de ${total} resultado(s) — Página ${state.page} de ${totalPages}
      </p>
      <div class="flex gap-2">
        <button id="btn-prev" ${state.page <= 1 ? 'disabled' : ''}
          class="px-3 py-1.5 text-xs rounded-lg border ${state.page <= 1 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-50'}">
          ← Anterior
        </button>
        <button id="btn-next" ${state.page >= totalPages ? 'disabled' : ''}
          class="px-3 py-1.5 text-xs rounded-lg border ${state.page >= totalPages ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-50'}">
          Siguiente →
        </button>
      </div>
    </div>`;

  // ── Eventos ────────────────────────────────────────────────
  root.querySelector('#btn-add').addEventListener('click', () =>
    openMovementModal(products, () => { state.page = 1; _render(root); }));

  root.querySelector('#f-type-filter').addEventListener('change', e => {
    state.type = e.target.value; state.page = 1; _render(root);
  });
  root.querySelector('#f-product-filter').addEventListener('change', e => {
    state.productId = e.target.value; state.page = 1; _render(root);
  });
  root.querySelector('#f-date-from').addEventListener('change', e => {
    state.dateFrom = e.target.value; state.page = 1; _render(root);
  });
  root.querySelector('#f-date-to').addEventListener('change', e => {
    state.dateTo = e.target.value; state.page = 1; _render(root);
  });

  root.querySelector('#btn-prev')?.addEventListener('click', () => {
    if (state.page > 1) { state.page--; _render(root); }
  });
  root.querySelector('#btn-next')?.addEventListener('click', () => {
    if (state.page < totalPages) { state.page++; _render(root); }
  });
}

// ── Helpers ────────────────────────────────────────────────────
const cls = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400';

function summaryCard(label, value, colorCls) {
  return `
    <div class="rounded-xl p-4 ${colorCls} border border-current/10">
      <p class="text-xl font-bold">${value}</p>
      <p class="text-xs mt-0.5 opacity-80">${label}</p>
    </div>`;
}

function applyFilters(movements, { type, productId, dateFrom, dateTo }) {
  return [...movements]
    .filter(m => type === 'todos'  || m.type      === type)
    .filter(m => !productId        || m.productId === productId)
    .filter(m => !dateFrom         || isoDate(m.timestamp) >= dateFrom)
    .filter(m => !dateTo           || isoDate(m.timestamp) <= dateTo)
    .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));  // más reciente primero
}

// Convierte timestamp (ms) a 'YYYY-MM-DD' para comparar con input[type=date]
function isoDate(ts) {
  if (!ts) return '';
  return new Date(ts).toISOString().slice(0, 10);
}

function formatDateTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return `${d.toLocaleDateString('es-MX')} ${d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
}

function movementRow(m, products) {
  const prod  = products.find(p => p.id === m.productId);
  const badge = m.type === 'entrada'
    ? 'bg-green-100 text-green-700'
    : 'bg-red-100 text-red-700';
  const stockPost = m.stockAfter != null
    ? `<span class="${m.stockAfter <= 0 ? 'text-red-500 font-semibold' : 'text-gray-700'}">${m.stockAfter}</span>`
    : '<span class="text-gray-300">—</span>';

  return `
    <tr class="border-t hover:bg-gray-50 transition-colors">
      <td class="px-4 py-3 text-gray-500 whitespace-nowrap">${formatDateTime(m.timestamp)}</td>
      <td class="px-4 py-3 font-medium">
        ${prod?.name ?? '<span class="text-gray-400 italic text-xs">Eliminado</span>'}
      </td>
      <td class="px-4 py-3">
        <span class="px-2 py-0.5 rounded-full text-xs font-medium ${badge} capitalize">${m.type}</span>
      </td>
      <td class="px-4 py-3 text-gray-600">${m.reason ?? '—'}</td>
      <td class="px-4 py-3 text-right font-semibold">${m.type === 'entrada' ? '+' : '-'}${m.qty}</td>
      <td class="px-4 py-3 text-right">${stockPost}</td>
      <td class="px-4 py-3 text-gray-400 whitespace-nowrap">${m.user ?? '—'}</td>
      <td class="px-4 py-3 text-gray-400 text-xs">${m.note || '—'}</td>
    </tr>`;
}

// ── Modal de registro ──────────────────────────────────────────
const REASONS = {
  entrada: ['Compra a proveedor', 'Devolución de cliente', 'Ajuste de inventario', 'Otro'],
  salida:  ['Venta', 'Pérdida / Merma', 'Devolución a proveedor', 'Ajuste de inventario', 'Otro'],
};

function openMovementModal(products, onSaved) {
  if (!products.length) { toast('Primero registra productos', 'info'); return; }

  const productOptions = products.map(p =>
    `<option value="${p.id}" data-stock="${p.stock}">${p.name} (stock: ${p.stock})</option>`).join('');

  openModal(`
    <h2 class="text-lg font-semibold mb-4">Registrar Movimiento</h2>
    <div class="space-y-3">
      <div>
        <label class="text-xs text-gray-500 font-medium">Producto *</label>
        <select id="f-product" class="mt-1 ${cls}">${productOptions}</select>
        <p id="stock-display" class="text-xs text-indigo-500 mt-1 font-medium"></p>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-xs text-gray-500 font-medium">Tipo *</label>
          <select id="f-type" class="mt-1 ${cls}">
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-gray-500 font-medium">Cantidad *</label>
          <input id="f-qty" type="number" min="1" value="1" class="mt-1 ${cls}" />
        </div>
      </div>
      <div>
        <label class="text-xs text-gray-500 font-medium">Motivo *</label>
        <select id="f-reason" class="mt-1 ${cls}">
          ${REASONS.entrada.map(r => `<option>${r}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="text-xs text-gray-500 font-medium">Nota adicional</label>
        <input id="f-note" placeholder="Opcional..." class="mt-1 ${cls}" />
      </div>
    </div>
    <div class="flex justify-end gap-3 mt-5">
      <button data-cancel  class="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50">Cancelar</button>
      <button data-confirm class="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Guardar</button>
    </div>`, () => saveMovement(onSaved));

  setTimeout(() => {
    updateStockDisplay();
    updateReasons();
    document.getElementById('f-product')?.addEventListener('change', updateStockDisplay);
    document.getElementById('f-type')?.addEventListener('change', updateReasons);
  }, 0);
}

function updateStockDisplay() {
  const sel   = document.getElementById('f-product');
  const stock = sel?.options[sel.selectedIndex]?.dataset.stock ?? '?';
  const el    = document.getElementById('stock-display');
  if (el) el.textContent = `Stock disponible: ${stock} unidades`;
}

function updateReasons() {
  const type   = document.getElementById('f-type')?.value;
  const select = document.getElementById('f-reason');
  if (select && type) select.innerHTML = REASONS[type].map(r => `<option>${r}</option>`).join('');
}

// ── Guardar ────────────────────────────────────────────────────
function saveMovement(onSaved) {
  if (!can('movements.create')) { toast('Sin permisos para registrar movimientos', 'error'); return; }

  const productId = document.querySelector('#f-product')?.value;
  const type      = document.querySelector('#f-type')?.value;
  const reason    = document.querySelector('#f-reason')?.value;
  const qty       = Number(document.querySelector('#f-qty')?.value);
  const note      = document.querySelector('#f-note')?.value.trim();

  if (!qty || qty < 1) { toast('La cantidad debe ser mayor a 0', 'error'); return; }

  const product = db.getOne(DB_KEYS.products, productId);
  if (!product)  { toast('Producto no encontrado', 'error'); return; }

  if (type === 'salida' && product.stock < qty) {
    toast(`Stock insuficiente. Disponible: ${product.stock}`, 'error');
    return;
  }

  const delta      = type === 'entrada' ? qty : -qty;
  const stockAfter = product.stock + delta;

  db.push(DB_KEYS.movements, {
    productId,
    type,
    reason,
    qty,
    note,
    stockAfter,                              // snapshot del stock resultante
    timestamp: Date.now(),                   // ms epoch — ordenable y filtrable
    user: getSession()?.name ?? '—',
  });

  db.update(DB_KEYS.products, productId, { stock: stockAfter });

  if (stockAfter === 0)
    toast(`🚨 ${product.name} se quedó sin stock`, 'error', 5000);
  else if (stockAfter <= product.minStock)
    toast(`⚠️ ${product.name} en stock bajo (${stockAfter})`, 'info', 5000);
  else
    toast('Movimiento registrado');

  onSaved?.();
}
