<template>
  <center-container>
    <a class="button" @click="authWithGoogle">
      <img alt="Google Icon" src="@/assets/Google.svg">
      <span>Sign in with Google</span>
    </a>
  </center-container>
</template>

<script>
import * as firebase from 'firebase/app'
import Center from '@/components/Center';

const auth = async () => {
  await import(/* webpackChunkName: "firebase_auth"*/ 'firebase/auth')
  return firebase.auth()
}

export default {
  name: "Auth",
  components: {centerContainer: Center},
  beforeRouteEnter(_, __, next) {
    auth().then(auth => auth.getRedirectResult().then((result) => {
      if (result.user) {
        next({name: 'Home'})
      } else {
        next(() => document.title = 'DBG Stundenplan Synchronisation - Login')
      }
    }))
  },
  methods: {
    async authWithGoogle() {
      let instance = await auth()

      let provider = new firebase.auth.GoogleAuthProvider()
      provider.addScope('https://www.googleapis.com/auth/calendar.events')

      instance.signInWithRedirect(provider)
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