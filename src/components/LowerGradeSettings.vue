<template>
  <div>
    <setting-title title="Wähle dein Klasse"/>
    <button-container class="class_groups">
      <options-button
          v-for="c in ['a', 'b', 'c', 'd', 'e', 'f']"
          :key="c"
          :checked="value.class === c"
          :option="c"
          :value="value.class"
          group="class"
          @input="updateConfig('class', $event)"
      >
        {{ c }}
      </options-button>
    </button-container>

    <div v-if="value.class !== '' && value.grade > 7">
      <setting-title title="Wähle dein Profilfach"/>
      <button-container class="profile">
        <options-button
            v-for="p in profiles"
            :key="p.value"
            :checked="value.profile === p.value"
            :option="p.value"
            :value="value.profile"
            group="profile"
            @input="updateConfig('profile', $event)"
        >
          {{ p.display }}
        </options-button>
      </button-container>
    </div>

    <div v-if="value.class !== '' && (value.grade < 8 || value.profile !== '')">
      <setting-title title="Wähle dein Religionsunterricht"/>
      <button-container class="religion">
        <options-button
            v-for="r in religionLessonTypes"
            :key="r.value"
            :checked="value.religion === r.value"
            :option="r.value"
            :value="value.religion"
            group="religion"
            @input="updateConfig('religion', $event)"
        >
          {{ r.display }}
        </options-button>
      </button-container>
    </div>

    <div
        v-if="value.religion !== '' && (value.grade < 8 && value.class || value.profile !== '' && value.profile !== 'Sport')">
      <setting-title title="Wähle deine Sportgruppe"/>
      <button-container class="sport">
        <options-button
            v-for="group in sportGroups"
            :key="group.value"
            :checked="value.sport === group.value"
            :option="group.value"
            :value="value.sport"
            group="sport"
            @input="updateConfig('sport', $event)"
        >
          {{ group.display }}
        </options-button>
      </button-container>
    </div>
  </div>

</template>

<script>
import OptionsButton from '@/components/OptionsButton'
import ButtonContainer from '@/components/ButtonContainer'
import SettingTitle from '@/components/SettingTitle'
import {religionLessonTypes} from '@/components/Setup'

const profiles = [
  {display: 'NWT', value: 'science'},
  {display: 'Sport', value: 'sport'},
  {display: 'Latein', value: 'latin'}
]

const sportGroups = [
  {display: 'Jungs', value: 'boys'},
  {display: 'Mädchens', value: 'girls'}
]

export default {
  name: "LowerGradeSettings",
  components: {SettingTitle, ButtonContainer, OptionsButton},
  props: {
    value: {
      type: Object,
      required: true
    }
  },
  computed: {
    profiles: () => profiles,
    sportGroups: () => sportGroups,
    religionLessonTypes: () => religionLessonTypes
  },
  methods: {
    updateConfig(key, value) {
      let copy = {...this.value}
      copy[key] = value

      this.$emit('input', copy)
    }
  }
}
</script>

<style scoped>
h1 {
  margin-bottom: 1rem;
  margin-top: 3rem;
  text-align: center;
}

.class_groups {
  width: calc(5rem * 6 + 4rem);
}

.religion {
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  width: calc(11rem * 3 + 2rem);
}

.profile {
  grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr));
  width: calc(7.5rem * 3 + 2rem);
}

.sport {
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
  width: calc(10rem * 2 + 1rem);
}
</style>