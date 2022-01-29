<template>
  <div>
    <h2 :class="{disabled: mainCourseDisabled && singleCourseType}">{{ title }}</h2>
    <slot></slot>
    <div v-if="showOptions">
      <button-container v-if="!singleCourseType" class="course_type">
        <options-button
            v-for="type in ['Basiskurs', 'Leistungskurs']"
            :key="type"
            :checked="type === selectedType"
            :group="`type_${_uid}`"
            :multiselect="required === false"
            :option="type === 'Leistungskurs'"
            :disable="type === 'Leistungskurs' && mainCourseDisabled"
            @input="update('main', $event !== null ? $event === 'true' : null)"
        >
          {{ type }}
        </options-button>
      </button-container>
      <button-container
          v-if="singleCourseType || value && value.main !== null && value.main !== ''"
          class="course_numbers"
      >
        <options-button
            v-for="n in 6"
            :key="n"
            :checked="n === selectedCourseNumber"
            :group="`course_number_${_uid}`"
            :multiselect="singleCourseType"
            :option="n"
            @input="update('course_number', $event)"
            :disable="singleCourseType && mainCourseDisabled"
        >
          {{ n }}
        </options-button>
      </button-container>
    </div>
  </div>
</template>
<script>
import ButtonContainer from '@/components/ButtonContainer';
import OptionsButton from '@/components/OptionsButton';

export default {
  name: 'course-options',
  components: {ButtonContainer, OptionsButton},
  props: {
    required: {
      type: Boolean,
      required: true,
    },
    singleCourseType: {
      type: Boolean,
      required: false,
      default: false
    },
    title: {
      required: true,
      type: String
    },
    value: {
      type: Object,
    },
    showOptions: {
      type: Boolean,
      required: false,
      default: true
    },
    mainCourseCount: {
      type: Number,
      required: false,
      default: undefined
    }
  },
  computed: {
    selectedType() {
      if (this.value && this.value.main !== null) {
        return this.value.main ? 'Leistungskurs' : 'Basiskurs';
      }

      return 'None';
    },
    selectedCourseNumber() {
      return this.value ? Number(this.value.course_number) : 0;
    },
    mainCourseDisabled() {
      return this.mainCourseCount >= 3 && (!this.value || this.value.main !== true);
    }
  },
  methods: {
    update(key, value) {
      let options = {...this.value};
      this.$set(options, key, value);

      this.$emit('input', options);
    }
  }
};
</script>
<style scoped>
h2 {
  margin: 2rem auto 1rem;
  font-weight: 400;
  font-size: 1.75rem;
  text-align: center;

  max-width: 58rem;
}

.course_type {
  grid-template-columns: repeat(auto-fill, minmax(12.5rem, 1fr));
  width: calc(12.5rem * 2 + 1rem);
}

.course_numbers {
  width: calc(5rem * 6 + 4rem);
}

.course_numbers:not(:first-of-type) {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.2);
}

/*noinspection CssUnusedSymbol*/
.disabled {
  opacity: 0.25;
}
</style>