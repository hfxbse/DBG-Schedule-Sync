<template>
  <button class="button" @click="$emit('click')" @contextmenu.prevent>
    <img :alt="image.alt" :src="image.src" @contextmenu.prevent>
    <span :style="textStyle" @contextmenu.prevent>{{ lable }}</span>
  </button>
</template>

<script>
export default {
  name: "SettingsButton",
  props: {
    lable: {
      type: String,
      required: true,
      validator: (value) => (value ?? '').length > 0,
    },
    image: {
      type: Object,
      required: true,
      validator: (value) => (value?.alt ?? '').length > 0
    },
    textStyle: {
      type: Object,
      required: false,
      default: () => ({})
    }
  }
};
</script>

<style scoped>
.button {
  padding: 0.75rem;
  outline: none;

  min-width: 17.5rem;
  width: 35vw;
  max-width: 100%;

  display: flex;
  flex-direction: row;
  align-items: center;

  box-shadow: var(--element-shadow);
  border: none;
  border-radius: 1.75rem;

  background: white;
}

img {
  height: 1.5rem;
  width: 1.5rem;
  margin-right: 0.5rem;
}

span {
  margin: auto;
  padding-right: 2rem;
  font-weight: 500;
  font-size: 1rem;
  user-select: none;
}
</style>