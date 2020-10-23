<template>
  <div>
    <!--suppress HtmlFormInputWithoutLabel -->
    <input
        :id="_uid"
        :checked="checked"
        :name="group"
        :type="multiselect ? 'checkbox' : 'radio'"
        :value="option"
        @input="$emit('input', $event.target.value)"
    >
    <label :for="_uid">
      <span>
        <slot></slot>
      </span>
    </label>
  </div>
</template>

<script>
export default {
  name: "OptionsButton",
  props: {
    option: {
      required: false,
    },
    group: {
      type: String,
      required: false,
    },
    multiselect: {
      type: Boolean,
      required: false,
      default: false
    },
    checked: {
      type: Boolean,
      required: false,
      default: false
    }
  },
}
</script>

<style scoped>
label {
  font-size: 1.5rem;
  font-weight: 300;

  background: white;
  height: 3rem;

  border: none;
  border-radius: 5rem;
  box-shadow: var(--element-shadow);

  outline: none;
  display: flex;
  align-items: center;
}

input:checked + label {
  background: var(--ink-blue);
  box-shadow: none;
  font-weight: bold;
  color: white;
}

input {
  width: 0;
  height: 0;
  opacity: 0;

  position: absolute;
  top: 0;
  left: 0;
}

label > span {
  margin: auto;
}
</style>