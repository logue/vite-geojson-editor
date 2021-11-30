import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import marker2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

import store from '../store';

// Hack to get the markers into Vue correctly
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

let drawnItems = null;
let map = null;

export function createMap() {
  function getUrlVars() {
    const ret = {};
    window.location.href.replace(
      /[?&]+([^=&]+)=([^&]*)/gi,
      function (m, key, value) {
        ret[key] = value;
      }
    );
    return ret;
  }

  // A hack to quickly look for starting location
  // @todo: Use VUE routes

  const vars = getUrlVars();
  const lat = vars.lat || import.meta.env.VITE_MAP_DEFAULT_LATITUDE;
  const lng = vars.lng || import.meta.env.VITE_MAP_DEFAULT_LONGITUDE;
  const zoom = vars.zoom || import.meta.env.VITE_MAP_DEFAULT_ZOOM;

  map = L.map('map').setView([lat, lng], zoom);

  L.tileLayer(
    import.meta.env.VITE_MAP_TILE_ZXY_URI ||
      'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    {
      attribution:
        import.meta.env.VITE_MAP_ATTRIBUTION ||
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
      subdomains: import.meta.env.VITE_MAP_SUBDOMAINS,
      maxZoom: import.meta.env.VITE_MAP_MAX_ZOOM,
      crs: L.CRS.Simple,
    }
  ).addTo(map);

  /*
  if (import.meta.env.VITE_MAP_IS_RASTER) {
    var extent = import.meta.env.VITE_MAP_EXTENT;
    map.setMaxBounds(
      new L.LatLngBounds([extent[0], extent[1]], [extent[2], extent[3]])
    );
  }
  */
  drawnItems = L.geoJSON(null, {
    style() {
      return {
        color: '#007bff',
      };
    },
  }).addTo(map);

  map.addControl(
    new L.Control.Draw({
      position: 'topright',
      edit: {
        featureGroup: drawnItems,
        poly: {
          allowIntersection: false,
        },
      },
      draw: {
        polygon: {
          allowIntersection: false,
        },
        circlemarker: false,
        circle: false,
      },
    })
  );

  map.on('click', clickHandlerForMap);

  map.on(L.Draw.Event.DRAWSTART, function (event) {
    map.off('click', clickHandlerForMap);
  });

  map.on(L.Draw.Event.DRAWSTOP, function () {
    map.on('click', clickHandlerForMap);
  });

  map.on(L.Draw.Event.CREATED, function (event) {
    drawnItems.addLayer(event.layer);
    parseGeoJSONAndSendToStore(drawnItems.toGeoJSON());
  });

  map.on(L.Draw.Event.EDITED, function () {
    parseGeoJSONAndSendToStore(drawnItems.toGeoJSON());
  });

  map.on(L.Draw.Event.DELETED, function () {
    parseGeoJSONAndSendToStore(drawnItems.toGeoJSON());
  });
}

function clickHandlerForMap() {
  store.commit('setSelectedProperties', null);
}

function parseGeoJSONAndSendToStore(geojson) {
  store.commit('setGeoJSON', geojson);
}

function openPopup(e) {
  L.DomEvent.stop(e);
  store.commit('setSelectedProperties', e.target.feature.properties);
}

export function zoomToFeatures() {
  map.fitBounds(drawnItems.getBounds());
}

export function modifyGeoJSON(newGeoJSON) {
  drawnItems.clearLayers();
  drawnItems.addData(newGeoJSON);

  drawnItems.eachLayer(function (layer) {
    layer.on('click', openPopup);
  });
}
