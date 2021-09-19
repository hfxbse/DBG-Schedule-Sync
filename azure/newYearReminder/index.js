const AWS = require('aws-sdk')
const fs = require('fs')
const {minify} = require('html-minifier')

AWS.config.update({region: process.env.AWS_REGION})

const SES = new AWS.SES({apiVersion: '2010-12-01'})

const { admin } = require("../admin");

const db = admin.firestore()
const auth = admin.auth();

async function sendEmails(recipients) {
  const template = {
    Template: {
      TemplateName: process.env.AWS_EMAIL_TEMPLATE,
      SubjectPart: fs.readFileSync(__dirname + '/emailSubject.txt').toString(),
      TextPart: fs.readFileSync(__dirname + '/email.txt').toString(),
      HtmlPart: minify(fs.readFileSync(__dirname + '/email.html').toString(), {
        collapseBooleanAttributes: true,
        includeAutoGeneratedTags: false,
        minifyCSS: true,
        processConditionalComments: true,
        removeComments: true,
        removeEmptyAttributes: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        sortAttributes: true,
        sortClassName: true,
      })
    }
  }

  try {
    await SES.updateTemplate(template).promise();
  } catch (e) {
    if(e.code === "TemplateDoesNotExist") {
      await SES.createTemplate(template).promise()
    } else {
      throw e
    }
  }

  await SES.sendBulkTemplatedEmail({
    Destinations: recipients.map(recipient => ({
        Destination: {
          ToAddresses: [
            recipient.address
          ]
        },
        ReplacementTemplateData: JSON.stringify({name: recipient.name})
    })),
    Source: `DBG Vertretungsplan Synchronisation <${process.env.AWS_EMAIL_SOURCE}>`,
    Template: process.env.AWS_EMAIL_TEMPLATE,
    DefaultTemplateData: JSON.stringify({}),
  }).promise()
}

module.exports = async function (context) {
  let calendars = await db.collection('calendars').get()
  calendars = calendars.docs.filter(doc => {
    const data = doc.data().google;
    return 'id' in data && 'refresh_token' in data;
  })

  if(calendars.length > 0) {
    let recipients = await Promise.all(calendars.map(doc => (async () => {
      try {
        const user = await auth.getUser(doc.id)
        return {address: user.email, name: user.displayName.replace("​", "").trim()}
      } catch (e) {
        context.log.warn(e)
        return undefined;
      }
    })()));

    recipients = recipients.filter(address => address !== undefined)

    if(recipients.length > 0) {
      await sendEmails(recipients.filter(recipient => recipient !== undefined));
      return
    }
  }

  context.log.info("No emails send as there are no active users.");
};