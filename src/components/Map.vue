<template>
  <div id="map" class="h-100 w-100">
    <div id="coordinate">(0,0)</div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { createMap } from './../controllers/leafletMap';

@Component
export default class LeafletMap extends Vue {
  modal = false;

  get propertey() {
    return this.$store.getters.propertey;
  }

  @Watch('propertey')
  onProperteyChanged() {
    console.log(this.propertey);
  }

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
  top: 0.5rem;
  left: 3rem;
}
</style>
