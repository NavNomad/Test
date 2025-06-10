angular.module("app", ["leaflet-directive"])
.controller("GermanMapCtrl", ["$scope", "$http", function ($scope, $http) {
  $scope.showCenterCoords = false;
  $scope.selectedCountry = {};
  $scope.selectedCountryData = {};
  $scope.highlightedLayer = null;

  const continentProperties = {
    "150": { name: 'Europe', colors: [ '#809bce', '#7291cc', '#6983b3', '#6d90d1', '#506ca1' ] },
    "019": { name: 'America', colors: [ '#76d4f0', '#6fcce8', '#65c3de', '#57b8d3', '#4bb1cc' ] }, // updated America to cyan-blue
    "002": { name: 'Africa', colors: [ '#b8e0d4', '#a3c4ba', '#a3d4c5', '#88bdad', '#91e3ca' ] },
    "142": { name: 'Asia', colors: [ '#eac4d5', '#dea0bc', '#d1a3b8', '#eda6c6', '#e7b2c7' ] },
    "009": { name: 'Oceania', colors: [ '#d6eadf', '#deffed', '#bae3cd', '#9dc4af', '#cef0de' ] }
  };

  $scope.center = { lat: 40.8471, lng: 14.0625, zoom: 2 };
  $scope.defaults = {
    tileLayer: "http://{s}.tiles.wmflabs.org/osm-no-labels/{z}/{x}/{y}.png"
  };

  function getContinentColor(code) {
    const regionCode = $scope.countries[code]?.["region-code"];
    const alpha3 = $scope.countries[code]?.["alpha-3"];
    if (!regionCode || !alpha3) return "#ccc";
    const shades = continentProperties[regionCode]?.colors || ["#ccc"];
    const index = alpha3.charCodeAt(0) % shades.length;
    return shades[index];
  }

  function highlightFeature(layer) {
    if ($scope.highlightedLayer) {
      $scope.highlightedLayer.setStyle({
        weight: 1,
        color: "#fff",
        fillColor: getContinentColor($scope.highlightedLayer.feature.id)
      });
    }
    layer.setStyle({ weight: 2, color: "#000", fillColor: "#39e" });
    $scope.highlightedLayer = layer;
  }

  // Load country data
  $http.get("https://s3-us-west-2.amazonaws.com/s.cdpn.io/93930/countries.json?v=11").then(res => {
    $scope.countries = {};
    res.data.forEach(country => {
      country["alpha-3"] = country["alpha-3"].replace("_", "");
      country.flag = (country["alpha-2"] || "").toLowerCase();
      $scope.countries[country["alpha-3"]] = country;
    });

    // Load geoJSON
    return $http.get("https://s3-us-west-2.amazonaws.com/s.cdpn.io/93930/countries.geo.json?v=11");
  }).then(geo => {
    $scope.geojson = {
      data: geo.data,
      style: feature => ({
        fillColor: getContinentColor(feature.id),
        weight: 1,
        color: "white",
        fillOpacity: 0.7
      }),
      onEachFeature: (feature, layer) => {
        layer.on("click", () => {
          highlightFeature(layer);
          const code = feature.id;
          $scope.selectedCountryData = $scope.countries[code] || {};
          
          // REST API fetch
          $http.get(`https://restcountries.com/v3.1/alpha/${code}`)
            .then(res => {
              const c = res.data[0];
              $scope.selectedCountry = {
                name: c.name.common,
                language: Object.values(c.languages || {})[0] || "Unknown",
                currency: Object.values(c.currencies || {})[0]?.name || "Unknown",
                symbol: Object.values(c.currencies || {})[0]?.symbol || ""
              };
            })
            .catch(() => {
              $scope.selectedCountry = {
                name: feature.properties.name || "Unknown",
                language: "Unknown",
                currency: "Unknown",
                symbol: ""
              };
            });
        });
      }
    };
  });
}]);
