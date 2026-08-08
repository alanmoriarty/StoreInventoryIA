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
    <h1 class="text-2xl font-bold text-brand-darkest mb-6">Dashboard</h1>

    <!-- KPIs -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      ${kpi('Productos',    totalProducts,      'bg-brand-base')}
      ${kpi('Sin stock',    outOfStock.length,  'bg-brand-dark')}
      ${kpi('Stock bajo',   lowStock.length,    'bg-brand-light')}
      ${kpi('Movimientos',  movements.length,   'bg-brand-darkest')}
    </div>

    <div class="grid md:grid-cols-2 gap-6">

      <!-- Últimos movimientos -->
      <div class="bg-white rounded-xl shadow p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold text-brand-darkest">Últimos movimientos</h2>
          <a href="#/movements" class="text-xs text-brand-base hover:underline">Ver todos →</a>
        </div>
        ${recentMovementsTable(movements, products)}
      </div>

      <!-- Alertas de stock -->
      <div class="bg-white rounded-xl shadow p-4">
        <h2 class="font-semibold text-brand-darkest mb-3">⚠️ Alertas de stock</h2>
        ${stockAlerts(outOfStock, lowStock)}
      </div>

    </div>

    <!-- Resumen de unidades -->
    <div class="grid grid-cols-2 gap-4 mt-6">
      <div class="bg-brand-muted/20 border border-brand-base/30 rounded-xl p-4">
        <p class="text-2xl font-bold text-brand-darkest">+${unitsIn}</p>
        <p class="text-sm text-brand-base mt-1">Unidades ingresadas (total histórico)</p>
      </div>
      <div class="bg-brand-muted/20 border border-brand-base/30 rounded-xl p-4">
        <p class="text-2xl font-bold text-brand-darkest">-${unitsOut}</p>
        <p class="text-sm text-brand-dark mt-1">Unidades egresadas (total histórico)</p>
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
    return `<p class="text-brand-base text-sm">Sin movimientos aún.</p>`;

  const rows = recent.map(m => {
    const prod  = products.find(p => p.id === m.productId);
    const badge = m.type === 'entrada'
      ? 'bg-brand-muted text-brand-darkest'
      : 'bg-brand-muted text-brand-darkest';
    const dt = m.timestamp
      ? new Date(m.timestamp).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
      : m.date ?? '—';
    return `
      <tr class="border-t text-sm">
        <td class="py-2 px-2 font-medium">${prod?.name ?? '<span class="text-brand-base italic text-xs">Eliminado</span>'}</td>
        <td class="py-2 px-2">
          <span class="px-1.5 py-0.5 rounded-full text-xs font-medium ${badge} capitalize">${m.type}</span>
        </td>
        <td class="py-2 px-2 text-right font-semibold">${m.type === 'entrada' ? '+' : '-'}${m.qty}</td>
        <td class="py-2 px-2 text-brand-base text-xs whitespace-nowrap">${dt}</td>
      </tr>`;
  }).join('');

  return `
    <table class="w-full">
      <thead class="text-left text-brand-base text-xs uppercase">
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
    return `<p class="text-brand-base text-sm">✅ Todos los productos tienen stock suficiente.</p>`;

  const outRows = outOfStock.map(p => alertRow(p, 'bg-brand-muted/20 border-brand-base/30', '🚨', 'text-brand-dark', 'Sin stock'));
  const lowRows = lowStock.map(p =>  alertRow(p, 'bg-brand-muted/20 border-brand-base/30', '⚠️', 'text-brand-darkest', `Stock: ${p.stock} / Mín: ${p.minStock}`));

  return `<ul class="space-y-2 max-h-52 overflow-y-auto">${[...outRows, ...lowRows].join('')}</ul>`;
}

function alertRow(p, bg, icon, textCls, label) {
  return `
    <li class="flex items-center justify-between px-3 py-2 rounded-lg border ${bg} text-sm">
      <span>${icon} ${p.name}</span>
      <span class="font-medium ${textCls}">${label}</span>
    </li>`;
}
