const $$ = Dom7;

const storage = localforage.createInstance({
  name: "maps",
  storeName: "saved_maps"
});

let storageSize = 0;

const app = new Framework7({
  el: "#app",
  theme: "md",
  init: false,
  view: {
    stackPages: true,
    browserHistory: true,
    browserHistoryOnLoad: true
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
          if (sessionStorage.getItem("activeLayer")) {
            loadMap();
          }
        },
        close: function() {
          measure.clearMeasure();
          app.toast.close();
        },
        closed: function() {
          // $$("#map-title").html(null);
          app.range.setValue("#opacity-range", 100);
          layers.raster.clearLayers();
          // layers.vector.clearLayers();
          // map.removeControl(controls.layerCtrl);
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
  }, {
    name: "collections",
    path: "/collections/",
    popup: {
      el: "#collections-popup"
    }
  }],
  touch: {
    tapHold: true
  },
  on: {
    sortableEnable: function(listEl) {
      $$("#sort-icon").html("save");
    },
    sortableDisable: function(listEl) {
      $$("#sort-icon").html("sort");
      orderList();
    }
  }
});

const map = L.map("map", {
  zoomSnap: app.device.desktop ? 1 : 0,
  tap: false,
  maxZoom: 22,
  zoomControl: false,
  attributionControl: false,
  renderer: L.canvas({
    padding: 0.5,
    tolerance: 10
  })
}).fitWorld();

const layers = {
  raster: L.layerGroup().addTo(map),
  vector: L.featureGroup().addTo(map),
  basemaps: {
    "Streets": L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.@2xpng", {
      maxNativeZoom: 18,
      maxZoom: map.getMaxZoom(),
      attribution: `© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, © <a href="https://carto.com/attribution">CARTO</a>`,
    }),
    "Aerial": L.tileLayer("https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}", {
      maxNativeZoom: 16,
      maxZoom: map.getMaxZoom(),
      attribution: "USGS",
    }),
    "Topo": L.tileLayer("https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}", {
      maxNativeZoom: 16,
      maxZoom: map.getMaxZoom(),
      attribution: "USGS",
    }),
    "Charts": L.tileLayer("https://tileservice.charts.noaa.gov/tiles/50000_1/{z}/{x}/{y}.png", {
      maxNativeZoom: 18,
      maxZoom: map.getMaxZoom(),
      attribution: "NOAA",
    })
  },
  measure: {
    group: L.featureGroup().addTo(map),
    line: L.polyline([], {
      interactive: false,
      // dashArray: "0 10 0 10",
      weight: 3
    })
    .addTo(map)
    .showMeasurements({imperial: true, showTotalDistance: true, minDistance: 0})
  }
};

const measure = {
  clearMeasure: function() {
    layers.measure.group.clearLayers();
    layers.measure.line.setLatLngs([]);
    map.off("click", measure.clickListener);
    map.off("drag", measure.dragListener);
    map.off("zoom", measure.dragListener);
    $$(".crosshair").css("visibility", "hidden");
    $$(".toast-text").html("Tap to add measurement segments.");
  },
  clickListener: function() {
    layers.measure.line.addLatLng(map.getCenter());
    layers.measure.line.updateMeasurements();
    layers.measure.group.addLayer(
      L.circleMarker(map.getCenter(), {
        interactive: false,
        color: "#2A93EE",
        fillColor: "#fff",
        fillOpacity: 1,
        interactive: false,
        opacity: 1,
        radius: 5,
        weight: 2
      })
    )
    getTotalMeasurement();
  },
  dragListener: function() {
    let points = layers.measure.line.getLatLngs();
    if (points.length > 0) {
      if (points.length > 1) {
        points.pop(); 
      }
      points.push(map.getCenter());
      layers.measure.line.setLatLngs(points);
      $$(".toast-text").html(`Total distance: ${getTotalMeasurement()}`);
    }
  }
}

function getTotalMeasurement() {
  var measureSegments = layers.measure.line._measurementLayer.getLayers();
  var totalSegments = measureSegments.length;
  if (totalSegments > 0) {
    var lastSegment = measureSegments[totalSegments - 1];
    var totalDist = lastSegment._measurement;
    // layers.measure.line._measurementLayer.getLayerId(lastSegment)
    layers.measure.line._measurementLayer.removeLayer(lastSegment._leaflet_id);
    return(totalDist);
  }
}

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
    setView: "untilPan",
    cacheLocation: true,
    position: "topleft",
    flyTo: false,
    keepCurrentZoomLevel: true,
    circleStyle: {
      interactive: false
    },
    markerStyle: {
      interactive: true
    },
    compassStyle: {
      radius: 10,
      width: 10,
      depth: 7
    },
    metric: false,
    strings: {
      title: "Zoom to my location",
      popup: function(options) {
        const loc = controls.locateCtrl._marker.getLatLng();
        return `<div style="text-align: center;">You are within ${Number(options.distance).toLocaleString()} ${options.unit}<br>from <strong>${loc.lat.toFixed(6)}</strong>, <strong>${loc.lng.toFixed(6)}</strong></div>`;
      }
    },
    locateOptions: {
      enableHighAccuracy: true,
      maxZoom: 18
    },
    iconElementTag: "i",
    createButtonCallback: function (container, options) {
      // const link = L.DomUtil.create("a", "gps-btn link icon-only", $$("#map-btns")[0]);
      // link.title = options.strings.title;
      // const icon = L.DomUtil.create(options.iconElementTag, "icon material-icons", link);
      const link = L.DomUtil.create("a", "gps-btn color-white", $$("#gps-fab")[0]);
      link.title = options.strings.title;
      const icon = L.DomUtil.create(options.iconElementTag, "icon material-icons color-black", link);
      return { link: link, icon: icon };
    },
    onLocationError: function(e) {
      app.dialog.alert(e.message, "Alert");
    }
  }).addTo(map),

  layerCtrl: L.control.layers(null, {"Vector Features <a href='#' onclick='clearVectors();' style='font-size: initial;'><i class='icon material-icons color-red'>clear</i></a>": layers.vector}, {collapsed: false})
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
    app.dialog.alert("Raster MBTiles files supported", "Unsupported Format");
  }
  this.value = "";
}, false);

const vectorInput = L.DomUtil.create("input", "hidden");
vectorInput.type = "file";
vectorInput.accept = ".geojson, .kml, .gpx";
vectorInput.style.display = "none";

vectorInput.addEventListener("change", function () {
  const file = vectorInput.files[0];
  const format = file.name.split(".").pop();

  if (file.name.endsWith(".geojson") || file.name.endsWith(".kml") || file.name.endsWith(".gpx")) {
    loadVector(file, format);
  } else {
    app.dialog.alert("GeoJSON, KML, and GPX files supported", "Unsupported Format");
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
  if (controls.locateCtrl._isFollowing()) {
    $$(".gps-btn i").removeClass("color-black");
    $$(".gps-btn i").addClass("color-blue");
  } else {
    $$(".gps-btn i").removeClass("color-blue");
    $$(".gps-btn i").addClass("color-black");
  }
});

map.on("moveend", function(e) {
  if (controls.locateCtrl._isFollowing()) {
    $$(".gps-btn i").removeClass("color-black");
    $$(".gps-btn i").addClass("color-blue");
  } else {
    $$(".gps-btn i").removeClass("color-blue");
    $$(".gps-btn i").addClass("color-black");
  }
});

$$(document).on(`${app.device.desktop ? "contextmenu": "taphold"}`, ".overlay", function() {
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
                  // closeButtonColor: "white",
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
    // app.progressbar.show("white");
    app.preloader.show();
    fetch(url).then(response => {
      return response.arrayBuffer();
    }).then(buffer => {
      app.preloader.hide();
      const db = new SQL.Database(new Uint8Array(buffer));
      saveMap(db, buffer, url);
    }).catch(err => {
      console.log(err);
    });
  });
}

function loadRaster(file) {
  app.progressbar.show();
  const reader = new FileReader();
  reader.onload = function(e) {
    const db = new SQL.Database(new Uint8Array(reader.result));
    saveMap(db, reader.result, "file");
  }
  reader.readAsArrayBuffer(file);
}

function loadVector(file, format) {
  const reader = new FileReader();
  let geojson = null;
  app.progressbar.show();
  reader.onload = function(e) {
    if (format == "geojson") {
      geojson = JSON.parse(reader.result);
    } else if (format == "kml") {
      const kml = (new DOMParser()).parseFromString(reader.result, "text/xml");
      geojson = toGeoJSON.kml(kml, {styles: true});
    } else if (format == "gpx") {
      const gpx = (new DOMParser()).parseFromString(reader.result, "text/xml");
      geojson = toGeoJSON.gpx(gpx);
    }

    layers.vector.clearLayers();

    L.geoJSON(geojson, {  
      style: function (feature) {
        return {	
          color: feature.properties["stroke"] ? feature.properties["stroke"] : feature.properties["marker-color"] ? feature.properties["marker-color"] : "#ff0000",
          opacity: feature.properties["stroke-opacity"] ? feature.properties["stroke-opacity"] : 1.0,
          weight: feature.properties["stroke-width"] ? feature.properties["stroke-width"] : 3,
          fillColor:  (feature.properties["marker-color"] && !feature.properties["fill"]) ? feature.properties["marker-color"] : feature.properties["fill"] ? feature.properties["fill"] : "#ff0000",
          fillOpacity: (feature.geometry.type == "Point" && !feature.properties["fill-opacity"]) ? 1 : feature.properties["fill-opacity"] ? feature.properties["fill-opacity"] : 0.2,
        };	
      },
      pointToLayer: function (feature, latlng) {	
        const size = feature.properties["marker-size"] ? feature.properties["marker-size"] : "medium";
        const sizes = {
          small: 2,
          medium: 5,
          large: 8
        };
        return L.circleMarker(latlng, {
          radius: sizes[size]
        });
      },
      onEachFeature: function (feature, layer) {
        let table = "<div style='overflow:auto;'><table>";
        const hiddenProps = ["styleUrl", "styleHash", "styleMapHash", "stroke", "stroke-opacity", "stroke-width", "opacity", "fill", "fill-opacity", "icon", "scale", "coordTimes", "marker-size", "marker-color", "marker-symbol"];
        for (const key in feature.properties) {
          if (feature.properties.hasOwnProperty(key) && hiddenProps.indexOf(key) == -1) {
            table += `<tr><th>${key.toUpperCase()}</th><td>${formatProperty(feature.properties[key])}</td></tr>`;
          }
        }
        table += "</table></div>";
        layer.bindPopup(table, {
          closeButton: false,
          maxHeight: 300,
          maxWidth: 250
        });
      }
      
    }).addTo(layers.vector);
    layers.vector.bringToBack();
    map.addControl(controls.layerCtrl);
    map.fitBounds(layers.vector.getBounds());
    app.progressbar.hide();
  }
  reader.readAsText(file);
}

function clearVectors() {
  app.dialog.confirm("Clear Vector Features?", null, function() {
    layers.vector.clearLayers();
    map.removeControl(controls.layerCtrl);
  });
}

function saveMap(db, file, source) {
  const metadata = db.exec("SELECT value FROM metadata WHERE name IN ('name', 'description', 'bounds') ORDER BY name DESC");
  const key = (source == "file") ? Date.now().toString() : source;
  const value = {
    name: metadata[0].values[0][0] ? metadata[0].values[0][0] : name,
    description: metadata[0].values[1][0],
    bounds: metadata[0].values[2][0],
    timestamp: Date.now(),
    source: source,
    mbtiles: file
  };

  storage.length().then(function(numberOfKeys) {
    value.index = numberOfKeys;
    storage.setItem(key, value).then(function (value) {
      $$("#empty-list-placeholder").remove();
      sessionStorage.setItem("activeLayer", key);
      app.popup.close("#add-popup", false);
      app.views.main.router.navigate("/map/");
      addMaptoList({key: key, value: value});
      // loadSavedMaps();
    }).catch(function(err) {
      alert("Error saving map!");
    });
  }).catch(function(err) {
    alert("Error getting count of saved maps!");
  });

  // storage.setItem(key, value).then(function (value) {
  //   // app.views.main.router.back();
  //   sessionStorage.setItem("activeLayer", key);
  //   // window.history.replaceState(null, null, window.location.pathname);
  //   app.popup.close("#add-popup", false);
  //   app.views.main.router.navigate("/map/");

  //   // loadSavedMaps();
  //   addMaptoList({key: key, value: value})
  // }).catch(function(err) {
  //   alert("Error saving map!");
  // });
}

function loadSavedMaps() {
  app.progressbar.show();
  storageSize = 0;
  const maps = [];
  $$("#map-list").empty();
  storage.length().then(function(numberOfKeys) {
    if (numberOfKeys > 0) {
      storage.iterate(function(value, key, iterationNumber) {
        maps.push({
          key: key,
          value: value
        });
      }).then(function() {
        maps.sort(function(a, b) {
          // return (a.value.name.toUpperCase() < b.value.name.toUpperCase()) ? -1 : (a.value.name.toUpperCase() > b.value.name.toUpperCase()) ? 1 : 0;
          return (a.value.index < b.value.index) ? -1 : (a.value.index > b.value.index) ? 1 : 0;
        });
        
        maps.forEach(function(map, index) {
          addMaptoList(map);
        });
    
        app.progressbar.hide();
      }).catch(function(err) {
        console.log(err);
        alert("Error loading saved maps!");
      });
    } else {
      $$("#database-size").html(0);
      $$("#map-list").append(`
        <li id="empty-list-placeholder">
          <a class="item-link list-button" onclick="app.views.main.router.navigate('/add/');">No maps saved. Add a map now!</a>
        </li>
      `);
      app.progressbar.hide();
    }
  }).catch(function(err) {
    console.log(err);
  });
}

function addMaptoList(map) {
  storageSize += map.value.mbtiles.byteLength;
  $$("#database-size").html(formatSize(storageSize));
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
      <div class="sortable-handler"></div>
    </li>`;
      
    $$("#map-list").append(li);
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
      app.progressbar.hide();
      $$(".leaflet-control-attribution").html($$(".leaflet-control-attribution").html().replace("<a", "<a class='external' target='_blank'"));
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

function orderList() {
  app.progressbar.show();
  const items = $$("#map-list li"), count = items.length;
  items.each(function(el, i) {
    const key = $$(this).attr("data-key");
    storage.getItem(key).then(function (item) {
      item.index = i;
      storage.setItem(key, item);
      if (i == (count - 1)) {
        app.progressbar.hide();
      }
    }).catch(function(err) {
      console.log(err);
    });
  });
}

function formatProperty(value) {
  if (typeof value == "string" && value.startsWith("http")) {
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
          // closeButtonColor: "white",
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

function startMeasurement(){
  app.toast.create({
    text: "Tap to add measurement segments.",
    closeButton: true,
    // closeButtonColor: "white",
    closeButtonText: "Clear",
    on: {
      close: function () {
        measure.clearMeasure();
      },
      open: function() {
        $$(".crosshair").css("visibility", "visible");
        map.on("click", measure.clickListener);
        map.on("drag", measure.dragListener);
        map.on("zoom", measure.dragListener);
      }
    }
  }).open();
}


function increaseOpacity() {
  const slider = app.range.get(".range-slider");
  slider.setValue(slider.getValue() + 5);
}

function decreaseOpacity() {
  const slider = app.range.get(".range-slider");
  slider.setValue(slider.getValue() - 5);
}

function launchGmaps() {
  const center = map.getCenter();
  const zoom = map.getZoom();
  const url = `https://www.google.com/maps/@?api=1&map_action=map&center=${center.lat},${center.lng}&zoom=${Math.round(zoom)}`;
  window.open(url);
}

$$("input[type=radio][name=basemap]").change(function() {
  for (const key in layers.basemaps) {
    if (key == this.value && key != "none") {
      map.addLayer(layers.basemaps[key]);
    } else {
      map.removeLayer(layers.basemaps[key]);
    }
  }
});

app.on("init", function() {
  iosChecks();
  app.progressbar.show();

  app.range.create({
    el: ".range-slider",
    min: 0,
    max: 100,
    step: 1,
    value: 100,
    on: {
      change: function (e) {
        const opacity = e.value / 100;
        layers.raster.getLayers()[0].setOpacity(opacity);
      }
    }
  });
  
  initSqlJs({
    locateFile: function() {
      return "assets/vendor/sqljs-1.4.0/sql-wasm.wasm";
    }
  }).then(function(sql){
    SQL = sql;
    if (app.utils.parseUrlQuery(document.URL).map) {
      const url = app.utils.parseUrlQuery(document.URL).map;
      controls.locateCtrl.stopFollowing();
      storage.getItem(url).then(value => {
        if (value) {
          sessionStorage.setItem("activeLayer", url);
          window.history.replaceState(null, null, window.location.pathname);
          app.views.main.router.navigate("/map/");
        } else {
          app.preloader.show();
          fetch(url).then(response => {
            return response.arrayBuffer();
          }).then(buffer => {
            app.preloader.hide();
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

    loadSavedMaps();
    if (app.views.current.router.currentRoute.url == "/map/" && !sessionStorage.getItem("activeLayer")) {
      app.views.main.router.back();
    }
  });
})

app.init();