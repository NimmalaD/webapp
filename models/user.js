const sequelize = require("./index.js");
const Sequelize = require("sequelize");

const User = sequelize.define(
  "user",
  {
    uid: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV1,
      primaryKey: true,
    },
    first_name: {
      type: Sequelize.STRING,
      allownull: false,
    },
    last_name: {
      type: Sequelize.STRING,
      allownull: false,
    },
    email: {
      type: Sequelize.STRING,
      unique: true,
      allownull: false,
    },
    password: {
      type: Sequelize.STRING,
      allownull: false,
    },
    account_created: {
      type: Sequelize.DATE,
    },
    account_updated: {
      type: Sequelize.DATE,
    },
  },
  {
    createdAt: "account_created",
    updatedAt: "account_updated",
  }
);

module.exports = User;
