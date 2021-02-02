importScripts('assets/vendor/workbox-6.0.2/workbox-sw.js');

workbox.setConfig({
  debug: false,
  modulePathPrefix: 'assets/vendor/workbox-6.0.2/'
});

workbox.precaching.precacheAndRoute([
  {url: 'index.html', revision: '02.01.21.3'},
  {url: 'manifest.json', revision: '01.06.21.2'},
  {url: 'assets/img/apple-touch-icon.png', revision: '09.08.20.1'},
  {url: 'assets/img/favicon-32x32.png', revision: '09.08.20.1'},
  {url: 'assets/img/favicon-16x16.png', revision: '09.08.20.1'},
  {url: 'assets/img/android-chrome-192x192.png', revision: '09.08.20.1'},
  {url: 'assets/img/ios-share.png', revision: '09.08.20.1'},
  {url: 'assets/img/crosshair.svg', revision: '10.16.20.1'},
  {url: 'assets/fonts/MaterialIcons-Regular.woff2', revision: '09.08.20.1'},
  {url: 'assets/vendor/framework7-6.0.6/framework7-bundle.min.css', revision: '01.28.21.1'},
  {url: 'assets/vendor/framework7-6.0.6/framework7-bundle.min.js', revision: '01.28.21.1'},
  {url: 'assets/vendor/sqljs-1.4.0/sql-wasm.js', revision: '12.09.20.1'},
  {url: 'assets/vendor/sqljs-1.4.0/sql-wasm.wasm', revision: '12.09.20.1'},
  {url: 'assets/vendor/localForage-1.9.0/localforage.min.js', revision: '09.08.20.1'},
  {url: 'assets/vendor/leaflet-1.7.1/images/layers.png', revision: '09.08.20.1'},
  {url: 'assets/vendor/leaflet-1.7.1/images/layers-2x.png', revision: '09.08.20.1'},
  {url: 'assets/vendor/leaflet-1.7.1/images/marker-icon.png', revision: '09.08.20.1'},
  {url: 'assets/vendor/leaflet-1.7.1/images/marker-icon-2x.png', revision: '09.08.20.1'},
  {url: 'assets/vendor/leaflet-1.7.1/images/marker-shadow.png', revision: '09.08.20.1'},
  {url: 'assets/vendor/leaflet-1.7.1/leaflet.css', revision: '09.08.20.1'},
  {url: 'assets/vendor/leaflet-1.7.1/leaflet.js', revision: '09.08.20.1'},
  {url: 'assets/vendor/leaflet-locatecontrol-0.72.1/L.Control.Locate.min.css', revision: '09.08.20.1'},
  {url: 'assets/vendor/leaflet-locatecontrol-0.72.1/L.Control.Locate.min.js', revision: '09.08.20.1'},
  {url: 'assets/vendor/leaflet-measure-path-1.5.0/leaflet-measure-path.css', revision: '10.16.20.2'},
  {url: 'assets/vendor/leaflet-measure-path-1.5.0/leaflet-measure-path.js', revision: '10.16.20.1'},
  {url: 'assets/vendor/leaflet-mbtiles/Leaflet.TileLayer.MBTiles.js', revision: '10.16.20.1'},
  {url: 'assets/vendor/togeojson-0.16.0/togeojson.js', revision: '01.07.21.1'},
  {url: 'assets/js/app.js', revision: '02.01.21.3'},
  {url: 'assets/css/app.css', revision: '01.13.21.1'}
], {
  // Ignore all URL parameters.
  ignoreURLParametersMatching: [/.*/]
});