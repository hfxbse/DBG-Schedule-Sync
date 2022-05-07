<template>
  <div>
    <settings-button
        :image="{
          src: require('@/assets/logout.svg'),
          alt: 'Logout icon'
        }"
        lable="Ausloggen"
        @click="logout"
    />
    <div class="options">
      <h1>Anzeigeoptionen</h1>
      <settings-toggle
          :value="weekType"
          class="toggle"
          label="A/B-Woche anzeigen"
          @input="save('content', {...contentOptions, week_type: $event})"
      />
      <settings-toggle
          :value="additionalInfo"
          class="toggle"
          label="Informationen zum Tag anzeigen"
          @input="save('content', {...contentOptions, additional_info: $event})"
      />
    </div>
    <settings-button
        :image="{
        src: require('@/assets/delete_forever.svg'),
        alt: 'Delete forever icon'
      }"
        :text-style="{color: 'white', 'font-weight': 'bold'}"
        class="delete"
        lable="Account löschen"
        @mousedown.native="deletionStart = new Date()"
        @touchstart.native="deletionStart = new Date()"
        @contextmenu.prevent
        @mouseup.native="deleteAccount"
        @touchend.native="deleteAccount"
    />
    <error-message
        v-model="deletionError"
        message="Account konnte nicht gelöscht werden, versuche es später noch einmal"
    />
  </div>
</template>

<script>
import SettingsButton from "@/components/SettingsButton";
import {getAuth, signOut, deleteUser} from "firebase/auth";
import {getAnalytics, logEvent} from "firebase/analytics";
import {app} from "@/main";
import ErrorMessage from "@/components/ErrorMessage";
import SettingsToggle from "@/components/SettingsToggle";
import {firestore, firestoreBindings} from "@/vuefire";

export default {
  name: "Settings",
  components: {
    SettingsToggle,
    ErrorMessage,
    SettingsButton
  },
  mixins: [firestoreBindings],
  async created() {
    let {db} = await firestore();

    this.setupBind(
        'contentOptions',
        db.collection('query_configs')
            .doc(this.user.uid)
            .collection('options')
            .doc('content'),
        () => {
          this.configState = {};
          return {};
        }
    );
  },
  methods: {
    async logout() {
      await signOut(getAuth(app));
      this.$emit('close');
    },
    async deleteAccount() {
      if (new Date() - this.deletionStart >= 15 * 1000) {
        try {
          await deleteUser(getAuth(app).currentUser);
          this.$emit('close');
        } catch (e) {
          this.deletionError = true;

          logEvent(
              getAnalytics(app),
              'exception',
              {description: 'Could not delete user', fatal: false, ...e}
          );
        }
      }
    },
    async save(category, values) {
      let {db, serverTimestamp} = await firestore();
      const config = db.collection('query_configs').doc(this.user.uid);

      if ((await config.get()).exists) {
        config.update({last_update: serverTimestamp()});
      } else {
        config.set({last_update: serverTimestamp()});
      }

      config.collection('options').doc(category).set(values);
    },
  },
  computed: {
    weekType() {
      return this.contentOptions?.week_type ?? true;
    },
    additionalInfo() {
      return this.contentOptions?.additional_info ?? true;
    },
  },
  data() {
    return {
      deletionStart: new Date(),
      deletionError: false,
      contentOptions: {}
    };
  }
};
</script>

<style scoped>

button:first-of-type {
  margin: 0 0 1.5rem;
}

@keyframes long-press {
  /* interpolation between linear gradient are not supported at this time */
  0% {
    background: linear-gradient(90deg, #690000 0%, red 0%);
  }
  1% {
    background: linear-gradient(90deg, #690000 1%, red 1%);
  }
  1.5% {
    background: linear-gradient(90deg, #690000 1.5%, red 1.5%);
  }
  2% {
    background: linear-gradient(90deg, #690000 2%, red 2%);
  }
  2.5% {
    background: linear-gradient(90deg, #690000 2.5%, red 2.5%);
  }
  3% {
    background: linear-gradient(90deg, #690000 3%, red 3%);
  }
  3.5% {
    background: linear-gradient(90deg, #690000 3.5%, red 3.5%);
  }
  4% {
    background: linear-gradient(90deg, #690000 4%, red 4%);
  }
  4.5% {
    background: linear-gradient(90deg, #690000 4.5%, red 4.5%);
  }
  5% {
    background: linear-gradient(90deg, #690000 5%, red 5%);
  }
  5.5% {
    background: linear-gradient(90deg, #690000 5.5%, red 5.5%);
  }
  6% {
    background: linear-gradient(90deg, #690000 6%, red 6%);
  }
  6.5% {
    background: linear-gradient(90deg, #690000 6.5%, red 6.5%);
  }
  7% {
    background: linear-gradient(90deg, #690000 7%, red 7%);
  }
  7.5% {
    background: linear-gradient(90deg, #690000 7.5%, red 7.5%);
  }
  8% {
    background: linear-gradient(90deg, #690000 8%, red 8%);
  }
  8.5% {
    background: linear-gradient(90deg, #690000 8.5%, red 8.5%);
  }
  9% {
    background: linear-gradient(90deg, #690000 9%, red 9%);
  }
  9.5% {
    background: linear-gradient(90deg, #690000 9.5%, red 9.5%);
  }
  10% {
    background: linear-gradient(90deg, #690000 10%, red 10%);
  }
  10.5% {
    background: linear-gradient(90deg, #690000 10.5%, red 10.5%);
  }
  11% {
    background: linear-gradient(90deg, #690000 11%, red 11%);
  }
  11.5% {
    background: linear-gradient(90deg, #690000 11.5%, red 11.5%);
  }
  12% {
    background: linear-gradient(90deg, #690000 12%, red 12%);
  }
  12.5% {
    background: linear-gradient(90deg, #690000 12.5%, red 12.5%);
  }
  13% {
    background: linear-gradient(90deg, #690000 13%, red 13%);
  }
  13.5% {
    background: linear-gradient(90deg, #690000 13.5%, red 13.5%);
  }
  14% {
    background: linear-gradient(90deg, #690000 14%, red 14%);
  }
  14.5% {
    background: linear-gradient(90deg, #690000 14.5%, red 14.5%);
  }
  15% {
    background: linear-gradient(90deg, #690000 15%, red 15%);
  }
  15.5% {
    background: linear-gradient(90deg, #690000 15.5%, red 15.5%);
  }
  16% {
    background: linear-gradient(90deg, #690000 16%, red 16%);
  }
  16.5% {
    background: linear-gradient(90deg, #690000 16.5%, red 16.5%);
  }
  17% {
    background: linear-gradient(90deg, #690000 17%, red 17%);
  }
  17.5% {
    background: linear-gradient(90deg, #690000 17.5%, red 17.5%);
  }
  18% {
    background: linear-gradient(90deg, #690000 18%, red 18%);
  }
  18.5% {
    background: linear-gradient(90deg, #690000 18.5%, red 18.5%);
  }
  19% {
    background: linear-gradient(90deg, #690000 19%, red 19%);
  }
  19.5% {
    background: linear-gradient(90deg, #690000 19.5%, red 19.5%);
  }
  20% {
    background: linear-gradient(90deg, #690000 20%, red 20%);
  }
  20.5% {
    background: linear-gradient(90deg, #690000 20.5%, red 20.5%);
  }
  21% {
    background: linear-gradient(90deg, #690000 21%, red 21%);
  }
  21.5% {
    background: linear-gradient(90deg, #690000 21.5%, red 21.5%);
  }
  22% {
    background: linear-gradient(90deg, #690000 22%, red 22%);
  }
  22.5% {
    background: linear-gradient(90deg, #690000 22.5%, red 22.5%);
  }
  23% {
    background: linear-gradient(90deg, #690000 23%, red 23%);
  }
  23.5% {
    background: linear-gradient(90deg, #690000 23.5%, red 23.5%);
  }
  24% {
    background: linear-gradient(90deg, #690000 24%, red 24%);
  }
  24.5% {
    background: linear-gradient(90deg, #690000 24.5%, red 24.5%);
  }
  25% {
    background: linear-gradient(90deg, #690000 25%, red 25%);
  }
  25.5% {
    background: linear-gradient(90deg, #690000 25.5%, red 25.5%);
  }
  26% {
    background: linear-gradient(90deg, #690000 26%, red 26%);
  }
  26.5% {
    background: linear-gradient(90deg, #690000 26.5%, red 26.5%);
  }
  27% {
    background: linear-gradient(90deg, #690000 27%, red 27%);
  }
  27.5% {
    background: linear-gradient(90deg, #690000 27.5%, red 27.5%);
  }
  28% {
    background: linear-gradient(90deg, #690000 28%, red 28%);
  }
  28.5% {
    background: linear-gradient(90deg, #690000 28.5%, red 28.5%);
  }
  29% {
    background: linear-gradient(90deg, #690000 29%, red 29%);
  }
  29.5% {
    background: linear-gradient(90deg, #690000 29.5%, red 29.5%);
  }
  30% {
    background: linear-gradient(90deg, #690000 30%, red 30%);
  }
  30.5% {
    background: linear-gradient(90deg, #690000 30.5%, red 30.5%);
  }
  31% {
    background: linear-gradient(90deg, #690000 31%, red 31%);
  }
  31.5% {
    background: linear-gradient(90deg, #690000 31.5%, red 31.5%);
  }
  32% {
    background: linear-gradient(90deg, #690000 32%, red 32%);
  }
  32.5% {
    background: linear-gradient(90deg, #690000 32.5%, red 32.5%);
  }
  33% {
    background: linear-gradient(90deg, #690000 33%, red 33%);
  }
  33.5% {
    background: linear-gradient(90deg, #690000 33.5%, red 33.5%);
  }
  34% {
    background: linear-gradient(90deg, #690000 34%, red 34%);
  }
  34.5% {
    background: linear-gradient(90deg, #690000 34.5%, red 34.5%);
  }
  35% {
    background: linear-gradient(90deg, #690000 35%, red 35%);
  }
  35.5% {
    background: linear-gradient(90deg, #690000 35.5%, red 35.5%);
  }
  36% {
    background: linear-gradient(90deg, #690000 36%, red 36%);
  }
  36.5% {
    background: linear-gradient(90deg, #690000 36.5%, red 36.5%);
  }
  37% {
    background: linear-gradient(90deg, #690000 37%, red 37%);
  }
  37.5% {
    background: linear-gradient(90deg, #690000 37.5%, red 37.5%);
  }
  38% {
    background: linear-gradient(90deg, #690000 38%, red 38%);
  }
  38.5% {
    background: linear-gradient(90deg, #690000 38.5%, red 38.5%);
  }
  39% {
    background: linear-gradient(90deg, #690000 39%, red 39%);
  }
  39.5% {
    background: linear-gradient(90deg, #690000 39.5%, red 39.5%);
  }
  40% {
    background: linear-gradient(90deg, #690000 40%, red 40%);
  }
  40.5% {
    background: linear-gradient(90deg, #690000 40.5%, red 40.5%);
  }
  41% {
    background: linear-gradient(90deg, #690000 41%, red 41%);
  }
  41.5% {
    background: linear-gradient(90deg, #690000 41.5%, red 41.5%);
  }
  42% {
    background: linear-gradient(90deg, #690000 42%, red 42%);
  }
  42.5% {
    background: linear-gradient(90deg, #690000 42.5%, red 42.5%);
  }
  43% {
    background: linear-gradient(90deg, #690000 43%, red 43%);
  }
  43.5% {
    background: linear-gradient(90deg, #690000 43.5%, red 43.5%);
  }
  44% {
    background: linear-gradient(90deg, #690000 44%, red 44%);
  }
  44.5% {
    background: linear-gradient(90deg, #690000 44.5%, red 44.5%);
  }
  45% {
    background: linear-gradient(90deg, #690000 45%, red 45%);
  }
  45.5% {
    background: linear-gradient(90deg, #690000 45.5%, red 45.5%);
  }
  46% {
    background: linear-gradient(90deg, #690000 46%, red 46%);
  }
  46.5% {
    background: linear-gradient(90deg, #690000 46.5%, red 46.5%);
  }
  47% {
    background: linear-gradient(90deg, #690000 47%, red 47%);
  }
  47.5% {
    background: linear-gradient(90deg, #690000 47.5%, red 47.5%);
  }
  48% {
    background: linear-gradient(90deg, #690000 48%, red 48%);
  }
  48.5% {
    background: linear-gradient(90deg, #690000 48.5%, red 48.5%);
  }
  49% {
    background: linear-gradient(90deg, #690000 49%, red 49%);
  }
  49.5% {
    background: linear-gradient(90deg, #690000 49.5%, red 49.5%);
  }
  50% {
    background: linear-gradient(90deg, #690000 50%, red 50%);
  }
  50.5% {
    background: linear-gradient(90deg, #690000 50.5%, red 50.5%);
  }
  51% {
    background: linear-gradient(90deg, #690000 51%, red 51%);
  }
  51.5% {
    background: linear-gradient(90deg, #690000 51.5%, red 51.5%);
  }
  52% {
    background: linear-gradient(90deg, #690000 52%, red 52%);
  }
  52.5% {
    background: linear-gradient(90deg, #690000 52.5%, red 52.5%);
  }
  53% {
    background: linear-gradient(90deg, #690000 53%, red 53%);
  }
  53.5% {
    background: linear-gradient(90deg, #690000 53.5%, red 53.5%);
  }
  54% {
    background: linear-gradient(90deg, #690000 54%, red 54%);
  }
  54.5% {
    background: linear-gradient(90deg, #690000 54.5%, red 54.5%);
  }
  55% {
    background: linear-gradient(90deg, #690000 55%, red 55%);
  }
  55.5% {
    background: linear-gradient(90deg, #690000 55.5%, red 55.5%);
  }
  56% {
    background: linear-gradient(90deg, #690000 56%, red 56%);
  }
  56.5% {
    background: linear-gradient(90deg, #690000 56.5%, red 56.5%);
  }
  57% {
    background: linear-gradient(90deg, #690000 57%, red 57%);
  }
  57.5% {
    background: linear-gradient(90deg, #690000 57.5%, red 57.5%);
  }
  58% {
    background: linear-gradient(90deg, #690000 58%, red 58%);
  }
  58.5% {
    background: linear-gradient(90deg, #690000 58.5%, red 58.5%);
  }
  59% {
    background: linear-gradient(90deg, #690000 59%, red 59%);
  }
  59.5% {
    background: linear-gradient(90deg, #690000 59.5%, red 59.5%);
  }
  60% {
    background: linear-gradient(90deg, #690000 60%, red 60%);
  }
  60.5% {
    background: linear-gradient(90deg, #690000 60.5%, red 60.5%);
  }
  61% {
    background: linear-gradient(90deg, #690000 61%, red 61%);
  }
  61.5% {
    background: linear-gradient(90deg, #690000 61.5%, red 61.5%);
  }
  62% {
    background: linear-gradient(90deg, #690000 62%, red 62%);
  }
  62.5% {
    background: linear-gradient(90deg, #690000 62.5%, red 62.5%);
  }
  63% {
    background: linear-gradient(90deg, #690000 63%, red 63%);
  }
  63.5% {
    background: linear-gradient(90deg, #690000 63.5%, red 63.5%);
  }
  64% {
    background: linear-gradient(90deg, #690000 64%, red 64%);
  }
  64.5% {
    background: linear-gradient(90deg, #690000 64.5%, red 64.5%);
  }
  65% {
    background: linear-gradient(90deg, #690000 65%, red 65%);
  }
  65.5% {
    background: linear-gradient(90deg, #690000 65.5%, red 65.5%);
  }
  66% {
    background: linear-gradient(90deg, #690000 66%, red 66%);
  }
  66.5% {
    background: linear-gradient(90deg, #690000 66.5%, red 66.5%);
  }
  67% {
    background: linear-gradient(90deg, #690000 67%, red 67%);
  }
  67.5% {
    background: linear-gradient(90deg, #690000 67.5%, red 67.5%);
  }
  68% {
    background: linear-gradient(90deg, #690000 68%, red 68%);
  }
  68.5% {
    background: linear-gradient(90deg, #690000 68.5%, red 68.5%);
  }
  69% {
    background: linear-gradient(90deg, #690000 69%, red 69%);
  }
  69.5% {
    background: linear-gradient(90deg, #690000 69.5%, red 69.5%);
  }
  70% {
    background: linear-gradient(90deg, #690000 70%, red 70%);
  }
  70.5% {
    background: linear-gradient(90deg, #690000 70.5%, red 70.5%);
  }
  71% {
    background: linear-gradient(90deg, #690000 71%, red 71%);
  }
  71.5% {
    background: linear-gradient(90deg, #690000 71.5%, red 71.5%);
  }
  72% {
    background: linear-gradient(90deg, #690000 72%, red 72%);
  }
  72.5% {
    background: linear-gradient(90deg, #690000 72.5%, red 72.5%);
  }
  73% {
    background: linear-gradient(90deg, #690000 73%, red 73%);
  }
  73.5% {
    background: linear-gradient(90deg, #690000 73.5%, red 73.5%);
  }
  74% {
    background: linear-gradient(90deg, #690000 74%, red 74%);
  }
  74.5% {
    background: linear-gradient(90deg, #690000 74.5%, red 74.5%);
  }
  75% {
    background: linear-gradient(90deg, #690000 75%, red 75%);
  }
  75.5% {
    background: linear-gradient(90deg, #690000 75.5%, red 75.5%);
  }
  76% {
    background: linear-gradient(90deg, #690000 76%, red 76%);
  }
  76.5% {
    background: linear-gradient(90deg, #690000 76.5%, red 76.5%);
  }
  77% {
    background: linear-gradient(90deg, #690000 77%, red 77%);
  }
  77.5% {
    background: linear-gradient(90deg, #690000 77.5%, red 77.5%);
  }
  78% {
    background: linear-gradient(90deg, #690000 78%, red 78%);
  }
  78.5% {
    background: linear-gradient(90deg, #690000 78.5%, red 78.5%);
  }
  79% {
    background: linear-gradient(90deg, #690000 79%, red 79%);
  }
  79.5% {
    background: linear-gradient(90deg, #690000 79.5%, red 79.5%);
  }
  80% {
    background: linear-gradient(90deg, #690000 80%, red 80%);
  }
  80.5% {
    background: linear-gradient(90deg, #690000 80.5%, red 80.5%);
  }
  81% {
    background: linear-gradient(90deg, #690000 81%, red 81%);
  }
  81.5% {
    background: linear-gradient(90deg, #690000 81.5%, red 81.5%);
  }
  82% {
    background: linear-gradient(90deg, #690000 82%, red 82%);
  }
  82.5% {
    background: linear-gradient(90deg, #690000 82.5%, red 82.5%);
  }
  83% {
    background: linear-gradient(90deg, #690000 83%, red 83%);
  }
  83.5% {
    background: linear-gradient(90deg, #690000 83.5%, red 83.5%);
  }
  84% {
    background: linear-gradient(90deg, #690000 84%, red 84%);
  }
  84.5% {
    background: linear-gradient(90deg, #690000 84.5%, red 84.5%);
  }
  85% {
    background: linear-gradient(90deg, #690000 85%, red 85%);
  }
  85.5% {
    background: linear-gradient(90deg, #690000 85.5%, red 85.5%);
  }
  86% {
    background: linear-gradient(90deg, #690000 86%, red 86%);
  }
  86.5% {
    background: linear-gradient(90deg, #690000 86.5%, red 86.5%);
  }
  87% {
    background: linear-gradient(90deg, #690000 87%, red 87%);
  }
  87.5% {
    background: linear-gradient(90deg, #690000 87.5%, red 87.5%);
  }
  88% {
    background: linear-gradient(90deg, #690000 88%, red 88%);
  }
  88.5% {
    background: linear-gradient(90deg, #690000 88.5%, red 88.5%);
  }
  89% {
    background: linear-gradient(90deg, #690000 89%, red 89%);
  }
  89.5% {
    background: linear-gradient(90deg, #690000 89.5%, red 89.5%);
  }
  90% {
    background: linear-gradient(90deg, #690000 90%, red 90%);
  }
  90.5% {
    background: linear-gradient(90deg, #690000 90.5%, red 90.5%);
  }
  91% {
    background: linear-gradient(90deg, #690000 91%, red 91%);
  }
  91.5% {
    background: linear-gradient(90deg, #690000 91.5%, red 91.5%);
  }
  92% {
    background: linear-gradient(90deg, #690000 92%, red 92%);
  }
  92.5% {
    background: linear-gradient(90deg, #690000 92.5%, red 92.5%);
  }
  93% {
    background: linear-gradient(90deg, #690000 93%, red 93%);
  }
  93.5% {
    background: linear-gradient(90deg, #690000 93.5%, red 93.5%);
  }
  94% {
    background: linear-gradient(90deg, #690000 94%, red 94%);
  }
  94.5% {
    background: linear-gradient(90deg, #690000 94.5%, red 94.5%);
  }
  95% {
    background: linear-gradient(90deg, #690000 95%, red 95%);
  }
  95.5% {
    background: linear-gradient(90deg, #690000 95.5%, red 95.5%);
  }
  96% {
    background: linear-gradient(90deg, #690000 96%, red 96%);
  }
  96.5% {
    background: linear-gradient(90deg, #690000 96.5%, red 96.5%);
  }
  97% {
    background: linear-gradient(90deg, #690000 97%, red 97%);
  }
  97.5% {
    background: linear-gradient(90deg, #690000 97.5%, red 97.5%);
  }
  98% {
    background: linear-gradient(90deg, #690000 98%, red 98%);
  }
  98.5% {
    background: linear-gradient(90deg, #690000 98.5%, red 98.5%);
  }
  99% {
    background: linear-gradient(90deg, #690000 99%, red 99%);
  }
  99.5% {
    background: linear-gradient(90deg, #690000 99.5%, red 99.5%);
  }
  100% {
    background: linear-gradient(90deg, #690000 100%, red 100%);
  }
}

button:last-of-type {
  background: red;
  user-select: none;
}

button:last-of-type:active {
  animation-name: long-press;
  animation-duration: 15s;
  animation-timing-function: ease-out;
  animation-fill-mode: forwards;
}

.options {
  padding: 1rem 1.5rem;
  margin: 0 0 1.5rem;

  background: white;
  border-radius: 1.75rem;
}

h1 {
  font-size: 1rem;
  font-weight: normal;
  text-align: center;

  margin-bottom: 1rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.3);
}

.toggle {
  margin-bottom: 0.75rem;
}

.options > :last-child {
  margin-bottom: 0.25rem;
}
</style>