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
          map.invalidateSize();
        },
        opened: function() {
          loadMap();
        },
        closed: function() {
          // $$("#map-title").html(null);
          layers.raster.clearLayers();
          layers.vector.clearLayers();
          map.removeControl(controls.layerCtrl);
          sessionStorage.removeItem("activeLayer");
        }
      }
    }
  }, {
    name: "add",
    path: "/add/",
    popup: {
      el: "#add-popup"
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

const layers = {
  raster: L.layerGroup().addTo(map),
  vector: L.featureGroup().addTo(map)
};

const controls = {
  attributionCtrl: L.control.attribution({
    prefix: null,
  }).addTo(map),

  scaleCtrl: L.control.scale({
    position: "bottomleft"
  }).addTo(map),

  locateCtrl: L.control.locate({
    icon: "gps_fixed",
    iconLoading: "gps_not_fixed",
    setView: "untilPanOrZoom",
    cacheLocation: true,
    position: "topleft",
    flyTo: false,
    keepCurrentZoomLevel: true,
    circleStyle: {
      interactive: false
    },
    markerStyle: {
      interactive: false
    },
    locateOptions: {
      enableHighAccuracy: true/*,
      maxZoom: 17*/
    },
    iconElementTag: "i",
    createButtonCallback: function (container, options) {
      const link = L.DomUtil.create("a", "gps-btn link icon-only", $$("#map-btns")[0]);
      link.title = "Zoom to my location";
      const icon = L.DomUtil.create(options.iconElementTag, "icon material-icons", link);
      return { link: link, icon: icon };
    },
    onLocationError: function(e) {
      alert(e.message);
    }
  }).addTo(map),

  layerCtrl: L.control.layers(null, {"GeoJSON": layers.vector}, {collapsed: false})
};

controls.locateCtrl.start();

const rasterInput = L.DomUtil.create("input", "hidden");
rasterInput.type = "file";
rasterInput.accept = ".mbtiles";
rasterInput.style.display = "none";

rasterInput.addEventListener("change", function () {
  const file = rasterInput.files[0];

  if (file.name.endsWith(".mbtiles")) {
    loadRaster(file);
  } else {
    alert("Only .mbtiles files supported!");
  }
  this.value = "";
}, false);

const vectorInput = L.DomUtil.create("input", "hidden");
vectorInput.type = "file";
vectorInput.accept = ".geojson";
vectorInput.style.display = "none";

vectorInput.addEventListener("change", function () {
  const file = vectorInput.files[0];

  if (file.name.endsWith(".geojson")) {
    loadVector(file);
  } else {
    alert("Only .geojson files supported!");
  }
  this.value = "";
}, false);

$$(".gps-btn").on("click", function (e) {
  if (!controls.locateCtrl._active) {
    $$(".gps-btn i").removeClass("gps_fixed");
    $$(".gps-btn i").addClass("gps_not_fixed");
  } else {
    $$(".gps-btn i").removeClass("gps_not_fixed");
    $$(".gps-btn i").addClass("gps_fixed");
  }
});

$$(document).on("taphold", ".overlay", function() {
  const li = $$(this);
  const key = li.attr("data-key");
  const name = li.find(".item-title .name").html();
  const description = li.find(".item-title .item-footer").html();
  app.actions.create({
    buttons: [
      [{
        text: "Edit",
        // color: "blue",
        onClick: function () {
          app.dialog.create({
            content: `<div class="list no-hairlines-md">
              <ul>
                <li class="item-content item-input" style="padding: 0px;">
                  <div class="item-inner">
                    <div class="item-title item-label">Name</div>
                    <div class="item-input-wrap">
                      <input id="map-name" type="text" value="${name}">
                    </div>
                  </div>
                </li>
                <li class="item-content item-input" style="padding: 0px;">
                  <div class="item-inner">
                    <div class="item-title item-label">Description</div>
                    <div class="item-input-wrap">
                      <textarea id="map-description">${description}</textarea>
                    </div>
                  </div>
                </li>
              </ul>
            </div>`,
          buttons: [{
            text: "CANCEL"
          },{
            text: "OK",
            close: false,
            onClick: function(dialog, e) {
              const name = $$("#map-name").val();
              const description = $$("#map-description").val();
              if (name.length > 0) {
                app.progressbar.show();
                storage.getItem(key).then(function (value) {
                  value.name = name;
                  value.description = description;
                  storage.setItem(key, value).then(function (value) {
                    li.find(".item-title .name").html(name);
                    li.find(".item-title .item-footer").html(description);
                    app.progressbar.hide();
                    app.dialog.close();
                  });
                });
              } else {
                app.toast.create({
                  text: "Map Name required!",
                  closeButton: true,
                  closeTimeout: 2000
                }).open();
              }
            }
          }]
        }).open()
        }	
      }], 
      [{	
        text: "Delete",
        // icon: "<i class='icon material-icons'>delete</i>",
        color: "red",
        onClick: function () {
          app.dialog.confirm("Delete <b>" + name + "</b> from your device?", null, function() {
            layers.raster.clearLayers();
            storage.removeItem(key).then(function () {
              // li.remove();
              loadSavedMaps();
            });
          });
        }	
      }]
    ]	
  }).open();
});

function fetchFile() {
  app.dialog.prompt(null, "Map URL", function (url) {
    app.progressbar.show();
    fetch(url).then(response => {
      return response.arrayBuffer();
    }).then(buffer => {
      const db = new SQL.Database(new Uint8Array(buffer));
      saveMap(db, buffer, url);
    }).catch(err => {
      console.log(err);
    });
  });
}

function loadRaster(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const db = new SQL.Database(new Uint8Array(reader.result));
    saveMap(db, reader.result, "file");
  }
  reader.readAsArrayBuffer(file);
}

function loadVector(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const geojson = JSON.parse(reader.result);
    layers.vector.clearLayers();

    L.geoJSON(geojson, {  
      onEachFeature: function (feature, layer) {
        let table = "<div style='overflow:auto;'><table>";
        for (const key in feature.properties) {
          if (feature.properties.hasOwnProperty(key)) {
            table += `<tr><th>${key.toUpperCase()}</th><td>${formatProperty(feature.properties[key])}</td></tr>`;
          }
        }
        table += "</table></div>";
        layer.bindPopup(table, {
          maxHeight: 300,
          maxWidth: 250
        });
      }
      
    }).addTo(layers.vector);
    map.addControl(controls.layerCtrl);
    map.fitBounds(layers.vector.getBounds());
  }
  reader.readAsText(file);
}

function saveMap(db, file, source) {
  const metadata = db.exec("SELECT value FROM metadata WHERE name IN ('name', 'description', 'bounds') ORDER BY name DESC");
  // const key = metadata[0].values[0][0];
  const key = (source == "file") ? Date.now().toString() : source;
  const value = {
    name: metadata[0].values[0][0] ? metadata[0].values[0][0] : name,
    description: metadata[0].values[1][0],
    bounds: metadata[0].values[2][0],
    timestamp: Date.now(),
    source: source,
    mbtiles: file
  };

  storage.setItem(key, value).then(function (value) {
    // app.views.main.router.back();
    sessionStorage.setItem("activeLayer", key);
    window.history.replaceState(null, null, window.location.pathname);
    app.views.main.router.navigate("/map/");

    loadSavedMaps();
  }).catch(function(err) {
    alert("Error saving map!");
  });
}

function loadSavedMaps() {
  app.progressbar.show();
  const maps = [];
  let size = 0;
  $$("#map-list").empty();
  storage.length().then(function(numberOfKeys) {
    if (numberOfKeys > 0) {
      storage.iterate(function(value, key, iterationNumber) {
        size += value.mbtiles.byteLength;
        maps.push({
          key: key,
          value: value
        });
      }).then(function() {
        $$("#database-size").html(formatSize(size));
        maps.sort(function(a, b) {
          return (a.value.name.toUpperCase() < b.value.name.toUpperCase()) ? -1 : (a.value.name.toUpperCase() > b.value.name.toUpperCase()) ? 1 : 0;
        });
        
        maps.forEach(function(map, index) {
          const li = `<li class="overlay" data-key="${map.key}">
            <a href="#" class="item-link item-content" onclick="$$('#map-title').html('${map.value.name}'); sessionStorage.setItem('activeLayer', '${map.key}'); app.views.main.router.navigate('/map/');">
              <div class="item-inner">
                <div class="item-title">
                  <span class="name">${map.value.name}</span>
                  <div class="item-footer">${map.value.description}</div>
                </div>
                <div class="item-after" style="display: block">
                  <span class="badge">${formatSize(map.value.mbtiles.byteLength)}</span><br>
                  <span style="font-size: x-small">${new Date(map.value.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            </a>
          </li>`;
            
          $$("#map-list").append(li);
        });
    
        app.progressbar.hide();
      }).catch(function(err) {
        alert("Error loading saved maps!");
      });
    } else {
      $$("#database-size").html(0);
      $$("#map-list").append(`
        <li>
          <a class="item-link list-button" onclick="app.views.main.router.navigate('/add/');">No maps saved. Add a map now!</a>
        </li>
      `);
      app.progressbar.hide();
    }
  }).catch(function(err) {
    console.log(err);
  });
}

function loadMap() {
  app.progressbar.show();
  const key = sessionStorage.getItem("activeLayer");
  storage.getItem(key).then(function (value) {
    $$("#map-title").html(value.name);
    const layer = L.tileLayer.mbTiles(value.mbtiles, {
      zIndex: 10,
      autoScale: true,
      fitBounds: true,
      updateWhenIdle: false
    }).on("databaseloaded", function(e) {
      $$(".leaflet-control-attribution").html($$(".leaflet-control-attribution").html().replace("<a", "<a class='external' target='_blank'"));
      app.progressbar.hide();
    });
    layers.raster.addLayer(layer);
  });
}

function formatSize(size) {
  size = size / 1000;
  if (size > 1000) {
    size = (size/1000).toFixed(1) + " MB";
  } else {
    size = size.toFixed(1) + " KB";
  }
  return size;
}

function formatProperty(value) {
  if (typeof value == "string" && (value.indexOf("http") === 0 || value.indexOf("https") === 0)) {
    return `<a class="external" href="${value}" target="_blank">${value}</a>`;
  } else {
    return value;
  }
}

function emptyDatabase() {
  app.dialog.confirm("Delete all saved maps?", null, function() {
    app.progressbar.show();
    storage.clear().then(function() {
      loadSavedMaps();
      app.progressbar.hide();
    }).catch(function(err) {
      console.log(err);
    });
  });
}

function iosChecks() {
  if (app.device.ios) {
    if (parseFloat(app.device.osVersion) < 11.3) {
      app.dialog.alert("This app is not fully supported on devices running iOS < 11.3.", "Warning");
    } else if (!app.device.standalone) {
      if (!localStorage.getItem("dismissPrompt")) {
        app.toast.create({
          text: "Tap the <img src='assets/img/ios-share.png' height='18px'> button " + (app.device.ipad ? "at the top of the screen" : "below") + " to Add to Home Screen.",
          closeButton: true,
          position: app.device.ipad ? "center" : "bottom",
          on: {
            close: function () {
              localStorage.setItem("dismissPrompt", true);
            }
          }
        }).open();
      } 
    }
  }
}

app.on("init", function() {
  iosChecks();
  app.progressbar.show();
  
  initSqlJs({
    locateFile: function() {
      return "assets/vendor/sqljs-1.3.0/sql-wasm.wasm";
    }
  }).then(function(sql){
    SQL = sql;
    if (app.utils.parseUrlQuery(document.URL).map) {
      const url = app.utils.parseUrlQuery(document.URL).map;
      
      storage.getItem(url).then(value => {
        if (value) {
          sessionStorage.setItem("activeLayer", url);
          window.history.replaceState(null, null, window.location.pathname);
          app.views.main.router.navigate("/map/");
        } else {
          fetch(url).then(response => {
            return response.arrayBuffer();
          }).then(buffer => {
            const db = new SQL.Database(new Uint8Array(buffer));
            saveMap(db, buffer, url);
            // sessionStorage.setItem("activeLayer", url);
            // window.history.replaceState(null, null, window.location.pathname);
            // app.views.main.router.navigate("/map/");
          }).catch(err => {
            console.log(err);
          });
        }
      });
    }

    // if (app.utils.parseUrlQuery(document.URL).key) {
    //   const key = app.utils.parseUrlQuery(document.URL).key;
    //   storage.getItem(key).then(function (value) {
    //     // $$("#map-title").html("${value.name}");
    //     sessionStorage.setItem("activeLayer", key);
    //     app.views.main.router.navigate("/map/");
    //   });
    // }

    loadSavedMaps();
    if (app.views.current.router.currentRoute.url == "/map/" && sessionStorage.getItem("activeLayer")) {
      loadMap();
    }
  });
})

app.init();