const overlay = () => document.getElementById('modal-overlay');
const content = () => document.getElementById('modal-content');

export function openModal(html, onConfirm) {
  const overlayEl = overlay();
  const contentEl = content();
  if (!overlayEl || !contentEl) return;

  contentEl.innerHTML = html;
  overlayEl.classList.remove('hidden');

  const confirmBtn = contentEl.querySelector('[data-confirm]');
  const cancelBtn  = contentEl.querySelector('[data-cancel]');

  confirmBtn?.addEventListener('click', () => { onConfirm?.(); closeModal(); });
  cancelBtn?.addEventListener('click', closeModal);
}

export function closeModal() {
  const overlayEl = overlay();
  const contentEl = content();
  if (!overlayEl || !contentEl) return;

  overlayEl.classList.add('hidden');
  contentEl.innerHTML = '';
}

// Cerrar al hacer click fuera
const modalOverlay = document.getElementById('modal-overlay');
modalOverlay?.addEventListener('click', e => { if (e.target === overlay()) closeModal(); });
