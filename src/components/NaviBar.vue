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
        <b-dropdown-item @click="pointsModalOpen = !pointsModalOpen">
          Create Random Points
        </b-dropdown-item>
        <b-dropdown-item @click="zoomTo">Zoom to Features</b-dropdown-item>
        <b-dropdown-item @click="$store.dispatch('convertFeatures')">
          Convert Multipart to Singlepart geometries
        </b-dropdown-item>
      </b-nav-item-dropdown>
      <b-nav-form class="mx-3">
        <b-button class="mr-3" @click="loadDataModal = !loadDataModal">
          Load from URL
        </b-button>
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
      <template v-if="githubClientId">
        <b-nav-item
          v-if="githubUsername === null && !loadingGithubUser"
          @click="signin"
        >
          Sign in
        </b-nav-item>
        <b-nav-item v-else>
          <b-avatar :src="githubImage" :text="githubUsername" />
        </b-nav-item>
      </template>
    </b-navbar-nav>
    <b-modal v-model="loadDataModal" title="Load from URL" @ok="loadFromUrl">
      <b-form-input v-model="remoteUrl" placeholder="Url of geojson" required />
    </b-modal>
    <b-modal
      v-model="pointsModalOpen"
      title="Number of points to create"
      @ok="createRandomPoints"
    >
      <b-form-group
        label="Number of points to create"
        label-for="numberOfPoints"
      >
        <b-form-input
          id="numberOfPoints"
          v-model="numberOfPoints"
          type="number"
          placeholder="10"
          required
        />
      </b-form-group>
      <b-form-group label="Bounding box" label-for="bbox">
        <b-form-input
          id="bbox"
          v-model="bbox"
          type="text"
          placeholder="-180, -90, 180, 90"
          required
        />
      </b-form-group>
    </b-modal>
  </b-navbar>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import FileSaver from 'file-saver';
import { topology } from 'topojson-server';
import wkt from 'wellknown';
import shape from 'shp-write';
import axios from 'axios';
import lint from '@mapbox/geojsonhint';
import { zoomToFeatures } from '../controllers/leafletMap';
import { randomPoint } from '@turf/random';

@Component
/** HelloWorld Component */
export default class NaviBar extends Vue {
  loadDataModal = false;
  creatingGist = false;
  remoteUrl = '';

  pointsModalOpen = false;
  numberOfPoints = 10;
  bbox = '-180, -90, 180, 90';

  @Prop()
  loadingGithubUser = false;

  get githubClientId() {
    return import.meta.env.VITE_GITHUB_CLIENT_ID;
  }

  get githubAccessToken() {
    return this.$store.state.githubAccessToken !== null;
  }
  get githubUsername() {
    return this.$store.state.githubUsername === null
      ? null
      : this.$store.state.githubUsername.login;
  }
  get githubImage() {
    return this.$store.state.githubUsername === null
      ? null
      : this.$store.state.githubUsername.avatar_url;
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
        disabled: !this.githubAccessToken,
      },
    ];
  }

  zoomTo() {
    zoomToFeatures();
  }

  createRandomPoints() {
    if (this.bbox.split(',').length - 1 !== 3) this.bbox = '-180, -90, 180, 90';
    const newPoints = randomPoint(this.numberOfPoints, {
      bbox: JSON.parse('[' + this.bbox + ']'),
    });
    this.$store.commit('setGeoJSON', {
      type: 'FeatureCollection',
      features: this.currentGeojson.features.concat(newPoints.features),
    });
  }

  async loadFromUrl() {
    try {
      const response = await axios.get(this.remoteUrl);
      const errors = lint.hint(response.data);

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
          }
        );

        return;
      }
      this.$store.commit('setGeoJSON', response.data);
      zoomToFeatures();
    } catch (error) {
      this.$bvToast.toast('File could not be retrieved from specified url', {
        title: 'Could not retrieve file',
        variant: 'danger',
      });
    }
  }

  saveToGeojson() {
    const file = new File(
      [this.$store.state.geojsonString],
      'exported.geojson',
      {
        type: 'application/geo+json;charset=utf-8',
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
      });
    });
  }

  async signin() {
    window.open(
      `https://github.com/login/oauth/authorize?client_id=${this.githubClientId}&scope=gist,read:user`,
      'oauth',
      `height=400,width=600`
    );
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
        geometries: this.$store.getters.geojson.features.map(f => f.geometry),
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
