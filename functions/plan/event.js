const lessonTimings = require('./lesson_timings.json');
const changeTypes = require('./change_types.json');

function formatDateDigit(number) {
  number = String(number);

  return number.length === 1 ? `0${number}` : number;
}

function getApiDateString(date) {
  return `${date.getFullYear()}-${formatDateDigit(date.getMonth() + 1)}-${formatDateDigit(date.getDate())}`;
}

function getFirstReminderDiff(day, start) {
  let reminderTime = new Date(day);

  reminderTime.setHours(reminderTime.getHours() - 4);

  return Math.floor((start.getTime() - reminderTime.getTime()) / 60000);   // Convert milliseconds to minutes
}

exports.getApiDateString = getApiDateString;
exports.getFirstReminderDiff = getFirstReminderDiff;

exports.createEvent = (row, date) => {
  if (changeTypes[row.kind]) {
    row.kind = changeTypes[row.kind];
  }

  let summary, description;
  if (row.kind !== 'Entfall' && row.old_subject !== row.new_subject) {
    summary = `${row.new_subject} statt ${row.old_subject}`;

    if (row.text.trim() !== '') {
      description = `<b>${row.kind}</b>\n${row.text}`;
    } else {
      description = `<b>${row.kind}</b>`;
    }
  } else {
    summary = `${row.old_subject} ${row.kind}`;
    description = row.text;
  }

  if (row.classes.length > 1) {
    if (description !== '') {
      description += '\n';
    }

    description += '<em>';
    row.classes.forEach((c, index) => {
      description += `${index + 1 === row.classes.length ? ' und ' : index ? ', ' : ''}${c}`;
    });
    description += '</em>';
  }

  let lessons = [...row.lessons.matchAll(/\d+/gi)];
  let start = new Date(date);
  let end = new Date(date);

  let reminderTimeDiff;

  if (lessons.length) {
    let lesson = lessons[0][0];

    start.setHours(start.getHours() + Number(lessonTimings[lesson].start.hour));
    start.setMinutes(start.getMinutes() + Number(lessonTimings[lesson].start.minute));

    reminderTimeDiff = getFirstReminderDiff(date, start);

    start = {
      dateTime: start.toISOString()
    };

    if (lessons.length > 1) {
      lesson = lessons[1][0];
    }

    end.setHours(end.getHours() + Number(lessonTimings[lesson].end.hour));
    end.setMinutes(end.getMinutes() + Number(lessonTimings[lesson].end.minute));

    end = {
      dateTime: end.toISOString()
    };
  } else {
    reminderTimeDiff = getFirstReminderDiff(date, start);
    end.setDate(end.getDate() + 1);

    start = {date: getApiDateString(start)};
    end = {date: getApiDateString(end)};
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
  };

  if (row.kind !== 'Entfall') {
    event.location = row.room.trim();
  }

  return event;
};