<template>
  <div v-if="online">
    <button @click="logout">Ausloggen</button>
    <setup/>
  </div>
  <center-container v-else>
    <h1>You're offline.</h1>
  </center-container>
</template>

<script>
import Setup from '@/components/Setup.vue'
import Center from '@/components/Center';
import * as firebase from "firebase";

const auth = async () => {
  await import(/* webpackChunkName: "firebase_auth"*/ 'firebase/auth')
  return firebase.auth()
}

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
  },
  methods: {
    async logout() {
      await (await auth()).signOut()
      await this.$router.push({name: 'Auth'})
    }
  }
}
</script>

<style scoped>
div {
  position: relative;
}

button {
  display: block;

  position: fixed;
  top: 1rem;
  left: 1rem;

  z-index: 1;

  font-size: 1rem;
  font-weight: 200;

  background: rgba(255, 255, 255, 0.7);
  padding: .5rem 1rem;

  border: none;
  border-radius: 5rem;
  box-shadow: 0 3px 3px rgba(0, 0, 0, 0.2);

  outline: none;
}
</style>
