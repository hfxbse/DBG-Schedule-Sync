<template>
  <div class="button_container">
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: "ButtonContainer",
};
</script>

<style scoped>
.button_container {
  display: grid;
  grid-gap: 0.5rem;
  grid-template-columns: repeat(auto-fill, minmax(5rem, 1fr));

  width: fit-content;
  max-width: calc(100vw - 4.2rem);

  margin: auto;
}

.button_container:last-child:not(:first-child) {
  margin-bottom: 0;
}
</style>