<template>
  <b-navbar type="dark" variant="dark">
    <b-navbar-brand href="#">Vite GeoJson Editor</b-navbar-brand>
    <b-navbar-nav class="ml-auto">
      <b-nav-item-dropdown text="Fix" right>
        <b-dropdown-item
          :disabled="doesntRequireParseFixing"
          @click="$store.dispatch('fixFeatures')"
        >
          Fix Quotation Marks on Keys
        </b-dropdown-item>
        <b-dropdown-item
          :disabled="doesntRequireWindingFixing"
          @click="$store.dispatch('rewindFeatures')"
        >
          Fix Winding Order
        </b-dropdown-item>
      </b-nav-item-dropdown>
      <b-nav-item-dropdown text="Tools" right>
        <b-dropdown-item @click="$store.dispatch('randomFeatures')">
          Create Random Points
        </b-dropdown-item>
        <b-dropdown-item @click="zoomTo">Zoom to Features</b-dropdown-item>
        <b-dropdown-item @click="$store.dispatch('convertFeatures')">
          Convert Multipart to Singlepart geometries
        </b-dropdown-item>
      </b-nav-item-dropdown>
    </b-navbar-nav>
  </b-navbar>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { zoomToFeatures } from '../controllers/leafletMap';

@Component
/** HelloWorld Component */
export default class NaviBar extends Vue {
  get doesntRequireParseFixing() {
    return !this.$store.state.requiresParseFixing;
  }
  get doesntRequireWindingFixing() {
    return !this.$store.state.requiresWindingOrderFix;
  }
  get featureCount() {
    return this.$store.getters.featureCount;
  }
  get currentGeojson() {
    return this.$store.getters.geojson;
  }
  zoomTo() {
    zoomToFeatures();
  }
}
</script>
