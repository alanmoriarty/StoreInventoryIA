const overlay = () => document.getElementById('modal-overlay');
const content = () => document.getElementById('modal-content');

export function openModal(html, onConfirm) {
  content().innerHTML = html;
  overlay().classList.remove('hidden');

  const confirmBtn = content().querySelector('[data-confirm]');
  const cancelBtn  = content().querySelector('[data-cancel]');

  confirmBtn?.addEventListener('click', () => { onConfirm?.(); closeModal(); });
  cancelBtn?.addEventListener('click', closeModal);
}

export function closeModal() {
  overlay().classList.add('hidden');
  content().innerHTML = '';
}

// Cerrar al hacer click fuera
document.getElementById('modal-overlay')
  .addEventListener('click', e => { if (e.target === overlay()) closeModal(); });
