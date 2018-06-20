const express = require('express');
const https = require('https');
const logger = require('./functions/logger');
const { PROJECT_DOMAIN } = process.env;
const app = express();
const port = process.env.PORT || 5000;
const domain = PROJECT_DOMAIN ? `https://${PROJECT_DOMAIN}.glitch.me/` : 'http://localhost:%s/';
app.get('/', (req, res) => {
  return res.status(200).send('Ok');
});
setInterval(() => {
  https.get(domain);
}, 280000);
app.listen(port, () => {
  logger.info(`App listening at ${domain}`, port);
});