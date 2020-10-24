<template>
  <div class="option_button">
    <!--suppress HtmlFormInputWithoutLabel -->
    <input
        :id="_uid"
        :checked="checked"
        :name="group"
        :type="multiselect ? 'checkbox' : 'radio'"
        :value="option"
        @change="input"
        :disabled="disable"
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
    },
    disable: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  methods: {
    input($event) {
      let value = null;

      if($event.target.checked) {
        value = $event.target.value
      }

      this.$emit('input', value)
    }
  }
}
</script>

<style scoped>
.option_button {
  position: relative;
}

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

input:disabled + label {
  opacity: 0.25;
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