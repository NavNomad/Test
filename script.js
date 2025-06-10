angular.module("app", ["leaflet-directive"])
.controller("MapCtrl", ["$scope", "$http", function ($scope, $http) {
  $scope.center = { lat: 20, lng: 0, zoom: 2 };
  $scope.defaults = { tileLayer: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" };
  $scope.selectedCountry = null;
  $scope.highlightedLayer = null;

  const continentColors = {
    "150": [ '#809bce', '#7291cc', '#6983b3', '#6d90d1', '#506ca1' ], // Europe
    "019": [ '#00bcd4', '#4dd0e1', '#80deea', '#b2ebf2', '#e0f7fa' ], // America (cyan blues)
    "002": [ '#b8e0d4', '#a3c4ba', '#a3d4c5', '#88bdad', '#91e3ca' ], // Africa
    "142": [ '#eac4d5', '#f3d1dc', '#f3b1c9', '#eda6c6', '#f5b9d3' ], // Asia
    "009": [ '#d6eadf', '#deffed', '#bae3cd', '#9dc4af', '#cef0de' ]  // Oceania
  };

  function getColor(feature) {
    const region = $scope.countries[feature.id]?.["region-code"];
    const id = feature.id || "";
    const colors = continentColors[region];
    if (!colors) return "#ccc";
    return colors[id.charCodeAt(0) % colors.length];
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

  // Load countries metadata
  $http.get("https://s3-us-west-2.amazonaws.com/s.cdpn.io/93930/countries.json?v=11")
    .then(res => {
      $scope.countries = {};
      res.data.forEach(country => {
        country.flag = (country["alpha-2"] || '').toLowerCase();
        $scope.countries[country["alpha-3"]] = country;
      });

      // Load geojson
      return $http.get("https://s3-us-west-2.amazonaws.com/s.cdpn.io/93930/countries.geo.json?v=11");
    })
    .then(res => {
      $scope.geojson = {
        data: res.data,
        style: feature => ({
          fillColor: getColor(feature),
          weight: 1,
          opacity: 1,
          color: "#fff",
          fillOpacity: 0.7
        }),
        onEachFeature: (feature, layer) => {
          layer.on("click", () => {
            highlightFeature(layer);
            const country = $scope.countries[feature.id] || {};
            $http.get(`https://restcountries.com/v3.1/alpha/${feature.id}`)
              .then(res => {
                const data = res.data[0] || {};
                $scope.selectedCountry = {
                  name: data.name?.common || feature.properties.name || "Unknown",
                  language: Object.values(data.languages || {})[0] || "Unknown",
                  currency: Object.values(data.currencies || {})[0]?.name || "Unknown",
                  symbol: Object.values(data.currencies || {})[0]?.symbol || ""
                };
              })
              .catch(() => {
                $scope.selectedCountry = {
                  name: country.name || feature.properties.name || "Unknown",
                  language: country.language || "Unknown",
                  currency: country.currency || "Unknown",
                  symbol: ""
                };
              });
          });
        }
      };
    });
}]);
