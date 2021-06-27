const admin = require('firebase-admin')
const serviceAccount = require('./service_account.json')

if (process.env.ASPNETCORE_ENVIRONMENT === 'Production') {
  admin.initializeApp({credential: admin.credential.cert(serviceAccount)})
} else {
  admin.initializeApp({projectId: 'dbg-schedule-sync'})
}

exports.admin = admin;