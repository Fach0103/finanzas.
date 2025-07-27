import { financeDB } from '../db.js';

export function inicializarCategorias() {
  cargarCategoriasSelect();
  prepararFormularioCategorias();
  renderizarListaCategorias();
}

function cargarCategoriasSelect() {
  financeDB.getAllCategories()
    .then(categories => {
      const select = document.getElementById('categorySelect');
      if (!select) return;

      select.innerHTML = '<option value="">Selecciona una categoría</option>';
      categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        select.appendChild(option);
      });
    })
    .catch(error => {
      console.error('Error al cargar categorías:', error);
    });
}

function prepararFormularioCategorias() {
  const form = document.getElementById('categoryForm');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('categoryName').value.trim();
    const editingId = document.getElementById('editingCategoryId').value;

    if (!name) return;

    if (editingId) {
      await financeDB.updateCategory(Number(editingId), { name });
      document.getElementById('editingCategoryId').value = '';
    } else {
      await financeDB.addCategory({ name });
    }

    form.reset();
    cargarCategoriasSelect();
    renderizarListaCategorias();
  });
}

async function renderizarListaCategorias() {
  const lista = document.getElementById('categoryList');
  lista.innerHTML = '';
  const categorias = await financeDB.getAllCategories();

  categorias.forEach(cat => {
    const li = document.createElement('li');
    li.classList.add('categoria-item');

    const nombre = document.createElement('span');
    nombre.textContent = cat.name;

    const botones = document.createElement('div');
    botones.classList.add('categoria-botones');

    const btnEditar = document.createElement('button');
    btnEditar.textContent = '✏️';
    btnEditar.title = 'Editar';
    btnEditar.addEventListener('click', () => {
      document.getElementById('categoryName').value = cat.name;
      document.getElementById('editingCategoryId').value = cat.id;
    });

    const btnEliminar = document.createElement('button');
    btnEliminar.textContent = '🗑️';
    btnEliminar.title = 'Eliminar';
    btnEliminar.addEventListener('click', async () => {
      const confirmado = confirm(`¿Eliminar la categoría "${cat.name}" y sus transacciones asociadas?`);
      if (confirmado) {
        await financeDB.deleteCategoryAndTransactions(cat.id);
        cargarCategoriasSelect();
        renderizarListaCategorias();
      }
    });

    botones.appendChild(btnEditar);
    botones.appendChild(btnEliminar);
    li.appendChild(nombre);
    li.appendChild(botones);
    lista.appendChild(li);
  });
}
