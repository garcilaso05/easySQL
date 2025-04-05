// Script para mostrar mapa de provincias con conteo de víctimas y OAVD
window.addEventListener("load", () => {
  const tab = document.getElementById("mapa");
  if (!tab) return;

  // Crear el contenedor del mapa
  const mapDiv = document.createElement("div");
  mapDiv.id = "mapaVictimes";
  mapDiv.style.width = "100%";
  mapDiv.style.height = "500px";
  tab.appendChild(mapDiv);

  // Crear botón de carga manual de datos
  const boton = document.createElement("button");
  boton.innerText = "Carregar dades al mapa";
  boton.style.marginTop = "10px";
  boton.onclick = window.cargarDatosMapa;
  tab.appendChild(boton);

  // Inicializar mapa centrado en España
  window.mapaLeaflet = L.map("mapaVictimes").setView([40.4, -3.7], 5);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
  }).addTo(window.mapaLeaflet);
});

window.addEventListener("resize", () => {
  if (window.mapaLeaflet) {
    window.mapaLeaflet.invalidateSize();
  }
});

// Estilo del icono de OAVD
const oavdIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [25, 25],
  iconAnchor: [12, 24],
  popupAnchor: [0, -20]
});

// Función para cargar datos al mapa
window.cargarDatosMapa = function () {
  const coords = {
    "A Coruña": [43.3623, -8.4115], "Ávila": [40.6566, -4.6815], "Avila": [40.6566, -4.6815],
    "Alava": [42.8468, -2.6727], "Albacete": [38.9943, -1.8585], "Alicante": [38.3452, -0.4810],
    "Almería": [36.8340, -2.4637], "Asturias": [43.3619, -5.8494], "Badajoz": [38.8794, -6.9706],
    "Barcelona": [41.3851, 2.1734], "Bilbao": [43.263, -2.935], "Burgos": [42.3439, -3.6969],
    "Cáceres": [39.4750, -6.3724], "Cádiz": [36.5164, -6.2994], "Cantabria": [43.1828, -3.9878],
    "Castellón": [39.9864, -0.0513], "Ciudad Real": [38.9861, -3.9291], "Córdoba": [37.8882, -4.7794],
    "Cuenca": [40.0704, -2.1374], "Girona": [41.9794, 2.8214], "Granada": [37.1773, -3.5986],
    "Guadalajara": [40.6333, -3.1667], "Gipuzkoa": [43.3128, -1.9749], "Huelva": [37.2614, -6.9447],
    "Huesca": [42.1362, -0.4089], "Jaén": [37.7796, -3.7849], "La Rioja": [42.2871, -2.5396],
    "León": [42.5987, -5.5671], "Lleida": [41.6176, 0.6200], "Lugo": [43.0124, -7.5553],
    "Madrid": [40.4168, -3.7038], "Málaga": [36.7213, -4.4214], "Melilla": [35.292, -2.938],
    "Murcia": [37.984, -1.128], "Navarra": [42.6954, -1.6761], "Pamplona": [42.812, -1.645],
    "Ourense": [42.3365, -7.8649], "Palencia": [42.0097, -4.5284], "Ponferrada": [42.546, -6.597],
    "Plasencia": [40.029, -6.088], "Las Palmas": [28.1235, -15.4363], "Cartagena": [37.605, -0.986],
    "Pontevedra": [42.4333, -8.6333], "Salamanca": [40.9701, -5.6635], "San Sebastián": [43.322, -1.983],
    "Santa Cruz de Tenerife": [28.4636, -16.2518], "Segovia": [40.9481, -4.1184], "Sevilla": [37.3886, -5.9823],
    "Soria": [41.7667, -2.4667], "Tarragona": [41.1189, 1.2445], "Teruel": [40.3456, -1.1065],
    "Toledo": [39.8628, -4.0273], "Valencia": [39.4699, -0.3763], "Valladolid": [41.6529, -4.7286],
    "Vitoria-Gasteiz": [42.846, -2.672], "Vizcaya": [43.2630, -2.9350], "Zamora": [41.5033, -5.7446],
    "Zaragoza": [41.6488, -0.8891], "Illes Balears": [39.5712, 2.6466], "Ibiza": [38.906, 1.432],
    "Mallorca": [39.569, 2.650], "Menorca": [39.889, 4.264], "Tenerife": [28.468, -16.254],
    "Gran Canaria": [28.123, -15.431], "Lanzarote": [28.963, -13.551], "Fuerteventura": [28.389, -14.031],
    "La Palma": [28.682, -17.764], "La Gomera": [28.103, -17.109], "El Hierro": [27.738, -18.020],
    "Ceuta": [35.888, -5.316], "Logroño": [42.466, -2.445]
  };

  if (window.mapaLayerGroup) {
    window.mapaLeaflet.removeLayer(window.mapaLayerGroup);
  }

  const group = L.layerGroup();

  // Añadir círculos de víctimas por provincia
  try {
    const resultados = alasql("SELECT [Provincia] AS provincia, COUNT(*) AS total FROM ECOVICTIMA GROUP BY [Provincia]");
    resultados.forEach(({ provincia, total }) => {
      const nombreNormalizado = provincia.trim();
      const coord = coords[nombreNormalizado];
      if (!coord) return;

      const color = total >= 5 ? "red" : total >= 3 ? "orange" : "blue";
      const circle = L.circle(coord, {
        radius: total * 2000,
        color: color,
        fillColor: color,
        fillOpacity: 0.5
      }).bindPopup(`<strong>${nombreNormalizado}</strong><br>Víctimes: ${total}`);
      group.addLayer(circle);
    });
  } catch (e) {
    alert("No se pudo cargar la tabla ECOVICTIMA.");
    console.error(e);
  }

  // Añadir pines de oficinas desde tabla OAVD
  try {
    const oficinas = alasql("SELECT Ciudad FROM OAVD");
    oficinas.forEach(({ Ciudad }) => {
      const ciudad = Ciudad.trim();
      const coord = coords[ciudad];
      if (coord) {
        const pin = L.marker(coord, { icon: oavdIcon })
          .bindPopup(`<strong>${ciudad}</strong><br>Oficina de Asistencia a las Víctimas del Delito`);
        group.addLayer(pin);
      } else {
        console.warn("Sin coordenadas para OAVD:", ciudad);
      }
    });
  } catch (e) {
    console.warn("Tabla OAVD no encontrada o error en consulta.");
  }

  window.mapaLayerGroup = group;
  group.addTo(window.mapaLeaflet);
};

// Recarga automática tras insertar
const originalExecuteSQL = window.executeSQL;
window.executeSQL = function () {
  originalExecuteSQL();
  const visible = document.getElementById("mapa").classList.contains("active");
  if (visible) {
    setTimeout(() => window.cargarDatosMapa(), 100);
  }
};
