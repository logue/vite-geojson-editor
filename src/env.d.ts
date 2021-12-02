/* eslint-disable */
/// <reference types="vite/client" />

declare module '*.vue' {
  import Vue from 'vue';
  export default Vue;
}

interface ImportMetaEnv {
  // see https://vitejs.dev/guide/env-and-mode.html#env-files
  // add .env variables.

  /** Application Title */
  readonly VITE_APP_TITLE: string;
  /** Default Latitude (Y axis) */
  readonly VITE_MAP_DEFAULT_LATITUDE: number;
  /** Default Longitude (X axis) */
  readonly VITE_MAP_DEFAULT_LONGITUDE: number;
  /** Default Zoom */
  readonly VITE_MAP_DEFAULT_ZOOM: number;

  readonly VITE_GITHUB_ACCESS_TOKEN: string;

  /** Map tile server uri (https:// ... /{z}/{x}/{y}.png) */
  readonly VITE_MAP_TILE_ZXY_URI: string;
  /** Map Attributions */
  readonly VITE_MAP_ATTRIBUTION: string;
  readonly VITE_MAP_SUBDOMAINS: string;
  /** Max zoom */
  readonly VITE_MAP_MAX_ZOOM: number;
  readonly VITE_MAP_MIN_ZOOM: number;

  /** Raster Image mode */
  readonly VITE_MAP_IS_RASTER: string;
  /** Minimum Latitude (min Y axis) */
  readonly VITE_MAP_EXTENT_MIN_LATITUDE: number;
  /** Minimum Latitude (min X axis) */
  readonly VITE_MAP_EXTENT_MIN_LONGITUDE: number;
  /** Maximum Longitude (max Y axis) */
  readonly VITE_MAP_EXTENT_MAX_LATITUDE: number;
  /** Maximum Longitude (max X axis) */
  readonly VITE_MAP_EXTENT_MAX_LONGITUDE: number;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
