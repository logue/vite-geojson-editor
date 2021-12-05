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

  /** Max zoom */
  readonly VITE_MAP_MAX_ZOOM: number;
  /** Minimum zoom */
  readonly VITE_MAP_MIN_ZOOM: number;

  readonly VITE_MAP_FEATURE_COLOR: string;
  readonly VITE_MAP_FEATURE_COLOR_SELECTED: string;
  readonly VITE_MAP_PRECISION?: number;

  /** Post to Gist access token */
  readonly VITE_GITHUB_CLIENT_ID: string;

  /** Map tile server uri (https:// ... /{z}/{x}/{y}.png) */
  readonly VITE_MAP_TILE_ZXY_URI: string;
  /** Map Attributions */
  readonly VITE_MAP_ATTRIBUTION: string;

  /** Raster tile mode (for game map etc.) */
  readonly VITE_MAP_IS_RASTER: boolean;
  readonly VITE_MAP_CENTER_TO_ZERO: boolean;
  readonly VITE_MAP_WIDTH: number;
  readonly VITE_MAP_HEIGHT: boolean;

  /** Limit Bounds box */
  readonly VITE_MAP_LIMIT_BOUNDS: boolean;
  /** Minimum Latitude (min Y axis) */
  readonly VITE_MAP_MIN_LATITUDE: number;
  /** Minimum Latitude (min X axis) */
  readonly VITE_MAP_MIN_LONGITUDE: number;
  /** Maximum Longitude (max Y axis) */
  readonly VITE_MAP_MAX_LATITUDE: number;
  /** Maximum Longitude (max X axis) */
  readonly VITE_MAP_MAX_LONGITUDE: number;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
