const {google} = require('googleapis');
const functions = require('firebase-functions');

const admin = require('firebase-admin');

let firebase;
let credentials;
let webAppSettings;

exports.googleOAuth = functions.region('europe-west1').https.onCall(async ({auth_code}) => {
  firebase = require('firebase/app');
  require('firebase/auth');

  credentials = require('./oauth_client.json').web;
  webAppSettings = require('./web_client.json');

  firebase.initializeApp(webAppSettings);

  const client = new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret,
      'postmessage'
  );

  const {tokens} = await client.getToken(auth_code);

  if (tokens.refresh_token) {
    const entry = {
      google: {
        refresh_token: tokens.refresh_token
      }
    }

    try {
      let credentials = new firebase.auth.GoogleAuthProvider().credential(tokens.id_token)

      if (process.env.FIRESTORE_EMULATOR_HOST) {
        firebase.auth().useEmulator('http://localhost:9099/')
      }

      await firebase.auth().signInWithCredential(credentials)
    } catch (error) {
      // TODO get correct function error code
      throw new functions.https.HttpsError('unknown', `${error.message} [${error.code}]`)
    }

    const userID = firebase.auth().currentUser.uid
    await firebase.auth().signOut()

    let doc = admin.firestore().collection('calendars').doc(userID)

    if ((await doc.get()).exists) {
      await doc.update(entry)
    } else {
      await doc.set(entry)
    }
  }

  return {id_token: tokens.id_token}
});