<template>
  <div>
    <setting-title title="Wähle deine Kurse"/>
    <course-options
        v-for="(name, id)  in visibleRequiredCourses"
        :key="id"
        :main-course-count="mainCourseCount"
        :required="true"
        :title="name"
        :value="value[id]"
        class="course"
        @input="update(id, $event)"
    />

    <course-options
        v-if="lastRequiredSelected"
        :main-course-count="mainCourseCount"
        :required="true"
        :showOptions="religionSelected"
        :value="value.religion"
        class="course"
        title="Religionsunterricht"
        @input="update('religion', $event)"
    >
      <button-container :class="{religion: true, border: religionSelected}">
        <options-button
            v-for="r in ['Evangelisch', 'Katholisch', 'Ethik']" :key="r"
            :checked="religion === r"
            :option="r"
            group="region"
            @input="$emit('updateReligion', $event)"
        >
          {{ r }}
        </options-button>
      </button-container>
    </course-options>

    <div v-if="value && value.religion && value.religion.course_number">
      <course-options
          v-for="(name, id) in basicOrAdvancedCourses"
          :key="id"
          :main-course-count="mainCourseCount"
          :required="false"
          :title="name"
          :value="value[id]"
          class="course"
          @input="update(id, $event)"
      />

      <course-options
          :main-course-count="mainCourseCount"
          :required="false"
          :single-course-type="true"
          :value="value.economy"
          class="course" title="Wirtschaft"
          @input="update('economy', {...$event, main: $event.course_number !== null ? true : null})"
      />
      <course-options
          v-for="(name, id) in optionalBasicSubjects"
          :key="id"
          :required="false"
          :single-course-type="true"
          :title="name"
          :value="value[id]"
          class="course"
          @input="update(id, {...$event, main: $event.course_number !== null ? false : null})"
      />
    </div>

  </div>
</template>

<script>
import SettingTitle from '@/components/SettingTitle';
import CourseOptions from '@/components/CourseOptions';
import ButtonContainer from '@/components/ButtonContainer';
import OptionsButton from '@/components/OptionsButton';

export default {
  name: "CourseSelection",
  components: {OptionsButton, ButtonContainer, CourseOptions, SettingTitle},
  props: {
    value: {
      type: Object,
      required: true
    },
    religion: {
      type: String,
      required: true
    },
    mainCourseCount: {
      required: true,
      type: Number
    }
  },
  computed: {
    religionSelected() {
      return this.religion !== undefined && this.religion !== '';
    },
    visibleRequiredCourses() {
      let visible = {}
      let subjects = Object.keys(this.requiredCourses)

      subjects.forEach((subject, index) => {
        if (index !== 0) {
          let previousCourse = this.value[subjects[index - 1]];
          if(previousCourse && previousCourse.course_number) {
            this.$set(visible, subject, this.requiredCourses[subject])
          }
        } else {
          this.$set(visible, subject, this.requiredCourses[subject])
        }
      })

      return visible
    },
    lastRequiredSelected() {
      let subjectIDs = Object.keys(this.requiredCourses)
      let lastRequired = this.value[subjectIDs[subjectIDs.length - 1]]

      return this.value && lastRequired && lastRequired.course_number
    },
  },
  methods: {
    update(key, value) {
      let newValues = {...this.value}
      this.$set(newValues, key, value)

      this.$emit('input', newValues)
    }
  },
  data() {
    return {
      requiredCourses: {
        math: 'Mathematik',
        german: 'Deutsch',
        history: 'Geschichte',
        geography: 'Geographie',
        politics: 'Gemeinschaftskunde',
        sport: 'Sport'
      },
      basicOrAdvancedCourses: {
        english: 'Englisch',
        french: 'Französisch',
        latin: 'Latein',
        art: 'Bildende Kunst',
        music: 'Musik',
        biology: 'Biologie',
        chemistry: 'Chemie',
        physics: 'Physik'
      },
      optionalBasicSubjects: {
        seminar: 'Seminarkurs',
        theater: 'Literatur und Theater',
        vk_math: 'VK Mathematik',
        vk_language: 'VK Sprache',
        computer_science: 'Informatik',
        literature: 'Literatur',
        philosophy: 'Philosophie',
        psychology: 'Psychologie',
        astronomy: 'Astronomie'
      }
    }
  }
}
</script>

<style scoped>
.course + .course {
  margin-top: 4rem;
}

/*noinspection CssUnusedSymbol*/
.religion {
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  width: calc(11rem * 3 + 2rem);
}

/*noinspection CssUnusedSymbol*/
.border {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
}
</style>