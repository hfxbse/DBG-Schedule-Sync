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
import * as firebase from 'firebase/app'

const auth = async () => {
  await import(/* webpackChunkName: "firebase_auth"*/ 'firebase/auth')
  return firebase.auth()
}

const analytics = async () => {
  await import(/* webpackChunkName: "firebase_auth"*/ 'firebase/analytics')
  return firebase.analytics()
}

const functions = async () => {
  await import(/* webpackChunkName: "firebase_functions"*/ 'firebase/functions')

  if (location.hostname === 'localhost') {
    firebase.functions().useFunctionsEmulator('http://localhost:5001');
  }

  return firebase.functions()
}

export default {
  name: "Auth",
  methods: {
    async authWithGoogle() {
      try {
        const authCode = await this.$gAuth.getAuthCode();

        this.working = true;

        const authInstance = await auth()
        const functionsInstance = await functions()

        const signIn = functionsInstance.httpsCallable('oAuthHandler-googleOAuth');

        let data;

        // eslint-disable-next-line no-constant-condition
        while (true) {
          try {
            data = (await signIn({auth_code: authCode})).data
            break
          } catch (e) {
            analytics().then(analytics => analytics.logEvent('exception', {
              ...e,
              description: 'oAuthHandler unavailable',
              fatal: false,
            }))
          }
        }


        await this.$gAuth.signOut()

        let credentials = new firebase.auth.GoogleAuthProvider().credential(data.id_token)
        let user = await authInstance.signInWithCredential(credentials)

        if(user.additionalUserInfo.isNewUser) {
          analytics().then(analytics => analytics.logEvent('sign_up'));
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
    }
  },
  data() {
    return {
      working: false,
      missingCookies: false
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