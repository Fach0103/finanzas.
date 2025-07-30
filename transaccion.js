export class Transaccion {
  constructor({ id, tipo, monto, fecha, categoria, descripcion }) {
    this.id = id;
    this.tipo = tipo;
    this.monto = monto;
    this.fecha = fecha;
    this.categoria = categoria;
    this.descripcion = descripcion || '';
  }

  renderizar() {
    const div = document.createElement('div');
    div.classList.add('transaccion-item');
    div.dataset.id = this.id;

    div.innerHTML = `
      <span class="transaccion-tipo ${this.tipo === 'ingreso' ? 'transaccion-ingreso' : 'transaccion-egreso'}">${this.tipo.toUpperCase()}</span>
      <span class="transaccion-monto">$${this.monto.toFixed(2)}</span>
      <span class="transaccion-categoria">${this.categoria}</span>
      <span class="transaccion-descripcion">${this.descripcion}</span>
      <span class="transaccion-fecha">${this.fecha}</span>
      <div class="transaccion-acciones">
        <button class="btn-editar" data-id="${this.id}">✏️</button>
        <button class="btn-eliminar" data-id="${this.id}">🗑️</button>
      </div>
    `;

    return div;
  }
}

export class TransaccionesManager {
  constructor(selector) {
    this.contenedor = document.querySelector(selector);
    this.transacciones = [];
  }

  agregar(data) {
    const transaccion = new Transaccion(data);
    this.transacciones.push(transaccion);
    this.contenedor.appendChild(transaccion.renderizar());
  }

  cargarDesdeLista(lista = []) {
    this.transacciones = [];
    this.contenedor.innerHTML = '';
    lista.forEach(data => this.agregar(data));
  }

  buscarPorTexto(texto = '') {
    const filtro = texto.toLowerCase();
    const resultados = this.transacciones.filter(t =>
      t.descripcion.toLowerCase().includes(filtro) ||
      t.categoria.toLowerCase().includes(filtro)
    );
    this._renderizarFiltrados(resultados);
  }

  filtrarPor(tipo = 'todos', categoria = 'todos') {
    const resultados = this.transacciones.filter(t =>
      (tipo === 'todos' || t.tipo === tipo) &&
      (categoria === 'todos' || t.categoria === categoria)
    );
    this._renderizarFiltrados(resultados);
  }

  eliminarPorId(id) {
    this.transacciones = this.transacciones.filter(t => t.id !== id);
    this._renderizarFiltrados(this.transacciones);
  }

  _renderizarFiltrados(lista = []) {
    this.contenedor.innerHTML = '';
    lista.forEach(t => this.contenedor.appendChild(t.renderizar()));
  }
}
