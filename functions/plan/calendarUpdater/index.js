const functions = require('firebase-functions');

let google;

let admin;
let db;

const credentials = require('../../oauth_client.json').web;

let getApiDateString;
let getFirstReminderDiff;

let abbreviations;
let religions;
let sportGroups;
let profiles;

function createContext(userUid, action) {
  return {userUid, action};
}

function getReligionAbbreviation(config, course) {
  religions = require('./religions.json');

  if (config.religion !== religions.ethic) {
    const ending = config.religion === religions.evangelical ? 'ev' : 'rk';

    if (config.grade > 11) {
      let abbreviations = [];

      // noinspection JSUnresolvedVariable
      if (course.course_number === 1) {
        abbreviations = ['rel', `rel ${ending}`];
      } else if (ending === 'rk') {
        abbreviations = ['rel rk'];
      }

      // noinspection JSUnresolvedVariable
      abbreviations.push(`rel ${ending}${course.course_number}`);
      // noinspection JSUnresolvedVariable
      abbreviations.push(`rel${course.course_number}`);

      if (course.main) {
        abbreviations = abbreviations.map(abbreviation => abbreviation.toUpperCase());
      }

      return abbreviations;
    } else {
      return `rel ${ending}`;
    }
  } else {
    return 'eth';
  }
}

function courseToStrings(config, course, userUid) {
  const subject = course.id;
  let abbreviation;

  course = course.data();

  // noinspection JSUnresolvedVariable
  if (course.main === null || course.course_number === null) {
    return [];
  }

  if (subject === 'religion') {
    abbreviation = getReligionAbbreviation(config, course);

    if (typeof abbreviation !== "string") {   // only Ethic needs further preparation
      return abbreviation;
    }
  } else {
    abbreviations = require('./abbreviation.json');

    if (!(subject in abbreviations)) {
      functions.logger.warn(`Unknown subject`, {subject, userUid});
      return null;
    }

    abbreviation = abbreviations[subject];

    if (abbreviation === null) {
      functions.logger.warn(`Subject abbreviation unknown"`, {subject, userUid});
      return null;
    }
  }

  if (course.main) {
    abbreviation = abbreviation.toUpperCase();
  }

  // noinspection JSUnresolvedVariable
  let courseStrings = [`${abbreviation}${course.course_number}`];

  // noinspection JSUnresolvedVariable
  if (Number(course.course_number) === 1) {
    courseStrings.push(abbreviation);
  }

  return courseStrings;
}

function randomBetween(min, max) {
  return Math.floor(
      Math.random() * (max - min) + min
  );
}

async function actionRunner(context, action, retryDepth = 0, maxDepth = 3, error) {
  if (retryDepth === maxDepth) {
    functions.logger.error('Could not fulfill action', {...context, error});
    return;
  }

  try {
    await action();
  } catch (e) {
    if ((e?.response?.data?.error?.errors ?? [])[0]?.reason !== 'rateLimitExceeded') {
      throw e;
    }

    const delay = 12 * (retryDepth + 1) + randomBetween(0, 8);

    functions.logger.debug(`Rate limit exceeded, waiting ${delay} seconds before retrying`, {
      ...context,
      retryDepth: (retryDepth + 1),
      maxDepth: (maxDepth + 1),
      e
    });

    ++retryDepth;

    await new Promise(resolve => {
      setTimeout(
          async () => {
            await actionRunner(context, action, retryDepth, maxDepth, e);
            resolve();
          },
          delay * 1000
      );
    });
  }
}

async function rateLimiter(context, actions, limit = 10) {
  const processes = actions.splice(0, limit).map(action => (async () => {
    while (action !== undefined) {
      try {
        // eslint-disable-next-line
        await actionRunner(context, action);
      } finally {
        action = actions.pop();
      }
    }
  })());

  return Promise.all(processes);
}

async function getChanges(snapshot, plan) {
  let config = snapshot.data();

  const entries = plan.collection('entries');

  if (config.grade > 11) {
    let courses = (await snapshot.ref.collection('courses').get()).docs;

    let queries = [];
    courses.forEach(course => queries = queries.concat(courseToStrings(config, course, snapshot.id)));
    queries = queries.filter(course => course !== undefined && courses !== null);

    let grade = `K${config.grade - 11}`;

    let results = [], promises = [];

    while (queries.length !== 0) {
      promises.push(entries.where(
          'classes', 'array-contains', grade
      ).where(
          'old_subject', 'in', queries.splice(0, 10)
      ).get());
    }

    promises = await Promise.all(promises);
    promises.forEach(({docs}) => {
      if (docs) results = results.concat(docs);
    });

    return results;
  } else {
    religions = require('./religions.json');

    let excludedSubjects = Object.values(religions).filter(
        religion => religion !== config.religion
    ).map(religion => {
      return getReligionAbbreviation({grade: config.grade, religion: religion});
    });

    if (config.religion === religions.ethic) {
      excludedSubjects.push('rel');
    }

    profiles = require('./profiles.json');

    if (config.grade < 8 || config.profile !== profiles.sport) {
      sportGroups = require('./sportGroups.json');

      if (config.sport === sportGroups.boys) {
        excludedSubjects.push('spw');
      } else {
        excludedSubjects.push('spm');
      }
    }

    if (config.grade > 7) {
      switch (config.profile) {
        case profiles.science:
          excludedSubjects = excludedSubjects.concat([profiles.sport, 'l', 'lat']);
          break;
        case profiles.sport:
          excludedSubjects = excludedSubjects.concat([profiles.science, 'l', 'lat']);
          break;
        case profiles.latin:
          excludedSubjects = excludedSubjects.concat([profiles.science, profiles.sport]);
          break;
      }
    }

    excludedSubjects = excludedSubjects.map(abbreviation =>
        abbreviation.charAt(0).toUpperCase() + abbreviation.slice(1)
    );

    let snapshot = (await entries.where(
        'classes', 'array-contains', `${config.grade}${config.class}`
    ).where(
        'old_subject', 'not-in', excludedSubjects
    ).get());

    return snapshot.docs;
  }
}

async function getCalendarId(api, credentials, userId) {
  let calendarId = credentials.id;

  if (calendarId === undefined) {
    const webAppAddress = functions.config().web_app.address;

    calendarId = (await api.calendars.insert({
      requestBody: {
        timeZone: 'Europe/Berlin',
        summary: 'Vertretungsplan',
        description: `Dein persönlicher DBG-Metzingen Vertretungsplan.\n\nDie Einstellungen findest du auf ${webAppAddress}.`
      }
    })).data.id;

    await db.collection('calendars').doc(userId).update({
      google: {
        refresh_token: credentials.refresh_token,
        id: calendarId
      }
    });
  }

  return calendarId;
}

async function clearDay(context, api, calendarId, plan) {
  let startTime = new Date(plan.date.seconds * 1000);

  let events = (await api.events.list({
    calendarId: calendarId,
    timeMin: startTime,
  })).data.items;

  return rateLimiter(context, events.map(event => () => api.events.delete({
    calendarId: calendarId,
    eventId: event.id
  })));
}

async function updateWeekTypeEvent(api, calendarId, plan) {
  let startTime = new Date(plan.date.seconds * 1000);
  startTime.setDate(startTime.getDate() - startTime.getDay() + 1);

  let endTime = new Date(new Date(startTime).setDate(startTime.getDate() + 5));

  let events = (await api.events.list({
    calendarId: calendarId,
    timeMin: startTime,
    timeMax: new Date(new Date(startTime).setMinutes(1))
  })).data.items;

  let event = {
    start: {date: getApiDateString(startTime)},
    end: {date: getApiDateString(endTime)},
    summary: `${plan.week} Woche`
  };

  if (events.length) {
    for (let entry of events) {
      if (entry.end.date === event.end.date) {
        if (entry.summary !== event.summary) {
          // gets only called once normally
          // eslint-disable-next-line no-await-in-loop
          await api.events.update({
            calendarId: calendarId,
            eventId: events[0].id,
            requestBody: event
          });
        }

        return;
      }
    }
  }

  await api.events.insert({
    calendarId: calendarId,
    requestBody: event
  });
}

function addDayInformation(context, api, calendarId, plan) {
  let date = new Date(plan.date.seconds * 1000);
  date.setDate(date.getDate() + 1);

  return rateLimiter(context, plan.information.map(entry => () => {
    let parts = entry.split(/: +/);

    let event = {
      start: {date: getApiDateString(date)},
      end: {date: getApiDateString(date)},
      summary: parts.shift(),
      reminders: {
        useDefault: false,
        overrides: [
          {
            method: 'popup',
            minutes: getFirstReminderDiff(date, date)
          }
        ]
      }
    };

    if (parts.length) {
      event.description = parts.join(': ');
    }

    return api.events.insert({
      calendarId: calendarId,
      requestBody: event
    });
  }));
}

function addChange(api, calendarId, change) {
  return api.events.insert({
    calendarId: calendarId,
    requestBody: change.event
  });
}

let auth;

async function updateCalendar(plan, config) {
  const userUid = config.query.id;

  // noinspection SpellCheckingInspection
  let oAuthClient = new google.auth.OAuth2(credentials.client_id, credentials.client_secret, 'postmessage');

  try {
    let credentialsDoc = db.collection('calendars').doc(userUid);
    let credentials = (await credentialsDoc.get()).data()?.google;

    if (credentials === undefined || credentials.refresh_token === undefined) {
      return;
    }

    let refreshToken = credentials.refresh_token;

    oAuthClient.setCredentials({refresh_token: refreshToken});

    let api = google.calendar({version: 'v3', auth: oAuthClient});

    let calendarId;

    try {
      calendarId = await getCalendarId(api, credentials, userUid);
      await clearDay(createContext(userUid, 'clearDay'), api, calendarId, plan.data);
    } catch (error) {
      if (error.code === 404 || error.code === 410) {
        // TODO inform user on how to delete their account if they did not delete the calendar by accident
        credentials.id = undefined;
        calendarId = await getCalendarId(api, credentials, userUid);
      } else {
        let response = error.response;

        if (response?.data?.error?.code === 403 || response?.data?.error === 'invalid_grant') {
          functions.logger.info('Notifying user of missing permissions', {userUid});

          const {sendPermissionNotification} = require("./email");

          try {
            try {
              if (auth === undefined) {
                auth = admin.auth();
              }

              await auth.revokeRefreshTokens(userUid);

              const user = await auth.getUser(userUid);
              await sendPermissionNotification({
                address: user.email,
                name: user.displayName.replace("​", "").trim()
              });
            } catch (e) {
              functions.logger.warn(e);
            }

            await oAuthClient.revokeToken(credentials.refresh_token);
          } finally {
            delete credentials.refresh_token;
            await credentialsDoc.set(credentials);
          }

          return;
        } else {
          // noinspection ExceptionCaughtLocallyJS
          throw error;
        }
      }
    }

    if (config.content?.week_type ?? true) {
      await updateWeekTypeEvent(api, calendarId, plan.data);
    }

    if (config.content?.additional_info ?? true) {
      await addDayInformation(createContext(userUid, 'addDayInformation'), api, calendarId, plan.data);
    }

    let changes = await getChanges(config.query, plan.snapshot.ref);

    await rateLimiter(
        createContext(userUid, 'addChanges'),
        changes.map(change => () => addChange(api, calendarId, change.data()))
    );
  } catch (error) {
    functions.logger.error(`Calender synchronisation failed for user ${userUid}`, error);
  }
}

function setup() {
  admin = require('firebase-admin');
  google = require('googleapis').google;

  getApiDateString = require('../event.js').getApiDateString;
  getFirstReminderDiff = require('../event.js').getFirstReminderDiff;

  if (db === undefined) {
    db = admin.firestore();
  }
}

async function onConfigChange(config) {
  setup();

  // config reference needs to be recreated for the admin ask, as else it will not use the required permissions somehow
  const adminConfig = db.collection('query_configs').doc(config.id);
  const changeIdentifier = {userUid: config.id, updateTime: config.updateTime.toDate()};

  if (!config.data().grade) {
    functions.logger.info(
        `Configuration is incomplete, exiting.`,
        changeIdentifier
    );

    return;
  }

  functions.logger.debug(`Debouncing config changes`, changeIdentifier);

  for (let i = 0; i < 40; i++) {  // each iteration is one second apart
    // eslint-disable-next-line no-await-in-loop
    await new Promise(resolve => setTimeout(resolve, 1000));
    // eslint-disable-next-line no-await-in-loop
    let current = await adminConfig.get();

    if (!current.exists) {
      functions.logger.info(
          `Configuration got deleted while debouncing, exiting.`,
          changeIdentifier
      );

      return;
    } else if (current.updateTime?.toDate() > config.updateTime.toDate()) {
      functions.logger.info(
          `Configuration changed again before debounce delay did run out, exiting.`,
          changeIdentifier
      );

      return;
    }
  }

  const plans = (await db.collection('plans').get()).docs;

  const allConfigs = {
    query: await adminConfig.get(),
    content: (await adminConfig.collection('options').doc('content').get()).data()
  };

  for (let snapshot of plans) {
    // eslint-disable-next-line no-await-in-loop
    await updateCalendar({snapshot, data: snapshot.data()}, allConfigs);
  }
}

exports.schedule = functions
    .region('europe-west1')
    .runWith({timeoutSeconds: 540})
    .pubsub.schedule("12 0,9,15 * * *").timeZone('Europe/Berlin')
    .onRun(async () => {
      setup();

      const plans = (await db.collection('plans').get()).docs;
      const query_configs = (await db.collection('query_configs').get()).docs;

      for (let snapshot of plans) {
        // eslint-disable-next-line no-await-in-loop
        await rateLimiter(
            createContext(undefined, 'updateCalendar'),
            query_configs.map(config => async () => {
              const allConfigs = {
                query: config,
                content: (await config.ref.collection('options').doc('content').get()).data()
              };

              await updateCalendar({
                snapshot,
                data: snapshot.data()
              }, allConfigs);
            }),
            20
        );
      }
    });

const configListener = functions
    .region('europe-west1')
    .runWith({timeoutSeconds: 300})
    .firestore.document('query_configs/{docId}');

exports.onConfigCreate = configListener.onCreate(onConfigChange);
exports.onConfigUpdate = configListener.onUpdate((change => onConfigChange(change.after)));
