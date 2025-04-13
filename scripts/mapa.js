let mapaLeaflet;

function initMap() {
    if (!mapaLeaflet) {
        mapaLeaflet = L.map('mapa').setView([40.416775, -3.703790], 6); // Centro en España
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(mapaLeaflet);
    }
}

function actualizarMapa() {
    mapaLeaflet.invalidateSize();
}

// Event listener para inicializar el mapa cuando se muestra la pestaña
document.addEventListener('DOMContentLoaded', () => {
    const mapTab = document.querySelector('[onclick="showTab(\'mapa\')"]');
    if (mapTab) {
        mapTab.addEventListener('click', () => {
            setTimeout(() => {
                initMap();
                actualizarMapa();
            }, 100);
        });
    }
});
