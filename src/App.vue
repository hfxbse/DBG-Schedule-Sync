<template>
  <div id="app">
    <div class="links">
      <a href="/privacy.pdf" @auxclick="log('view_privacy')" @click="log('view_privacy')">Datenschutz</a>
      <a
          class="github" href="https://github.com/StuBITtv/DBG-Schedule-Sync"
          @auxclick="log('visit_source')"
          @click="log('visit_source')"
      >
        <img alt="GitHub Icon" src="@/assets/GitHub.svg">
        <span>Quellcode</span>
      </a>
    </div>
    <home/>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  font-family: Roboto, sans-serif;
}

html, body, #app {
  background: #FAFAFA;
}

:root {
  --element-shadow: 0 4px 4px rgba(0, 0, 0, 0.3);
  --ink-blue: #3351BB
}
</style>

<style scoped>
.links {
  position: fixed;
  top: 1.1rem;
  right: 1rem;

  z-index: 10;

  display: flex;
  justify-content: right;

  background: rgba(255, 255, 255, 0.9);
  padding: 0.5rem 0.75rem;
  border-radius: 3rem;
}

@media (max-width: 50ch) {
  .links {
    top: 5rem
  }
}

.github {
  width: fit-content;
  display: flex;
}

img {
  height: 1.25rem;
  margin-right: 0.5rem;
}

span {
  margin: auto;
}

a {
  color: black;
  text-decoration: none;

  position: relative;
  text-align: right;
}

a:first-child {
  margin-right: 0.75rem;
  padding-right: 0.75rem;

  border-right: 1px solid black;
}

a:first-child, a:last-child > :last-child {
  margin-top: 0.075rem;
}
</style>

<script>
import Home from "@/views/Home";

import {app} from "@/main";

import {
  getAnalytics,
  logEvent
} from "firebase/analytics";


export default {
  components: {Home},
  methods: {
    log(eventName) {
      const analyticsInstance = getAnalytics(app);
      logEvent(analyticsInstance, eventName);
    }
  }
};
</script>