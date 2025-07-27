// Inicialización del mapa
const map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM(),
      title: 'OpenStreetMap'
    })
  ],
  view: new ol.View({
    center: ol.proj.fromLonLat([-74.0721, 4.7110]), // Bogotá, Colombia
    zoom: 10
  })
});

// Capas cargadas por el usuario
const vectorLayer = new ol.layer.Vector({
  source: new ol.source.Vector(),
  title: 'Capa Personalizada'
});
map.addLayer(vectorLayer);

// Escala dinámica
map.on('moveend', () => {
  const scale = map.getView().getResolution();
  document.getElementById('scale').textContent = `Escala: 1:${Math.round(scale)}`;
});

// Geolocalización
document.getElementById('geolocate').addEventListener('click', () => {
  navigator.geolocation.getCurrentPosition(pos => {
    const coords = ol.proj.fromLonLat([pos.coords.longitude, pos.coords.latitude]);
    map.getView().setCenter(coords);
  });
});

// Buscador (Nominatim API)
document.getElementById('search').addEventListener('change', (e) => {
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${e.target.value}`)
    .then(response => response.json())
    .then(data => {
      if (data.length > 0) {
        const coords = ol.proj.fromLonLat([parseFloat(data[0].lon), parseFloat(data[0].lat)]);
        map.getView().setCenter(coords);
      }
    });
});

// Selector de mapa base
document.getElementById('baseMap').addEventListener('change', (e) => {
  const baseLayer = map.getLayers().item(0);
  baseLayer.setSource(
    e.target.value === 'satellite' 
      ? new ol.source.XYZ({ url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}' })
      : new ol.source.OSM()
  );
});

// Carga de capas GeoJSON
document.getElementById('layerUpload').addEventListener('change', (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    const features = new ol.format.GeoJSON().readFeatures(reader.result);
    vectorLayer.getSource().addFeatures(features);
    updateLegend();
    updateAttributeTable();
  };
  reader.readAsText(file);
});

// Leyenda y atributos
function updateLegend() {
  const legendDiv = document.getElementById('legend');
  legendDiv.innerHTML = '<h4>Leyenda</h4>';
  // Implementar lógica según estilos de capa
}

function updateAttributeTable() {
  const table = document.getElementById('attributeTable');
  const features = vectorLayer.getSource().getFeatures();
  if (features.length > 0) {
    const headers = Object.keys(features[0].getProperties()).filter(prop => prop !== 'geometry');
    table.innerHTML = `
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${features.map(f => `<tr>${headers.map(h => `<td>${f.get(h)}</td>`).join('')}</tr>`).join('')}</tbody>
    `;
  }
}

// Transparencia (ejemplo con slider)
const opacitySlider = document.createElement('input');
opacitySlider.type = 'range';
opacitySlider.min = 0;
opacitySlider.max = 100;
opacitySlider.value = 100;
opacitySlider.addEventListener('input', () => {
  vectorLayer.setOpacity(opacitySlider.value / 100);
});
document.querySelector('.layer-control').appendChild(opacitySlider);