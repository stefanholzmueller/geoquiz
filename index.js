const bounds = L.latLngBounds(L.latLng(-64, -180), L.latLng(84, 215));
const map = L.map('map', {
  maxBounds: bounds
}).fitWorld();
var popup;

//Show the bounds on screen
//L.rectangle(bounds, { color: "cornflowerblue", weight: 1, fillOpacity: 0 }).addTo(map);

L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager_nolabels/{z}/{x}/{y}.png', {
  minZoom: 2,
  maxZoom: 18,
  attribution: '&copy;<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy;<a href="https://cartodb.com/attributions">CartoDB</a></br><a href="https://opendatacommons.org/licenses/odbl/">(ODbL) </a><a href="https://pacific-data.sprep.org/dataset/openstreetmap-data-pacific">OSM Data Pacific</a> &vert;<a href="http://www.opendefinition.org/licenses/cc-by-sa">(CC BY-SA 4.0) </a><a href="https://www.spc.int/">SPC</a>'
}).addTo(map);
L.control.scale().addTo(map);

var myStyle = {
  color: "cornflowerblue",
  weight: 1,
  opacity: 1,
  fillOpacity: 0,
  dashArray: '2, 5'
};

//Pacific eez boundaries
L.geoJSON(pacific, { interactive: false }).setStyle(myStyle).addTo(map);
L.geoJSON(pacific2, { interactive: false }).setStyle(myStyle).addTo(map);

//Markers Islands
L.marker([-0.533333, 166.916667]).addTo(map).on('click', handleClick);//Nauru
L.marker([-13.833333, 188.25]).addTo(map).on('click', handleClick);//Samoa
L.marker([-13.833333, -171.75]).addTo(map).on('click', handleClick);//Samoa+180
L.marker([-19.053889, 190.08]).addTo(map).on('click', handleClick);//Niue
L.marker([-19.053889, -169.92]).addTo(map).on('click', handleClick);//Niue+180
L.marker([-21.133333, 184.8]).addTo(map).on('click', handleClick);//Tonga+180
L.marker([-21.133333, -175.2]).addTo(map).on('click', handleClick);//Tonga
L.marker([-21.2, 200.233333]).addTo(map).on('click', handleClick);//Cook Islands+180
L.marker([-21.2, -159.766667]).addTo(map).on('click', handleClick);//Cook Islands
L.marker([-8.516667, 179.2]).addTo(map).on('click', handleClick);//Tuvalu
L.marker([1.466667, 173.033333]).addTo(map).on('click', handleClick);//Kiribati
L.marker([-2.810556, -171.675556]).addTo(map).on('click', handleClick);//Kiribati2
L.marker([-2.810556, 188.324444]).addTo(map).on('click', handleClick);//Kiribati2+180
L.marker([1.866667, -157.4]).addTo(map).on('click', handleClick);//Kiribati3
L.marker([1.866667, 202.6]).addTo(map).on('click', handleClick);//Kiribati3+180
L.marker([6.916667, 158.183333]).addTo(map).on('click', handleClick);//Micronesia
L.marker([7.116667, 171.066667]).addTo(map).on('click', handleClick);//Marshal Islands
L.marker([7.5, 134.616667]).addTo(map).on('click', handleClick);//Palau

const shuffledCountries = shuffle(countries);
const state = {
  target: null,
  correct: 0,
  wrong: 0,
  skipped: 0
};

function nextTarget() {
  if (shuffledCountries.length > 0) {
    state.target = shuffledCountries.pop();
  } else {
    alert(`Congratulations! \n You found all ${state.correct} countries, with ${state.wrong} incorrect guesses, and you skipped ${state.skipped} countries.`);
  }
  document.getElementById('target').textContent = normalizeCountryName(state.target.address.country);
  updateUiState();
}
nextTarget();

function updateUiState() {
  document.getElementById('correct').textContent = state.correct;
  document.getElementById('wrong').textContent = state.wrong;
  document.getElementById('skipped').textContent = state.skipped;
}

document.getElementById('skip').onclick = function () {
  state.skipped++;
  nextTarget();
}

function handleClick(ev) {
  const latlng = ev.latlng;
  const queryParams = { 'accept-language': 'en', format: 'json', lat: latlng.wrap().lat, lon: latlng.wrap().lng, zoom: 3 };
  getJson('https://nominatim.openstreetmap.org/reverse', queryParams).then(function (place) {
    if (place.error === "Unable to geocode") {
      popup = L.popup().setLatLng(latlng).setContent("Nothing here").openOn(map);
    } else if (place.error) {
      console.error('reverse geocoding error: ' + place.error);
    } else {
      const countryName = normalizeCountryName(place.address.country || place.display_name);
      const targetCountry = normalizeCountryName(state.target.address.country);
      if (countryName === targetCountry) {
        const popupText = `You correctly located <span class="correct">${targetCountry}</span>. Good job!`;
        popup = L.popup().setLatLng(latlng).setContent(popupText).openOn(map);
        displayCountryShape(countryName, 'green').then(function () {
          state.correct++;
          nextTarget();
        });
      } else {
        const incorrectLocation = normalizeCountryName(countryName);
        const distance = Math.round(L.latLng(state.target.lat, state.target.lon).distanceTo(latlng) / 1000)
        const popupText = `You clicked on <span class="incorrect">${incorrectLocation}</span>, not ${targetCountry}. Try again!<br><span class="hint">Hint: ${targetCountry} is approximately ${distance} km away.</span>`;
        popup = L.popup().setLatLng(latlng).setContent(popupText).openOn(map);
        displayCountryShape(countryName, 'red').then(function () {
          state.wrong++;
          updateUiState();
        });
      }
    }
  })
};

map.on('click', handleClick);

var wrongShape;

function displayCountryShape(countryName, mycolor) {
  const queryParams = { 'accept-language': 'en', country: countryName, format: 'json', lang: 'en', polygon_geojson: 1, polygon_threshold: 0.01 };
  return getJson('https://nominatim.openstreetmap.org/search', queryParams).then(function (places) {
    const shapes = places.filter(function (place) {
      return place.geojson.type.endsWith("Polygon") && place.display_name === countryName;
    });
    if (shapes[0]) {
      var geojson = {
        type: 'Feature',
        geometry: shapes[0].geojson
      };
      if (wrongShape) wrongShape.removeFrom(map);
      if (mycolor !== 'red') {
        L.geoJSON(geojson).setStyle({ color: mycolor, fillColor: mycolor, weight: 1,  interactive: false }).addTo(map);
      } else {
        wrongShape = L.geoJSON(geojson).setStyle({ color: mycolor, fillColor: mycolor, weight: 1 });
        wrongShape.addTo(map);
      }
    } else {
      console.error(`cannot display shape of country: ${countryName}`, places);
    }
  });
}

function normalizeCountryName(countryName) {
  switch (countryName) {
    //case "Czechia": return "Czech Republic";
    //case "Democratic Republic of the Congo": return "Congo";
    //case "Guam": return "United States of America";
    case "RDPA": return "Algeria";
    case "RSA": return "South Africa";
    //case "Russian Federation": return "Russia";
    //case "Sahrawi Arab Democratic Republic": return "Morocco";
    case "SBA": return "Akrotiri and Dhekelia";
    case "Sint Maarten": return "The Netherlands";
    case "South Ossetia": return "Georgia";
    //case "Territorial waters of Faroe Islands": return "Faroe Islands";
    case "Turkish Republic Of Northern Cyprus": return "Cyprus";
    //case "North Macedonia": return "Macedonia";
    case "Mindanao": return "Philippines";
    case "Luzon": return "Philippines";
    case "Visayas": return "Philippines";
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
