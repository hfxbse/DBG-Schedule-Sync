import Vue from 'vue'

import App from '@/App.vue'

import GAuth from 'vue-google-oauth2'

import '@/registerServiceWorker'

import {initializeApp} from "firebase/app";
import {getAnalytics, logEvent} from "firebase/analytics";

import {firestorePlugin as vuefire} from "vuefire";

Vue.use(vuefire)

let authDomain = process.env.VUE_APP_DOMAIN

if (location.hostname === process.env.VUE_APP_ALT_DOMAIN) {
  authDomain = process.env.VUE_APP_ALT_DOMAIN
}

export const appOptions = {
  apiKey: process.env.VUE_APP_API_KEY,
  authDomain: authDomain,
  databaseURL: process.env.VUE_APP_DATABASE_URL,
  projectId: process.env.VUE_APP_PROJECT_ID,
  storageBucket: process.env.VUE_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.VUE_APP_MESSAGING_SENDER_ID,
  appId: process.env.VUE_APP_APP_ID,
  measurementId: process.env.VUE_APP_MEASUREMENT_ID,
};

export const app = initializeApp(appOptions)

async function debugSetup() {
  if (location.hostname === 'localhost') {
    const {connectAuthEmulator, getAuth} = await import("firebase/auth");
    const {getFirestore, connectFirestoreEmulator} = await import("firebase/firestore");
    const {getFunctions, connectFunctionsEmulator} = await import("firebase/functions");

    connectAuthEmulator(getAuth(app), "http://localhost:9099");
    connectFirestoreEmulator(getFirestore(app), 'localhost', 8000);
    connectFunctionsEmulator(getFunctions(app), 'localhost', 5001);
  }
}

window.addEventListener('error', function (event) {
  const {message, filename, lineno, colno} = event;

  console.error(event)

  const analyticsInstance = getAnalytics(app);

  logEvent(analyticsInstance, 'exception', {
    description: `Exception: ${message} in ${filename} at ${lineno}:${colno}`,
    fatal: false,
    ...event,
  })
})

window.addEventListener('unhandledrejection', function (event) {
  console.error(event)

  const analyticsInstance = getAnalytics(app);

  logEvent(analyticsInstance, 'exception', {
    description: `Rejected promise`,
    fatal: false,
    ...event.reason
  })
})

Vue.config.productionTip = false

Vue.use(GAuth, {
  clientId: process.env.VUE_APP_GOOGLE_OAUTH_CLIENT_ID,
  fetch_basic_profile: true,
  ux_mode: 'redirect',
  scope: 'https://www.googleapis.com/auth/calendar',
})

new Vue({
  render: h => h(App),
  async beforeMount() {
    await debugSetup();
  }
}).$mount('#app');
