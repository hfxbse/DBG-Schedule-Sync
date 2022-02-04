const functions = require('firebase-functions');
const {web: credentials} = require("../oauth_client.json");

let admin;
let google;
let db;
let auth;

exports.onDelete = functions.region('europe-west1').auth.user().onDelete((async user => {
  admin = require('firebase-admin');

  if (db === undefined) {
    db = admin.firestore();
    auth = admin.auth();
  }

  const calendars = await db.collection('calendars').doc(user.uid).get();
  const refresh_token = calendars.data()?.google?.refresh_token;

  if (refresh_token !== undefined) {
    google = require('googleapis').google;

    const oAuthClient = new google.auth.OAuth2(credentials.client_id, credentials.client_secret, 'postmessage');
    try {
      await oAuthClient.revokeToken(refresh_token);
    } catch (error) {
      if (error?.response?.data?.error === 'invalid_token') {
        functions.logger.info('Refresh token already revoked', {user: user.uid});
      } else {
        functions.logger.error('Unable to revoke refresh token', {error, user: user.uid});
      }
    }
  }

  await Promise.allSettled([
    calendars.ref.delete(),
    db.collection('query_configs').doc(user.uid).delete()
  ]);
}));