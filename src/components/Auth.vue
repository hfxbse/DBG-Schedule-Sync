<template>
  <div>
    <a class="button" @click="authWithGoogle">
      <img alt="Google Icon" src="@/assets/Google.svg">
      <span>Anmelden mit Google</span>
    </a>
  </div>
</template>

<script>
import * as firebase from 'firebase/app'

const auth = async () => {
  await import(/* webpackChunkName: "firebase_auth"*/ 'firebase/auth')
  return firebase.auth()
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
      let authCode = await this.$gAuth.getAuthCode()

      const authInstance = await auth()
      const functionsInstance = await functions()

      let {data} = await functionsInstance.httpsCallable('oAuthHandler-googleOAuth')({auth_code: authCode})

      await this.$gAuth.signOut()

      let credentials = new firebase.auth.GoogleAuthProvider().credential(data.id_token)
      await authInstance.signInWithCredential(credentials)

      this.$emit('success')
    }
  }
}
</script>

<style scoped>
.button {
  padding: 0.75rem;

  width: 17.5rem;

  display: flex;
  flex-direction: row;
  align-items: center;

  box-shadow: var(--element-shadow);
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
}
</style>