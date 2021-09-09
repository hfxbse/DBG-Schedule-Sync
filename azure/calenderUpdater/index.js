const admin = require("../admin").admin
const {google} = require('googleapis')

const {getApiDateString, getFirstReminderDiff} = require('../event')

const religions = {
  catholic: 'catholic',
  evangelical: 'evangelical',
  ethic: 'ethic'
}

const sportGroups = {
  boys: 'boys',
  girls: 'girls'
}

const profiles = {
  science: 'science',
  sport: 'sport',
  latin: 'latin'
}

const credentials = require('./oauth_client.json').web

const webAppName = 'dbg-schedule-sync'
const webAppAddress = `https://${webAppName}.web.app/`

function unknownSubjectAbbreviation(subject, context) {
  context.log.warn(`Subject abbreviation unknown for "${subject}"`, {userUid: context.userUid})
}

function getReligionAbbreviation(config, course) {
  if (config.religion !== religions.ethic) {
    const ending = config.religion === religions.evangelical ? 'ev' : 'rk';

    if (config.grade > 11) {
      let abbreviations = []

      if(course.course_number === 1) {
        abbreviations = ['rel', `rel ${ending}`]
      } else if(ending === 'rk') {
        abbreviations = ['rel rk']
      }

      abbreviations.push(`rel ${ending}${course.course_number}`)
      abbreviations.push(`rel${course.course_number}`)

      if(course.main) {
        abbreviations = abbreviations.map(abbreviation => abbreviation.toUpperCase());
      }

      return abbreviations
    } else {
      return `rel ${ending}`
    }
  } else {
    return 'eth'
  }
}

function courseToStrings(config, course, context) {
  let subject = course.id
  course = course.data()

  if (course.main === null || course.course_number === null) {
    return []
  }

  switch (subject) {
    case 'art':
      subject = 'bk'
      break
    case 'astronomy':
      unknownSubjectAbbreviation(subject, context)
      return []
    case 'biology':
      subject = 'bio'
      break
    case 'chemistry':
      subject = 'ch'
      break
    case 'computer_science':
      subject = 'inf'
      break
    case 'economy':
      subject = 'wI'
      break
    case 'english':
      subject = 'e'
      break
    case 'french':
      subject = 'f'
      break
    case 'geography':
      subject = 'geo'
      break
    case 'german':
      subject = 'd'
      break
    case 'history':
      subject = 'g'
      break
    case 'latin':
      subject = 'l'
      break
    case 'literature':
      subject = 'lit'
      break
    case 'math':
      subject = 'm'
      break
    case 'music':
      subject = 'mus'
      break
    case 'philosophy':
      subject = 'phil'
      break
    case 'physics':
      subject = 'ph'
      break
    case 'politics':
      subject = 'gk'
      break
    case 'religion':
      subject = getReligionAbbreviation(config, course);

      if(typeof subject !== "string") {   // only Ethic needs further preparation
        return subject
      }
      break;

    case 'psychology':
      subject = 'psy'
      break
    case 'seminar':
      subject = 'SF'
      break
    case 'sport':
      subject = 'sp'
      break
    case 'theater':
      subject = 'thea'
      break
    case 'vk_language':
      unknownSubjectAbbreviation(subject, context)
      return;
    case 'vk_math':
      unknownSubjectAbbreviation(subject, context)
      return;
    default:
      context.log.warn(`Unknown subject "${course.id}"`)
      return
  }

  if (course.main) {
    subject = subject.toUpperCase()
  }

  let courseStrings = [`${subject}${course.course_number}`]

  if (Number(course.course_number) === 1) {
    courseStrings.push(subject)
  }

  return courseStrings;
}

function randomBetween(min, max) {
  return Math.floor(
      Math.random() * (max - min) + min
  );
}

async function actionRunner(context, action,  retryDepth = 0, maxDepth=3, error) {
  let userUid = context.userUid;

  if(retryDepth === maxDepth) {
    context.log.error('Could not fulfill action', {userUid, error})
    return
  }

  try {
    await action()
  } catch (e) {
    const delay = 15 * (retryDepth + 1) + randomBetween(0, 7);

    context.log.warn(`Rate limit exceeded, waiting ${delay} seconds before retrying`, {
      userUid,
      retryDepth: (retryDepth + 1),
      maxDepth : (maxDepth + 1),
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
      )
    });
  }
}

async function rateLimiter(context, actions, limit=10) {
  while (actions.length > 0) {
      await Promise.all(actions.splice(0, limit).map(action => actionRunner(context, action)))
  }
}

async function getChanges(configRef, plan, context) {
  let config = configRef.data()

  const entries = plan.collection('entries')

  if (config.grade > 11) {
    let courses = (await configRef.ref.collection('courses').get()).docs

    let queries = []
    courses.forEach(course => queries = queries.concat(courseToStrings(config, course, context)));
    queries = queries.filter(course => course !== undefined && courses !== null);

    let grade = `K${config.grade - 11}`;

    let results = [], promises = []

    while (queries.length !== 0) {
      promises.push(entries.where(
          'classes', 'array-contains', grade
      ).where(
          'old_subject', 'in', queries.splice(0, 10)
      ).get())
    }

    promises = await Promise.all(promises)
    promises.forEach(({docs}) => {
      if (docs) results = results.concat(docs)
    })

    return results
  } else {
    let excludedSubjects = Object.values(religions).filter(
        religion => religion !== config.religion
    ).map(religion => {
      return getReligionAbbreviation({grade: config.grade, religion: religion});
    })

    if (config.religion === religions.ethic) {
      excludedSubjects.push('rel')
    }

    if (config.grade < 8 || config.profile !== profiles.sport) {
      if (config.sport === sportGroups.boys) {
        excludedSubjects.push('spw')
      } else {
        excludedSubjects.push('spm')
      }
    }

    if (config.grade > 7) {
      switch (config.profile) {
        case profiles.science:
          excludedSubjects = excludedSubjects.concat([profiles.sport, 'l', 'lat'])
          break
        case profiles.sport:
          excludedSubjects = excludedSubjects.concat([profiles.science, 'l', 'lat'])
          break
        case profiles.latin:
          excludedSubjects = excludedSubjects.concat([profiles.science, profiles.sport])
          break
      }
    }

    excludedSubjects = excludedSubjects.map(abbreviation =>
        abbreviation.charAt(0).toUpperCase() + abbreviation.slice(1)
    )

    let snapshot = (await entries.where(
        'classes', 'array-contains', `${config.grade}${config.class}`
    ).where(
        'old_subject', 'not-in', excludedSubjects
    ).get());

    return snapshot.docs
  }
}

const db = admin.firestore()

async function getCalendarId(api, credentials, userId) {
  let calendarId = credentials.id

  if (calendarId === undefined) {
    calendarId = (await api.calendars.insert({
      requestBody: {
        timeZone: 'Europe/Berlin',
        summary: 'Vertretungsplan',
        description: `Dein persönlicher DBG-Metzingen Vertretungsplan.\n\nDie Einstellungen findest du auf ${webAppAddress}.`
      }
    })).data.id

    await db.collection('calendars').doc(userId).update({
      google: {
        refresh_token: credentials.refresh_token,
        id: calendarId
      }
    })
  }

  return calendarId
}

async function clearDay(context, api, calendarId, plan) {
  let startTime = new Date(plan.date.seconds * 1000)

  let events = (await api.events.list({
    calendarId: calendarId,
    timeMin: startTime,
  })).data.items

  return rateLimiter(context, events.map(event => () => api.events.delete({
    calendarId: calendarId,
    eventId: event.id
  })))
}

async function updateWeekTypeEvent(api, calendarId, plan) {
  let startTime = new Date(plan.date.seconds * 1000)
  startTime.setDate(startTime.getDate() - startTime.getDay() + 1)

  let endTime = new Date(new Date(startTime).setDate(startTime.getDate() + 5));

  let events = (await api.events.list({
    calendarId: calendarId,
    timeMin: startTime,
    timeMax: new Date(new Date(startTime).setMinutes(1))
  })).data.items

  let event = {
    start: {date: getApiDateString(startTime)},
    end: {date: getApiDateString(endTime)},
    summary: `${plan.week} Woche`
  }

  if (events.length) {
    for (let entry of events) {
      if (entry.end.date === event.end.date) {
        if (entry.summary !== event.summary) {
          await api.events.update({
            calendarId: calendarId,
            eventId: events[0].id,
            requestBody: event
          })
        }

        return
      }
    }
  }

  await api.events.insert({
    calendarId: calendarId,
    requestBody: event
  })
}

function addDayInformation(context, api, calendarId, plan) {
  let date = new Date(plan.date.seconds * 1000)
  date.setDate(date.getDate() + 1)

  return rateLimiter(context, plan.information.map(entry => () => {
    if (/^Vertretungsplan: /.test(entry)) {
      return
    }

    let parts = entry.split(/: +/)

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
    }

    if (parts.length) {
      event.description = parts.join(': ')
    }

    return api.events.insert({
      calendarId: calendarId,
      requestBody: event
    });
  }));
}

function addChange(api, calendarId, change) {
  return  api.events.insert({
    calendarId: calendarId,
    requestBody: change.event
  });
}

module.exports = async (context) => {
  const plans = (await db.collection('plans').get()).docs;
  const query_configs = (await db.collection('query_configs').get()).docs


  for(let snapshot of plans) {
      let plan = snapshot.data();

      await rateLimiter(context, query_configs.map( config => async () => {
        const current = {...context, userUid: config.id};

        let oAuthClient = new google.auth.OAuth2(credentials.client_id, credentials.client_secret, 'postmessage')

        try {
          let credentialsDoc = db.collection('calendars').doc(config.id)
          let credentials = (await credentialsDoc.get()).data().google

          if (credentials === undefined || credentials.refresh_token === undefined) {
            return
          }

          let refreshToken = credentials.refresh_token

          oAuthClient.setCredentials({refresh_token: refreshToken})

          let api = google.calendar({version: 'v3', auth: oAuthClient})

          let calendarId

          try {
            calendarId = await getCalendarId(api, credentials, config.id)
          } catch (error) {
            let response = error.response

            if (response.data.error.code === 403 || response.data.error === 'invalid_grant') {
              delete credentials.refresh_token
              await credentialsDoc.set(credentials)
              return
            } else {
              // noinspection ExceptionCaughtLocallyJS
              throw error;
            }
          }

          try {
            await clearDay(current, api, calendarId, plan)
          } catch (error) {
            if (error.code === 404) {
              credentials.id = undefined
              calendarId = await getCalendarId(api, credentials, config.id)
            } else {
              // noinspection ExceptionCaughtLocallyJS
              throw error;
            }
          }

          await updateWeekTypeEvent(api, calendarId, plan)
          await addDayInformation(current, api, calendarId, plan)

          let changes = await getChanges(config, snapshot.ref, current)

          await rateLimiter(current, changes.map(change => () => addChange(api, calendarId, change.data())))
        } catch (error) {
          current.log.error(`Calender synchronisation failed for user ${config.id}`, error)
        }
      }), 20)
    }

}
