const mongoose = require('mongoose');
const logger = require('../functions/logger');
mongoose.Promise = Promise;

const connection = mongoose.connection;
class MongoDB {
  static get db() {
    return connection.db;
  }
  static async start() {
    await mongoose.connect(process.env.DB_URL);
    logger.info('Successfully started the mongoDB');
  }
}
module.exports = MongoDB;