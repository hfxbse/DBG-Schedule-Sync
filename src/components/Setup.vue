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
            v-model="configState.grade"
            :checked="configState.grade === n + 11"
            :option="n + 11"
            group="grade"
        >
          {{ `K${n}` }}
        </options-button>
      </button-container>

      <lower-grade-settings v-if="configState.grade !== 0 && configState.grade < 12" v-model="configState"/>

      <div v-else-if="configState.grade > 11">
        <!-- TODO show course selection -->
      </div>

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

export default {
  name: "Setup",
  components: {SettingTitle, LowerGradeSettings, ButtonContainer, OptionsButton, centerContainer: Center},
  async created() {
    let user = await getCurrentUser()
    this.$bind('config', firebase.firestore().collection('query_configs').doc(user.uid))
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
    },
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

      if (grade) {
        let valid = config.class !== '' && config.religion !== ''

        if (grade < 8) {
          return valid && config.sport !== ''
        } else if (grade < 12) {
          valid = valid && config.profile !== ''
          return valid && (config.profile !== 'Sport' && config.sport !== '' || config.profile === 'Sport')
        }
      }

      return false;
    },
    modified() {
      let keys = Object.keys(this.configState)

      return !this.config || keys.some(key => this.config[key] !== this.configState[key])
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