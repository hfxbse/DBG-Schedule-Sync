<template>
  <div class="center" @click="$emit('click', $event)">
    <div>
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: "Center"
}
</script>

<style scoped>
.center {
  min-height: 100vh;

  display: grid;
  place-items: center;
}

.center > * {
  padding: 5rem 1.5rem 12rem;
}
</style>