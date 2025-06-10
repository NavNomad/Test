angular.module("app", ["leaflet-directive"])
.controller("MapCtrl", ["$scope", "$http", function ($scope, $http) {
  $scope.center = { lat: 20, lng: 0, zoom: 2 };
  $scope.defaults = {
    tileLayer: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  };

  $scope.selectedCountry = null;
  $scope.highlightedLayer = null;

  function highlightFeature(layer) {
    if ($scope.highlightedLayer && $scope.highlightedLayer !== layer) {
      $scope.highlightedLayer.setStyle({
        weight: 1,
        color: "#fff",
        fillColor: "#ccc"
      });
    }
    layer.setStyle({
      weight: 2,
      color: "#000",
      fillColor: "#39e"
    });
    $scope.highlightedLayer = layer;
  }

  $http.get("https://s3-us-west-2.amazonaws.com/s.cdpn.io/93930/countries.geo.json?v=11")
    .then(function (geo) {
      $scope.geojson = {
        data: geo.data,
        style: function () {
          return {
            fillColor: "#ccc",
            weight: 1,
            opacity: 1,
            color: "#fff",
            fillOpacity: 0.7
          };
        },
        onEachFeature: function (feature, layer) {
          layer.on("click", function () {
            highlightFeature(layer);
            const code = feature.id;
            $http.get(`https://restcountries.com/v3.1/alpha/${code}`)
              .then(function (res) {
                const c = res.data[0];
                $scope.selectedCountry = {
                  name: c.name.common,
                  language: Object.values(c.languages || {})[0] || "Unknown",
                  currency: Object.values(c.currencies || {})[0]?.name || "Unknown",
                  symbol: Object.values(c.currencies || {})[0]?.symbol || "",
                  flag: c.cca2 ? c.cca2.toLowerCase() : ""
                };
              })
              .catch(function () {
                $scope.selectedCountry = {
                  name: "Unknown",
                  language: "Unknown",
                  currency: "Unknown",
                  symbol: "",
                  flag: ""
                };
              });
          });
        }
      };
    });
}]);
