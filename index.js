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

var shuffledCountries = shuffle(countries);
var state = {
  target: shuffledCountries.pop(),
  tries: 0
}

function render() {
  document.getElementById('target').textContent = showCountryName(state.target.address.country);
}

map.on('click', function(ev) {
  const queryParams = { format: 'json', lang: 'en', lat: ev.latlng.lat, lon: ev.latlng.lng, zoom: 3 };
  getJson('https://nominatim.openstreetmap.org/reverse', queryParams).then(function(place) {
    if (place.error) {
      console.log('reverse geocoding error: ' + place.error);
    } else {
      var countryName = place.address.country;
      if (countryName === state.target.address.country) {
        popupSnackbar('You correctly located ' + showCountryName(countryName) + '. Good job!');
        randomize();
      } else {
        popupSnackbar('You clicked on ' + showCountryName(countryName || 'the sea') + ', not ' + showCountryName(state.target.address.country) + '. Try again!');
      }
    }
  })
});

function showCountryName(countryName) {
  switch (countryName) {
    case "Democratic Republic of the Congo": return "Congo";
    case "RDPA": return "Algeria";
    case "RSA": return "South Africa";
    case "Russian Federation": return "Russia";
    default: return countryName;
  }
}

function randomize() {
  if (shuffledCountries.length > 0) {
    state.target = shuffledCountries.pop();
  } else {
    alert('Game over!');
  }
  render();
}
randomize();

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

function popupSnackbar(message) {
  document.querySelector('#snackbar').MaterialSnackbar.showSnackbar({
//    actionText: 'Show',
//    actionHandler: function(){}
    message: message,
    timeout: 3000
  });
}
