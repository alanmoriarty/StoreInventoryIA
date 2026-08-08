import { db, DB_KEYS } from '../app.js';

export function renderDashboard(root) {
  const products  = db.get(DB_KEYS.products);
  const movements = db.get(DB_KEYS.movements);

  const totalProducts = products.length;
  const lowStock      = products.filter(p => p.stock > 0 && p.stock <= p.minStock);
  const outOfStock    = products.filter(p => p.stock === 0);
  const unitsIn       = movements.filter(m => m.type === 'entrada').reduce((s, m) => s + m.qty, 0);
  const unitsOut      = movements.filter(m => m.type === 'salida').reduce((s, m) => s + m.qty, 0);

  root.innerHTML = `
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

    <!-- KPIs -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      ${kpi('Productos',    totalProducts,      'bg-indigo-500')}
      ${kpi('Sin stock',    outOfStock.length,  'bg-red-500')}
      ${kpi('Stock bajo',   lowStock.length,    'bg-yellow-500')}
      ${kpi('Movimientos',  movements.length,   'bg-slate-500')}
    </div>

    <div class="grid md:grid-cols-2 gap-6">

      <!-- Últimos movimientos -->
      <div class="bg-white rounded-xl shadow p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold text-gray-700">Últimos movimientos</h2>
          <a href="#/movements" class="text-xs text-indigo-500 hover:underline">Ver todos →</a>
        </div>
        ${recentMovementsTable(movements, products)}
      </div>

      <!-- Alertas de stock -->
      <div class="bg-white rounded-xl shadow p-4">
        <h2 class="font-semibold text-gray-700 mb-3">⚠️ Alertas de stock</h2>
        ${stockAlerts(outOfStock, lowStock)}
      </div>

    </div>

    <!-- Resumen de unidades -->
    <div class="grid grid-cols-2 gap-4 mt-6">
      <div class="bg-green-50 border border-green-200 rounded-xl p-4">
        <p class="text-2xl font-bold text-green-700">+${unitsIn}</p>
        <p class="text-sm text-green-600 mt-1">Unidades ingresadas (total histórico)</p>
      </div>
      <div class="bg-red-50 border border-red-200 rounded-xl p-4">
        <p class="text-2xl font-bold text-red-700">-${unitsOut}</p>
        <p class="text-sm text-red-600 mt-1">Unidades egresadas (total histórico)</p>
      </div>
    </div>`;
}

function kpi(label, value, color) {
  return `
    <div class="rounded-xl text-white p-5 ${color} shadow">
      <p class="text-3xl font-bold">${value}</p>
      <p class="text-sm mt-1 opacity-90">${label}</p>
    </div>`;
}

function recentMovementsTable(movements, products) {
  const recent = [...movements]
    .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
    .slice(0, 6);

  if (!recent.length)
    return `<p class="text-gray-400 text-sm">Sin movimientos aún.</p>`;

  const rows = recent.map(m => {
    const prod  = products.find(p => p.id === m.productId);
    const badge = m.type === 'entrada'
      ? 'bg-green-100 text-green-700'
      : 'bg-red-100 text-red-700';
    const dt = m.timestamp
      ? new Date(m.timestamp).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
      : m.date ?? '—';
    return `
      <tr class="border-t text-sm">
        <td class="py-2 px-2 font-medium">${prod?.name ?? '<span class="text-gray-400 italic text-xs">Eliminado</span>'}</td>
        <td class="py-2 px-2">
          <span class="px-1.5 py-0.5 rounded-full text-xs font-medium ${badge} capitalize">${m.type}</span>
        </td>
        <td class="py-2 px-2 text-right font-semibold">${m.type === 'entrada' ? '+' : '-'}${m.qty}</td>
        <td class="py-2 px-2 text-gray-400 text-xs whitespace-nowrap">${dt}</td>
      </tr>`;
  }).join('');

  return `
    <table class="w-full">
      <thead class="text-left text-gray-400 text-xs uppercase">
        <tr>
          <th class="pb-2 px-2">Producto</th>
          <th class="pb-2 px-2">Tipo</th>
          <th class="pb-2 px-2 text-right">Cant.</th>
          <th class="pb-2 px-2">Fecha</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function stockAlerts(outOfStock, lowStock) {
  if (!outOfStock.length && !lowStock.length)
    return `<p class="text-green-600 text-sm">✅ Todos los productos tienen stock suficiente.</p>`;

  const outRows = outOfStock.map(p => alertRow(p, 'bg-red-50 border-red-200', '🚨', 'text-red-600', 'Sin stock'));
  const lowRows = lowStock.map(p =>  alertRow(p, 'bg-yellow-50 border-yellow-200', '⚠️', 'text-yellow-700', `Stock: ${p.stock} / Mín: ${p.minStock}`));

  return `<ul class="space-y-2 max-h-52 overflow-y-auto">${[...outRows, ...lowRows].join('')}</ul>`;
}

function alertRow(p, bg, icon, textCls, label) {
  return `
    <li class="flex items-center justify-between px-3 py-2 rounded-lg border ${bg} text-sm">
      <span>${icon} ${p.name}</span>
      <span class="font-medium ${textCls}">${label}</span>
    </li>`;
}
