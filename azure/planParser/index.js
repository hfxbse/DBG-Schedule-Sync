const DSB = require('dsbapi')
const https = require('https')
const HTMLParser = require('node-html-parser')

const admin = require('firebase-admin');
const serviceAccount = require('./service_account.json')

if (process.env.ASPNETCORE_ENVIRONMENT === 'Production') {
  admin.initializeApp({credential: admin.credential.cert(serviceAccount)})
} else {
  admin.initializeApp({projectId: 'dbg-schedule-sync'})
}

const scheduleUpdater = require('./scheduleUpdater').scheduledUpdater

async function download(url, encoding) {
  return new Promise((resolve, reject) => {
    https.get(url, response => {
      let content = '';

      if (encoding) {
        response.setEncoding(encoding)
      }

      response.on('data', chunk => content += chunk);
      response.on('end', () => resolve(content));
      response.on('error', reject)
    })
  })
}

function prepareClasses(text) {
  if (text[0] !== 'K' && text[0] !== 'F') {
    let grade = text[0]
    text = text.substring(1)

    if (grade === '1') {
      grade += text[0]
      text = text.substring(1)
    }

    let classes = []
    for (let character of text) {
      classes.push(grade + character)
    }

    return classes
  } else {
    return [text]
  }
}

function parseRow(row) {
  let result = {}

  row.childNodes.forEach((column, index) => {
    switch (index) {
      case 0:
        result.classes = prepareClasses(column.text);
        break;
      case 1:
        result.lessons = column.text.trim()
        break
      case 2:
        result.kind = column.text.trim()
        break
      case 3:
        result.old_subject = column.text.trim()
        break
      case 4:
        result.new_subject = column.text.trim()
        break
      case 5:
        result.room = column.text.trim()
        break
      case 6:
        result.text = column.text.trim()
        break
    }
  })

  return result
}

function adjustTimezone(date) {
  let invdate = new Date(date.toLocaleString('en-US', {
    timeZone: 'Europe/Berlin'
  }));

  let diff = date.getTime() - invdate.getTime();

  return new Date(date.getTime() + diff);
}

function updatePlanInfo(doc, batch, website) {
  const updateText = website.querySelector('.mon_head').querySelector('p').childNodes
  const dateText = website.querySelector('.mon_title').rawText

  // adjust from german date time style
  let updateDateTime = updateText[updateText.length - 1].rawText.split(/ +/)
  updateDateTime.shift()

  const date = updateDateTime[1].split('.')
  const time = updateDateTime[2].split(':')

  updateDateTime = new Date(Number(date[2]), Number(date[1]) - 1, Number(date[0]), Number(time[0]), Number(time[1]))

  let planDate = dateText.split(/ +/)[0].split('.')
  planDate = adjustTimezone(new Date(Number(planDate[2]), Number(planDate[1]) - 1, Number(planDate[0])))

  let information = []
  let elements = website.querySelector('.info')

  if (elements) {
    elements.querySelectorAll('td').forEach(item => information.push(item.text))
  }

  batch.set(doc, {
    synced: admin.firestore.FieldValue.serverTimestamp(),
    date: planDate,
    updated: updateDateTime,
    information: information,
    week: dateText[dateText.length - 1]
  })
}

async function updateEntries(doc, batch, website) {
  let entries = doc.collection('entries')
  let snapshot = await entries.get()
  snapshot.docs.forEach(entry => batch.delete(entry.ref))

  let previousText = undefined
  let previousRow = {}
  let entry = undefined

  website.querySelector('.mon_list').childNodes.reverse().forEach(node => {
    if (node.classNames && node.classNames.length > 1) {
      let row = parseRow(node)

      // catch additional text
      if (
          row.classes.length === 0 &&
          row.lessons === '' &&
          row.kind === '' &&
          row.old_subject === '' &&
          row.new_subject === '' &&
          row.room === '' &&
          row.text !== ''
      ) {
        previousText = !previousText ? row.text : `${row.text} ${previousText}`
      } else {
        if (previousText !== undefined) {
          row.text += ` ${previousText}`
          previousText = undefined
        }

        if (
            JSON.stringify(previousRow.classes) === JSON.stringify(row.classes) &&
            previousRow.kind === row.kind &&
            previousRow.new_subject === row.new_subject &&
            previousRow.old_subject === row.old_subject &&
            previousRow.text === row.text &&

            !/-/.test(previousRow.lessons) &&
            !/-/.test(row.lessons) &&
            Number(previousRow.lessons) - 1 === Number(row.lessons)
        ) {
          row.lessons += ` - ${previousRow.lessons}`
          previousRow = {}

          batch.set(entry, row)
        } else {
          previousRow = {...row}

          entry = entries.doc()
          batch.set(entry, row)
        }
      }
    }
  })
}

module.exports = async function (context) {
  const dsb = new DSB(process.env.DSB_MOBILE_USER, process.env.DSB_MOBILE_PASSWORD)

  try {
    const data = await dsb.fetch();
    const timetables = DSB.findMethodInData('timetable', data)

    const db = admin.firestore();
    const batch = db.batch();

    for (let i = 0; i < timetables.data.length; i++) {
      let table = timetables.data[i]

      const website = HTMLParser.parse(await download(table.url, 'latin1'))

      let doc = db.collection('plans').doc(String(i + 1))
      updatePlanInfo(doc, batch, website)
      await updateEntries(doc, batch, website)
    }

    await batch.commit()

    context.log.verbose(`Updated the representation plans successfully.`)

    for (let i = 0; i < timetables.data.length; i++) {
      await scheduleUpdater(i + 1, context)
    }

    context.log.verbose(`Synced the calenders successfully.`)
  } catch (e) {
    context.log.error(`Failed to update representation plans: ${e}`)
    throw e
  }
}
