let DSB;
let https;
let HTMLParser;

const functions = require('firebase-functions');
let admin;
let fieldValue;

let createEvent;

async function download(url, encoding) {

  return new Promise((resolve, reject) => {
    https.get(url, response => {
      let content = '';

      if (encoding) {
        response.setEncoding(encoding);
      }

      response.on('data', chunk => content += chunk);
      response.on('end', () => resolve(content));
      response.on('error', reject);
    });
  });
}

function prepareClasses(text) {
  // entry other than a list of grades
  if (!/((\d{1,2}[a-z]+)|K\d{1,2})+/ig.test(text)) {
    return [text, 'other'];
  }

  let grade = text[0];
  text = text.substring(1);

  if (grade === '1') {
    grade += text[0];
    text = text.substring(1);
  }

  let classes = [];
  while (text.length > 0) {
    const firstChar = text[0];
    text = text.substring(1);

    // a K or a number while not in a K grade section indicates a new grade
    if (firstChar === 'K' || grade !== 'K' && !isNaN(Number.parseInt(firstChar))) {
      grade = firstChar;

            // a grade higher or equal to grade 10
            if (grade === '1') {
                grade += firstChar;
            }

            continue;
        }

        classes.push(grade + firstChar);
    }

  return classes;
}

function parseRow(row) {
  let result = {};

  row.childNodes.forEach((column, index) => {
    switch (index) {
      case 0:
        result.classes = prepareClasses(column.text);
        break;
      case 1:
        result.lessons = column.text.trim();
        break;
      case 2:
        result.kind = column.text.trim();
        break;
      case 3:
        result.old_subject = column.text.trim();
        break;
      case 4:
        result.new_subject = column.text.trim();
        break;
      case 5:
        result.room = column.text.trim();
        break;
      case 6:
        result.text = column.text.trim();
        break;
    }
  });

  return result;
}

function adjustTimezone(date) {
  let localDate = new Date(date.toLocaleString('en-US', {
    timeZone: 'Europe/Berlin'
  }));

  let diff = date.getTime() - localDate.getTime();

  return new Date(date.getTime() + diff);
}

function updatePlanInfo(doc, batch, website) {
  const updateText = website.querySelector('.mon_head').querySelector('p').childNodes;
  const dateText = website.querySelector('.mon_title').rawText;

  // adjust from german date time style
  let updateDateTime = updateText[updateText.length - 1].rawText.split(/ +/);
  updateDateTime.shift();

  const date = updateDateTime[1].split('.');
  const time = updateDateTime[2].split(':');

  updateDateTime = new Date(Number(date[2]), Number(date[1]) - 1, Number(date[0]), Number(time[0]), Number(time[1]));

  let planDate = dateText.split(/ +/)[0].split('.');
  planDate = adjustTimezone(new Date(Number(planDate[2]), Number(planDate[1]) - 1, Number(planDate[0])));

  let information = [];
  let elements = website.querySelector('.info');

  if (elements) {
    elements.querySelectorAll('td').forEach(item => {
      const info = item.text.trim();

      if (!(/Vertretungsplan:? (Herr|Frau) \w+/i).test(info)) {
        information.push(info);
      }
    });
  }

  batch.set(doc, {
      synced: fieldValue.serverTimestamp(),
      date: planDate,
      updated: updateDateTime,
      information: information,
      week: dateText[dateText.length - 1]
  });

  return planDate;
}

function compareEntryData(row, other) {
  return JSON.stringify(other.classes) === JSON.stringify(row.classes) &&
      other.kind === row.kind &&
      other.new_subject === row.new_subject &&
      other.old_subject === row.old_subject &&
      other.text === row.text;
}

async function updateEntries(doc, batch, website, planDate) {
    let entries = doc.collection('entries');
    let snapshot = await entries.get();
    snapshot.docs.forEach(entry => batch.delete(entry.ref));

    let previousText = undefined;
    let previousRow = {};
    let entry = undefined;

    website.querySelector('.mon_list').childNodes.slice(1).reverse().forEach(node => {
        if (node.classNames && node.classNames.length > 1) {
            let row = parseRow(node);

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
                previousText = !previousText ? row.text : `${row.text} ${previousText}`;
            } else {
                if (previousText !== undefined) {
                    row.text += ` ${previousText}`;
                    previousText = undefined;
                }

        createEvent = require("./event").createEvent;

        if (
            compareEntryData(previousRow, row) &&
            !/-/.test(previousRow.lessons) &&
            !/-/.test(row.lessons) &&
            Number(previousRow.lessons) - 1 === Number(row.lessons)
        ) {
          row.lessons += ` - ${previousRow.lessons}`;
          previousRow = {};

          batch.set(entry, {...row, event: createEvent(row, planDate)});
        } else if (!(compareEntryData(previousRow, row) && previousRow.lessons === row.lessons)) {
          previousRow = {...row};

          entry = entries.doc();
          batch.set(entry, {...row, event: createEvent(row, planDate)});
        }
      }
    }
  });
}

const functionOptions = functions
    .region('europe-west1')
    .pubsub.schedule('10 9,15 * * 1-5').timeZone('Europe/Berlin');

exports.parser = functionOptions.onRun(async () => {
  https = require('https');
  HTMLParser = require('node-html-parser');

  DSB = require('dsbapi');
    admin = require("firebase-admin");
    fieldValue = require("firebase-admin/firestore").FieldValue;

  const {dsb: config} = functions.config();
  const dsb = new DSB(config.user, config.password);

  const data = await dsb.fetch();
  const timetables = DSB.findMethodInData('timetable', data);

  const db = admin.firestore();
  const batch = db.batch();


  await Promise.all(timetables.data.map((table, index) => (async () => {
    // noinspection JSCheckFunctionSignatures
    const website = HTMLParser.parse(await download(table.url, 'latin1'));

    let doc = db.collection('plans').doc(String(index + 1));
    let planDate = updatePlanInfo(doc, batch, website);

    await updateEntries(doc, batch, website, planDate);
  })()));

  await batch.commit();
});
