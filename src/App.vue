<template>
  <div id="app">
    <div class="links">
      <a href="/privacy.pdf">Datenschutz</a>
      <a class="github" href="https://github.com/StuBITtv/DBG-Schedule-Sync">
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
  top: 1.7rem;
  right: 1rem;

  z-index: 10;

  display: flex;
  justify-content: right;
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
</style>

<script>
import Home from "./views/Home";

export default {
  components: {Home}
}
</script>