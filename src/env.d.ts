/* eslint-disable */
/// <reference types="vite/client" />

declare module '*.vue' {
  import Vue from 'vue';
  export default Vue;
}

interface ImportMetaEnv {
  // see https://vitejs.dev/guide/env-and-mode.html#env-files
  // add .env variables.
  readonly VITE_APP_TITLE: string;
  readonly VITE_MAP_DEFAULT_LATITUDE: number;
  readonly VITE_MAP_DEFAULT_LONGITUDE: number;
  readonly VITE_MAP_DEFAULT_ZOOM: number;
  readonly VITE_MAP_TILE_ZXY_URI: string;
  readonly VITE_MAP_ATTRIBUTION: string;
  readonly VITE_MAP_SUBDOMAINS: string;
  readonly VITE_MAP_MAX_ZOOM: string;
  readonly VITE_MAP_IS_RASTER: boolean;
  readonly VITE_MAP_EXTENT: [number, number, number, number];
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
