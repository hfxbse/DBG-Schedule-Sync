import Vue from 'vue'
import VueRouter from 'vue-router'

import * as firebase from 'firebase/app';
import 'firebase/auth'

import Auth from "@/views/Auth";
import Home from '@/views/Home.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/auth',
    name: 'Auth',
    component: Auth
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export async function getCurrentUser() {
  return new Promise((resolve, reject) => {
        const unsubscribe = firebase.auth().onAuthStateChanged(user => {
          unsubscribe();
          resolve(user);
        }, reject);
      }
  );
}

router.beforeEach(async (to, _, next) => {
  let user = await getCurrentUser();

  if (to.name === 'Home' && !user) {
    next({name: 'Auth'});
  } else if (to.name === 'Auth' && user) {
    next({name: 'Home'})
  } else {
    next();
  }
})

export default router
