/* jshint browser:true,curly: false */
/* global L */

window.onload = () => {
    let urlParams = new URLSearchParams(window.location.search);
    window.vue = new Vue({
        el: '#app',
        components: {
        },
        data: {
            profile: 'driving',
            coordinates: null,
            contours: '15,30,45,60',
            denoise: 1.0,
            generalize: 5
        },
        created: function() {
        },
        mounted: function() {
            this.$nextTick(function() {
                mapboxgl.accessToken = urlParams.get('access_token') || localStorage.getItem('MapboxAccessToken');
                this.map = new mapboxgl.Map({
                    container: 'map',
                    style: 'mapbox://styles/mapbox/streets-v11',
                    center: [0, 0],
                    zoom: 0,
                    hash: true
                });
                this.map.addControl(new mapboxgl.NavigationControl());
                this.geolocate = new mapboxgl.GeolocateControl()
                this.geolocate.on('geolocate', (geolocation) => {
                    if (geolocation && geolocation.coords) {
                        this.coordinates = [geolocation.coords.longitude, geolocation.coords.latitude];
                    }
                })
                this.map.addControl(this.geolocate);
                this.geocoder = new MapboxGeocoder({
                    accessToken: mapboxgl.accessToken
                });
                this.geocoder.on('result', (response) => {
                    this.coordinates = response.result.center;
                });
                this.map.addControl(this.geocoder, 'top-left');

                this.marker = new mapboxgl.Marker({
                    draggable: true
                });
                this.marker.on('dragend', () => {
                    this.coordinates = this.marker.getLngLat().toArray();
                });

                this.map.on('style.load', () => {
                    this.map.addSource('isochrones', { type: 'geojson', data: {
                        type: 'FeatureCollection',
                        features: []
                    }});
                    this.map.addLayer({
                        id: 'fill',
                        type: 'fill',
                        source: 'isochrones',
                        "layout": {},
                        "paint": {"fill-color": ["get", "fill"], "fill-opacity": 0.3}
                    });
                    this.map.addLayer({
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
                    this.map.addLayer({
                        id: 'outline',
                        type: 'line',
                        source: 'isochrones',
                        "layout": {"line-join": "round"},
                        "paint": {
                            "line-color": ["get", "color"],
                            "line-opacity": 1,
                            "line-width": 3
                        }
                    });
                    this.map.addLayer({
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

                this.map.on('load', () => {
                });

                this.map.on('click', (e) => {
                    this.coordinates = e.lngLat.wrap().toArray();
                });
            });
        },
        watch: {
            coordinates: function(value) {
                this.marker
                    .setLngLat(value)
                    .addTo(this.map);
                this.isochrone();
            },
            profile: function(value) {
                this.isochrone();
            },
            contours: function(value) {
                this.isochrone();
            },
            denoise: function(value) {
                this.isochrone();
            },
            generalize: function(value) {
                this.isochrone();
            }
        },
        methods: {
            isochrone: function() {
                let xhr = new XMLHttpRequest();
                xhr.open('GET', `https://api.mapbox.com/isochrone/v1/mapbox/${this.profile}/${this.coordinates}?contours_minutes=${this.contours}&polygons=true&generalize=${this.generalize}&denoise=${this.denoise}&access_token=${mapboxgl.accessToken}`);
                xhr.onload = () => {
                    if (Math.floor(xhr.status / 100) * 100 !== 200) return console.error(xhr.status, xhr.responseText);
                    const geojson = JSON.parse(xhr.responseText);
                    this.map.getSource('isochrones').setData(geojson);
                    this.map.fitBounds(turf.bbox(geojson), {
                        padding: 20,
                        duration: 1000
                    });

                }
                xhr.send();
            }
        }
    });
}
