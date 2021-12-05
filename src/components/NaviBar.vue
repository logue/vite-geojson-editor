<template>
  <b-navbar type="dark" variant="dark">
    <b-navbar-brand href="#">
      {{ title }}
    </b-navbar-brand>
    <b-navbar-nav class="ml-auto">
      <b-nav-form>
        <b-dropdown right class="mx-2">
          <template #button-content>
            <b-icon icon="tools" aria-hidden="true" />
            Tools
          </template>
          <b-dropdown-item @click="loadFileModal = !loadFileModal">
            <b-icon icon="file-earmark-code-fill" aria-hidden="true" />
            Load from file
          </b-dropdown-item>
          <b-dropdown-item @click="loadDataModal = !loadDataModal">
            <b-icon icon="link45deg" aria-hidden="true" />
            Load from URL
          </b-dropdown-item>
          <b-dropdown-divider />
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
            <b-icon icon="list-ol" aria-hidden="true" />
            Fix Winding Order
          </b-dropdown-item>
          <b-dropdown-divider />
          <b-dropdown-item @click="pointsModalOpen = !pointsModalOpen">
            <b-icon icon="geo-alt-fill" aria-hidden="true" />
            Create Random Points
          </b-dropdown-item>
          <b-dropdown-item @click="zoomTo">
            <b-icon icon="zoom-in" aria-hidden="true" />
            Zoom to Features
          </b-dropdown-item>
          <b-dropdown-item @click="$store.dispatch('convertFeatures')">
            Convert Multipart to Singlepart geometries
          </b-dropdown-item>
        </b-dropdown>
        <b-dropdown right variant="primary">
          <template #button-content>
            <b-icon icon="download" aria-hidden="true" />
            Save
            <b-badge variant="light">{{ featureCount }}</b-badge>
          </template>
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
          <b-icon icon="box-arrow-in-right" aria-hidden="true" />
          Sign in
        </b-nav-item>
        <b-nav-item v-else>
          <b-avatar :src="githubImage" :text="githubUsername" />
        </b-nav-item>
      </template>
    </b-navbar-nav>
    <b-modal v-model="loadDataModal" title="Load from URL" @ok="loadFromUrl">
      <b-input-group>
        <b-input-group-prepend is-text>
          <b-icon icon="link" aria-hidden="true" />
        </b-input-group-prepend>
        <b-form-input
          v-model="remoteUrl"
          placeholder="Url of geojson"
          required
        />
      </b-input-group>
    </b-modal>
    <b-modal v-model="loadFileModal" title="Load from URL" @ok="loadFromFile">
      <b-input-group>
        <b-input-group-prepend is-text>
          <b-icon icon="file-earmark-code-fill" aria-hidden="true" />
        </b-input-group-prepend>
        <b-form-file
          v-model="localFile"
          accept="application/geo+json"
          placeholder="File of geojson"
          required
        />
      </b-input-group>
    </b-modal>
    <b-modal
      v-model="pointsModalOpen"
      title="Number of points to create"
      size="lg"
      @ok="createRandomPoints"
    >
      <b-form-group
        label="Number of points to create"
        label-for="numberOfPoints"
      >
        <b-input-group>
          <b-input-group-prepend is-text>
            <b-icon icon="geo-alt-fill" aria-hidden="true" />
          </b-input-group-prepend>
          <b-form-input
            id="numberOfPoints"
            v-model="numberOfPoints"
            type="number"
            placeholder="10"
            required
          />
        </b-input-group>
      </b-form-group>
      <b-form-group label="Bounding box" label-for="bbox">
        <b-form-row id="bbox">
          <b-col>
            <b-input-group>
              <b-input-group-prepend is-text>
                <b-icon icon="arrow-left-short" aria-hidden="true" />
              </b-input-group-prepend>
              <b-form-input
                v-model="bbox[0]"
                type="number"
                placeholder="-180"
                minimum="-180"
                maximum="180"
                required
              />
            </b-input-group>
          </b-col>
          <b-col>
            <b-input-group>
              <b-input-group-prepend is-text>
                <b-icon icon="arrow-up-short" aria-hidden="true" />
              </b-input-group-prepend>
              <b-form-input
                v-model="bbox[1]"
                type="number"
                placeholder="-90"
                minimum="-90"
                maximum="90"
                required
              />
            </b-input-group>
          </b-col>
          <b-col>
            <b-input-group>
              <b-input-group-prepend is-text>
                <b-icon icon="arrow-right-short" aria-hidden="true" />
              </b-input-group-prepend>
              <b-form-input
                v-model="bbox[2]"
                type="number"
                placeholder="180"
                minimum="-180"
                maximum="180"
                required
              />
            </b-input-group>
          </b-col>
          <b-col>
            <b-input-group>
              <b-input-group-prepend is-text>
                <b-icon icon="arrow-down-short" aria-hidden="true" />
              </b-input-group-prepend>
              <b-form-input
                v-model="bbox[3]"
                type="number"
                placeholder="90"
                minimum="-90"
                maximum="90"
                required
              />
            </b-input-group>
          </b-col>
        </b-form-row>
      </b-form-group>
    </b-modal>
  </b-navbar>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import FileSaver from 'file-saver';
import { topology } from 'topojson-server';
import wkt from 'wellknown';
import shape from 'shp-write';
import axios from 'axios';
import lint from '@ricerobotics/geojsonhint';
import { randomPoint } from '@turf/random';
import type { BBox } from '@turf/helpers';

import { zoomToFeatures } from '../controllers/leafletMap';

@Component
/** HelloWorld Component */
export default class NaviBar extends Vue {
  loadDataModal = false;
  loadFileModal = false;
  creatingGist = false;
  remoteUrl = null;
  localFile: File = null;
  title = import.meta.env.VITE_APP_TITLE || 'Vite GeoJson Editor';

  pointsModalOpen = false;
  numberOfPoints = 10;
  bbox: BBox = [-180, -90, 180, 90];

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
        label: 'GeoJSON',
        value: 'geojson',
        mime: 'application/geo+json',
        disabled: false,
      },
      {
        label: 'Shapefile',
        value: 'shp',
        mime: 'x-gis/x-shapefile',
        disabled: false,
      },
      {
        label: 'TopoJSON',
        value: 'topojson',
        mime: 'application/json',
        disabled: false,
      },
      {
        label: 'WKT',
        value: 'wkt',
        mime: 'text/plain',
        disabled: false,
      },
      {
        label: 'Github Gist',
        value: 'gist',
        mime: null,
        disabled: !this.githubAccessToken,
      },
    ];
  }

  zoomTo() {
    zoomToFeatures();
  }

  createRandomPoints() {
    const newPoints = randomPoint(this.numberOfPoints, {
      bbox: this.bbox,
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
      this.$bvToast.toast('The specified file could be parsed as geojson', {
        title: 'Geojson has been loaded.',
        variant: 'primary',
      });
    } catch (error) {
      this.$bvToast.toast('File could not be retrieved from specified url', {
        title: 'Could not retrieve file',
        variant: 'danger',
      });
    }
  }

  async loadFromFile() {
    if (!this.localFile) {
      this.$bvToast.toast('File doees not selected.', {
        title: 'Could not retrieve file',
        variant: 'danger',
      });
      return;
    }
    const reader = new FileReader();
    reader.readAsText(this.localFile);
    reader.onload = () => {
      this.$store.commit('setGeoJSON', reader.result);
      zoomToFeatures();
      this.$bvToast.toast('The specified file could be parsed as geojson', {
        title: 'Geojson has been loaded.',
        variant: 'primary',
      });
    };
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
    switch (e) {
      case 'gist': {
        const r = await this.createGist();
        this.$bvToast.toast(r.data.id, {
          title: 'Gist created',
          solid: true,
        });
        return;
      }
      case 'shp': {
        shape.download(this.$store.getters.geojson, {
          folder: 'myshapes',
          types: {
            point: 'mypoints',
            polygon: 'mypolygons',
            line: 'mylines',
          },
        });
        return;
      }
      case 'topojson': {
        outData = topology(this.$store.getters.geojson.features);
        break;
      }
      case 'wkt': {
        outData = wkt.stringify({
          type: 'GeometryCollection',
          geometries: this.$store.getters.geojson.features.map(f => f.geometry),
        });
        break;
      }
      default: {
        outData = JSON.parse(this.$store.state.geojsonString);
        break;
      }
    }

    const file = new File([JSON.stringify(outData)], `export.${outName}`, {
      type: 'text/plain;charset=utf-8',
    });
    FileSaver.saveAs(file);
  }
}
</script>
