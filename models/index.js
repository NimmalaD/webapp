const dbConfig = require("../config/dbConfig.js");

const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.user,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
  }
);

// sequelize.authenticate(() => {
//   try {
//     console.log("database connected...");
//   } catch (error) {
//     console.log("error" + err);
//   }
// });

module.exports = sequelize;
