import { db, DB_KEYS } from '../app.js';
import { openModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { can } from '../auth.js';
import { openCategoriesModal, seedCategories } from './categories.js';

export function renderProducts(root) {
  seedCategories();
  const isAdmin = can('products.create'); // proxy para "es admin"
  _render(root, isAdmin, '', '');
}

function _render(root, isAdmin, filterName, filterCat) {
  const allProducts = db.get(DB_KEYS.products);
  const categories  = db.get(DB_KEYS.categories);

  const products = allProducts.filter(p => {
    const matchName = p.name.toLowerCase().includes(filterName.toLowerCase());
    const matchCat  = !filterCat || p.category === filterCat;
    return matchName && matchCat;
  });

  const catOptions = ['', ...categories.map(c => c.name)]
    .map(c => `<option value="${c}" ${c === filterCat ? 'selected' : ''}>${c || 'Todas las categorías'}</option>`)
    .join('');

  root.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-gray-800">Productos</h1>
      <div class="flex gap-2">
        ${isAdmin ? `
          <button id="btn-categories" class="border border-indigo-300 text-indigo-600 px-3 py-2 rounded-lg text-sm hover:bg-indigo-50">
            🏷️ Categorías
          </button>
          <button id="btn-add" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
            + Nuevo producto
          </button>` : ''}
      </div>
    </div>

    <!-- Filtros -->
    <div class="flex gap-3 mb-4">
      <input id="filter-name" value="${filterName}" placeholder="Buscar por nombre..."
        class="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      <select id="filter-cat"
        class="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
        ${catOptions}
      </select>
    </div>

    <!-- Tabla -->
    <div class="bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
          <tr>
            <th class="px-4 py-3 text-left">Nombre</th>
            <th class="px-4 py-3 text-left">Categoría</th>
            <th class="px-4 py-3 text-right">Stock</th>
            <th class="px-4 py-3 text-right">Stock Mín.</th>
            <th class="px-4 py-3 text-right">Precio</th>
            <th class="px-4 py-3 text-center">Estado</th>
            ${isAdmin ? `<th class="px-4 py-3"></th>` : ''}
          </tr>
        </thead>
        <tbody id="products-body">
          ${products.length ? products.map(p => productRow(p, isAdmin)).join('') : emptyRow(isAdmin ? 7 : 6)}
        </tbody>
      </table>
    </div>
    <p class="text-xs text-gray-400 mt-2">${products.length} producto(s) encontrado(s)</p>`;

  // Filtros en tiempo real
  root.querySelector('#filter-name').addEventListener('input', e =>
    _render(root, isAdmin, e.target.value, root.querySelector('#filter-cat').value));
  root.querySelector('#filter-cat').addEventListener('change', e =>
    _render(root, isAdmin, root.querySelector('#filter-name').value, e.target.value));

  root.querySelector('#btn-add')?.addEventListener('click', () => {
    if (!can('products.create')) { toast('Sin permisos para crear productos', 'error'); return; }
    openProductModal(null, () => _render(root, isAdmin, filterName, filterCat));
  });

  root.querySelector('#btn-categories')?.addEventListener('click', () => {
    if (!can('categories.manage')) { toast('Sin permisos para gestionar categorías', 'error'); return; }
    openCategoriesModal(() => _render(root, isAdmin, filterName, filterCat));
  });

  root.querySelector('#products-body').addEventListener('click', e => {
    const id = e.target.closest('[data-id]')?.dataset.id;
    if (!id) return;
    if (e.target.closest('[data-action="edit"]')) {
      if (!can('products.edit')) { toast('Sin permisos para editar productos', 'error'); return; }
      openProductModal(id, () => _render(root, isAdmin, filterName, filterCat));
    }
    if (e.target.closest('[data-action="delete"]')) {
      if (!can('products.delete')) { toast('Sin permisos para eliminar productos', 'error'); return; }
      confirmDelete(id, () => _render(root, isAdmin, filterName, filterCat));
    }
  });
}

// ── Fila de tabla ──────────────────────────────────────────────
function productRow(p, isAdmin) {
  const isLow      = p.stock <= p.minStock;
  const isOut      = p.stock === 0;
  const statusBadge = isOut
    ? '<span class="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">Sin stock</span>'
    : isLow
      ? '<span class="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">Stock bajo</span>'
      : '<span class="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">OK</span>';

  return `
    <tr class="border-t hover:bg-gray-50" data-id="${p.id}">
      <td class="px-4 py-3 font-medium">${p.name}</td>
      <td class="px-4 py-3 text-gray-500">${p.category}</td>
      <td class="px-4 py-3 text-right font-semibold ${isLow ? 'text-red-500' : 'text-gray-700'}">${p.stock}</td>
      <td class="px-4 py-3 text-right text-gray-400">${p.minStock}</td>
      <td class="px-4 py-3 text-right">$${Number(p.price).toFixed(2)}</td>
      <td class="px-4 py-3 text-center">${statusBadge}</td>
      ${isAdmin ? `
      <td class="px-4 py-3 text-right space-x-2">
        <button data-action="edit"   class="text-indigo-500 hover:underline text-xs">Editar</button>
        <button data-action="delete" class="text-red-400 hover:underline text-xs">Eliminar</button>
      </td>` : ''}
    </tr>`;
}

function emptyRow(cols) {
  return `<tr><td colspan="${cols}" class="px-4 py-8 text-center text-gray-400">Sin productos encontrados.</td></tr>`;
}

// ── Modal crear / editar ───────────────────────────────────────
function openProductModal(id, onSaved) {
  const p          = id ? db.getOne(DB_KEYS.products, id) : null;
  const categories = db.get(DB_KEYS.categories);
  const catOptions = categories.map(c =>
    `<option value="${c.name}" ${p?.category === c.name ? 'selected' : ''}>${c.name}</option>`
  ).join('');

  openModal(`
    <h2 class="text-lg font-semibold mb-4">${p ? 'Editar' : 'Nuevo'} Producto</h2>
    <div class="space-y-3">
      <div>
        <label class="text-xs text-gray-500 font-medium">Nombre *</label>
        <input id="f-name" value="${p?.name ?? ''}" placeholder="Nombre del producto"
          class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      </div>
      <div>
        <label class="text-xs text-gray-500 font-medium">Categoría *</label>
        <select id="f-category"
          class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
          ${catOptions}
        </select>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-xs text-gray-500 font-medium">
            Stock inicial ${p ? '<span class="text-yellow-600">(usa Movimientos para ajustar)</span>' : '*'}
          </label>
          <input id="f-stock" type="number" min="0" value="${p?.stock ?? 0}"
            ${p ? 'readonly class="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"'
                : 'class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"'} />
        </div>
        <div>
          <label class="text-xs text-gray-500 font-medium">Stock mínimo *</label>
          <input id="f-minStock" type="number" min="0" value="${p?.minStock ?? 0}"
            class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
      </div>
      <div>
        <label class="text-xs text-gray-500 font-medium">Precio unitario *</label>
        <input id="f-price" type="number" min="0" step="0.01" value="${p?.price ?? 0}"
          class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      </div>
      <div>
        <label class="text-xs text-gray-500 font-medium">Descripción</label>
        <textarea id="f-desc" rows="2" placeholder="Descripción opcional..."
          class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none">${p?.description ?? ''}</textarea>
      </div>
    </div>
    <div class="flex justify-end gap-3 mt-5">
      <button data-cancel  class="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50">Cancelar</button>
      <button data-confirm class="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Guardar</button>
    </div>`, () => saveProduct(id, onSaved));
}

// ── Guardar producto ───────────────────────────────────────────
function saveProduct(id, onSaved) {
  // Doble verificación server-side del permiso
  if (id && !can('products.edit'))   { toast('Sin permisos para editar', 'error');   return; }
  if (!id && !can('products.create')){ toast('Sin permisos para crear', 'error');    return; }

  const name     = document.querySelector('#f-name')?.value.trim();
  const category = document.querySelector('#f-category')?.value;
  const stock    = Number(document.querySelector('#f-stock')?.value);
  const minStock = Number(document.querySelector('#f-minStock')?.value);
  const price    = Number(document.querySelector('#f-price')?.value);
  const description = document.querySelector('#f-desc')?.value.trim();

  if (!name)          { toast('El nombre es requerido', 'error');    return; }
  if (!category)      { toast('Selecciona una categoría', 'error');  return; }
  if (price < 0)      { toast('El precio no puede ser negativo', 'error'); return; }
  if (minStock < 0)   { toast('El stock mínimo no puede ser negativo', 'error'); return; }

  // Verificar nombre duplicado (excluyendo el propio en edición)
  const duplicate = db.get(DB_KEYS.products).some(p =>
    p.name.toLowerCase() === name.toLowerCase() && p.id !== id);
  if (duplicate) { toast('Ya existe un producto con ese nombre', 'error'); return; }

  const data = { name, category, minStock, price, description };

  if (id) {
    db.update(DB_KEYS.products, id, data);
    toast('Producto actualizado');
  } else {
    db.push(DB_KEYS.products, { ...data, stock: stock < 0 ? 0 : stock });
    toast('Producto creado');
  }

  onSaved?.();
}

// ── Confirmar eliminación ──────────────────────────────────────
function confirmDelete(id, onDeleted) {
  if (!can('products.delete')) { toast('Sin permisos para eliminar', 'error'); return; }
  const p            = db.getOne(DB_KEYS.products, id);
  const movCount     = db.get(DB_KEYS.movements).filter(m => m.productId === id).length;
  const warningHtml  = movCount > 0
    ? `<p class="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mt-2">
        ⚠️ Este producto tiene <strong>${movCount} movimiento(s)</strong> registrado(s). El historial quedará sin referencia.
       </p>`
    : '';

  openModal(`
    <h2 class="text-lg font-semibold mb-3 text-red-600">Eliminar producto</h2>
    <p class="text-gray-700 text-sm">¿Estás seguro de eliminar <strong>${p?.name}</strong>?</p>
    ${warningHtml}
    <div class="flex justify-end gap-3 mt-5">
      <button data-cancel  class="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50">Cancelar</button>
      <button data-confirm class="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700">Sí, eliminar</button>
    </div>`, () => {
    db.remove(DB_KEYS.products, id);
    toast('Producto eliminado', 'error');
    onDeleted?.();
  });
}
