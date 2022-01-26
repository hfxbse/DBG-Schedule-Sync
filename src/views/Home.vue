<template>
  <div v-if="online">
    <button v-if="user" @click="logout">Ausloggen</button>
    <button v-else @click="menuVisible = true">Einloggen</button>
    <setup
        :pendingSave="pendingSave"
        :user="user"
        @authorize="pendingSave = menuVisible = true"
        @saved="pendingSave = false"
    />

    <center-container v-if="menuVisible" class="menu" @click.self="pendingSave = menuVisible = false">
      <keep-alive>
        <auth v-if="!user" @success="menuVisible = false"/>
      </keep-alive>
    </center-container>
  </div>
  <center-container v-else>
    <h1>You're offline.</h1>
  </center-container>
</template>

<script>
import Setup from '@/components/Setup.vue'

import {app} from "@/main";
import {getAuth, onAuthStateChanged, signOut} from "firebase/auth";

export default {
  name: 'Home',
  components: {
    Auth: () => import(/* webpackChunkName: "auth"*/ "@/components/Auth"),
    CenterContainer: () => import(/* webpackChunkName: "auth"*/ "@/components/Center"),
    Setup
  },
  created() {
    document.ononline = () => this.online = true
    document.onoffline = () => this.online = false

    onAuthStateChanged(getAuth(app), user => this.user = user);
  },
  data() {
    return {
      online: window.navigator.onLine,
      user: null,
      menuVisible: false,
      pendingSave: false,
    }
  },
  methods: {
    async logout() {
      await signOut(getAuth(app));
    }
  },
  watch: {}
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

  background: rgba(255, 255, 255, 0.9);
  padding: .5rem 1rem;

  border: none;
  border-radius: 5rem;
  box-shadow: 0 3px 3px rgba(0, 0, 0, 0.2);

  outline: none;
}

.menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;

  background: rgba(0, 0, 0, 0.8);

  z-index: 2;
}

.menu * {
  z-index: 3;
}
</style>
