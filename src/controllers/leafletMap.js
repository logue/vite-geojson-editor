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
  // A hack to quickly look for starting location
  // @todo: Use VUE routes

  const vars = () => {
    const ret = {
      lat: import.meta.env.VITE_MAP_DEFAULT_LATITUDE || 0,
      lng: import.meta.env.VITE_MAP_DEFAULT_LONGITUDE || 0,
      zoom: import.meta.env.VITE_MAP_DEFAULT_ZOOM || 0,
    };
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, (m, key, value) => {
      ret[key] = value;
    });
    return ret;
  };

  map = L.map('map').setView([vars().lat, vars().lng], vars().zoom);

  L.tileLayer(
    import.meta.env.VITE_MAP_TILE_ZXY_URI ||
      'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    {
      attribution:
        import.meta.env.VITE_MAP_ATTRIBUTION ||
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
      subdomains: import.meta.env.VITE_MAP_SUBDOMAINS || 'abcd',
      maxZoom: import.meta.env.VITE_MAP_MAX_ZOOM || 19,
      minZoom: import.meta.env.VITE_MAP_MAX_ZOOM || 0,
      crs: L.CRS.Simple,
    }
  ).addTo(map);

  /*
  if (import.meta.env.VITE_MAP_BOUNDING) {
    map.setMaxBounds(
      new L.LatLngBounds(
        // South-West
        [VITE_MAP_EXTENT_MAX_LATITUDE, VITE_MAP_EXTENT_MIN_LONGITUDE],
        // North-East
        [VITE_MAP_EXTENT_MIN_LATITUDE, VITE_MAP_EXTENT_MAX_LONGITUDE]
      )
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

  map.on('mousemove', e => {
    document.getElementById('coordinate').innerText = e.latlng.toString();
  });

  map.on(L.Draw.Event.DRAWSTART, event => {
    map.off('click', clickHandlerForMap);
  });

  map.on(L.Draw.Event.DRAWSTOP, () => {
    map.on('click', clickHandlerForMap);
  });

  map.on(L.Draw.Event.CREATED, event => {
    drawnItems.addLayer(event.layer);
    store.commit('setGeoJSON', drawnItems.toGeoJSON());
  });

  map.on(L.Draw.Event.EDITED, () => {
    store.commit('setGeoJSON', drawnItems.toGeoJSON());
  });

  map.on(L.Draw.Event.DELETED, () => {
    store.commit('setGeoJSON', drawnItems.toGeoJSON());
  });
}

function clickHandlerForMap() {
  store.commit('setSelectedProperties', null);
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
