<template>
  <div class="center" @click="$emit('click', $event)">
    <div :class="{'center-slot-wrapper': true, without: lift}" @click="$emit('click', $event)">
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
  height: 100%;
  min-width: 100%;

  display: grid;
  place-items: center;

  overflow: auto;
}

.center > * {
  padding: 5rem 1.5rem 3rem;
}

@media (min-width: 70ch) {
  .center > * {
    padding-bottom: 8rem;
  }

  .without {
    padding-bottom: 17rem;
  }
}
</style>

<style>
.center-slot-wrapper > * {
  margin: auto;
  width: fit-content;
}
</style>
