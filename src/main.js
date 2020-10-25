import Vue from 'vue'

import * as firebase from 'firebase/app'
import App from '@/App.vue'

import router from '@/router'
import '@/registerServiceWorker'

const firestore = async () => {
  await import(/* webpackChunkName: "firebase_firestore"*/ 'firebase/firestore')
  let vuefire = (await import(/* webpackChunkName: "vuefire"*/ 'vuefire')).firestorePlugin

  if (location.hostname === 'localhost') {
    firebase.firestore().settings({
      host: 'localhost:8000',
      ssl: false,
      experimentalForceLongPolling: true,
    })
  }

  Vue.use(vuefire)

  return firebase.firestore()
}

export function executeInProduction(callback) {
  if (process.env.NODE_ENV === 'production') {
    return callback();
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

executeInProduction(async () => {
  await import(/* webpackChunkName: "firebase_analytics"*/ 'firebase/analytics')
  return firebase.analytics();
});

firestore().then(() => {
  Vue.config.productionTip = false

  new Vue({
    router,
    render: h => h(App)
  }).$mount('#app')
})
