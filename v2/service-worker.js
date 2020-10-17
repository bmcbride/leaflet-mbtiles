importScripts('assets/vendor/workbox-v5.1.2/workbox-sw.js');

workbox.setConfig({
  debug: false,
  modulePathPrefix: 'assets/vendor/workbox-v5.1.2/'
});

workbox.precaching.precacheAndRoute([
  {url: 'index.html', revision: '10.16.20.3'},
  {url: 'manifest.json', revision: '10.14.20.2'},
  {url: 'assets/img/apple-touch-icon.png', revision: '09.08.20.1'},
  {url: 'assets/img/favicon-32x32.png', revision: '09.08.20.1'},
  {url: 'assets/img/favicon-16x16.png', revision: '09.08.20.1'},
  {url: 'assets/img/android-chrome-192x192.png', revision: '09.08.20.1'},
  {url: 'assets/img/ios-share.png', revision: '09.08.20.1'},
  {url: 'assets/img/crosshair.svg', revision: '10.16.20.1'},
  {url: 'assets/fonts/MaterialIcons-Regular.woff2', revision: '09.08.20.1'},
  {url: 'assets/vendor/framework7-5.7.13/css/framework7.bundle.min.css', revision: '09.08.20.1'},
  {url: 'assets/vendor/framework7-5.7.13/js/framework7.bundle.min.js', revision: '09.08.20.1'},
  {url: 'assets/vendor/sqljs-1.3.2/sql-wasm.js', revision: '09.08.20.1'},
  {url: 'assets/vendor/sqljs-1.3.2/sql-wasm.wasm', revision: '09.08.20.1'},
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
  {url: 'assets/js/app.js', revision: '10.16.20.4'},
  {url: 'assets/css/app.css', revision: '10.16.20.2'}
], {
  // Ignore all URL parameters.
  ignoreURLParametersMatching: [/.*/]
});