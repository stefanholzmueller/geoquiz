const bounds = L.latLngBounds(L.latLng(-64, -180), L.latLng(84, 180));
const map = L.map('map', {
 maxBounds: bounds
}).fitWorld();
var popup;

L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png', {
  bounds: bounds,
  minZoom: 2,
  maxZoom: 18,
  reuseTiles: true,
  attribution: '&copy;<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy;<a href="https://cartodb.com/attributions">CartoDB</a>'
}).addTo(map);
L.control.scale().addTo(map);

const shuffledCountries = shuffle(countries);
const state = {
  target: shuffledCountries.pop()
}

function nextTarget() {
  if (shuffledCountries.length > 0) {
    state.target = shuffledCountries.pop();
  } else {
    alert('Game over!');
  }
  document.getElementById('target').textContent = normalizeCountryName(state.target.address.country);
}
nextTarget();

document.getElementById('skip').onclick = nextTarget;

map.on('click', function(ev) {
  const latlng = ev.latlng;
  const queryParams = { 'accept-language': 'en', format: 'json', lat: latlng.lat, lon: latlng.lng, zoom: 3 };
  getJson('https://nominatim.openstreetmap.org/reverse', queryParams).then(function(place) {
    if (place.error) {
      console.log('reverse geocoding error: ' + place.error);
    } else {
      const countryName = normalizeCountryName(place.address.country);
      const targetCountry = normalizeCountryName(state.target.address.country);
      if (countryName === targetCountry) {
        const popupText = `You correctly located <span class="correct">${targetCountry}</span>. Good job!`;
        popup = L.popup().setLatLng(latlng).setContent(popupText).openOn(map);
        displayCountryShape(countryName, 'green').then(nextTarget);
      } else {
        const incorrectLocation = normalizeCountryName(countryName || 'the sea');
        const distance = Math.round(L.latLng(state.target.lat, state.target.lon).distanceTo(latlng) / 1000)
        const popupText = `You clicked on <span class="incorrect">${incorrectLocation}</span>, not ${targetCountry}. Try again!<br><span class="hint">Hint: ${targetCountry} is approximately ${distance} km away.</span>`;
        popup = L.popup().setLatLng(latlng).setContent(popupText).openOn(map);
        displayCountryShape(countryName, 'red');
      }
    }
  })
});

function displayCountryShape(countryName, color) {
  const queryParams = { 'accept-language': 'en', country: countryName, format: 'json', lang: 'en', polygon_geojson: 1, polygon_threshold: 0.01 };
  return getJson('https://nominatim.openstreetmap.org/search', queryParams).then(function(places) {
    const shapes = places.filter(function(place) {
      return place.geojson.type.endsWith("Polygon");
    });
    if (shapes[0]) {
      var geojson = {
        type: 'Feature',
        geometry: shapes[0].geojson
      };
      L.geoJSON(geojson).setStyle({ color: color, fillColor: color, opacity: 0.7, weight: 1 }).addTo(map);
    } else {
      console.log(`cannot display shape of country: ${countryName}`, places);
    }
  });
}

function normalizeCountryName(countryName) {
  switch (countryName) {
    case "Czechia": return "Czech Republic";
    case "Democratic Republic of the Congo": return "Congo";
    case "Guam": return "United States of America";
    case "RDPA": return "Algeria";
    case "RSA": return "South Africa";
    case "Russian Federation": return "Russia";
    case "Sahrawi Arab Democratic Republic": return "Morocco";
    case "SBA": return "Akrotiri and Dhekelia";
    case "Sint Maarten": return "The Netherlands";
    case "South Ossetia": return "Georgia";
    case "Territorial waters of Faroe Islands": return "Faroe Islands";
    case "Turkish Republic Of Northern Cyprus": return "Cyprus";
    case "North Macedonia": return "Macedonia";
    case "Netherlands": return "The Netherlands";
    case "Mindanao": return "Philippines";
    case "United States": return "United States of America"
    default: return countryName;
  }
}

function shuffle(array) {
    let counter = array.length;

    while (counter > 0) {
        let index = Math.floor(Math.random() * counter);
        counter--;
        let temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
}

function buildUrl(baseUrl, queryParams) {
  return baseUrl + '?' + Object.keys(queryParams).map(key => key + '=' + queryParams[key]).join('&');
}

function getJson(baseUrl, queryParams, callback) {
  return fetch(buildUrl(baseUrl, queryParams)).then(response => response.json());
}
