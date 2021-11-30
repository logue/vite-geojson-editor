<template>
  <div class="d-flex flex-column p-3">
    <code-area />
    <bottom-menu />
  </div>
</template>

<script>
import CodeArea from './Code.vue';
import BottomMenu from './BottomMenu.vue';

export default {
  name: 'Sidebar',
  components: {
    CodeArea,
    BottomMenu,
  },
};
</script>
