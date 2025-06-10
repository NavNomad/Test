// script.js
angular.module("app", ["leaflet-directive"])
.controller("GermanMapCtrl", ["$scope", "$http", function($scope, $http) {
  $scope.showCenterCoords = false;
  $scope.countriesGeoJson = "https://s3-us-west-2.amazonaws.com/s.cdpn.io/93930/countries.geo.json?v=11";
  $scope.countriesJson = "https://s3-us-west-2.amazonaws.com/s.cdpn.io/93930/countries.json?v=11";

  const continentProperties = {
    "150": { name: "Europe", colors: ["#809bce", "#7291cc", "#6983b3", "#6d90d1", "#506ca1"] },
    "019": { name: "America", colors: ["#81d4fa", "#4fc3f7", "#29b6f6", "#03a9f4", "#039be5"] },
    "002": { name: "Africa", colors: ["#b8e0d4", "#a3c4ba", "#a3d4c5", "#88bdad", "#91e3ca"] },
    "142": { name: "Asia", colors: ["#eac4d5", "#dea0bc", "#d1a3b8", "#eda6c6"] },
    "009": { name: "Oceania", colors: ["#d6eadf", "#deffed", "#bae3cd", "#9dc4af", "#cef0de"] }
  };

  angular.extend($scope, {
    center: {
      lat: 20,
      lng: 0,
      zoom: 2
    },
    legend: {
      colors: ["#809bce", "#81d4fa", "#b8e0d4", "#eac4d5", "#d6eadf"],
      labels: ["Europe", "America", "Africa", "Asia", "Oceania"]
    },
    defaults: {
      tileLayer: "http://{s}.tiles.wmflabs.org/osm-no-labels/{z}/{x}/{y}.png"
    }
  });

  function getColor(country) {
    if (!country || !country["region-code"]) return "#ccc";
    const colors = continentProperties[country["region-code"]]?.colors || ["#ccc"];
    const index = country["alpha-3"].charCodeAt(0) % colors.length;
    return colors[index];
  }

  function style(feature) {
    const country = $scope.countries[feature.id];
    return {
      fillColor: getColor(country),
      weight: 1,
      opacity: 1,
      color: "white",
      fillOpacity: 0.7
    };
  }

  function highlightLayer(layer, color = "#000", fillColor = "#39e") {
    layer.setStyle({
      weight: 2,
      color: color,
      fillColor: fillColor
    });
    layer.bringToFront();
  }

  function resetHighlight(layer, country) {
    layer.setStyle({
      weight: 1,
      color: "white",
      fillColor: getColor(country)
    });
  }

  $http.get($scope.countriesJson).then(function(res) {
    const data = res.data;
    $scope.countries = {};
    data.forEach(country => {
      const id = country["alpha-3"].replace("_", "");
      country.flag = country["alpha-2"]?.toLowerCase() || "";
      $scope.countries[id] = country;
    });

    $http.get($scope.countriesGeoJson).then(function(geo) {
      $scope.geojson = {
        data: geo.data,
        style: style,
        resetStyleOnMouseout: true,
        onEachFeature: function(feature, layer) {
          layer.on({
            click: function(e) {
              const country = $scope.countries[feature.id];
              $scope.selectedCountry = feature;
              $scope.selectedCountryData = country || {};

              $http.get(`https://restcountries.com/v3.1/alpha/${feature.id}`)
                .then(res => {
                  const info = res.data[0];
                  $scope.selectedCountryExtra = {
                    language: Object.values(info.languages || {})[0] || "Unknown",
                    currency: Object.values(info.currencies || {})[0]?.name || "Unknown",
                    symbol: Object.values(info.currencies || {})[0]?.symbol || ""
                  };
                }).catch(() => {
                  $scope.selectedCountryExtra = { language: "Unknown", currency: "Unknown", symbol: "" };
                });

              highlightLayer(layer);
              $scope.$applyAsync();
            },
            mouseover: function(e) {
              highlightLayer(layer, "#666", "#ddd");
            },
            mouseout: function(e) {
              resetHighlight(layer, $scope.countries[feature.id]);
            }
          });
        }
      };
    });
  });
}]);
