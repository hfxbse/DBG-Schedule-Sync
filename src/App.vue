<template>
  <div id="app">
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
<script>
import Home from "./views/Home";

export default {
  components: {Home}
}
</script>