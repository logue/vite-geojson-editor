<template>
  <div class="d-flex flex-column h-100">
    <NaviBar />
    <main role="main" class="container-fluid px-0 h-100">
      <div class="float-left w-50 h-100">
        <Map />
      </div>
      <div class="float-right w-50 h-100">
        <Sidebar />
      </div>
    </main>

    <footer class="footer mt-auto py-3 bg-light">
      <div class="container">
        <Properties />
      </div>
    </footer>
  </div>
</template>

<script>
import Map from './components/Map.vue';
import NaviBar from './components/NaviBar.vue';
import Sidebar from './components/Sidebar.vue';
import Properties from './components/Properties.vue';

import rewind from '@turf/rewind';

export default {
  components: {
    Map,
    NaviBar,
    Sidebar,
    Properties,
  },
  mounted: function () {
    const params = new URL(document.location).searchParams;
    const data = params.get('data');
    if (data) {
      const prettyGeojsonString = JSON.stringify(JSON.parse(data), null, 2);
      this.$store.commit('setGeoJSON', prettyGeojsonString);
      const newGeojson = rewind(this.$store.getters.geojson);
      this.$store.commit('setGeoJSON', newGeojson);
    }
  },
};
</script>
