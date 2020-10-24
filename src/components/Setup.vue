<template>
  <div>
    <center-container>

      <setting-title title="Wähle deine Stufe"/>
      <button-container class="grades">
        <options-button
            v-for="n in 7"
            :key="`grade_${n + 4}`"
            v-model="gradeProxy"
            :checked="configState.grade === n + 4"
            :option="n + 4"
            group="grade"
        >
          {{ n + 4 }}
        </options-button>
        <options-button
            v-for="n in 2"
            :key="`grade_K${n}`"
            v-model="gradeProxy"
            :checked="configState.grade === n + 11"
            :option="n + 11"
            group="grade"
        >
          {{ `K${n}` }}
        </options-button>
      </button-container>

      <lower-grade-settings v-if="configState.grade !== 0 && configState.grade < 12" v-model="configState"/>

      <course-selection
          v-else-if="configState.grade > 11"
          v-model="courses"
          :main-course-count="mainCourseCount"
          :religion="configState.religion"
          @updateReligion="$set(configState, 'religion', $event)"
      />

    </center-container>
    <button v-if="validInput && modified" class="apply_button" @click="save">Speichern</button>
  </div>
</template>

<script>
import * as firebase from 'firebase/app'
import 'firebase/firestore'

import Center from "@/components/Center";
import OptionsButton from "@/components/OptionsButton";
import {getCurrentUser} from "@/router";
import ButtonContainer from "@/components/ButtonContainer";
import LowerGradeSettings from "@/components/LowerGradeSettings";
import SettingTitle from "@/components/SettingTitle";
import CourseSelection from "./CourseSelection";

export default {
  name: "Setup",
  components: {
    CourseSelection,
    SettingTitle,
    LowerGradeSettings,
    ButtonContainer,
    OptionsButton,
    centerContainer: Center
  },
  async created() {
    let user = await getCurrentUser()
    this.$bind('config', firebase.firestore().collection('query_configs').doc(user.uid))

    this.$bind(
        'rawCourses',
        firebase.firestore().collection('query_configs').doc(user.uid).collection('courses')
    )
  },
  methods: {
    getUID(id) {
      return `${id}_${this._uid}`
    },
    async getConfig() {
      let db = firebase.firestore()
      return db.collection('query_configs').doc((await getCurrentUser()).uid)
    },
    async save() {
      let doc = await this.getConfig()
      let config = this.configState;

      doc.set({
        grade: Number(config.grade),
        class: config.class,
        profile: config.profile,
        sport: config.sport,
        religion: config.religion
      })

      if (config.grade > 11) {
        let db = firebase.firestore()
        let batch = db.batch();

        let courses = Object.keys(this.courses)

        courses.forEach((course) => {
          batch.set(doc.collection('courses').doc(course), this.courses[course])
        })

        batch.commit().then(() => this.coursesState = undefined)
      }
    },
    compareCourseOptions(current, old) {
      current = {...current}
      old = {...old}

      current = this.nullToUndefined(current)

      return current.main !== old.main || (current.main !== null && current.course_number !== old.course_number)
    },
    nullToUndefined(object) {
      Object.keys(object).forEach(key => {
        if (object[key] === null) {
          object[key] = undefined;
        }
      })

      return object
    },
    actualCourse(course) {
      return course.main !== undefined && course.main !== null && course.course_number;
    },
    rawCoursesToMap(raw) {
      let courses = {}
      raw.forEach(course => this.$set(courses, course.id, course))

      return courses;
    }
  },
  computed: {
    gradeProxy: {
      get() {
        return this.configState.grade
      },
      set(value) {
        this.$set(this.configState, 'grade', Number(value))
      }
    },
    validInput() {
      let config = this.configState;
      let grade = config.grade;

      if (grade !== 0 && grade < 12) {
        let valid = config.class !== '' && config.religion !== ''

        if (grade < 8) {
          return valid && config.sport !== ''
        } else if (grade < 12) {
          valid = valid && config.profile !== ''
          return valid && (config.profile !== 'Sport' && config.sport !== '' || config.profile === 'Sport')
        }
      } else if (grade > 11) {
        let hasRequired = this.courses.religion && this.courses.religion.course_number && this.mainCourseCount === 3

        let courseNumbersSelected = !Object.keys(this.courses).some(course => {
          course = this.courses[course]
          let number = course.course_number
          return (number === undefined || number === null) && typeof course.main === 'boolean'
        })

        return hasRequired && courseNumbersSelected
      }

      return false;
    },
    modified() {
      let keys = Object.keys(this.configState)
      let lowerGradeChanged = !this.config || keys.some(key => this.config[key] !== this.configState[key])

      let newCourses = Object.keys(this.courses);

      newCourses = newCourses.filter(course => this.actualCourse(this.courses[course]))
      let actualOldCourses = this.actualOldCourses;

      let upperGradeChanged = newCourses.length !== actualOldCourses.length || actualOldCourses.some(old => {
        let current = this.courses[old.id];
        return !current || this.compareCourseOptions(current, old)
      });

      return lowerGradeChanged || upperGradeChanged;
    },
    courses: {
      get() {
        return !this.coursesState ? this.rawCoursesToMap(this.rawCourses) : this.coursesState;
      },
      set(value) {
        this.coursesState = value;
      }
    },
    actualOldCourses() {
      return this.rawCourses.filter(this.actualCourse);
    },
    mainCourseCount() {
      let count = 0;
      let subjects = Object.keys(this.courses)

      subjects.forEach(subject => count += Boolean(this.courses[subject].main))

      return count;
    },
    oldCourses() {
      return this.rawCoursesToMap(this.rawCourses)
    }
  },
  watch: {
    config(current, old) {
      if (!current) {
        return
      }

      current.grade = Number(current.grade)

      if ((!old || !old.grade) && current) {
        this.configState = {...current};
      } else {
        let keys = Object.keys(this.configState)

        keys.forEach((key) => {
          if (this.configState[key] === old[key]) {
            this.$set(this.configState, key, key !== 'grade' ? current[key] : Number(current[key]));
          }
        })
      }
    },
    oldCourses(current, old) {
      if (this.coursesState && !this.modified) {
        this.coursesState = undefined;
      } else if (this.coursesState && old && current) {
        Object.keys(current).forEach(c => {
          c = current[c]

          let id = c.id;

          let o = {...old[id]}
          let state = {...this.coursesState[id]}

          o = this.nullToUndefined(o)
          state = this.nullToUndefined(state)


          if(this.coursesState[id] !== undefined) {
            if(state.main === o.main) {
              this.$set(this.coursesState[id], 'main', c.main)
            }

            if(state.course_number === o.course_number) {
              this.$set(this.coursesState[id], 'course_number', Number(c.course_number))
            }
          } else {
            this.$set(this.coursesState, id, c)
          }
        })
      }
    }
  },
  data() {
    return {
      configState: {
        grade: 0,
        class: '',
        profile: '',
        sport: '',
        religion: '',
      },
      config: {},
      coursesState: undefined,
      rawCourses: [],
    }
  }
}
</script>

<style scoped>
.apply_button {
  position: fixed;
  bottom: 0;
  right: 0;
  left: 0;

  display: block;
  width: 100vw;
  height: 4rem;

  outline: none;

  background: #83b81e;
  border: none;

  font-size: 1.2rem;
  color: white;
  font-weight: bold;
}

.grades {
  width: calc(5rem * 9 + 7rem);
}
</style>