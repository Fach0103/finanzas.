import { financeDB } from '../db.js';

document.addEventListener('DOMContentLoaded', async () => {
  await financeDB.init();

  const categorySelect = document.getElementById('categorySelect');
  if (categorySelect) {
    const categories = await financeDB.getAllCategories();

    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = cat.name;
      categorySelect.appendChild(option);
    });
  }
});
