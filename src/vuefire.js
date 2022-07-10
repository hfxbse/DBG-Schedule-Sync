import {appOptions} from "@/main";

export const firestore = async () => {
  const firebase = (await import(/* webpackChunkName: "firebase_compat"*/ 'firebase/compat/app')).default;
  await import(/* webpackChunkName: "firebase_compat"*/ 'firebase/compat/firestore');

  firebase.initializeApp(appOptions);
  return {db: firebase.firestore(), serverTimestamp: firebase.firestore.FieldValue.serverTimestamp};
};

export const firestoreBindings = {
  props: {
    user: {
      required: true,
    },
  },
  watch: {
    user: {
      immediate: true,
      async handler(user, oldUser) {
        if (user) {
          Object.values(this.vuefireBinds).forEach(({field, source}) => this.$bind(field, source));
        } else if (!user && oldUser) {
          Object.values(this.vuefireBinds).forEach(({field, reset}) => this.$unbind(field, reset));
        }
      }
    },
  },
  methods: {
    setupBind(field, source, reset) {
      if (field in this.vuefireBinds) {
        this.$unbind(field, reset);
        reset();
      }

      this.$bind(field, source);
      this.vuefireBinds[field] = {field, source, reset};
    },
  },
  data() {
    return {
      vuefireBinds: {}
    };
  }
};