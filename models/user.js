const sequelize = require("./index.js");
const Sequelize = require("sequelize");

const userModel = (sequelize)=> {
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
        writeonly: true
      },
      account_created: {
        type: Sequelize.DATE,
        readonly: true
      },
      account_updated: {
        type: Sequelize.DATE,
        readonly: true
      },
    },
    {
      createdAt: "account_created",
      updatedAt: "account_updated",
    }
  );
  return User
}


module.exports = userModel;
