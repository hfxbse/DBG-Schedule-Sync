<template>
  <div :style="position" class="error">
    <p>{{ message }}</p>
  </div>
</template>

<script>
export default {
  name: "ErrorMessage",
  props: {
    message: {
      type: String,
      required: true,
    },
    value: {
      type: Boolean,
      required: true,
    }
  },
  computed: {
    position() {
      return {
        transform: `translateY(${!this.value * 100}%)`
      };
    }
  },
  watch: {
    value(value) {
      if (value) {
        setTimeout(() => this.$emit('input', false), 5 * 1000);
      }
    }
  },
};
</script>

<style scoped>
.error {
  position: fixed;
  bottom: 0;
  right: 0;

  background-color: #ad0000;
  color: white;

  font-weight: 600;
  text-align: center;

  width: 100vw;

  transition-property: transform;
  transition-duration: 750ms;
}

.error p {
  padding: 1rem 0.75rem;
}
</style>