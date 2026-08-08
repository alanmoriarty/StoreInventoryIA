import { db, DB_KEYS } from '../app.js';
import { openModal, closeModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { can } from '../auth.js';

// Seed de categorías por defecto
export function seedCategories() {
  if (db.get(DB_KEYS.categories).length) return;
  ['General', 'Electrónica', 'Ropa', 'Alimentos', 'Herramientas'].forEach(name =>
    db.push(DB_KEYS.categories, { name }));
}

export function openCategoriesModal(onClose) {
  if (!can('categories.manage')) { toast('Sin permisos para gestionar categorías', 'error'); return; }
  function render() {
    const cats = db.get(DB_KEYS.categories);
    openModal(`
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">Gestionar Categorías</h2>
      </div>

      <ul id="cat-list" class="space-y-1 mb-4 max-h-48 overflow-y-auto">
        ${cats.length
          ? cats.map(c => `
            <li class="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-brand-muted/20 border text-sm" data-cat-id="${c.id}">
              <span class="cat-name">${c.name}</span>
              <div class="flex gap-2">
                <button data-cat-action="edit"   class="text-brand-base hover:underline text-xs">Editar</button>
                <button data-cat-action="delete" class="text-brand-dark hover:underline text-xs">Eliminar</button>
              </div>
            </li>`).join('')
          : `<li class="text-brand-base text-sm text-center py-3">Sin categorías.</li>`}
      </ul>

      <div class="flex gap-2">
        <input id="f-cat-name" placeholder="Nueva categoría..."
          class="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-base" />
        <button id="btn-cat-add"
          class="bg-brand-base text-white px-3 py-2 rounded-lg text-sm hover:bg-brand-dark">
          Agregar
        </button>
      </div>

      <div class="flex justify-end mt-4">
        <button data-cancel class="px-4 py-2 text-sm rounded-lg border hover:bg-brand-muted/20">Cerrar</button>
      </div>`, null);

    // Sobrescribir el cierre del modal para llamar onClose
    document.querySelector('[data-cancel]')?.addEventListener('click', () => {
      closeModal();
      onClose?.();
    });

    // Agregar categoría
    document.getElementById('btn-cat-add').addEventListener('click', () => {
      if (!can('categories.manage')) { toast('Sin permisos', 'error'); return; }
      const input = document.getElementById('f-cat-name');
      const name  = input.value.trim();
      if (!name) { toast('Escribe un nombre', 'error'); return; }
      const exists = db.get(DB_KEYS.categories).some(c => c.name.toLowerCase() === name.toLowerCase());
      if (exists) { toast('Ya existe esa categoría', 'error'); return; }
      db.push(DB_KEYS.categories, { name });
      toast('Categoría agregada');
      render();
    });

    // Editar / Eliminar
    document.getElementById('cat-list').addEventListener('click', e => {
      const li     = e.target.closest('[data-cat-id]');
      const action = e.target.closest('[data-cat-action]')?.dataset.catAction;
      if (!li || !action) return;
      const id = li.dataset.catId;

      if (action === 'delete') {
        if (!can('categories.manage')) { toast('Sin permisos', 'error'); return; }
        const inUse = db.get(DB_KEYS.products).some(p => {
          const cat = db.getOne(DB_KEYS.categories, id);
          return p.category === cat?.name;
        });
        if (inUse) { toast('Categoría en uso, no se puede eliminar', 'error'); return; }
        db.remove(DB_KEYS.categories, id);
        toast('Categoría eliminada', 'error');
        render();
        return;
      }

      if (action === 'edit') {
        if (!can('categories.manage')) { toast('Sin permisos', 'error'); return; }
        const cat      = db.getOne(DB_KEYS.categories, id);
        const nameSpan = li.querySelector('.cat-name');
        nameSpan.innerHTML = `
          <input id="edit-cat-input" value="${cat.name}"
            class="border rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-base w-36" />`;
        const input = document.getElementById('edit-cat-input');
        input.focus();
        input.addEventListener('keydown', e => {
          if (e.key === 'Enter')  saveEdit();
          if (e.key === 'Escape') render();
        });
        li.querySelector('[data-cat-action="edit"]').textContent = 'Guardar';
        li.querySelector('[data-cat-action="edit"]').addEventListener('click', saveEdit, { once: true });

        function saveEdit() {
          const newName = document.getElementById('edit-cat-input')?.value.trim();
          if (!newName) { toast('El nombre no puede estar vacío', 'error'); return; }
          // Actualizar productos que usen esta categoría
          const oldName = cat.name;
          db.get(DB_KEYS.products)
            .filter(p => p.category === oldName)
            .forEach(p => db.update(DB_KEYS.products, p.id, { category: newName }));
          db.update(DB_KEYS.categories, id, { name: newName });
          toast('Categoría actualizada');
          render();
        }
      }
    });
  }

  render();
}
