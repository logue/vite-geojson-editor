import L from 'leaflet';
import RasterCoords from 'leaflet-rastercoords';
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

  const options = {
    center: [vars().lat, vars().lng],
    zoom: vars().zoom,
    zoomControl: true,
    maxZoom: import.meta.env.VITE_MAP_MAX_ZOOM || 19,
    minZoom: import.meta.env.VITE_MAP_MAX_ZOOM || 0,
  };

  if (import.meta.env.VITE_MAP_IS_RASTER === true) {
    options.crs = L.CRS.Simple;

    if (!import.meta.env.VITE_MAP_WIDTH || !import.meta.env.VITE_MAP_HEIGHT) {
      throw new Error(
        'Raster image mode must be set map VITE_MAP_WIDTH and VITE_MAP_HEIGHT.'
      );
    }
  }

  map = L.map('map', options);

  if (import.meta.env.VITE_MAP_IS_RASTER === true) {
    const rc = new RasterCoords(map, [
      import.meta.env.VITE_MAP_WIDTH,
      import.meta.env.VITE_MAP_HEIGHT,
    ]);
    map.setMaxZoom(rc.zoomLevel());
  }

  L.tileLayer(
    import.meta.env.VITE_MAP_TILE_ZXY_URI ||
      'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    {
      attribution:
        import.meta.env.VITE_MAP_ATTRIBUTION ||
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
      subdomains: import.meta.env.VITE_MAP_SUBDOMAINS || 'abcd',
    }
  ).addTo(map);

  if (import.meta.env.VITE_MAP_LIMIT_BOUNDS === true) {
    map.setMaxBounds(getBounds());
  }

  drawnItems = L.geoJSON(null, {
    style() {
      return {
        color: import.meta.env.VITE_MAP_FEATURE_COLOR || '#6c757d',
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

  map.on('mousemove', e => {
    document.getElementById('coordinate').innerText = e.latlng.toString();
  });
}

export function getBounds() {
  if (import.meta.env.VITE_MAP_IS_RASTER === true) {
    const rc = new RasterCoords(map, [
      import.meta.env.VITE_MAP_WIDTH,
      import.meta.env.VITE_MAP_HEIGHT,
    ]);
    return rc.getMaxBounds();
  } else {
    return [
      // South-West
      [
        import.meta.env.VITE_MAP_MIN_LATITUDE || -90,
        import.meta.env.VITE_MAP_MIN_LONGITUDE || -180,
      ],
      // North-East
      [
        import.meta.env.VITE_MAP_MAX_LATITUDE || 90,
        import.meta.env.VITE_MAP_MAX_LONGITUDE || 180,
      ],
    ];
  }
}

let lastSelectedFeature = null;

function highlightSelectedFeature() {
  lastSelectedFeature.setStyle({
    color: import.meta.env.VITE_MAP_FEATURE_SELECTED || '#0d6efd',
  });
}

function resetStyleOfPreviousSelection() {
  if (lastSelectedFeature === null) return;
  lastSelectedFeature.setStyle({
    color: import.meta.env.VITE_MAP_FEATURE_COLOR || '#6c757d',
  });
}

function clickHandlerForMap() {
  store.commit('setSelectedProperties', null);
}

function openPopup(e) {
  L.DomEvent.stop(e);
  resetStyleOfPreviousSelection();
  lastSelectedFeature = e.target;
  console.log(lastSelectedFeature);
  highlightSelectedFeature();
  store.commit('setSelectedProperties', lastSelectedFeature.feature);
}

export function zoomToFeatures() {
  map.fitBounds(drawnItems.getBounds());
}

export function modifyGeoJSON(newGeoJSON) {
  drawnItems.clearLayers();
  drawnItems.addData(newGeoJSON);

  drawnItems.eachLayer(layer => {
    layer.on('click', openPopup);
  });
}
