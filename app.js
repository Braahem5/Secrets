//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const bcrypt =require("bcrypt");
const saltRounds = 10;
const _ = require("lodash");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
// for the static file like images and css files e.t.c.
app.use(express.static("public"));
const schema = mongoose.Schema;

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

// Define Todo schema
const userSchema = new schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});



// Create Todo model
const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    const newUser = new User({
      email: req.body.username,
      password: hash,
    });
    newUser.save().then((value) => {
      if (value) {
        res.render("secrets");
      }
    });
  });
  
});

app.post("/login", (req, res) => {
  
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({ email: username }).then((value, err) => {
    if (value) {
      bcrypt.compare(password, value.password, function (err, result) {
        if (result === true){
          res.render("secrets");
        }
      }); 
      
    } else {
      console.log(err);
    }
  });
});

app.get("/submit", (req, res) => {
  res.render("submit");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
