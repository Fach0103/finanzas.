export function inicializarNavegacion() {
  const vistas = document.querySelectorAll('.view');

  const botones = Array.from(document.querySelectorAll('.sidebar-nav a'))
    .map(boton => {
      const destino = boton.getAttribute('data-target');
      const vistaExiste = document.getElementById(destino);

      if (!vistaExiste) {
        boton.classList.add('disabled');
        boton.title = 'Función en desarrollo';
      }

      return { boton, destino, vistaExiste };
    });

  function mostrarVista(idVista) {
    vistas.forEach(v => v.style.display = 'none');
    const vistaActiva = document.getElementById(idVista);
    if (vistaActiva) vistaActiva.style.display = 'block';
  }

  botones.forEach(({ boton, destino, vistaExiste }) => {
    boton.addEventListener('click', e => {
      e.preventDefault();
      if (!vistaExiste) return;
      mostrarVista(destino);
    });
  });

  mostrarVista('dashboardView');
}
