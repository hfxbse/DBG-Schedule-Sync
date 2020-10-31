const admin = require('firebase-admin')
const serviceAccount = require('./service_account.json')

const functions = require('firebase-functions');

const religions = {
  catholic: 'Katholisch',
  evangelical: 'Evangelisch',
  ethic: 'Ethik'
}

const sportGroups = {
  boys: 'Jungs',
  girls: 'Mädchens'
}

const profiles = {
  science: 'NWT',
  sport: 'Sport',
  latin: 'Latein'
}

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  admin.initializeApp({credential: admin.credential.cert(serviceAccount)})
} else {
  admin.initializeApp({projectId: 'dbg-schedule-sync'})
}

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
      subject = 'wi'
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

  const entries = await plan.ref.collection('entries')

  if (config.grade > 11) {
    let courses = (await configRef.ref.collection('courses').get()).docs

    let queries = courses.map(course => courseToString(config, course)).filter(text => text)
    let grade = `K${config.grade - 11}`

    let results = []
    while (queries.length !== 0) {
      results.concat((await entries.where(
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
          excludedSubjects.concat([profiles.sport, 'l'])
          break
        case profiles.sport:
          excludedSubjects.concat([profiles.science, 'l'])
          break
        case profiles.latin:
          excludedSubjects.concat([profiles.science, profiles.sport])
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

    console.dir({
      excludedSubjects,
      class: `${config.grade}${config.class}`,
      results: snapshot.size
    })

    return snapshot.docs
  }
}

exports.scheduledUpdater = functions.firestore.document('/plans/{id}').onWrite(async (change) => {
  const plan = change.after.data()

  const query_configs = (await admin.firestore().collection('query_configs').get()).docs
  for (const config of query_configs) {
    (await getChanges(config, change.after)).forEach(change => console.dir(change.data()))
  }
})