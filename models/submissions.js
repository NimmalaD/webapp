const sequelize = require("./index.js");
const Sequelize = require("sequelize");
const submissionModel = (sequelize)=> {
  const Submissions = sequelize.define(
    "submissions",
    {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV1,
        primaryKey: true,
        readonly : true
      },
      submission_url: {
        type: Sequelize.STRING,
        allownull: false,
        validate: {
          isUrl: true,
        },
      },
      submission_date : {
        type: Sequelize.DATE,
        readonly: true
      },
      submission_updated : {
        type: Sequelize.DATE,
        readonly: true
      },
    },
    {
      createdAt: "submission_date",
      updatedAt: "submission_updated",
    }
  );
  return Submissions
}


module.exports = submissionModel;
