function setupGraficoSelectors() {
    const tableSelect = document.getElementById('graficoTableSelect');
    const columnSelect = document.getElementById('graficoColumnSelect');
    
    // Rellenar select de tablas
    tableSelect.innerHTML = '<option value="">Selecciona una tabla</option>';
    for (const tableName in schema.tables) {
        if (!schema.tables[tableName].isEnum) {
            const option = document.createElement('option');
            option.value = tableName;
            option.textContent = tableName;
            tableSelect.appendChild(option);
        }
    }

    // Event listener para cuando cambia la tabla
    tableSelect.addEventListener('change', () => {
        const selectedTable = tableSelect.value;
        columnSelect.innerHTML = '<option value="">Selecciona una columna</option>';
        columnSelect.disabled = !selectedTable;

        if (selectedTable && schema.tables[selectedTable]) {
            schema.tables[selectedTable].columns.forEach(col => {
                const option = document.createElement('option');
                option.value = col.name;
                option.textContent = `${col.name} (${col.type})`;
                columnSelect.appendChild(option);
            });
        }
    });
}

// Función para generar un nuevo gráfico
function generarGrafico() {
    const tableName = document.getElementById('graficoTableSelect').value;
    const columnName = document.getElementById('graficoColumnSelect').value;
    const tipoGrafico = document.getElementById('graficoTipoSelect').value;

    if (!tableName || !columnName || !tipoGrafico) {
        alert('Por favor, selecciona todos los campos necesarios');
        return;
    }

    try {
        // Crear primero el contenedor y los botones
        const graficoId = 'grafico_' + Date.now();
        const container = document.createElement('div');
        container.className = 'grafico-item';
        container.id = graficoId;

        // Crear y añadir los botones ANTES del gráfico
        const actions = document.createElement('div');
        actions.className = 'grafico-actions';
        actions.innerHTML = `
            <button class="grafico-btn delete" onclick="eliminarGrafico('${graficoId}')" title="Eliminar">❌</button>
        `;
        container.appendChild(actions);

        // Crear el contenedor específico para el gráfico
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        chartContainer.style.width = '100%';
        chartContainer.style.height = '400px'; // Altura fija para el gráfico
        container.appendChild(chartContainer);

        // Insertar al principio del contenedor de gráficos
        const graficosContainer = document.getElementById('graficos-container');
        graficosContainer.insertBefore(container, graficosContainer.firstChild);

        // Resto del código para crear el gráfico...
        const query = `
            SELECT ${columnName}, COUNT(*) as Cantidad
            FROM ${tableName}
            GROUP BY ${columnName}
            ORDER BY Cantidad DESC
        `;
        const result = ejecutarSQL(query);
        let datos = result.map(row => ({
            name: row[columnName] || 'No especificado',
            y: row.Cantidad
        }));

        // Crear el gráfico en el contenedor específico
        const chartOptions = {
            chart: {
                type: tipoGrafico === 'semicircle' ? 'pie' : tipoGrafico,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                style: { fontFamily: 'Poppins, sans-serif' }
            },
            title: {
                text: `Distribución de ${columnName} en ${tableName}`,
                style: { color: '#5E548E', fontSize: '20px' }
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}</b>: {point.percentage:.1f}%'
                    },
                    ...(tipoGrafico === 'semicircle' ? {
                        startAngle: -90,
                        endAngle: 90,
                        center: ['50%', '75%'],
                        size: '150%'
                    } : {})
                },
                series: {
                    dataLabels: {
                        style: {
                            fontSize: '0.8em',
                            color: document.body.classList.contains('dark-mode') ? '#FFFFFF' : '#333333'
                        }
                    }
                }
            },
            xAxis: {
                categories: datos.map(d => d.name),
                labels: {
                    rotation: -45,
                    style: {
                        fontSize: '0.8em',
                        color: document.body.classList.contains('dark-mode') ? '#FFFFFF' : '#333333'
                    }
                }
            },
            yAxis: {
                title: { text: 'Cantidad' },
                labels: {
                    style: {
                        fontSize: '0.8em',
                        color: document.body.classList.contains('dark-mode') ? '#FFFFFF' : '#333333'
                    }
                }
            },
            series: [{
                name: 'Cantidad',
                colorByPoint: true,
                data: datos,
                ...(tipoGrafico === 'semicircle' ? {
                    innerSize: '50%'
                } : {})
            }],
            credits: { enabled: false }
        };

        Highcharts.chart(chartContainer, chartOptions);

    } catch (error) {
        console.error('Error al generar gráfico:', error);
        alert('Error al generar el gráfico: ' + error.message);
    }
}

// Función para eliminar gráfico
function eliminarGrafico(graficoId) {
    if (confirm('¿Estás seguro de que deseas eliminar este gráfico?')) {
        const element = document.getElementById(graficoId);
        if (element) element.remove();
    }
}

function cargarGrafico() {
    setupGraficoSelectors();
    cargarGraficoEdades();
    cargarGraficoMapa();
    cargarGraficoVictimasPorAno();
    cargarGraficoDenuncias();
}

// Añadir evento para cargar el gráfico cuando se selecciona la pestaña
document.addEventListener('DOMContentLoaded', () => {
    const graficosTab = document.querySelector('[onclick="showTab(\'graficos\')"]');
    if (graficosTab) {
        graficosTab.addEventListener('click', () => {
            setTimeout(cargarGrafico, 100); // Pequeño delay para asegurar que el contenedor está visible
        });
    }
});

// Añadir evento cuando cambia la estructura de tablas
document.addEventListener('tableStructureChanged', () => {
    if (document.getElementById('graficos').classList.contains('active')) {
        setupGraficoSelectors();
    }
});
