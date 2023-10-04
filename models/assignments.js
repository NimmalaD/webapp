const sequelize = require('./index.js')
const Sequelize = require('sequelize');


    const Assignment = sequelize.define('assignments', {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV1,
            primaryKey: true
          },
        name:{
            type: Sequelize.STRING,
            allownull: false
        },
        points: {
            type: Sequelize.NUMBER,
            allownull: false,
            validate: {
                isInt: true, // Ensure the value is an integer
                min: 18,     // Minimum age limit
                max: 100,    // Maximum age limit
              },
        },
        num_of_attempts: {
            type: Sequelize.NUMBER,
            allownull: false,
            validate: {
                isInt: true, 
                min: 1,     
                max: 100,   
              },
        },
        deadline: {
            type: Sequelize.STRING,
            allownull:false
        },
        asignment_created: {
            type: Sequelize.DATE
          },
          assignment_updated: {
            type: Sequelize.DATE
          },
    },{
        createdAt: 'asignment_created',
        updatedAt: 'assignment_updated'
    });

    module.exports = Assignment;