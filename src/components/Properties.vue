<template>
  <div v-if="selectedProperties !== null">
    <b-table striped hover :fields="fields" :items="tableProperties">
      <template #table-caption>Property</template>
    </b-table>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class Properties extends Vue {
  fields = [
    {
      label: 'Property',
      key: 'property',
      sortable: true,
    },
    {
      label: 'Value',
      key: 'value',
      sortable: true,
    },
  ];

  get selectedProperties() {
    return this.$store.state.selectedProperties;
  }
  get propertyKeys() {
    return Object.keys(this.selectedProperties);
  }
  get tableProperties() {
    return this.propertyKeys.map(key => {
      return { property: key, value: this.selectedProperties[key] };
    });
  }
}
</script>
