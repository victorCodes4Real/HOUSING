
import express from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import User from './public/uploads/models/Users.js';

const app = express ();
const __dirname = path.resolve();

// Use session middleware 
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname)); //To serve home.html, login.html, etc.
const session = require('express-session');
const MongoStore = require('connect-mongo'); // npm i connect-mongo
app.use(session({
  secret: process.env.SESSION_SECRET || 'mynameisachilonuvictorikennaiwasborninapril',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create ({ mongoUrl: 'mongodb://localhost:27017/yourdb'}),
  cookie: {
     maxAge: 24 * 60 * 60 * 1000, // 24hours
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
     sameSite: 'lax'
  }
}));

//Connect to MongoDB database "my app"
mongoose.connect(MONGO_URI)
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

//Ensure upload folder exists
const uploadDir = path.join(__dirname,'public/uploads');
if (!fs.existsSync(uploadDir)) 
    fs.mkdirSync (uploadDir, { recursive:true});



//Multer Setup
const storage = multer.diskStorage({
    destination: (req,file, cb) => cb(null, uploadDir),
    filename: (req,file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
 const upload = multer({ storage });

//LOGIN endpoint
app.post('/login', async (req, res) =>{
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return res.json ({success: false, reason:'not_registered', message: 'Email not registered.'});
    }
    const match = await bcrypt.compare(password, user.password); //Note: typo i
if (!match){
    return res.json({ success: false, message:'Incorrect password.'});
}
req.session.userId = user._id;
res.json({ success:true });
});

// LOGOUT endpoint
app.post('/logout', (req, res) =>{
    req.session.destroy(() => {
        res.json({ success: true });
    });
});

// Middleware to protect homepage
function requireLogin(req, res, next){
    if (!req.session.userId) {
        return res.redirect('/login.html');
    }
    next();
}

// Serve homepage only if logged in
app.get('/index.html', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve login and signup pages
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/signup.html', (req, res) => res.sendFile(path.join(__dirname, 'signup.html')));

   //Endpoint to check if email is available (for debounced frontend validation)
   app.post('/check-email', async (req, res) => {
    try {
     const { email } = req.body;
     if (!email) return res.status(400).json({ available: false });
     
     const existingUser = await User.findOne({ email: email.toLowerCase() });
     res.json({ available: existingUser ? false : true });
    } catch (err) {
        console.error('Error checking email:', err);
        res.status(500).json({ available: false });
    }
});

   //Registration Route
 app.post ('/register', 
      upload.single('profile_image'), async (req, res) => {
            try {
        const {
            username, email, firstName, lastName, 
            gender, dob, age, phone, password, confirm_password
        } = req.body;
       //Server-side validation
       if (password !== confirm_password)
        return res.status(400).send('Passwords do not match');

    //check if email or username exists
    if (await User.findOne({ email: email.toLowerCase() }))
        return res.status(409).send('Email already registered');
      if (await User.findOne({ username }))
        return res.status(409).send('username already taken');

    //Example: using Regex for email on backend 
     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     if (!emailRegex.test(email)) {
        return res.status(400).send('Email format is invalid');
     }
     //Check presence of required fields
     if (!username || !firstName || !lastName|| !email || !password){
        return res.status(400).send('All required fields must be filled');
     }
        //Hash password
        const hashedPassword = await 
        bcrypt.hash(password, 10);

        const imageUrl = req.file ? '/uploads/' + req.file.filename : null;
         const newUser = new User({
            username,
            email: email.toLowerCase(),
            firstName,
            lastName,
            gender,
            dob,
            age,
            phone,
            password: hashedPassword,
            imageUrl
        });
         await newUser.save();
         req.session.userId = newUser._id;
         res.redirect('/');
       }   catch (err) {
            console.error(err);
            res.status(500).send('Server error');
       }
       
      });

          // Homepage route to greet and show avatar
          app.get ('/', async (req, res) => {
            try {
              let user = null;
              if (req.session.userId){
                user = await User.findById(req.session.userId);
              }             
              let html = `
              <!DOCTYPE html>
              <html lang="en">
              <head>
              <title>Homepage</title>
              <style>
              #user-avatar{
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 1.5rem;
              background: #007BFF;
              color: white;
              width: 70px;
              height: 70px;
              border-radius: 50%;
              user-select: none;
              margin: 20px;
              }
              img{
              width: 100%;
              height: 100%;
              border-radius: 50%;
              object-fit: cover;
              }

              </style>
              </head>
              <body>
              <h1> Welcome to the Homepage</h1>
              `;
              if (user){
                 html += `
                 <h2> Hello, ${user.firstName} ${user.lastName}</h2>
                  <div id="user-avatar">
                 `;
                 if (user.imageUrl){
                    html += `<img src ="${user.imageUrl}" 
                    alt="${user.firstName} ${user.lastName}">`; 
                 } else {
                    const initials = `${user.firstName.charAt(0).toUpperCase()}${user.lastName.charAt(0).toUpperCase()}`;
                       html += `${initials}`;
                 }
                 html += `</div>`;
              } else {
                 html += ` <p> Please <a href="/signup.html"> sign up </a> or <a href="/login.html"> Log in </a> </p>`;
              }
              html += `</body></html>`;
              res.send(html);
            } catch (err) {
               console.error('Homepage error:', err);
               res.status(500).send('Server error');
            }
          });
 




























































