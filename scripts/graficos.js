function cargarGrafico() {
    cargarGraficoEdades();
    cargarGraficoMapa();
    cargarGraficoVictimasPorAno();
    cargarGraficoDenuncias(); // Añadir la nueva función
}

function cargarGraficoEdades() {
    const query = `
        SELECT TramoEdadVictima, COUNT(*) AS Cantidad
        FROM ECOVICTIMA
        GROUP BY TramoEdadVictima
    `;

    try {
        const result = alasql(query);
        const datos = result.map(row => ({
            name: row.TramoEdadVictima || 'No especificado',
            y: row.Cantidad
        }));

        Highcharts.chart('graficoEdades', {
            chart: {
                type: 'pie',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                style: { fontFamily: 'Poppins, sans-serif' }
            },
            title: {
                text: 'Distribución por Edad de las Víctimas',
                style: {
                    color: '#5E548E',
                    fontSize: '20px'
                }
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    colors: [
                        '#9B4F96', '#C067BB', '#E6D5E6', '#5E548E', 
                        '#7E6BBE', '#FF3366', '#B784B7', '#8B4513'
                    ],
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}</b>: {point.percentage:.1f}%',
                        style: {
                            fontWeight: 'normal',
                            textOutline: '0px'
                        }
                    },
                    showInLegend: true
                }
            },
            tooltip: {
                headerFormat: '',
                pointFormat: '<span style="color:{point.color}">\u25CF</span> <b>{point.name}</b><br/>' +
                    'Cantidad: <b>{point.y}</b><br/>' +
                    'Porcentaje: <b>{point.percentage:.1f}%</b>'
            },
            legend: {
                align: 'right',
                verticalAlign: 'middle',
                layout: 'vertical',
                itemStyle: {
                    fontWeight: 'normal'
                }
            },
            series: [{
                name: 'Edad',
                colorByPoint: true,
                data: datos
            }],
            credits: {
                enabled: false
            }
        });

    } catch (error) {
        console.error('Error en gráfico de edades:', error);
    }
}

function cargarGraficoMapa() {
    const query = `
        SELECT CCAA, COUNT(*) as Total
        FROM ECOVICTIMA
        GROUP BY CCAA
    `;

    try {
        const result = alasql(query);
        const datos = result.map(row => ({
            name: row.CCAA,
            y: row.Total
        }));

        Highcharts.chart('graficoMapa', {
            chart: {
                type: 'column',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                style: { fontFamily: 'Poppins, sans-serif' }
            },
            title: {
                text: 'Víctimas por Comunidad Autónoma',
                style: { color: '#5E548E', fontSize: '20px' }
            },
            xAxis: {
                categories: datos.map(d => d.name),
                labels: { rotation: -45 }
            },
            yAxis: {
                title: { text: 'Número de víctimas' }
            },
            series: [{
                name: 'Víctimas',
                data: datos,
                color: '#9B4F96'
            }],
            credits: { enabled: false }
        });
    } catch (error) {
        console.error('Error en gráfico de mapa:', error);
    }
}

function cargarGraficoVictimasPorAno() {
    const query = `
        SELECT YEAR(Fecha) as Ano, MONTH(Fecha) as Mes, COUNT(*) as Total
        FROM ECOVICTIMA
        GROUP BY YEAR(Fecha), MONTH(Fecha)
        ORDER BY Ano, Mes
    `;

    try {
        const result = alasql(query);
        
        // Convertir números de mes a nombres
        const nombresMeses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        // Formatear las categorías del eje X
        const categorias = result.map(r => `${nombresMeses[r.Mes - 1]} ${r.Ano}`);

        Highcharts.chart('graficoAnual', {
            chart: {
                type: 'line',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                style: { fontFamily: 'Poppins, sans-serif' }
            },
            title: {
                text: 'Evolución Mensual de Víctimas',
                style: { color: '#5E548E', fontSize: '20px' }
            },
            xAxis: {
                categories: categorias,
                labels: {
                    rotation: -45,
                    style: {
                        fontSize: '10px'
                    }
                }
            },
            yAxis: {
                title: { text: 'Número de víctimas' },
                min: 0
            },
            tooltip: {
                formatter: function() {
                    return `<b>${this.x}</b><br/>
                            Víctimas: <b>${this.y}</b>`;
                }
            },
            series: [{
                name: 'Víctimas',
                data: result.map(r => r.Total),
                color: '#9B4F96',
                marker: {
                    enabled: true,
                    radius: 4
                }
            }],
            credits: { enabled: false },
            plotOptions: {
                line: {
                    lineWidth: 2,
                    states: {
                        hover: {
                            lineWidth: 3
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error en gráfico mensual:', error);
    }
}

function cargarGraficoDenuncias() {
    const query = `
        SELECT HabiaDenuncia, COUNT(*) AS Cantidad
        FROM ECOVICTIMA
        GROUP BY HabiaDenuncia
    `;

    try {
        const result = alasql(query);
        const datos = result.map(row => ({
            name: row.HabiaDenuncia ? 'Con denuncia previa' : 'Sin denuncia previa',
            y: row.Cantidad,
            color: row.HabiaDenuncia ? '#9B4F96' : '#C067BB'
        }));

        Highcharts.chart('graficoDenuncias', {
            chart: {
                type: 'pie',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                style: { fontFamily: 'Poppins, sans-serif' }
            },
            title: {
                text: 'Distribución de Casos por Existencia de Denuncia Previa',
                style: { color: '#5E548E', fontSize: '20px' }
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}</b>: {point.percentage:.1f}%',
                        style: {
                            fontWeight: 'normal',
                            textOutline: '0px'
                        }
                    },
                    showInLegend: true
                }
            },
            tooltip: {
                pointFormat: '{point.name}: <b>{point.y} casos</b> ({point.percentage:.1f}%)'
            },
            legend: {
                align: 'center',
                verticalAlign: 'bottom',
                layout: 'horizontal'
            },
            series: [{
                name: 'Denuncias',
                colorByPoint: true,
                data: datos
            }],
            credits: { enabled: false }
        });

    } catch (error) {
        console.error('Error en gráfico de denuncias:', error);
        document.getElementById('graficoDenuncias').innerHTML = 
            `<div class="error">Error al generar el gráfico: ${error.message}</div>`;
    }
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
