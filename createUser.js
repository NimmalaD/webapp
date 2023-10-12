const fs = require("fs");
const csv = require("csv-parser");
const bcrypt = require("bcrypt");
const sequelize = require("./models/index");
const {User} = require("./models/index");

const createUser = async () => {
  const userData = [];
  fs.createReadStream("/opt/user.csv")
    .pipe(csv())
    .on("data", (row) => {
      userData.push(row);
    })
    .on("end", () => {
      userData.forEach(async (val) => {
        const existingUser = await User.findOne({
          where: { email: val.email },
        });

        if (!existingUser) {
          // User doesn't exist, create a new account with a hashed password
          const hashedPassword = await bcrypt.hash(val.password, 10); // Hash the password with bcrypt
          await User.create({
            first_name: val.first_name,
            last_name: val.last_name,
            email: val.email,
            password: hashedPassword,
            // Other user properties as needed
          })
            .then(() => {
              console.log("User inserted");
            })
            .catch((err) => {
              console.log("Error inserting user", err);
            });
        }
      });
    });
};

module.exports = createUser;
