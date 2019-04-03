// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"HJD/":[function(require,module,exports) {
/* jshint browser:true,curly: false */

/* global L */
window.onload = function () {
  var urlParams = new URLSearchParams(window.location.search);
  window.vue = new Vue({
    el: '#app',
    components: {},
    data: {
      profile: 'driving',
      coordinates: null,
      contours: '15,30,45,60',
      denoise: 1.0,
      generalize: 5
    },
    created: function created() {},
    mounted: function mounted() {
      this.$nextTick(function () {
        var _this = this;

        mapboxgl.accessToken = urlParams.get('access_token') || localStorage.getItem('MapboxAccessToken');
        this.map = new mapboxgl.Map({
          container: 'map',
          style: 'mapbox://styles/mapbox/streets-v11',
          center: [0, 0],
          zoom: 0,
          hash: true
        });
        this.map.addControl(new mapboxgl.NavigationControl());
        this.geolocate = new mapboxgl.GeolocateControl();
        this.geolocate.on('geolocate', function (geolocation) {
          if (geolocation && geolocation.coords) {
            _this.coordinates = [geolocation.coords.longitude, geolocation.coords.latitude];
          }
        });
        this.map.addControl(this.geolocate);
        this.geocoder = new MapboxGeocoder({
          accessToken: mapboxgl.accessToken
        });
        this.geocoder.on('result', function (response) {
          _this.coordinates = response.result.center;
        });
        this.map.addControl(this.geocoder, 'top-left');
        this.marker = new mapboxgl.Marker({
          draggable: true
        });
        this.marker.on('dragend', function () {
          _this.coordinates = _this.marker.getLngLat().toArray();
        });
        this.map.on('style.load', function () {
          _this.map.addSource('isochrones', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: []
            }
          });

          _this.map.addLayer({
            id: 'fill',
            type: 'fill',
            source: 'isochrones',
            "layout": {},
            "paint": {
              "fill-color": ["get", "fill"],
              "fill-opacity": 0.3
            }
          });

          _this.map.addLayer({
            id: 'outline-shadow',
            type: 'line',
            source: 'isochrones',
            "layout": {},
            "paint": {
              "line-color": ["get", "color"],
              "line-offset": 3,
              "line-opacity": 0.3,
              "line-width": 6
            }
          });

          _this.map.addLayer({
            id: 'outline',
            type: 'line',
            source: 'isochrones',
            "layout": {
              "line-join": "round"
            },
            "paint": {
              "line-color": ["get", "color"],
              "line-opacity": 1,
              "line-width": 3
            }
          });

          _this.map.addLayer({
            id: 'label',
            type: 'symbol',
            source: 'isochrones',
            layout: {
              "text-field": ["to-string", ["get", "contour"]],
              "symbol-placement": "line",
              "symbol-spacing": 50,
              "text-font": ["Open Sans Bold", "Arial Unicode MS Regular"],
              "text-max-angle": 35,
              "text-offset": [0, 0.5]
            },
            paint: {
              "text-halo-width": 5,
              "text-halo-color": ["get", "color"],
              "text-color": "hsl(0, 0%, 100%)"
            }
          });
        });
        this.map.on('load', function () {});
        this.map.on('click', function (e) {
          _this.coordinates = e.lngLat.wrap().toArray();
        });
      });
    },
    watch: {
      coordinates: function coordinates(value) {
        this.marker.setLngLat(value).addTo(this.map);
        this.isochrone();
      },
      profile: function profile(value) {
        this.isochrone();
      },
      contours: function contours(value) {
        this.isochrone();
      },
      denoise: function denoise(value) {
        this.isochrone();
      },
      generalize: function generalize(value) {
        this.isochrone();
      }
    },
    methods: {
      isochrone: function isochrone() {
        var _this2 = this;

        var xhr = new XMLHttpRequest();
        xhr.open('GET', "https://api.mapbox.com/isochrone/v1/mapbox/".concat(this.profile, "/").concat(this.coordinates, "?contours_minutes=").concat(this.contours, "&polygons=true&generalize=").concat(this.generalize, "&denoise=").concat(this.denoise, "&access_token=").concat(mapboxgl.accessToken));

        xhr.onload = function () {
          if (Math.floor(xhr.status / 100) * 100 !== 200) return console.error(xhr.status, xhr.responseText);
          var geojson = JSON.parse(xhr.responseText);

          _this2.map.getSource('isochrones').setData(geojson);

          _this2.map.fitBounds(turf.bbox(geojson), {
            padding: 20,
            duration: 1000
          });
        };

        xhr.send();
      }
    }
  });
};
},{}]},{},["HJD/"], null)
//# sourceMappingURL=/isochrone-playground/main.e6decf2f.js.map