<template>
  <setup v-if="online">
  </setup>
  <center-container v-else>
    <h1>You're offline.</h1>
  </center-container>
</template>

<script>
import Setup from '@/components/Setup.vue'
import Center from "../components/Center";

export default {
  name: 'Home',
  components: {centerContainer: Center, Setup},
  beforeRouteEnter(_, __, next) {
    next(() => document.title = 'DBG Stundenplan Synchronisation')
  },
  created() {
    document.ononline = () => this.online = true
    document.onoffline = () => this.online = false
  },
  data() {
    return {
      online: window.navigator.onLine
    }
  }
}
</script>
