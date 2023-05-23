# DBG Schedule Sync

![Icon](https://i.imgur.com/BvxYrRZt.png)

A web service to sync the representation plan of the school [DBG Metzingen](https://dbg-metzingen.de), which is hosted
on [DSBmobile](https://www.dsbmobile.de), to [Google Calendar](https://calendar.google.com). It is built using
[Firebase](https://firebase.google.com). For mailing, [AWS SES](https://aws.amazon.com/ses/) is used.

Only the changes which are relevant to the individual student get synced to their calendar. A separate secondary
calendar gets created for the plan, which then looks something like the image below.
![Synced calendar on Google Calendar](https://i.imgur.com/SirZztp.png)
At the start of the new school year, all active users receive an email, reminding them to adjust their settings to their
new schedule accordingly.

The web app running in production can be found on [dbg-vertretung.stubit.tv](https://dbg-vertretung.stubit.tv/).

# Deployment

Before the service can be deployed successfully, config files and environment variables need to be added.

## Frontend

The Firebase SDK configuration can be configured via environment variables with a nearly identical name. Remember that
it is possible to create a `.env`-file to set them only once.

| JSON field name     | Environment variable                                                                                                                      |
|---------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| `apiKey`            | `VUE_APP_API_KEY`                                                                                                                         |
| `authDomain`        | `VUE_APP_DOMAIN`                                                                                                                          |
| `authDomain`        | `VUE_APP_ALT_DOMAIN` _In case your website can be reached from another domain.<br/>If not, it should be set identically to the previous._ |
| `databaseURL`       | `VUE_APP_DATABASE_URL`                                                                                                                    |
| `projectId`         | `VUE_APP_PROJECT_ID`                                                                                                                      |
| `storageBucket`     | `VUE_APP_STORAGE_BUCKET`                                                                                                                  |
| `messagingSenderId` | `VUE_APP_MESSAGING_SENDER_ID`                                                                                                             |
| `appId`             | `VUE_APP_APP_ID`                                                                                                                          |
| `measurementId`     | `VUE_APP_MEASUREMENT_ID`                                                                                                                  |

The Google-OAuth client ID can be set via the `VUE_APP_GOOGLE_OAUTH_CLIENT_ID` environment variable. In addition, to get
verified by Google to use it in production, add your privacy notice PDF as `public/privacy.pdf`.

To verify your website for Google Search indexing, you can set the verification code via `GOOGLE_VERIFICATION_ID_ONE`,  
and for the second domain via `GOOGLE_VERIFICATION_ID_TWO`.

The social media preview image URL, which will show the chosen image when your website is linked, can be set via
`PREVIEW_IMAGE`.

## Backend

All required config files need to be at the root of the `functions`-directory. In addition, the appropriate accounts
need to be created for the cloud services.

The sign-in process needs the same Firebase SDK configuration as the frontend but in a less modified form. Create
`web_client.json`, in which you copy your configuration, and change to formatting to be proper JSON. The field names
stay unmodified. It should look like this:

```json
{
  "apiKey": "",
  "appId": "",
  "authDomain": "",
  "databaseURL": "",
  "measurementId": "",
  "messagingSenderId": "",
  "projectId": "",
  "storageBucket": ""
}
```

Download your OAuth client configuration to complete the sign-up process as JSON and save it as `oauth_client.json`.

Download your service account credentials to access the Google Calendar API and Firebase as JSON and save it as
`service_account.json`.

The rest of the configuration is done via the
[Firebase environment configuration](https://firebase.google.com/docs/functions/config-env?gen=1st#environment_configuration).
The keys are as follows:

| Configuration key                       | Description                                                                               |
|-----------------------------------------|-------------------------------------------------------------------------------------------|
| `aws.email.debug_addresses`             | Email addresses which will receive emails while debugging.                                |
| `aws.email.templates.permissions`       | Email template name, which informs the user about missing calendar access permissions.    |
| `aws.email.templates.new_year_reminder` | Email template name, which reminds the user to adjust their settings for the new year.    |
| `aws.email.source_address`              | Email addresses to send emails from.                                                      |
| `aws.region`                            | AWS service region.                                                                       |
| `aws.key_id`                            | AWS service account key ID.                                                               |
| `aws.access_key`                        | AWS service account access key. **Should be replaced by the Google Cloud Secret Manger.** |
| `web_app.address`                       | URL to your web app that will be added to the calendar description.                       |
| `dsb.password`                          | DSB password.  **Should be replaced by the Google Cloud Secret Manger.**                  |
| `dsb.user`                              | DSB username.                                                                             |
