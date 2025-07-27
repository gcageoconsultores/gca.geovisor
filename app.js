// Inicialización del mapa
const map = L.map('map').setView([4.7110, -74.0721], 10); // Bogotá, Colombia

// Capa base OSM
const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Capas base alternativas
const baseLayers = {
  "OpenStreetMap": osmLayer,
  "Satélite": L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'),
  "Topográfico": L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png')
};

// Control de capas base
L.control.layers(baseLayers, null, {position: 'topright'}).addTo(map);

// Escala
L.control.scale({position: 'bottomleft'}).addTo(map);

// Geolocalización
document.getElementById('geolocate').addEventListener('click', () => {
  map.locate({setView: true, maxZoom: 15});
});

map.on('locationfound', (e) => {
  L.marker(e.latlng).addTo(map)
    .bindPopup("¡Estás aquí!").openPopup();
});

// Buscador de direcciones
const searchControl = new GeoSearch.GeoSearchControl({
  provider: new GeoSearch.OpenStreetMapProvider(),
  style: 'bar',
  searchLabel: 'Buscar dirección...',
});
map.addControl(searchControl);

// Carga de capas GeoJSON
document.getElementById('layerUpload').addEventListener('change', (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  
  reader.onload = () => {
    const layer = L.geoJSON(JSON.parse(reader.result), {
      onEachFeature: (feature, layer) => {
        // Mostrar atributos al hacer clic
        if (feature.properties) {
          let popupContent = `<table>`;
          for (const key in feature.properties) {
            popupContent += `<tr><th>${key}</th><td>${feature.properties[key]}</td></tr>`;
          }
          popupContent += `</table>`;
          layer.bindPopup(popupContent);
        }
      }
    }).addTo(map);
    
    // Actualizar panel de capas
    addLayerControls(layer, file.name.split('.')[0]);
    updateAttributeTable(layer);
  };
  
  reader.readAsText(file);
});

// Añadir controles de capa al panel
function addLayerControls(layer, layerName) {
  const layerDiv = document.createElement('div');
  layerDiv.className = 'layer-control';
  layerDiv.innerHTML = `
    <label>
      <input type="checkbox" checked> ${layerName}
    </label>
    <div>
      <label>Transparencia: 
        <input type="range" min="0" max="100" value="100" class="opacity-slider">
      </label>
    </div>
    <div class="legend"></div>
  `;
  
  document.getElementById('layerControls').appendChild(layerDiv);
  
  // Control de visibilidad
  layerDiv.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
    if (e.target.checked) {
      map.addLayer(layer);
    } else {
      map.removeLayer(layer);
    }
  });
  
  // Control de transparencia
  layerDiv.querySelector('.opacity-slider').addEventListener('input', (e) => {
    layer.setStyle({fillOpacity: e.target.value / 100, opacity: e.target.value / 100});
  });
  
  // Generar leyenda (ejemplo simple)
  if (layer.options.style) {
    const legend = layerDiv.querySelector('.legend');
    legend.innerHTML = '<strong>Leyenda:</strong>';
    const legendItem = document.createElement('div');
    legendItem.className = 'legend-item';
    legendItem.innerHTML = `
      <div class="legend-color" style="background:${layer.options.style.fillColor};"></div>
      <span>${layerName}</span>
    `;
    legend.appendChild(legendItem);
  }
}

// Actualizar tabla de atributos
function updateAttributeTable(layer) {
  const table = document.getElementById('attributeTable');
  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody');
  
  // Limpiar tabla
  thead.innerHTML = '';
  tbody.innerHTML = '';
  
  // Obtener propiedades del primer feature (si existe)
  const features = layer.getLayers();
  if (features.length > 0 && features[0].feature.properties) {
    const properties = features[0].feature.properties;
    const headers = Object.keys(properties);
    
    // Crear encabezados
    thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
    
    // Llenar tabla (primeros 10 registros)
    features.slice(0, 10).forEach(feature => {
      const row = document.createElement('tr');
      headers.forEach(header => {
        row.innerHTML += `<td>${feature.feature.properties[header]}</td>`;
      });
      tbody.appendChild(row);
    });
  }
}

// Herramientas de dibujo
const drawControl = new L.Control.Draw({
  draw: {
    polygon: true,
    polyline: true,
    rectangle: false,
    circle: false,
    marker: true,
    circlemarker: false
  },
  edit: {
    featureGroup: new L.FeatureGroup() // Se debe añadir al mapa después
  }
});
map.addControl(drawControl);

// Manejar eventos de dibujo
map.on('draw:created', (e) => {
  const layer = e.layer;
  // Aquí podrías enviar la nueva geometría a un servidor
  map.addLayer(layer);
});
