const dbConfig = require("../config/dbConfig.js");

const { Sequelize, DataTypes } = require("sequelize");
const mysql = require("mysql2/promise");
const UserModel = require("../models/user.js");
const AssignmentModel = require("../models/assignments.js");
require('dotenv').config();

const database = process.env.DB_NAME
const user = process.env.DB_USER
const password = process.env.DB_PASSWORD
const host = process.env.DB_HOST
const dialect = process.env.DB_DIALECT;

const sequelizesync = async () => {
  await sequelize.sync({ alter: true });
  console.log("Models synchronized successfully.");
};


const db = async () => {
  const connection = await mysql.createConnection({
    host: host,
    user: user,
    password: password,
  });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
};

const sequelize = new Sequelize(
  database,
  user,
  password,
  {
    host: host,
    dialect: dialect,
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