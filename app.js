const express = require('express');
const createUser = require('./createUser')
const app = express()
const bcrypt = require('bcrypt');
const User = require('./models/user')
const sequelize = require('./models/index')

// const auth = require('./createUser')

app.use(express.json())
app.use(express.urlencoded({extended: true}))

// Middleware for basic authentication
// const auth = (req, res, next) => {
//     // const authorizationHeader = req.headers.authorization;
  
//     if (!req.headers.authorization) {
//       return res.status(401).json({ message: 'Unauthorized' });
//     }
  
//     const credentials = Buffer.from(authorizationHeader.split(' ')[1], 'base64').toString('utf-8');
//     const [email, password] = credentials.split(':');
  
//     // Check if the provided credentials match a user in your database
//     User.findOne({ where: { email: email } })
//       .then(async (existingUser) => {
//         if (!existingUser || !(await bcrypt.compare(password, existingUser.password))) {
//           return res.status(401).json({ message: 'Unauthorized' });
//         }
  
//         // Authentication successful
//         next();
//       })
//       .catch((error) => {
//         console.error('Authentication Error:', error);
//         res.status(500).send('Internal Server Error');
//       });

      
//   };

const isAuth = async(req, res, next) =>{
    const authorizationHeader = req.headers.authorization;
  
        if (!authorizationHeader) {
        return res.status(401).json({ message: 'Unauthorized' });
        }
    
        const credentials = Buffer.from(authorizationHeader.split(' ')[1], 'base64').toString('utf-8');
        const [email, password] = credentials.split(':');
    
        // Check if the provided credentials match a user in your database
        const user = await User.findOne({ where: { email }})
        try {
            
            if(!user){
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const passwordMatch = await bcrypt.compare(password, user.password);
            if(passwordMatch){
              next()
            }else{
                return res.status(401).json({ message: 'Unauthorized' });

            }
        } catch (error) {
            console.error('Authentication Error:', error);
            res.status(500).send('Internal Server Error');
        }
        
}

// API endpoint that requires basic authentication
app.get('/protected',isAuth, async(req,res)=>{
        
    res.json({ message: 'Authenticated' });
    console.log(res)
        

        });

//PORT
app.listen(3000,()=>{
    console.log("server listening at 3000");
})

sequelize.sync().then(() => {
    createUser()
  
})
