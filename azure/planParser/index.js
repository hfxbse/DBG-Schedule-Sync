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
        result.lessons = column.text
        break
      case 2:
        result.kind = column.text
        break
      case 3:
        result.old_subject = column.text
        break
      case 4:
        result.new_subject = column.text
        break
      case 5:
        result.room = column.text
        break
      case 6:
        result.text = column.text
        break
    }
  })

  return result
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
  planDate = new Date(Number(planDate[2]), Number(planDate[1]) - 1, Number(planDate[0]))

  let information = []
  website.querySelector('.info').querySelectorAll('td').forEach(item => information.push(item.text))

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

  website.querySelector('.mon_list').childNodes.forEach(node => {
    if (node.classNames && node.classNames.length > 1) {
      batch.set(entries.doc(), parseRow(node))
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
  } catch (e) {
    context.log.error(`Failed to update representation plans: ${e}`)
    throw e
  }
}
