# DBG Schedule Sync

![Icon](https://i.imgur.com/BvxYrRZt.png)

A web service to sync the representation plan of the school [DBG Metzingen](https://dbg-metzingen.de), which is hosted
on [DSBmobile](https://www.dsbmobile.de), to [Google Calendar](https://calendar.google.com). It is build using
[Firebase](https://firebase.google.com), as well as serverless functions running on
[Azure](https://azure.microsoft.com/en-us/). For mailing, [AWS SES](https://aws.amazon.com/ses/) is used.

Only the changes which are relevant to the individual student get synced to their calendar. A separate secondary
calendar gets created for the plan, which then looks something like in the image below.
![Synced calendar on Google Calendar](https://i.imgur.com/SirZztp.png)
At the start of the new school year, all active users receive an email, reminding them to adjust their settings
to their new schedule accordingly.

The web app running in production can be found on [dbg-vertretung.stubit.tv](https://dbg-vertretung.stubit.tv/).
