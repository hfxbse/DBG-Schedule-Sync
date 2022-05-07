<template>
  <label>
    <span>{{ label }}</span>
    <input :checked="value" type="checkbox" @input="$emit('input', $event.target.checked)">
  </label>
</template>

<script>
export default {
  name: "SettingsToggle",
  props: {
    label: {
      required: true,
      type: String,
    },
    value: {
      required: false,
      type: Boolean,
      default: true,
    }
  },
};
</script>

<style scoped>
label {
  display: flex;
  flex-direction: row;

  align-items: center;

  width: 100%;
  min-height: 1.2rem;

  position: relative;
}

span {
  display: block;
  font-size: 0.9rem;
  max-width: 60%;
}

input {
  margin-left: auto;
  pointer-events: none;
  outline: none;

  width: 0;
  height: 0;
}

input:before {
  display: block;
  content: "";

  height: 0.6rem;
  width: 1.8rem;
  border-radius: 0.325rem;

  background: #b9b9b9;

  position: absolute;
  right: 0;

  top: 50%;
  transform: translateY(-50%);
}

input:after {
  display: block;
  content: "";

  height: 1rem;
  width: 1rem;
  border-radius: 1rem;

  background: #626262;

  position: absolute;
  right: 0.8rem;

  transform: translateY(-50%);
  transition: 0.2s;
}

input:checked:after {
  background: hsl(81, 72%, 35%);
  box-shadow: hsla(68, 81%, 39%, 0.9) 0 1px 5px 0;

  transform: translate(0.8rem, -50%);
}
</style>