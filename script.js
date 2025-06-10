angular.module("app", ["leaflet-directive"])
.controller("GermanMapCtrl", ["$scope", "$http", function($scope, $http) {
  $scope.center = { lat: 20, lng: 0, zoom: 2 };
  $scope.defaults = {
    tileLayer: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  };
  $scope.selectedCountry = {};
  $scope.selectedCountryData = {};
  $scope.highlightedLayer = null;

  const continentColors = {
    "150": ['#809bce', '#7291cc', '#6983b3', '#6d90d1', '#506ca1'], // Europe
    "019": ['#8cd2e8', '#7ec8df', '#6fbfd7', '#62b5cf', '#56abc7'], // America (cyan tones)
    "002": ['#b8e0d4', '#a3c4ba', '#a3d4c5', '#88bdad', '#91e3ca'], // Africa
    "142": ['#eac4d5', '#dea0bc', '#d1a3b8', '#eda6c6', '#e6accf'], // Asia
    "009": ['#d6eadf', '#deffed', '#bae3cd', '#9dc4af', '#cef0de']  // Oceania
  };

  function getColor(country) {
    if (!country || !country["region-code"]) return "#FFF";
    const colors = continentColors[country["region-code"]] || ['#ccc'];
    const index = country["alpha-3"]?.charCodeAt(0) % colors.length;
    return colors[index];
  }

  function highlightFeature(layer) {
    if ($scope.highlightedLayer) {
      $scope.highlightedLayer.setStyle({
        weight: 1,
        color: "#fff",
        fillColor: $scope.highlightedLayer.defaultFill
      });
    }
    layer.defaultFill = layer.options.fillColor;
    layer.setStyle({
      weight: 3,
      color: "#000",
      fillColor: "#39e"
    });
    $scope.highlightedLayer = layer;
  }

  // Load country metadata
  $http.get("https://s3-us-west-2.amazonaws.com/s.cdpn.io/93930/countries.json?v=11").then(res => {
    const countriesMeta = {};
    res.data.forEach(c => {
      c["alpha-3"] = c["alpha-3"]?.replace("_", "");
      c.flag = (c["alpha-2"] || "").toLowerCase();
      countriesMeta[c["alpha-3"]] = c;
    });
    $scope.countries = countriesMeta;

    // Now load the geojson data
    $http.get("https://s3-us-west-2.amazonaws.com/s.cdpn.io/93930/countries.geo.json?v=11").then(geo => {
      $scope.geojson = {
        data: geo.data,
        style: feature => {
          const countryMeta = countriesMeta[feature.id];
          return {
            fillColor: getColor(countryMeta),
            weight: 1,
            color: "white",
            fillOpacity: 0.7
          };
        },
        onEachFeature: (feature, layer) => {
          layer.on("click", () => {
            highlightFeature(layer);
            const code = feature.id;
            $scope.selectedCountryData = countriesMeta[code] || {};

            // Live fetch language + currency
            $http.get(`https://restcountries.com/v3.1/alpha/${code}`).then(res => {
              const data = res.data[0];
              $scope.selectedCountry = {
                name: data.name.common,
                language: Object.values(data.languages || {})[0] || "Unknown",
                currency: Object.values(data.currencies || {})[0]?.name || "Unknown",
                symbol: Object.values(data.currencies || {})[0]?.symbol || ""
              };
            }).catch(() => {
              $scope.selectedCountry = {
                name: "Unknown", language: "Unknown", currency: "Unknown", symbol: ""
              };
            });
          });
        }
      };
    });
  });
}]);
