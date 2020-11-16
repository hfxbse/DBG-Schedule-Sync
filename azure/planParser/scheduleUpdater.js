/*
 * currently using await after each api call, due to the leak of an batch interface in the google api library
 * TODO: find way to do batch requests
 *
 */

const admin = require('firebase-admin')
const {google} = require('googleapis')

const lessonTimings = require('./lesson_timings.json')
const changeKinds = require('./changeKinds.json')

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

const oAuthClient = new google.auth.OAuth2(credentials.client_id, credentials.client_secret, 'postmessage')

const webAppName = 'dbg-schedule-sync'
const webAppAddress = `https://${webAppName}.web.app/`

function unknownSubjectAbbreviation(subject) {
  console.warn(`Subject abbreviation unknown for "${subject}"`)
}

function getReligionAbbreviation(config) {
  if (config.religion !== religions.ethic) {
    if (config.grade > 11) {
      return 'rel'
    } else {
      return `rel ${config.religion === religions.evangelical ? 'ev' : 'rk'}`
    }
  } else {
    return 'eth'
  }
}

function courseToString(config, course) {
  let subject = course.id
  course = course.data()

  if (course.main === null || course.course_number === null) {
    return
  }

  switch (subject) {
    case 'art':
      subject = 'bk'
      break
    case 'astronomy':
      unknownSubjectAbbreviation(subject)
      return;
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
      subject = getReligionAbbreviation(config);
      break
    case 'psychology':
      subject = 'psy'
      break
    case 'seminar':
      subject = 'bll'
      break
    case 'sport':
      subject = 'sp'
      break
    case 'theater':
      subject = 'thea'
      break
    case 'vk_language':
      unknownSubjectAbbreviation(subject)
      return;
    case 'vk_math':
      unknownSubjectAbbreviation(subject)
      return;
    default:
      console.warn(`Unknown subject "${course.id}"`)
      return
  }

  return `${course.main ? subject.toUpperCase() : subject}${course.course_number}`
}

async function getChanges(configRef, plan) {
  let config = configRef.data()

  const entries = plan.collection('entries')

  if (config.grade > 11) {
    let courses = (await configRef.ref.collection('courses').get()).docs

    let queries = courses.map(course => courseToString(config, course)).filter(text => text)
    let grade = `K${config.grade - 11}`

    let results = []
    while (queries.length !== 0) {
      results = results.concat((await entries.where(
          'classes', 'array-contains', grade
      ).where(
          'old_subject', 'in', queries.splice(0, 10)
      ).get()).docs)
    }

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

function formatDateDigit(number) {
  number = String(number)

  return number.length === 1 ? `0${number}` : number
}

function getApiDateString(date) {
  return `${date.getFullYear()}-${formatDateDigit(date.getMonth() + 1)}-${formatDateDigit(date.getDate())}`
}

async function clearDay(api, calendarId, plan) {
  let startTime = new Date(plan.date.seconds * 1000)

  let events = (await api.events.list({
    calendarId: calendarId,
    timeMin: startTime,
  })).data.items

  for (const event of events) {
    await api.events.delete({
      calendarId: calendarId,
      eventId: event.id
    })
  }
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

async function addDayInformation(api, calendarId, plan) {
  let date = new Date(plan.date.seconds * 1000)
  date.setDate(date.getDate() + 1)

  plan.information.forEach(entry => {
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

    api.events.insert({
      calendarId: calendarId,
      requestBody: event
    });
  })
}

function getFirstReminderDiff(day, start) {
  let reminderTime = new Date(day)

  reminderTime.setHours(reminderTime.getHours() - 4)

  return Math.floor((start.getTime() - reminderTime.getTime()) / 60000)   // Convert milliseconds to minutes
}

async function addChange(api, calendarId, plan, change) {
  let date = new Date(plan.date.seconds * 1000)

  if (changeKinds[change.kind]) {
    change.kind = changeKinds[change.kind]
  }

  let summary, description;
  if (change.kind !== 'Entfall' && change.old_subject !== change.new_subject) {
    summary = `${change.new_subject} statt ${change.old_subject}`

    if (change.text.trim() !== '') {
      description = `<b>${change.kind}</b>\n${change.text}`
    } else {
      description = `<b>${change.kind}</b>`
    }
  } else {
    summary = `${change.old_subject} ${change.kind}`
    description = change.text
  }

  if (change.classes.length > 1) {
    if (description !== '') {
      description += '\n'
    }

    description += '<em>'
    change.classes.forEach((c, index) => {
      description += `${index + 1 === change.classes.length ? ' und ' : index ? ', ' : ''}${c}`;
    })
    description += '</em>'
  }

  let lessons = [...change.lessons.matchAll(/\d+/gi)]
  let start = new Date(date)
  let end = new Date(date)

  let reminderTimeDiff

  if (lessons.length) {
    let lesson = lessons[0][0]

    start.setHours(start.getHours() + Number(lessonTimings[lesson].start.hour))
    start.setMinutes(start.getMinutes() + Number(lessonTimings[lesson].start.minute))

    reminderTimeDiff = getFirstReminderDiff(date, start)

    start = {
      dateTime: start.toISOString()
    }

    if (lessons.length > 1) {
      lesson = lessons[1][0]
    }

    end.setHours(end.getHours() + Number(lessonTimings[lesson].end.hour))
    end.setMinutes(end.getMinutes() + Number(lessonTimings[lesson].end.minute))

    end = {
      dateTime: end.toISOString()
    }
  } else {
    reminderTimeDiff = getFirstReminderDiff(date, start)
    end.setDate(end.getDate() + 1)

    start = {date: getApiDateString(start)}
    end = {date: getApiDateString(end)}
  }

  let event = {
    summary: summary.trim(),
    description: description.trim(),
    start: start,
    end: end,
    reminders: {
      useDefault: false,
      overrides: [
        {
          method: 'popup',
          minutes: 4
        },
        {
          method: 'popup',
          minutes: reminderTimeDiff,
        },
        {
          method: 'popup',
          minutes: reminderTimeDiff - 600   // ten hours later, at 6:00am on the same day
        }
      ],
    }
  }

  if (change.kind !== 'Entfall') {
    event.location = change.room.trim()
  }

  await api.events.insert({
    calendarId: calendarId,
    requestBody: event
  });
}

exports.scheduledUpdater = async (planNumber) => {
  const planRef = db.collection('plans').doc(planNumber.toString())
  const plan = (await planRef.get()).data()

  const query_configs = (await db.collection('query_configs').get()).docs
  for (const config of query_configs) {
    let credentialsDoc = db.collection('calendars').doc(config.id)
    let credentials = (await credentialsDoc.get()).data().google

    if (credentials === undefined || credentials.refresh_token === undefined) {
      continue
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
        continue
      } else {
        throw error
      }
    }

    try {
      await clearDay(api, calendarId, plan)
    } catch (error) {
      if (error.code === 404) {
        credentials.id = undefined
        calendarId = await getCalendarId(api, credentials, config.id)
      } else {
        throw error
      }
    }

    await updateWeekTypeEvent(api, calendarId, plan)
    await addDayInformation(api, calendarId, plan)

    let changes = await getChanges(config, planRef)
    for (let change of changes) {
      await addChange(api, calendarId, plan, change.data())
    }
  }
}