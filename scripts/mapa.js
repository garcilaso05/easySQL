let mapaLeaflet;
let mapLegend; // Nueva variable para mantener la leyenda

function initMap() {
    if (!mapaLeaflet) {
        mapaLeaflet = L.map('mapaContainer').setView([40.416775, -3.703790], 6);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(mapaLeaflet);
    }
    setTimeout(() => {
        mapaLeaflet.invalidateSize();
    }, 100);

    // Añadir leyenda fija si no existe
    if (!mapLegend) {
        mapLegend = L.control({ position: 'bottomright' });
        mapLegend.onAdd = function() {
            const div = L.DomUtil.create('div', 'map-legend');
            div.innerHTML = `
                <h4>Densidad de registros</h4>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #2ecc71"></div>
                    <span>Bajo (< 25% del total)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #f1c40f"></div>
                    <span>Medio (25-50% del total)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #e67e22"></div>
                    <span>Alto (50-75% del total)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #e74c3c"></div>
                    <span>Muy alto (> 75% del total)</span>
                </div>
            `;
            return div;
        };
        mapLegend.addTo(mapaLeaflet);
    }
}

function actualizarMapa() {
    // 1. Validación inicial
    const tableName = document.getElementById('mapaTableSelect').value;
    const columnName = document.getElementById('mapaColumnSelect').value;

    if (!tableName || !columnName) {
        showNotification('Selecciona una tabla y una columna para visualizar', 'warning');
        return;
    }

    try {
        // 2. Limpiar el mapa
        if (mapaLeaflet) {
            mapaLeaflet.eachLayer((layer) => {
                if (layer instanceof L.CircleMarker) {
                    mapaLeaflet.removeLayer(layer);
                }
            });
        }

        // 3. Obtener los datos - primera consulta de prueba
        console.log('Intentando consulta de prueba...');
        const testQuery = `SELECT * FROM ${tableName} LIMIT 1`;
        const testResult = ejecutarSQL(testQuery);
        console.log('Datos de prueba:', testResult);

        // 4. Realizar la consulta principal
        console.log('Ejecutando consulta principal...');
        const query = `SELECT [${columnName}], COUNT(*) as total FROM ${tableName} GROUP BY [${columnName}]`;
        console.log('Query:', query);
        
        const results = ejecutarSQL(query);
        console.log('Resultados:', results);

        if (results.length === 0) {
            showNotification('No hay datos para mostrar', 'info');
            return;
        }

        // 5. Procesar resultados
        const totalRegistros = results.reduce((sum, r) => sum + r.total, 0);
        const ranges = [
            { threshold: 0.25, color: '#2ecc71' },    // Verde
            { threshold: 0.50, color: '#f1c40f' },    // Amarillo
            { threshold: 0.75, color: '#e67e22' },    // Naranja
            { threshold: 1.00, color: '#e74c3c' }     // Rojo
        ];

        // 6. Crear marcadores
        results.forEach(result => {
            const locationName = result[columnName];
            const location = mapCoordinates[locationName];
            
            if (location) {
                const count = result.total;
                const percentage = count / totalRegistros;
                const range = ranges.find(r => percentage <= r.threshold);
                const radius = Math.max(8, Math.min(20, Math.sqrt(count) * 5));

                L.circleMarker([location.lat, location.lng], {
                    radius: radius,
                    fillColor: range.color,
                    color: '#fff',
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.7
                })
                .bindPopup(`
                    <strong>${locationName}</strong><br>
                    Cantidad: ${count}<br>
                    Porcentaje: ${(percentage * 100).toFixed(1)}%
                `)
                .addTo(mapaLeaflet);
            } else {
                console.warn(`No se encontraron coordenadas para: ${locationName}`);
            }
        });

        // 7. Ajustar vista
        mapaLeaflet.invalidateSize();

    } catch (error) {
        console.error('Error detallado:', error);
        showNotification(`Error al actualizar el mapa: ${error.message}`, 'error');
    }
}

function updateMapSelectors() {
    const tableSelect = document.getElementById('mapaTableSelect');
    const columnSelect = document.getElementById('mapaColumnSelect');

    // Limpiar selectores
    tableSelect.innerHTML = '<option value="">Selecciona una tabla</option>';
    columnSelect.innerHTML = '<option value="">Selecciona una columna</option>';
    columnSelect.disabled = true;

    // Poblar selector de tablas
    for (const tableName in schema.tables) {
        if (!schema.tables[tableName].isEnum) {
            const hasMapColumn = schema.tables[tableName].columns.some(col => 
                schema.tables[col.type]?.isEnum && isEnumUsableInMaps(col.type)
            );

            if (hasMapColumn) {
                const option = document.createElement('option');
                option.value = tableName;
                option.textContent = tableName;
                tableSelect.appendChild(option);
            }
        }
    }
}

function updateColumnSelect() {
    const tableSelect = document.getElementById('mapaTableSelect');
    const columnSelect = document.getElementById('mapaColumnSelect');
    const tableName = tableSelect.value;

    columnSelect.innerHTML = '<option value="">Selecciona una columna</option>';
    columnSelect.disabled = !tableName;

    if (tableName) {
        const table = schema.tables[tableName];
        table.columns.forEach(column => {
            if (schema.tables[column.type]?.isEnum && isEnumUsableInMaps(column.type)) {
                const option = document.createElement('option');
                option.value = column.name;
                option.textContent = `${column.name} (${column.type})`;
                columnSelect.appendChild(option);
            }
        });
    }
}

// Función auxiliar para obtener coordenadas según el valor
function getLocation(value) {
    // Definir coordenadas para las diferentes regiones
    const coordinates = {
        // Ejemplo de algunas coordenadas (añadir más según necesidad)
        'Madrid': { lat: 40.4165, lng: -3.7026 },
        'Barcelona': { lat: 41.3851, lng: 2.1734 },
        'Valencia': { lat: 39.4699, lng: -0.3763 },
        // ... más coordenadas
    };

    return coordinates[value];
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const mapTab = document.querySelector('[onclick="showTab(\'mapa\')"]');
    if (mapTab) {
        mapTab.addEventListener('click', () => {
            setTimeout(() => {
                initMap();
                updateMapSelectors();
            }, 100);
        });
    }

    // Añadir listener para el cambio de tabla
    const tableSelect = document.getElementById('mapaTableSelect');
    if (tableSelect) {
        tableSelect.addEventListener('change', updateColumnSelect);
    }
});
