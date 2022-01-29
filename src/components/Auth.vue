<template>
  <div>
    <button :class="{button: true, working}" @click="authWithGoogle">
      <img alt="Google Icon" src="@/assets/Google.svg">
      <span>{{ working ? "Anmeldung mit Google läuft" : "Anmelden mit Google" }}</span>
    </button>
    <p v-if="missingCookies" class="error">Drittanbieter-Cookies müssen zum anmelden aktiviert sein.</p>
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
} from "firebase/analytics"

import {getFunctions, httpsCallable} from 'firebase/functions';

export default {
  name: "Auth",
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
            data = (await signIn({auth_code: authCode})).data
            break
          } catch (e) {
            logEvent(analyticsInstance, 'exception', {
              ...e,
              description: 'oAuthHandler unavailable',
              fatal: false,
            })

            await new Promise(r => setTimeout(r, 2500));
          }
        }

        await this.$gAuth.signOut()

        this.initAuth();

        let credentials = GoogleAuthProvider.credential(data.id_token)
        let user = await signInWithCredential(this.authInstance, credentials)

        if (getAdditionalUserInfo(user).isNewUser) {
          logEvent(analyticsInstance, 'sign_up');
        }

        this.$emit('success')
      } catch (e) {
        if (e === false) {
          this.missingCookies = true
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
  data() {
    return {
      working: false,
      missingCookies: false,
      authInstance: null,
    }
  }
}
</script>

<style scoped>
.button {
  padding: 0.75rem;
  outline: none;

  width: 17.5rem;

  display: flex;
  flex-direction: row;
  align-items: center;

  box-shadow: var(--element-shadow);
  border: none;
  border-radius: 1.75rem;

  background: white;
}

img {
  height: 1.5rem;
  width: 1.5rem;
  margin-right: .5rem;
}

span {
  margin: auto;
  padding-right: 1.5rem;
  font-weight: 500;
  font-size: 1rem;
}

.working span {
  font-style: italic;
  font-weight: 300;
  padding-right: 0.5rem;
}

.error {
  color: red;
  font-weight: 500;
  text-align: center;

  margin-top: 1rem;
  width: 17.5rem;

}
</style>