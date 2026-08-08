const colors = {
  success: 'bg-green-600',
  error:   'bg-red-600',
  info:    'bg-indigo-600',
};

export function toast(message, type = 'success', duration = 3000) {
  const el = document.getElementById('toast');
  el.className = `fixed bottom-6 right-6 z-50 text-white text-sm px-4 py-2 rounded-lg shadow-lg ${colors[type] ?? colors.info}`;
  el.textContent = message;
  el.classList.remove('hidden');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.add('hidden'), duration);
}
