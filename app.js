const express = require("express");
const createUser = require("./createUser");
const app = express();
const bcrypt = require("bcrypt");
const User = require("./models/user");
const Assignment = require("./models/assignments");
const sequelize = require("./models/index");
const mysql = require('mysql2')

app.use(express.json());


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


sequelize.sync({alter: true}).then(()=> {
    createUser() 
})

const isAuth = async (req, res, next) => {
  const authorizationHeader = req.headers.authorization;
  const credentials = getUser(authorizationHeader);
  const [email, password] = credentials.split(":");
  const user = await User.findOne({ where: { email } });
  console.log(user);
  try {
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (passwordMatch) {
      next();
    } else {
      return res.status(401).json({ message: "Unauthorized User" });
    }
  } catch (error) {
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
  if (!authorizationHeader) {
    return res.status(401).json({ message: "Unauthorized User" });
  }

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

app.post("/assignments", isAuth, async (req, res) => {
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
      return res.status(400).json({ message: "Please provide all the fields" });
    }
    if(req.body.assignment_created || req.body.assignment_updated){
        return res.status(403).json({message: "No access permission"})
    }
    const newAssignment = new Assignment({
      ...req.body,
      user_id: userId,
    })
    const saveAssignment = await newAssignment.save()
    .then((saveAssignment)=>{return res.status(201).json(saveAssignment)})
    .catch((err)=>{
        return res.status(400).json({message: 'check min and max'})
    })
    // res.send(saveAssignment);

    //console.log(res)
  } catch (err) {
    return res.status(500).send()
  }
});

app.put("/assignments/:id", isAuth, async (req, res, next) => {
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
      return res.status(404).send("Assignment not found" );
    }
    if (assignment.user_id !== userId) {
      return res
        .status(403)
        .json({ message: "Forbidden" });
    }
    if(!req.body.name || !req.body.deadline || !req.body.num_of_attempts || !req.body.points){
        return res.status(400).json({message: "Please provide the fields to update"})
    }
    if(req.body.assignment_created || req.body.assignment_updated){
        return res.status(403).json({message: "No access permission"})
    }
    await assignment.update(updatedAssignment).then(()=> {
        return res.json({ message: "Assignment updated successfully" });
    }).catch((err)=>{
        return res.status(400).json({message:'check min and max'})
    })
    
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/assignments", isAuth, async (req, res, next) => {
  //const assignmentId = req.params.id;
  try {
    const assignments = await Assignment.findAll();
    if (!assignments) {
      res.send(202).json({ message: "Assignments not found" });
    } else {
      res.send(assignments);
    }
  } catch (error) {
    res.status(500).send();
  }
});

app.get("/assignments/:id", isAuth, async (req, res, next) => {
  try {
    const assignmentId = req.params.id;
    // Find the assignment by ID
    const assignment = await Assignment.findByPk(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    res.json(assignment);
  } catch (error) {
    console.error(error.message);
    // Handle other errors
    res.status(500).send()
  }
});

app.delete("/assignments/:id", isAuth, async (req, res, next) => {
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
        return res.status(404).json({ message: "Assignment not found" });
      }
    if (assignment.user_id !== userId) {
      return res
        .status(403)
        .json({ message: "Forbidden" });
    }
    await assignment.destroy(assignment);
    res.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    return res.status(500).send()
  }
});

// app.use("/assignments/:id", (req, res, next) => {
//   const id = req.params.id;
//   if (req.method === "PATCH") {
//     if (!id) {
//       res.status(405).json({ message: "Method Not Allowed" });
//     }
//     res.status(405).json({ message: "Method Not Allowed" });
//   } else {
//     next();
//   }
// });

app.patch('/*', isAuth, async(req,res,next)=>{
    return res.send(405)
})

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
      console.log("Database connection established successfully.");
      res.status(200).send();
    } catch (error) {
      console.error("Database connection failed:", error);
      res.status(503).send();
    }
  });
  

//PORT
app.listen(3000, () => {
  console.log("server listening at 3000");
});
module.exports = app;

// sequelize.sync().then(() => {
//   createUser();
// });
