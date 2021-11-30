<template>
  <div>
    <b-button variant="warning" @click="$store.dispatch('clearFeatures')">
      Clear
    </b-button>
    <b-button variant="primary" @click="copy">Copy</b-button>
    <b-button variant="primary" @click="saveToGeojson">Save</b-button>
  </div>
</template>

<script>
// import FileSaver from 'file-saver';
// import { topology } from 'topojson-server';
// import wkt from 'wellknown';
// import shape from 'shp-write';

export default {
  name: 'BottomMenu',
  data() {
    return {
      supportedFormats: [
        {
          label: 'Shapefile',
          value: 'shp',
        },
        {
          label: 'TopoJSON',
          value: 'topojson',
        },
        {
          label: 'WKT',
          value: 'wkt',
        },
      ],
    };
  },
  methods: {
    copy: function () {
      const el = document.createElement('textarea');
      el.value = this.$store.state.geojson;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);

      this.$Notice.open({
        title: 'Copied to clipboard',
        duration: 2.5,
      });
    },
    saveToGeojson: function () {
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
      const docId = vars.docId || 0;
      const featureId = encodeURIComponent(vars.featureId) || 0;

      const url = `https://node-red.community-atlas.net/complex/${docId}/${featureId}`;
      fetch(url, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'no-cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        headers: {
          'Content-Type': 'application/json',
          // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *client
        body: this.$store.state.geojsonString, // body data type must match "Content-Type" header
      });

      this.$store.dispatch('clearFeatures');
    },
  },
};
</script>
