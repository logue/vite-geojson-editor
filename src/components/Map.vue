<template>
  <div id="map" class="h-100 w-100">
    <div id="coordinate">(0,0)</div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { createMap } from './../controllers/leafletMap';

@Component
export default class LeafletMap extends Vue {
  mounted() {
    createMap();
  }
}
</script>

<style lang="scss">
#map {
  background-color: #e9ecef;
}

#coordinate {
  position: absolute;
  color: var(--orange);
  z-index: 1000;
  bottom: 0;
  left: 0.5rem;
}
</style>
