const $$ = Dom7;

const storage = localforage.createInstance({
  name: "maps",
  storeName: "saved_maps"
});

const app = new Framework7({
  root: "#app",
  theme: "md",
  init: false,
  view: {
    stackPages: true,
    pushState: true,
    pushStateOnLoad: true
  },
  routes: [{
    name: "home",
    path: "/",
    url: "index.html",
  }, {
    name: "map",
    path: "/map/",
    popup: {
      el: "#map-popup",
      on: {
        open: function() {
          // locateCtrl.start();
          map.invalidateSize();
        }
      }
    }
  }],
  touch: {
    tapHold: true
  }
});

const map = L.map("map", {
  zoomSnap: 0,
  maxZoom: 22,
  zoomControl: false,
  attributionControl: false
}).fitWorld();

const overLays = L.layerGroup().addTo(map);

const attributionCtrl = L.control.attribution({
  prefix: null,
  position: "bottomleft"
}).addTo(map);

const locateCtrl = L.control.locate({
  icon: "gps_fixed",
  iconLoading: "gps_not_fixed",
  setView: "untilPan",
  cacheLocation: true,
  position: "topleft",
  flyTo: false,
  circleStyle: {
    interactive: false
  },
  markerStyle: {
    interactive: false
  },
  locateOptions: {
    enableHighAccuracy: true,
    maxZoom: 17
  },
  iconElementTag: "i",
  createButtonCallback: function (container, options) {
    const link = L.DomUtil.create("a", "gps-btn", $$("#gps-fab")[0]);
    link.title = options.strings.title;
    const icon = L.DomUtil.create(options.iconElementTag, "icon material-icons", link);
    return { link: link, icon: icon };
  },
  onLocationError: function(e) {
    alert(e.message);
  }
}).addTo(map);
locateCtrl.start();


const fileInput = L.DomUtil.create("input", "hidden");
fileInput.type = "file";
fileInput.accept = ".mbtiles";
fileInput.style.display = "none";

fileInput.addEventListener("change", function () {
  const file = fileInput.files[0];
  const name = file.name.split(".").slice(0, -1).join(".");

  if (file.name.endsWith(".mbtiles")) {
    saveMap(file, name);
  } else {
    alert("Only .mbtiles files supported!");
  }
  this.value = "";
}, false);

$$(".gps-btn").on("click", function (e) {
  if (!locateCtrl._active) {
    $$(".gps-btn i").removeClass("gps_fixed");
    $$(".gps-btn i").addClass("gps_not_fixed");
  } else {
    $$(".gps-btn i").removeClass("gps_not_fixed");
    $$(".gps-btn i").addClass("gps_fixed");
  }
});

$$(document).on("taphold", ".overlay", function() {
  const name = $$(this).find("[name=overlay]").attr("data-name");
  const li = $$(this);
  app.actions.create({
    buttons: [{
        text: "Delete Map",
        color: "red",
        onClick: function () {
          deleteMap(name, li);
        }
      }, {
        text: "Cancel"
      }
    ]
  }).open();
});

function saveMap(file, name) {
  const reader = new FileReader();

  reader.onload = function(e) {
    const db = new SQL.Database(new Uint8Array(reader.result));
    const metadata = db.exec("SELECT value FROM metadata WHERE name IN ('name', 'description', 'bounds') ORDER BY name DESC");
    const key = metadata[0].values[0][0];
    const value = {
      name: metadata[0].values[0][0] ? metadata[0].values[0][0] : name,
      description: metadata[0].values[1][0],
      bounds: metadata[0].values[2][0],
      mbtiles: reader.result
    };

    storage.setItem(key, value).then(function (value) {
      loadSavedMaps();
    }).catch(function(err) {
      alert("Error saving map!");
    });
  }

  reader.readAsArrayBuffer(file);
}

function loadSavedMaps() {
  $$("#map-list").empty();
  const maps = [];
  storage.length().then(function(numberOfKeys) {
    if (numberOfKeys > 0) {
      storage.iterate(function(value, key, iterationNumber) {
        maps.push({
          key: key,
          value: value
        });
      }).then(function() {
        maps.sort(function(a, b) {
          return (a.key.toUpperCase() < b.key.toUpperCase()) ? -1 : (a.key.toUpperCase() > b.key.toUpperCase()) ? 1 : 0;
        });
        
        maps.forEach(function(map, index) {
          const li = `<li class="overlay">
            <a href="#" class="item-link item-content" name="overlay" data-name="${map.value.name}" onclick="loadMap('${map.value.name}'); app.views.main.router.navigate('/map/');">
              <div class="item-inner">
                <div class="item-title">
                  ${map.value.name}
                  <div class="item-footer">${map.value.description}</div>
                </div>
              </div>
            </a>
          </li>`;
            
          $$("#map-list").append(li);
        });
    
        app.preloader.hide();
      }).catch(function(err) {
        alert("Error loading saved maps!");
      });
    } else {
      $$("#map-list").append(`
        <li>
          <a class="item-link list-button" onclick="app.fab.open('#add-fab');">No maps saved. Add a map now!</a>
        </li>
      `);
      app.preloader.hide();
    }
  }).catch(function(err) {
    console.log(err);
  });
}

function loadMap(key) {
  app.preloader.show();
  sessionStorage.setItem("activeLayer", key);
  storage.getItem(key).then(function (value) {
    $$("#map-title").html(value.name);
    overLays.clearLayers();
    
    const layer = L.tileLayer.mbTiles(value.mbtiles, {
      zIndex: 10,
      autoScale: true,
      fitBounds: true,
      updateWhenIdle: false
    }).on("databaseloaded", function(e) {
      $$(".leaflet-control-attribution").html($$(".leaflet-control-attribution").html().replace("<a", "<a class='external' target='_blank'"));
      app.preloader.hide();
    });
    overLays.addLayer(layer);
  });
}

function deleteMap(name, li) {
  var cfm = confirm(`Remove ${name}?`);
  if (cfm == true) {
    overLays.clearLayers();
    storage.removeItem(name).then(function () {
      li.remove();
    });
  }
}

app.on("init", function() {
  app.preloader.show();
  initSqlJs({
    locateFile: function() {
      return "assets/vendor/sqljs-1.1.0/sql-wasm.wasm";
    }
  }).then(function(SQL){
    loadSavedMaps();
    if (app.views.current.router.currentRoute.url == "/map/" && sessionStorage.getItem("activeLayer")) {
      loadMap(sessionStorage.getItem("activeLayer"));
    }
  });
})

app.init();