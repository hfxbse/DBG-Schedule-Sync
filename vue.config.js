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
            title: 'DBG Vertretungsplan Synchronisation'
        }
    }
};
