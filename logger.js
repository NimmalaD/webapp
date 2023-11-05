const winston = require('winston');

const logger = winston.createLogger({
  format: winston.format.json(
    winston.format.timestamp()
  ),
  transports: [
    new winston.transports.Console(), 
    new winston.transports.File({ filename: 'logs.log'}) 
  ]
});

module.exports = logger;