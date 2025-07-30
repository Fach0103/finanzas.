import { financeDB } from '../db.js';
import { mostrarMensaje, resetearFormulario } from './utils.js';

/**
 * 🧠 Inicializa el módulo de categorías
 */
export function inicializarCategorias() {
  actualizarSelectsCategoria();
  prepararFormularioCategorias();
  renderizarListaCategorias();
}

/**
 * 🔁 Refresca todos los <select> que usan categorías
 */
function actualizarSelectsCategoria() {
  cargarCategoriasEnSelect('categorySelect');         // Transacciones
  cargarCategoriasEnSelect('budgetCategorySelect');   // Presupuestos
}

/**
 * 📤 Carga las categorías dentro de un <select>
 */
export function cargarCategoriasEnSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = '';
  financeDB.getAllCategories().then(categorias => {
    categorias.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = cat.name;
      select.appendChild(option);
    });
  });
}

/**
 * ✍️ Prepara el formulario para agregar o editar categoría
 */
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
      mostrarMensaje('resultado-categoria', '✏️ Categoría actualizada correctamente.');
    } else {
      await financeDB.addCategory({ name });
      mostrarMensaje('resultado-categoria', '✅ Categoría agregada correctamente.');
    }

    resetearFormulario('#categoryForm');
    renderizarListaCategorias();
    actualizarSelectsCategoria();
  });
}

/**
 * 📋 Renderiza la lista completa de categorías
 */
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
        renderizarListaCategorias();
        actualizarSelectsCategoria();
        mostrarMensaje('resultado-categoria', `🗑️ Categoría "${cat.name}" eliminada.`);
      }
    });

    botones.appendChild(btnEditar);
    botones.appendChild(btnEliminar);
    li.appendChild(nombre);
    li.appendChild(botones);
    lista.appendChild(li);
  });
}
