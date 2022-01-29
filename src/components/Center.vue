<template>
  <div class="center" @click="$emit('click', $event)">
    <div :class="{without: lift}">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: "Center",
  props: {
    lift: {
      type: Boolean,
      required: false,
      default: false
    }
  }
};
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

@media (min-width: 70ch) {
  .without {
    padding-bottom: 17rem;
  }
}
</style>