// Vuex Store
import flatten from '@turf/flatten';
import { randomPoint } from '@turf/random';
import rewind from '@turf/rewind';
import Vue from 'vue';
import Vuex, {
  ActionContext,
  ActionTree,
  GetterTree,
  MutationTree,
  StoreOptions,
} from 'vuex';

Vue.use(Vuex);

export interface GeoJsonEditorState {
  selectedProperties: Record<string, any>;
  requiresParseFixing: boolean;
  requiresWindingOrderFix: boolean;
  geojsonString: string;
  dodgyGeoJsonString: string;
  githubAccessToken: string;
  githubUsername: string;
}

/** State */
const state: GeoJsonEditorState = {
  selectedProperties: null,
  requiresParseFixing: false,
  requiresWindingOrderFix: false,
  geojsonString: `{
  "$schema": "https://json.schemastore.org/geojson.json",
  "type": "FeatureCollection",
  "features": []
}`,
  dodgyGeoJsonString: '',
  githubAccessToken: null,
  githubUsername: null,
};

/** Getters */
const getters: GetterTree<GeoJsonEditorState, GeoJsonEditorState> = {
  geojson: (s: GeoJsonEditorState) => {
    return JSON.parse(s.geojsonString);
  },
  featureCount: (s: GeoJsonEditorState): number => {
    const gj = JSON.parse(state.geojsonString);
    if (gj.type === 'FeatureCollection') return gj.features.length;
    if (gj.type === 'GeometryCollection') return gj.geometries.length;
    if (gj.type === 'Feature' || gj.type === 'Geometry') return 1;
    return 0;
  },
};

/** Mutation */
const mutations: MutationTree<GeoJsonEditorState> = {
  setGitHubUsername(s, name) {
    s.githubUsername = name;
  },
  setGitHubAccessToken(s, token) {
    s.githubAccessToken = token;
  },
  setGeoJSON(s, newGeojson: string) {
    if (typeof newGeojson !== 'string')
      newGeojson = JSON.stringify(newGeojson, null, 2);
    s.geojsonString = newGeojson;
    // modifyJSON()
  },
  setSelectedProperties(s, feature) {
    s.selectedProperties = feature.properties;
    // highlightSelectedFeatureInCodeArea(feature, state.geojsonString)
  },
  setRequiresParsingFix(s, bool) {
    s.requiresParseFixing = bool;
  },
  setRequiresWindingOrderFix(s, bool) {
    s.requiresWindingOrderFix = bool;
  },
  setDodgyString(s, dodgyString) {
    s.dodgyGeoJsonString = dodgyString;
  },
  clearRequiresFixes(s) {
    s.requiresWindingOrderFix = false;
    s.requiresParseFixing = false;
  },
};

/** Action */
const actions: ActionTree<GeoJsonEditorState, GeoJsonEditorState> = {
  fixFeatures(context: ActionContext<GeoJsonEditorState, GeoJsonEditorState>) {
    context.commit(
      'setGeoJSON',
      context.getters.geojson.replace(/(['"])?(\w+)(['"])?:([^/])/g, '"$2":$4')
    );
  },
  rewindFeatures(
    context: ActionContext<GeoJsonEditorState, GeoJsonEditorState>
  ) {
    context.commit('setGeoJSON', rewind(context.getters.geojson));
  },
  clearFeatures(
    context: ActionContext<GeoJsonEditorState, GeoJsonEditorState>
  ) {
    context.commit(
      'setGeoJSON',
      `{
  "$schema": "https://json.schemastore.org/geojson.json",
  "type": "FeatureCollection",
  "features": []
}`
    );
  },
  randomFeatures(
    context: ActionContext<GeoJsonEditorState, GeoJsonEditorState>
  ) {
    context.commit(
      'setGeoJSON',
      randomPoint(25, { bbox: [-180, -90, 180, 90] })
    );
  },
  convertFeatures(
    context: ActionContext<GeoJsonEditorState, GeoJsonEditorState>,
    currentGeojson
  ) {
    context.commit('setGeoJSON', flatten(currentGeojson));
  },
};

// VuexStore
const store: StoreOptions<GeoJsonEditorState> = {
  state,
  getters,
  mutations,
  actions,
};

export default new Vuex.Store<GeoJsonEditorState>(store);
