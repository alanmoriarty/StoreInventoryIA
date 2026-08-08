import { db, DB_KEYS } from '../app.js';
import { can } from '../auth.js';

export function renderReports(root) {
  if (!can('reports.view')) {
    root.innerHTML = `
      <div class="flex flex-col items-center justify-center h-64 text-center">
        <span class="text-5xl mb-4">🔒</span>
        <h2 class="text-xl font-semibold text-gray-700">Acceso restringido</h2>
        <p class="text-sm text-gray-400 mt-1">No tienes permisos para ver esta sección.</p>
      </div>`;
    return;
  }
  const products  = db.get(DB_KEYS.products);
  const movements = db.get(DB_KEYS.movements);

  // Resumen por categoría
  const byCategory = products.reduce((acc, p) => {
    acc[p.category] = acc[p.category] ?? { count: 0, stock: 0, value: 0 };
    acc[p.category].count++;
    acc[p.category].stock += p.stock;
    acc[p.category].value += p.stock * p.price;
    return acc;
  }, {});

  const lowStock = products.filter(p => p.stock <= p.minStock);

  // Totales de movimientos
  const totalEntradas = movements.filter(m => m.type === 'entrada').reduce((s, m) => s + m.qty, 0);
  const totalSalidas  = movements.filter(m => m.type === 'salida').reduce((s, m) => s + m.qty, 0);
  const valorTotal    = products.reduce((s, p) => s + p.stock * p.price, 0);

  root.innerHTML = `
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Reportes</h1>

    <!-- KPIs -->
    <div class="grid grid-cols-3 gap-4 mb-8">
      ${kpi('Valor total inventario', `$${valorTotal.toFixed(2)}`, 'bg-indigo-500')}
      ${kpi('Unidades ingresadas', totalEntradas, 'bg-green-500')}
      ${kpi('Unidades egresadas', totalSalidas, 'bg-red-500')}
    </div>

    <!-- Por categoría -->
    <div class="bg-white rounded-xl shadow p-4 mb-6">
      <h2 class="font-semibold text-gray-700 mb-3">Inventario por categoría</h2>
      ${Object.keys(byCategory).length
        ? `<table class="w-full text-sm">
            <thead class="text-gray-500 text-xs uppercase">
              <tr>
                <th class="pb-2 text-left">Categoría</th>
                <th class="pb-2 text-right">Productos</th>
                <th class="pb-2 text-right">Stock total</th>
                <th class="pb-2 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(byCategory).map(([cat, d]) => `
                <tr class="border-t">
                  <td class="py-2">${cat}</td>
                  <td class="py-2 text-right">${d.count}</td>
                  <td class="py-2 text-right">${d.stock}</td>
                  <td class="py-2 text-right">$${d.value.toFixed(2)}</td>
                </tr>`).join('')}
            </tbody>
          </table>`
        : `<p class="text-gray-400 text-sm">Sin datos.</p>`}
    </div>

    <!-- Stock bajo -->
    <div class="bg-white rounded-xl shadow p-4">
      <h2 class="font-semibold text-gray-700 mb-3">⚠️ Productos con stock bajo</h2>
      ${lowStock.length
        ? `<ul class="space-y-1 text-sm">
            ${lowStock.map(p => `
              <li class="flex justify-between border-b py-1">
                <span>${p.name}</span>
                <span class="text-red-500 font-medium">Stock: ${p.stock} / Mín: ${p.minStock}</span>
              </li>`).join('')}
          </ul>`
        : `<p class="text-green-600 text-sm">✅ Todos los productos tienen stock suficiente.</p>`}
    </div>`;
}

function kpi(label, value, color) {
  return `
    <div class="rounded-xl text-white p-5 ${color} shadow">
      <p class="text-2xl font-bold">${value}</p>
      <p class="text-sm mt-1 opacity-90">${label}</p>
    </div>`;
}
