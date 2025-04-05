function showTab(tabName) {
    // Ocultar todas las pestañas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Desactivar todos los botones
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    // Mostrar la pestaña seleccionada
    document.getElementById(tabName).classList.add('active');

    // Activar el botón correspondiente
    document.querySelector(`.tab-button[onclick="showTab('${tabName}')"]`).classList.add('active');

    // Inicializar pestañas específicas
    if (tabName === 'inserciones') {
        setupInsertionsTab();
    } else if (tabName === 'datos') {
        setupDataTab();
    }

    // 👇 Reparar tamaño del mapa si se activa la pestaña del mapa
    if (tabName === 'mapa' && window.mapaLeaflet) {
        setTimeout(() => {
          window.mapaLeaflet.invalidateSize();
        }, 300);
      }
      
}
