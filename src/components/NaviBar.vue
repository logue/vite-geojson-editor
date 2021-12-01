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
      <b-nav-form class="mx-3">
        <b-button @click="loadDataModal = !loadDataModal" class="mr-3" disabled>
          Load from URL
        </b-button>
        <b-modal
          v-model="loadDataModal"
          title="Load from URL"
          @ok="saveInFormats"
        >
          <b-form-input
            v-model="remoteUrl"
            placeholder="Url of geojson"
            required
          />
        </b-modal>
        <b-dropdown right text="Save" variant="primary">
          <b-dropdown-item
            v-for="format in supportedFormats"
            :key="format.value"
            :name="format.value"
            :disabled="format.disabled"
            @click="saveInFormats(format.value)"
          >
            {{ format.label }}
          </b-dropdown-item>
        </b-dropdown>
      </b-nav-form>
      <b-nav-item href="https://github.com/logue/vite-geojson-editor">
        <b-icon icon="github" aria-hidden="false" />
      </b-nav-item>
    </b-navbar-nav>
  </b-navbar>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import FileSaver from 'file-saver';
import { topology } from 'topojson-server';
import wkt from 'wellknown';
import shape from 'shp-write';
import axios from 'axios';
import lint from '@mapbox/geojsonhint';
import { zoomToFeatures } from '../controllers/leafletMap';

@Component
/** HelloWorld Component */
export default class NaviBar extends Vue {
  loadDataModal = false;
  creatingGist = false;
  remoteUrl = '';

  get hasGhAccessToken() {
    return this.$store.state.githubAccessToken !== null;
  }
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
  get supportedFormats() {
    return [
      {
        label: 'Shapefile',
        value: 'shp',
        disabled: false,
      },
      {
        label: 'TopoJSON',
        value: 'topojson',
        disabled: false,
      },
      {
        label: 'WKT',
        value: 'wkt',
        disabled: false,
      },
      {
        label: 'Github Gist',
        value: 'gist',
        disabled: !this.hasGhAccessToken,
      },
    ];
  }
  zoomTo() {
    zoomToFeatures();
  }

  async loadFromUrl() {
    try {
      const response = await axios.get(this.remoteUrl);
      const errors = lint.hint(response.data);

      console.log(errors);
      let hadParsingError = false;
      errors.forEach(err => {
        if (err.message.startsWith('Parse error')) {
          hadParsingError = true;
        }
      });
      if (hadParsingError) {
        this.$bvToast.toast(
          'The specified file could not be parsed as geojson',
          {
            title: 'Could not parse geojson',
            variant: 'warning',
            solid: true,
          }
        );

        return;
      }
      this.$store.commit('setGeoJSON', response.data);
      zoomToFeatures();
    } catch (error) {
      this.$bvToast.toast('File could not be retrieved from specified url', {
        title: 'Could not retrieve file',
        variant: 'error',
        solid: true,
      });
    }
  }
  saveToGeojson() {
    const file = new File(
      [this.$store.state.geojsonString],
      'exported.geojson',
      {
        type: 'text/plain;charset=utf-8',
      }
    );
    FileSaver.saveAs(file);
  }
  async createShare() {
    this.creatingGist = true;
    const response = await this.createGist();
    this.creatingGist = false;
    const newUrl = new URL(document.location.href);
    const params = newUrl.searchParams;
    params.delete('gist');
    params.append('gist', response.data.id);
    window.history.pushState({}, null, newUrl.toString());
    navigator.clipboard.writeText(newUrl.toString()).then(() => {
      this.$bvToast.toast('Share copied to clipboard', {
        title: 'Share',
        variant: 'success',
        solid: true,
      });
    });
  }
  createGist() {
    const that = this;
    return axios({
      url: 'https://api.github.com/gists',
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `token ${that.$store.state.githubAccessToken}`,
      },
      data: {
        description: 'GeoJson saved from geojson-editor',
        public: true,
        files: {
          'data.geojson': {
            content: that.$store.state.geojsonString,
          },
        },
      },
    });
  }
  async saveInFormats(e) {
    let outData = null;
    const outName = e;
    if (e === 'gist') {
      const r = await this.createGist();
      this.$bvToast.toast(r.data.id, {
        title: 'Gist created',
        solid: true,
      });
      return;
    }
    if (e === 'topojson') {
      outData = topology(this.$store.getters.geojson.features);
    }
    if (e === 'wkt') {
      outData = wkt.stringify({
        type: 'GeometryCollection',
        geometries: this.$store.getters.geojson.features.map(function (f) {
          return f.geometry;
        }),
      });
    }
    if (e === 'shp') {
      const options = {
        folder: 'myshapes',
        types: {
          point: 'mypoints',
          polygon: 'mypolygons',
          line: 'mylines',
        },
      };
      shape.download(this.$store.getters.geojson, options);
      return;
    }
    const file = new File([JSON.stringify(outData)], `export.${outName}`, {
      type: 'text/plain;charset=utf-8',
    });
    FileSaver.saveAs(file);
  }
}
</script>
