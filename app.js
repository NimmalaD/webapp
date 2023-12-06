const express = require("express");
const createUser = require("./createUser");
const app = express();
const bcrypt = require("bcrypt");
const {sequelize,db,sequelizesync,User,Assignment,Submission} = require("./models/index");
const snsService = require('./snsService.js')
const mysql = require('mysql2')
const logger = require("./logger.js");
const client = require("./statsD.js")
require('dotenv').config();
app.use(express.json());


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const port = process.env.PORT;

(async () => {
  try {
    logger.info('[' + new Date().toISOString() + '] Starting database setup and server initialization.');
    await db();
    await sequelize.sync({ alter: true });
    await createUser();
    logger.info('[' + new Date().toISOString() + '] Server listening')
    app.listen(port, () => {
      console.log("Server running on port", port)});
    logger.info('[' + new Date().toISOString() + '] Database setup and server initialization succeeded.');
  } catch (error) {
    console.error("Error:", error);
  };
    }
  )();

const isAuth = async (req, res, next) => {
  if(req.method == "GET" && req.originalUrl == '/v1/assignments/'){
    client.increment('assignment_get')
  }
  else if(req.method == "GET" ){
    client.increment('assignment_getbyid')
  }
  else if(req.method == "POST"){
    client.increment('assignment_post')
  }
  else if(req.method == "PUT"){
    client.increment('assignment_put')
  }
  else if(req.method == "DELETE"){
    client.increment('assignment_delete')
  }
  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader || !authorizationHeader.startsWith("Basic ")) {
    logger.info("Basic Auth not selected")
    return res.status(401).json({ message: "Unauthorized" });
  }
  const credentials = getUser(authorizationHeader);
  const [email, password] = credentials.split(":");
  const user = await User.findOne({ where: { email } });
  console.log(user);
  try {
    if (!user) {
      logger.info(`Unauthorized User - ${email} not found`)
      return res.status(401).json({ message: "Unauthorized" });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (passwordMatch) {
      next();
    } else {
      logger.info(`Unauthorized User - ${password} did not match`)
      return res.status(401).json({ message: "Unauthorized User" });
    }
  } catch (error) {
    logger.error(`Authentication error ${error}`)
    console.error("Authentication Error:", error);
    res.status(500).send("Internal Server Error");
  }
};

// API endpoint that requires basic authentication
app.get("/protected", isAuth, async (req, res) => {
  res.json({ message: "Authenticated" });
  console.log(res);
});

const getUser = (authorizationHeader) => {
  const credentials = Buffer.from(
    authorizationHeader.split(" ")[1],
    "base64"
  ).toString("utf-8");
  return credentials;
  // const [email] = credentials.split(':');
  // const user = await User.findOne({ where: { email }})
  // return user;
  // console.log(user)
  // const userId = user.uid;
};

User.hasMany(Assignment, {
  foreignKey: "user_id",
});
Assignment.belongsTo(User, {
  foreignKey: "user_id",
});
Assignment.hasMany(Submission, {
  foreignKey : "assignment_id"
})
Submission.belongsTo(Assignment, {
  foreignKey : "assignment_id"
})


function isValidDate(dateString) {
  const date = new Date(dateString);
  return !isNaN(date) && dateString !== "";
}

app.post("/demo/assignments", isAuth, async (req, res) => {
  // client.increment("post assignment")
  try {
    const postCredentials = getUser(req.headers.authorization);
    const [email] = postCredentials.split(":");
    const user = await User.findOne({ where: { email } });
    const userId = user.uid;
    console.log(userId);
    if (
      !req.body.name ||
      !req.body.points ||
      !req.body.num_of_attempts ||
      !req.body.deadline
    ) {
      logger.info('Please provide all fields')
      return res.status(400).json({ message: "Please provide all the fields" });
    }
    if (typeof req.body.name !== "string") {
      logger.info('Invalid input')
      return res.status(400).json({ message: "name should be string" });
    }
    if(!Number.isInteger(req.body.num_of_attempts) || !Number.isInteger(req.body.points)){
      logger.info('Please provide all fields')
      return res.status(400).json({message: 'Give valid number'})
    }
    if(req.body.points > 100 || req.body.points <= 0){
      logger.info('Invalid input')
      return res.status(400).json({message: 'Check min and max'})
    }
    if(req.body.num_of_attempts > 100 || req.body.num_of_attempts <= 0){
      logger.info('Invalid input')
      return res.status(400).json({message: 'Check min and max'})
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
    if (!dateRegex.test(req.body.deadline)) {
      logger.info('Invalid input')
    return res.status(400).json({ message: "deadline should be in date format (e.g., 'YYYY-MM-DDTHH:mm:ss.sssZ')" });
    }
    if(req.body.assignment_created || req.body.assignment_updated){
      logger.info('No access permission')
        return res.status(403).json({message: "No access permission"})
    }
    const newAssignment = new Assignment({
      ...req.body,
      user_id: userId,
    })
    try{
    const saveAssignment = await newAssignment.save()
    res.status(201).json(saveAssignment);
    logger.info(`Assignnment "${req.body.name}" created`)
    } catch(error){
      logger.error('Error:', error)
    }
    //console.log(res)
  } catch (error) {
    logger.error('[' + new Date().toISOString() + '] Error:', error)
    return res.status(500).send()
  }
});


app.put("/demo/assignments/:id", isAuth, async (req, res, next) => {
  // client.increment("put assignment")
  const assignmentId = req.params.id;
  try {
    const postCredentials = getUser(req.headers.authorization);
    const [email] = postCredentials.split(":");
    const user = await User.findOne({ where: { email } });
    const userId = user.uid;
    console.log(userId);
    const updatedAssignment = req.body;
    const options = { new: true };
    const assignment = await Assignment.findByPk(assignmentId);
    if (!assignment) {
      logger.info(`Assignment with id: "${assignmentId}" not found`)
      return res.status(404).send("Assignment not found" );
    }
    if (assignment.user_id !== userId) {
      logger.info('Forbidden user')
      return res.status(403).json({ message: "Forbidden" });
    }
    if(!req.body.name || !req.body.deadline || !req.body.num_of_attempts || !req.body.points){
      logger.info('Provide all fields')
        return res.status(400).json({message: "Provide all fields"})
    }
    if (typeof req.body.name !== "string") {
      logger.info('invalid input')
      return res.status(400).json({ message: "name should be string" });
    }
    if(!Number.isInteger(req.body.num_of_attempts) || !Number.isInteger(req.body.points)){
      logger.info('invalid input')
      return res.status(400).json({message: 'Give valid number'})
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
    if (!dateRegex.test(req.body.deadline)) {
      logger.info('invalid input')
    return res.status(400).json({ message: "deadline should be in date format (e.g., 'YYYY-MM-DDTHH:mm:ss.sssZ')" });
    }
    if(req.body.assignment_created || req.body.assignment_updated){
      logger.info('No access permission')
        return res.status(403).json({message: "No access permission"})
    }
    await assignment.update(updatedAssignment).then(()=> {
      logger.info(`Assignment "${req.body.name}" Updated`)
        return res.status(204).send();
    }).catch((error)=>{
      logger.error('[' + new Date().toISOString() + '] Check min and max')
        return res.status(400).json({message:'check min and max'})
    })
    
  } catch (error) {
    logger.error('[' + new Date().toISOString() + '] Error:', error)
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


app.get("/demo/assignments", isAuth, async (req, res, next) => {
  // client.increment("get assignments")
  //const assignmentId = req.params.id;
  try {
    const assignments = await Assignment.findAll();
    if (!assignments) {
      logger.info('Assignments not found')
      res.send(202).json({ message: "Assignments not found" });
    } else {
      logger.info('Assignments Found')
      res.send(assignments);
    }
  } catch (error) {
    loffer.error('[' + new Date().toISOString() + '] Error:', error)
    res.status(500).send();
  }
});


app.get("/demo/assignments/:id", isAuth, async (req, res, next) => {
  // client.increment("get assignment using id")
  try {
    const assignmentId = req.params.id;
    // Find the assignment by ID
    const assignment = await Assignment.findByPk(assignmentId);
    if (!assignment) {
      logger.info(`Assignment with id: "${assignmentId}" not found`)
      return res.status(404).json({ message: "Assignment not found" });
    }else{
      logger.info('[' + new Date().toISOString() + '] Assignment found')
    res.status(200).json(assignment);
  }
  } catch (error) {
    console.error(error.message);
    logger.error('[' + new Date().toISOString() + '] Error:', error)
    res.status(500).send()
  }
});


app.delete("/demo/assignments/:id", isAuth, async (req, res, next) => {
  // client.increment("delete assignment");
  const assignmentId = req.params.id;
  try {
    const postCredentials = getUser(req.headers.authorization);
    const [email] = postCredentials.split(":");
    const user = await User.findOne({ where: { email } });
    const userId = user.uid;
    console.log(userId);
    //const deletedAssignment = req.body;
    //const options = { new: true };
    const assignment = await Assignment.findByPk(assignmentId);
    if (!assignment) {
      logger.info(`Assignment with id: "${assignmentId}" not found`)
        return res.status(404).json({ message: "Assignment not found" });
      }
    if (assignment.user_id !== userId) {
      logger.info('forbidden user')
      return res.status(403).json({ message: "Forbidden" });
    }
    await assignment.destroy(assignment);
    logger.info(`Assignment ${assignmentId} Deleted`)
    return res.status(204).send();
  } catch (error) {
    logger.error('[' + new Date().toISOString() + '] Error:', error)
    return res.status(500).send()
  }
});

app.patch('/*', isAuth, async(req,res,next)=>{
  // client.increment("patch assignment");
  logger.info('[' + new Date().toISOString() + '] Patch not allowed')
    return res.send(405)
})


app.post("/demo/assignments/:id/submission", isAuth, async (req, res) => {
  try {
    const postCredentials = getUser(req.headers.authorization);
    const [email] = postCredentials.split(":");
    const user = await User.findOne({ where: { email } });
    console.log(email)
    const assignmentId = req.params.id;
    const { submissionDetails, submission_url } = req.body;
    const assignment = await Assignment.findByPk(assignmentId)
    if(!assignment){
      return res.status(404).json("Assignment not found")
    }
    const numAttempts = await Submission.count({
      where: { assignment_id: assignmentId }
    });
    const currentDate = new Date();
    if(currentDate > assignment.deadline){
      return res.status(403).json("Cannot submit after deadline")
    }
    if (numAttempts >= assignment.num_of_attempts) {
      return res.status(403).json({ message: "Exceeded maximum attempts" });
    }
    if(!req.body.submission_url){
        return res.status(400).json("required fields are missing")
      }
    // Create a new submission
    const newSubmission = await Submission.create({
      assignment_id : assignmentId,
      submission_details: submissionDetails,
      ...req.body
    });
    res.status(201).json(newSubmission);
    console.log(newSubmission);
    try {
      await snsService.postToSNSTopic(email,submission_url);
      logger.info("message posted successfully")
    } catch (error) {
      logger.info("cannot post the message")
    }
  } 
   catch (error) {
    logger.error('Error submitting assignment:', error);
    res.status(500).json({ message: "Error submitting assignment" });
  }
});

//Set 405 Method not allowed if the request is not GET
app.use((request, response, next) => {
    if (request.method === "GET") {
      next();
    } else {
      response.status(405).send();
    }
  });
  
  //GET request for health check api
  app.get("/healthz", async (req, res) => {
    client.increment("/healthz");
    if (Object.keys(req.body).length > 0) {
      return res.status(400).end();
    }
    //should not require params
    if (Object.keys(req.query).length > 0) {
      return res.status(400).end();
    }
    res.setHeader("Cache-Control", "no-cache");
    try {
      // Test the database connection
      await sequelize.authenticate();
      logger.info('[' + new Date().toISOString() + '] Database connected successfully')
      console.log("Database connection established successfully.");
      res.status(200).send();
    } catch (error) {
      logger.error('[' + new Date().toISOString() + '] Database connection failed')
      console.error("Database connection failed:", error);
      res.status(503).send();
    }
  });
  
module.exports = app;

