// ¡Hola! Here's your updated JS code using your requested continent color palettes.
// It fetches country data and colors them according to continent, using different shades per country.

angular.module("app", ["leaflet-directive"])
.controller('GermanMapCtrl', ["$scope", "$http", function($scope, $http) {
  $scope.showCenterCoords = false;
  $scope.countriesGeoJson = "https://s3-us-west-2.amazonaws.com/s.cdpn.io/93930/countries.geo.json?v=11";
  $scope.countriesJson = "https://s3-us-west-2.amazonaws.com/s.cdpn.io/93930/countries.json?v=11";

  $scope.$on("leafletDirectiveMap.geojsonMouseover", function(event, feature, leafletEvent) {
    countryMouseover(feature, leafletEvent);
  });
  $scope.$on("leafletDirectiveMap.geojsonClick", function(event, featureSelected, leafletEvent) {
    countryClick(featureSelected, leafletEvent);
  });

  var continentProperties = {
    "150": { name: 'Europe', colors: [ '#A9C0E4', '#8FA9D6', '#7294C7', '#5C83BB', '#4474AD' ] },
    "019": { name: 'America', colors: [ '#F6A6B2', '#F48498', '#EC627E', '#E34065', '#DA1F4C' ] },
    "002": { name: 'Africa', colors: [ '#C9E4C5', '#B3D9B1', '#9DCE9C', '#86C488', '#6FBA74' ] },
    "142": { name: 'Asia', colors: [ '#FFE2B0', '#FFD18F', '#FFC06E', '#FFAF4D', '#FF9F2D' ] },
    "009": { name: 'Oceania', colors: [ '#C1E1DC', '#A6D4CD', '#8CC6BE', '#73B9B0', '#5AADA2' ] }
  };

  angular.extend($scope, {
    center: {
      lat: 20,
      lng: 0,
      zoom: 2
    },
    legend: {
      colors: [ '#A9C0E4', '#F48498', '#C9E4C5', '#FFD18F', '#A6D4CD' ],
      labels: [ 'Europe', 'America', 'Africa', 'Asia', 'Oceania' ]
    },
    defaults: {
      tileLayer: "http://{s}.tiles.wmflabs.org/osm-no-labels/{z}/{x}/{y}.png"
    }
  });

  function selectCountry(country, event, color, fillColor) {
    var layer = event.target;
    layer.setStyle({
      weight: 2,
      color: color,
      fillColor: fillColor
    });
    layer.bringToFront();
  }

  function countryClick(country, event) {
    selectCountry(country, event, '#000', '#39e');
    $scope.selectedCountry = country;
    $scope.selectedCountryData = $scope.countries[country.id];
    console.log("click:", country.properties.name);
  }

  function countryMouseover(country, event) {
    selectCountry(country, event, '#666', '#ccc');
  }

  function getColor(country) {
    if (!country || !country["region-code"]) {
      return "#DDD";
    }
    var colors = continentProperties[country["region-code"]]?.colors || [];
    var index = country["alpha-3"].charCodeAt(0) % colors.length;
    return colors[index] || "#EEE";
  }

  function style(country) {
    return {
      fillColor: getColor($scope.countries[country.id]),
      weight: 1,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.8
    };
  }

  $http.get($scope.countriesJson).success(function(data) {
    $scope.countries = {};
    for (var i = 0; i < data.length; i++) {
      var country = data[i];
      var id = country['alpha-3'];
      country['alpha-3'] = id.replace('_', '');
      country.flag = (function(name) {
        if (!name) return '';
        return name.indexOf('_') !== -1 ? name : name.toLowerCase();
      })(country['alpha-2']);
      $scope.countries[id] = country;
    }

    $http.get($scope.countriesGeoJson).success(function(data) {
      angular.extend($scope, {
        geojson: {
          data: data,
          style: style,
          resetStyleOnMouseout: true
        },
        selectedCountry: {},
        selectedCountryData: {}
      });
    });
  });
}]);
