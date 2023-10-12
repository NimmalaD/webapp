const dbConfig = require("../config/dbConfig.js");

const { Sequelize, DataTypes } = require("sequelize");
const mysql = require("mysql2/promise");
const UserModel = require("../models/user.js");
const AssignmentModel = require("../models/assignments.js");

const sequelizesync = async () => {
  await sequelize.sync({ alter: true });
  console.log("Models synchronized successfully.");
};


const db = async () => {
  const connection = await mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
  });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
};

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.user,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
  }
);

const User = UserModel(sequelize);
const Assignment = AssignmentModel(sequelize);

module.exports = sequelize;


module.exports = {
  sequelize,
  db,
  sequelizesync,
  User,
  Assignment,
};
