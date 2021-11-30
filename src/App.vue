<template>
  <div class="d-flex flex-column h-100">
    <NaviBar />
    <main role="main" class="container-fluid px-0 h-100">
      <div class="float-left w-50 h-100">
        <Map />
      </div>
      <div class="float-right w-50 h-100">
        <code-area />
      </div>
    </main>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import Map from './components/Map.vue';
import NaviBar from './components/NaviBar.vue';
import CodeArea from './components/Code.vue';
import Properties from './components/Properties.vue';

import rewind from '@turf/rewind';

@Component({
  components: {
    Map,
    NaviBar,
    CodeArea,
    Properties,
  },
})
export default class App extends Vue {
  beforeCreate() {
    document.title = import.meta.env.VITE_APP_TITLE;
  }
  mounted() {
    const params = new URL(document.location.href).searchParams;
    const data = params.get('data');
    if (data) {
      const prettyGeojsonString = JSON.stringify(JSON.parse(data), null, 2);
      this.$store.commit('setGeoJSON', prettyGeojsonString);
      const newGeojson = rewind(this.$store.getters.geojson);
      this.$store.commit('setGeoJSON', newGeojson);
    }
  }
}
</script>
