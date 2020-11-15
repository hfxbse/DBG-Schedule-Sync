process.env.TZ = 'Europe/Berlin'

const admin = require('firebase-admin')
const serviceAccount = require('./service_account.json')

// if (!process.env.FIRESTORE_EMULATOR_HOST) {
admin.initializeApp({credential: admin.credential.cert(serviceAccount)})
// } else {
//   admin.initializeApp({projectId: 'dbg-schedule-sync'})
// }

exports.oAuthHandler = require('./oAuthHandler')