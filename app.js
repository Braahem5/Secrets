//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const ejs = require("ejs");
const _ = require("lodash");
const Schema = mongoose.Schema;

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true })); // this will get input from webpage
app.use(express.static("public")); // for the static file like images and css files e.t.c.


//setup session
app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
  })
);
app.use(passport.initialize()); //initalize passport
app.use(passport.session());   // use passport to deal with session

// Connect to MongoDB database
mongoose
  .connect("mongodb://127.0.0.1:27017/userDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

// Define schema 
const userSchema = new Schema({
  email: String,
  password: String,
});

/*************Password encryption *****************/
userSchema.plugin(passportLocalMongoose);

// Create Todo model
const User = mongoose.model("User", userSchema);

// Here db-model used to create strtegy and serialize and deserialize 
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/secrets", (req,res) => {
  if (req.isAuthenticated()){
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
})

app.get("/logout", (req,res) =>{
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
})

app.post("/register", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  
    User.register({ username: username }, password, (err, user) => {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, () => {
          res.redirect("/secrets");
        });
      }
    });
});

app.post("/login", (req, res) => {
  const user = new User ({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, (err) => {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req,res, () => {
        res.redirect("/secrets");
      })
    }
  })
});

app.get("/submit", (req, res) => {
  res.render("submit");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
