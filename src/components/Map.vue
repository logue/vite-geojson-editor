<template>
  <div id="map" />
</template>

<script>
import { createMap } from './../controllers/leafletMap';

export default {
  name: 'LeafletMap',
  mounted() {
    createMap();
  },
};
</script>

<style>
#map {
  height: 100%;
  width: 100%;
}
</style>
