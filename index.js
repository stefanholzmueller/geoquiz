var southWest = L.latLng(-62, -180),
    northEast = L.latLng(84, 180),
    bounds = L.latLngBounds(southWest, northEast);
var map = L.map('map', {
  maxBounds: bounds
}).fitWorld();

L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png', {
  minZoom: 2,
  maxZoom: 18,
  bounds: bounds,
  attribution: '&copy;<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy;<a href="https://cartodb.com/attributions">CartoDB</a>'
}).addTo(map);


var countryNames = countries.map(place => place.address.country);
var askedCountryName;

function randomize() {
  askedCountryName = countryNames[Math.floor(Math.random()*countryNames.length)];
  document.getElementById('asked').textContent = askedCountryName;
}
randomize();

function buildUrl(baseUrl, queryParams) {
  return baseUrl + '?' + Object.keys(queryParams).map(key => key + '=' + queryParams[key]).join('&');
}

function getJson(baseUrl, queryParams, callback) {
  return fetch(buildUrl(baseUrl, queryParams)).then(response => response.json());
}

map.on('click', function(ev) {
  getJson('https://nominatim.openstreetmap.org/reverse', { format: 'json', lang: 'en', lat: ev.latlng.lat, lon: ev.latlng.lng, zoom: 3 }).then(function(json) {
    var countryName = json.address.country;
    if (countryName === askedCountryName) {
      alert('You correctly located ' + countryName + '. Good job!');
      randomize();
    } else {
      alert('You clicked on ' + (countryName || 'the sea') + ', not ' + askedCountryName + '. Try again!');
    }
  })
});
