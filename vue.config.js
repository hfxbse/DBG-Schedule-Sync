module.exports = {
    pwa: {
        name: 'DBG Stundenplan Synchronisation',
        themeColor: '#FFF',
        msTileColor: '#FFF',
        workboxOptions: {
            skipWaiting: true,
        },
    },
    pages: {
        index: {
            entry: 'src/main.js',
            title: 'DBG Vertretungsplan Synchronisation',
            preview: process.env.PREVIEW_IMAGE,
            googleVerificationIdOne: process.env.GOOGLE_VERIFICATION_ID_ONE,
            googleVerificationIdTwo: process.env.GOOGLE_VERIFICATION_ID_TWO
        }
    }
};
