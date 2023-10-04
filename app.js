const express = require("express");
const createUser = require("./createUser");
const app = express();
const bcrypt = require("bcrypt");
const User = require("./models/user");
const Assignment = require("./models/assignments");
const sequelize = require("./models/index");

// const auth = require('./createUser')

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    if(!req.body.name || !req.body.points || !req.body.num_of_attempts || !req.body.deadline){
        return res.status(400).json({ message: "Please provide all the fields" });
    }
    const newAssignment = new Assignment({
      ...req.body,
      user_id: userId,
    });
    const saveAssignment = await newAssignment.save();
    res.send(saveAssignment);
    
    //console.log(res)
  } catch (error) {
    console.log(error.message);
    if (error.message.includes("Unexpected token")) {
      next(createError(400, "Please fill the required details"));
      return;
    } else if (error.name === "ValidationError") {
      next(createError(422, "Please enter the required fields"));
      return;
    }
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
      return res.status(404).json({ message: "Assignment not found" });
    }
    if (assignment.user_id !== userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized to update this assignment" });
    }

    await assignment.update(updatedAssignment, options);

    res.json({ message: "Assignment updated successfully" });
  } catch (error) {
    console.log(error.message);
    if (error.message.includes("Unexpected token")) {
      next(createError(400, "Please fill the required details"));
      return;
    } else if (error.name === "ValidationError") {
      next(createError(422, "Please enter the required fields"));
      return;
    }
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
    console.log(error.message);
    res.send(400)
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
    if (error.name === "CastError" && error.kind === "ObjectId") {
      return res.status(400).json({ message: "Provide a valid ID" });
    }
    // Handle other errors
    res.status(500).json({ message: "Internal Server Error" });
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
        .status(401)
        .json({ message: "Unauthorized to delete this assignment" });
    }

    await assignment.destroy(assignment);

    res.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    console.log(error.message);
    if (error.message.includes("Unexpected token")) {
      next(createError(400, "Please fill the required details"));
      return;
    } else if (error.name === "ValidationError") {
      next(createError(422, "Please enter the required fields"));
      return;
    }
  }
});

//PORT
app.listen(3000, () => {
  console.log("server listening at 3000");
});

sequelize.sync().then(() => {
  createUser();
});
