<template>
  <div id="map" class="h-100 w-100" />
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
