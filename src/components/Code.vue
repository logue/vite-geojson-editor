<template>
  <codemirror
    ref="myCm"
    :value="code"
    :options="cmOptions"
    @input="onCmCodeChange"
  />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { modifyGeoJSON } from '../controllers/leafletMap';
import { codemirror } from 'vue-codemirror';
import 'codemirror/addon/selection/active-line.js';
import 'codemirror/mode/javascript/javascript.js';

import lint from '@ricerobotics/geojsonhint';
import gp from 'geojson-precision';

@Component({
  components: {
    codemirror,
  },
})
/** Code Component */
export default class CodeArea extends Vue {
  errorLines = [];
  requiresParseFixing = false;
  errors = [];
  cmOptions = {
    tabSize: 2,
    cursorScrollMargin: 50,
    mode: 'text/javascript',
    styleActiveLine: true,
    lineNumbers: true,
    line: true,
  };

  get code() {
    return this.$store.state.geojsonString;
  }

  onCmCodeChange(newGeojsonString: string) {
    this.cleanErrorMarks();

    this.errorLines = [];

    this.errors = lint.hint(newGeojsonString);

    this.errors.forEach(err => {
      if (err.message.startsWith('Parse error')) {
        this.$store.commit('setRequiresParsingFix', true);
      } else if (err.message.startsWith('Polygons and MultiPolygons')) {
        this.$store.commit('setRequiresWindingOrderFix', true);
      } else {
        this.$store.commit('setRequiresParsingFix', false);
      }
      this.errorLines.push(err.line);
    }, this);

    if (this.errors.length === 0) {
      const newGeoJSON = JSON.parse(newGeojsonString);

      modifyGeoJSON(newGeoJSON);
      if (import.meta.env.VITE_MAP_PRECISION) {
        this.$store.commit(
          'setGeoJSON',
          gp.parse(newGeoJSON, import.meta.env.VITE_MAP_PRECISION)
        );
      } else {
        this.$store.commit('setGeoJSON', newGeoJSON);
      }
    }
    this.markErrors();
  }

  markErrors() {
    const cm = (this.$refs.myCm as any).codemirror;
    this.errors.forEach(err => {
      cm.doc.addLineClass(err.line + 1, 'gutter', 'geojsonError');
    }, this);
  }
  cleanErrorMarks() {
    const cm = (this.$refs.myCm as any).codemirror;
    this.errorLines.forEach(line => {
      cm.doc.removeLineClass(line + 1, 'gutter', 'geojsonError');
    }, this);
    this.$store.commit('clearRequiresFixes');
  }
}
</script>

<style lang="scss">
/* stylelint-disable */
// Bootstrap and its default variables
@import '../node_modules/bootstrap/scss/bootstrap';

/**
 * CodeMirror for Bootstrap
 *
 * @author    Logue <logue@hotmail.co.jp>
 * @copyright 2018-2019 Logue
 * @license   MIT
 */

/* BASICS */

.CodeMirror {
  height: calc(100vh - 56px);
  font-family: $font-family-monospace;
  direction: ltr; // berow Copy from bootstrap's .form-control
  display: block;
  width: 100%; //  padding: $input-padding-y $input-padding-x;
  color: $input-color;
  background-color: $input-bg;
  background-clip: padding-box;
  border: $input-border-width solid $input-border-color; // Note: This has no effect on <select>s in some browsers, due to the limited stylability of `<select>`s in CSS.
  @if $enable-rounded {
    // Manually use the if/else instead of the mixin to account for iOS override
    border-radius: $input-border-radius;
  } @else {
    // Otherwise undo the iOS default
    border-radius: 0;
  }
  @include box-shadow($input-box-shadow);
  @include transition(
    $input-transition
  ); // Unstyle the caret on `<select>`s in IE10+.
  &::-ms-expand {
    background-color: transparent;
    border: 0;
  }

  pre {
    // Horizontal padding of content
    padding: 0 4px;
  }
}

/* PADDING */

.CodeMirror-lines {
  padding: 4px 0;

  /* Vertical padding around content */
}

.CodeMirror-scrollbar-filler,
.CodeMirror-gutter-filler {
  background-color: $white;

  /* The little square between H and V scrollbars */
}

/* GUTTER */

.CodeMirror-gutters {
  border-right: $border-width solid $border-color;
  background-color: $gray-100;
  white-space: nowrap;
}

.CodeMirror-linenumbers {
  color: $gray-100;
}

.CodeMirror-linenumber {
  padding: 0 3px 0 5px;
  min-width: 20px;
  text-align: right;
  color: $gray-600;
  white-space: nowrap;
}

.CodeMirror-guttermarker {
  color: $black;
}

.CodeMirror-guttermarker-subtle {
  color: $gray-600;
}

/* CURSOR */

.CodeMirror-cursor {
  border-left: $border-width solid $gray-600;
  border-right: none;
  width: 0;
}

/* Shown when moving in bi-directional text */

.CodeMirror div.CodeMirror-secondarycursor {
  border-left: $border-width solid $border-color;
}

.cm-fat-cursor {
  .CodeMirror-cursor {
    width: auto;
    border: 0 !important;
    background: $green;
  }

  .CodeMirror-cursors {
    z-index: 1;
  }
}

.cm-fat-cursor-mark {
  background-color: rgba($green, 0.5);
  animation: blink 1.06s steps(1) infinite;
}

.cm-animate-fat-cursor {
  width: auto;
  border: 0;
  animation: blink 1.06s steps(1) infinite;
  background-color: $green;
}

@keyframes blink {
  0% {
  }

  50% {
    background-color: transparent;
  }

  100% {
  }
}

/* Can style cursor different in overwrite (non-insert) mode */

.cm-tab {
  display: inline-block;
  text-decoration: inherit;
}

.CodeMirror-rulers {
  position: absolute;
  left: 0;
  right: 0;
  top: -50px;
  bottom: -20px;
  overflow: hidden;
}

.CodeMirror-ruler {
  border-left: $border-width solid $border-color;
  top: 0;
  bottom: 0;
  position: absolute;
}

/* DEFAULT THEME */

.cm-header,
.cm-strong {
  font-weight: bold;
}

.cm-em {
  font-style: italic;
}

.cm-link {
  text-decoration: underline;
}

.cm-strikethrough {
  text-decoration: line-through;
}

.cm-negative {
  color: $danger;
}

.cm-positive {
  color: $success;
}

.cm-invalidchar {
  color: $warning;
}

.cm-s-default {
  .cm-header {
    color: $blue;
  }

  .cm-quote {
    color: $green;
  }

  .cm-keyword {
    color: $purple;
  }

  .cm-atom {
    color: $indigo;
  }

  .cm-number {
    color: $green;
  }

  .cm-def {
    color: $blue;
  }

  .cm-variable,
  .cm-punctuation,
  .cm-property,
  .cm-operator {
    color: $secondary;
  }

  .cm-variable-2 {
    color: $cyan;
  }

  .cm-variable-3,
  .cm-type {
    color: $green;
  }

  .cm-comment {
    color: $teal;
  }

  .cm-string {
    color: $pink;
  }

  .cm-string-2 {
    color: $orange;
  }

  .cm-meta {
    color: $gray-600;
  }

  .cm-qualifier {
    color: $dark;
  }

  .cm-builtin {
    color: $yellow;
  }

  .cm-bracket {
    color: $cyan;
  }

  .cm-tag {
    color: $green;
  }

  .cm-attribute {
    color: $red;
  }

  .cm-hr {
    color: $gray-600;
  }

  .cm-link {
    color: $blue;
  }

  .cm-error {
    color: $red;
  }
}

.CodeMirror-composing {
  border-bottom: 2px solid;
}

/* Default styles for common addons */

.CodeMirror-activeline-background {
  background: $light;
}

.CodeMirror span.CodeMirror-matchingbracket {
  color: $teal;
}

.CodeMirror span.CodeMirror-nonmatchingbracket {
  color: $pink;
}

.CodeMirror-matchingtag {
  background: rgba($orange, 0.3);
}

/* STOP */

/* The rest of this file contains styles related to the mechanics of
   the editor. You probably shouldn't touch them. */

.CodeMirror {
  position: relative;
  overflow: hidden;
  background: $white;
}

.CodeMirror-scroll {
  overflow: scroll !important;

  /* Things will break if this is overridden */

  /* 30px is the magic margin used to hide the element's real scrollbars */

  /* See overflow: hidden in .CodeMirror */
  margin-bottom: -30px;
  margin-right: -30px;
  padding-bottom: 30px;
  height: 100%;
  outline: none;

  /* Prevent dragging from highlighting the element */
  position: relative;
}

.CodeMirror-sizer {
  position: relative;
  border-right: 30px solid transparent;
}

/* The fake, visible scrollbars. Used to force redraw during scrolling
   before actual scrolling happens, thus preventing shaking and
   flickering artifacts. */

.CodeMirror-vscrollbar,
.CodeMirror-hscrollbar,
.CodeMirror-scrollbar-filler,
.CodeMirror-gutter-filler {
  position: absolute;
  z-index: 6;
  display: none;
}

.CodeMirror-vscrollbar {
  right: 0;
  top: 0;
  overflow-x: hidden;
  overflow-y: scroll;
}

.CodeMirror-hscrollbar {
  bottom: 0;
  left: 0;
  overflow-y: hidden;
  overflow-x: scroll;
}

.CodeMirror-scrollbar-filler {
  right: 0;
  bottom: 0;
}

.CodeMirror-gutter-filler {
  left: 0;
  bottom: 0;
}

.CodeMirror-gutters {
  position: absolute;
  left: 0;
  top: 0;
  min-height: 100%;
  z-index: 3;
}

.CodeMirror-gutter {
  white-space: normal;
  height: 100%;
  display: inline-block;
  vertical-align: top;
  margin-bottom: -30px;
}

.CodeMirror-gutter-wrapper {
  position: absolute;
  z-index: 4;
  background: none !important;
  border: none !important;

  ::selection {
    background-color: transparent;
  }
}

.CodeMirror-gutter-background {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 4;
}

.CodeMirror-gutter-elt {
  position: absolute;
  cursor: default;
  z-index: 4;
}

.CodeMirror-lines {
  cursor: text;
  min-height: 1px;

  /* prevents collapsing before first draw */
}

.CodeMirror pre {
  /* Reset some styles that the rest of the page might have set */
  border-radius: 0;
  border-width: 0;
  background: transparent;
  font-family: inherit;
  margin: 0;
  white-space: pre;
  word-wrap: normal;
  line-height: inherit;
  color: inherit;
  z-index: 2;
  position: relative;
  overflow: visible;
  font-variant-ligatures: contextual;
}

.CodeMirror-wrap pre {
  word-wrap: break-word;
  white-space: pre-wrap;
  word-break: normal;
}

.CodeMirror-linebackground {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 0;
}

.CodeMirror-linewidget {
  position: relative;
  z-index: 2;
  padding: 0.1px; // Force widget margins to stay inside of the container
}

.CodeMirror-widget {
}

.CodeMirror-rtl pre {
  direction: rtl;
}

.CodeMirror-code {
  outline: none;
}

/* Force content-box sizing for the elements where we expect it */

.CodeMirror-scroll,
.CodeMirror-sizer,
.CodeMirror-gutter,
.CodeMirror-gutters,
.CodeMirror-linenumber {
  box-sizing: content-box;
}

.CodeMirror-measure {
  position: absolute;
  width: 100%;
  height: 0;
  overflow: hidden;
  visibility: hidden;

  pre {
    position: static;
  }
}

.CodeMirror-cursor {
  position: absolute;
  pointer-events: none;
}

.CodeMirror-cursors {
  visibility: hidden;
  position: relative;
  z-index: 3;
}

.CodeMirror-dragcursors {
  visibility: visible;
}

.CodeMirror-selected {
  background: $gray-300;
}

.CodeMirror-focused {
  color: $input-focus-color;
  background-color: $input-focus-bg;
  border-color: $input-focus-border-color;
  outline: 0; // Avoid using mixin so we can pass custom focus shadow properly
  @if $enable-shadows {
    box-shadow: $input-box-shadow, $input-focus-box-shadow;
  } @else {
    box-shadow: $input-focus-box-shadow;
  }

  .CodeMirror-cursors {
    visibility: visible;
  }

  .CodeMirror-selected {
    background: $gray-400;
  }
}

.CodeMirror-crosshair {
  cursor: crosshair;
}

.CodeMirror-line::selection,
.CodeMirror-line > span::selection,
.CodeMirror-line > span > span::selection {
  background: $gray-800;
}

.cm-searching {
  background-color: rgba($yellow, 0.4);
}

/* Used to force a border model for a node */

.cm-force-border {
  padding-right: 0.1px;
}

@media print {
  /* Hide the cursor when printing */
  .CodeMirror .CodeMirror-cursors {
    visibility: hidden;
  }
}

/* See issue #2901 */

.cm-tab-wrap-hack::after {
  content: '';
}

/* Help users use markselection to safely style text background */

span.CodeMirror-selectedtext {
  background: none;
}
</style>
