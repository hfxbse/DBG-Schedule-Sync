<template>
  <h1>{{ title }}</h1>
</template>

<script>
export default {
  name: "SettingTitle",
  props: {
    title: {
      type: String,
      required: true
    }
  }
};
</script>

<style scoped>
h1 {
  margin-bottom: 1rem;
  margin-top: 3rem;
  text-align: center;
}
</style>