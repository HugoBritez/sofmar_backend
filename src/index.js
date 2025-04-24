const app  = require('./app');
const fs = require('fs');
const https = require('https');

/*
    cert: fs.readFileSync('/home/hmedical-node/server.cer'),
    key: fs.readFileSync('/home/hmedical-node/server.key')

    cert: fs.readFileSync('server.cer'),
    key: fs.readFileSync('server.key')
*/

https.createServer({
    cert: fs.readFileSync('server.cer'),
    key: fs.readFileSync('server.key')
    }, app).listen(app.get('port'), () => {
        console.log('Puerto habilitado: ', app.get('port'))  
})
