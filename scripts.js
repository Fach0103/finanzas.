import { financeDB } from '../db.js';

export async function cargarSelectorCategorias() {
  await financeDB.init();

  const categorySelect = document.getElementById('categorySelect');
  if (!categorySelect) return;

  const categories = await financeDB.getAllCategories();

  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.id;
    option.textContent = cat.name;
    categorySelect.appendChild(option);
  });
}
