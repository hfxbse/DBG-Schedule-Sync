import Vue from 'vue'
import { firestorePlugin } from 'vuefire'

import * as firebase from 'firebase/app'
import 'firebase/firestore'

import App from '@/App.vue'

import router from '@/router'
import '@/registerServiceWorker'

Vue.use(firestorePlugin)

export function executeInProduction(callback) {
  if (process.env.NODE_ENV === 'production') {
    callback();
  }
}

let authDomain = process.env.VUE_APP_DOMAIN

if (location.hostname === process.env.VUE_APP_ALT_DOMAIN) {
  authDomain = process.env.VUE_APP_ALT_DOMAIN
}

firebase.initializeApp({
  apiKey: process.env.VUE_APP_API_KEY,
  authDomain: authDomain,
  databaseURL: process.env.VUE_APP_DATABASE_URL,
  projectId: process.env.VUE_APP_PROJECT_ID,
  storageBucket: process.env.VUE_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.VUE_APP_MESSAGING_SENDER_ID,
  appId: process.env.VUE_APP_APP_ID,
  measurementId: process.env.VUE_APP_MEASUREMENT_ID,
})
executeInProduction(() => firebase.analytics);

if (location.hostname === 'localhost') {
  firebase.firestore().settings({
    host: 'localhost:8000',
    ssl: false,
    experimentalForceLongPolling: true,
  })
}

firebase.firestore()

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
