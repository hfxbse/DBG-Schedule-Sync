const admin = require('firebase-admin');
const serviceAccount = require('./service_account.json');

if (!process.env.FIREBASE_DEBUG_MODE) {
  admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
} else {
  admin.initializeApp({projectId: 'dbg-schedule-sync'});
}

exports.users = require('./users').users;

exports.oAuthHandler = require('./oAuthHandler');

exports.plan = require('./plan').plan;

exports.new_year_reminder = require('./newYearReminder').new_year_reminder;
