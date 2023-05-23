<template>
  <div>
    <settings-button
        :class="{googleAuth: true, working}"
        :image="{
          src: require('@/assets/Google.svg'),
          alt: 'Google logo'
        }"
        :lable="working ? 'Anmeldung mit Google läuft' : 'Anmelden mit Google'"
        :text-style="textStyle"
        @click="authWithGoogle"
    />
    <error-message v-model="missingCookies" message="Drittanbieter-Cookies müssen zum Anmelden aktiviert sein."/>
  </div>
</template>

<script>
import {app} from "@/main";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  getAdditionalUserInfo,
} from "firebase/auth";

import {
  getAnalytics,
  logEvent
} from "firebase/analytics";

import {getFunctions, httpsCallable} from 'firebase/functions';
import SettingsButton from "@/components/SettingsButton";
import ErrorMessage from "@/components/ErrorMessage";

export default {
  name: "Auth",
  components: {ErrorMessage, SettingsButton},
  methods: {
    async authWithGoogle() {
      try {
        const authCode = await this.$gAuth.getAuthCode();

        this.working = true;

        const analyticsInstance = getAnalytics(app);
        const functionsInstance = getFunctions(app, 'europe-west1');

        const signIn = httpsCallable(functionsInstance, 'oAuthHandler-googleOAuth');

        let data;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          try {
            data = (await signIn({auth_code: authCode})).data;
            break;
          } catch (e) {
            logEvent(analyticsInstance, 'exception', {
              ...e,
              description: 'oAuthHandler unavailable',
              fatal: false,
            });

            await new Promise(r => setTimeout(r, 2500));
          }
        }

        await this.$gAuth.signOut();

        this.initAuth();

        let credentials = GoogleAuthProvider.credential(data.id_token);
        let user = await signInWithCredential(this.authInstance, credentials);

        if (getAdditionalUserInfo(user).isNewUser) {
          logEvent(analyticsInstance, 'sign_up');
        }

        this.$emit('success');
      } catch (e) {
        if (e === false) {
          this.missingCookies = true;
        } else {
          throw e;
        }
      } finally {
        this.working = false;
      }
    },
    initAuth() {
      if (this.authInstance === null) {
        this.authInstance = getAuth(app);
      }
    },
  },
  computed: {
    textStyle() {
      return !this.working ? {} : {
        "font-style": "italic",
        "font-weight": 300,
        "padding-right": "0.5rem",
      };
    }
  },
  data() {
    return {
      working: false,
      missingCookies: false,
      authInstance: null,
    };
  }
};
</script>