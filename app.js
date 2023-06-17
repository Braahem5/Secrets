//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const VKontakteStrategy = require("passport-vkontakte").Strategy;
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
  })
);
app.use(passport.initialize()); //initalize passport
app.use(passport.session()); // use passport to deal with session

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

mongoose.set("autoIndex", true);
// Define schema
const userSchema = new Schema({
  email: String,
  password: String,
  googleId: String,
  vkontakteId: String,
});

/*************Password encryption *****************/
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// Create Todo model
const User = mongoose.model("User", userSchema);

// Here db-model used to create strtegy and serialize and deserialize
passport.use(User.createStrategy());

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, { id: user.id, username: user.username, name: user.name });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

passport.use(
  new VKontakteStrategy(
    {
      ...{
        clientID: process.env.APP_ID, // VK.com docs call it 'API ID'
        clientSecret: process.env.SECURE_KEY,
        callbackURL: "http://localhost:3000/auth/vkontakte/callback",
      },
      scope: ["email", "age", "gender"],
      profileFields: ["email", "city", "bdate"],
    },
    function myVerifyCallbackFn(
      accessToken,
      refreshToken,
      params,
      profile,
      done
    ) {
      //find or create a user with the vk Id in local database.
      User.findOrCreate({ vkontakteId: profile.id })
        .then(function (user) {
          done(null, user);
        })
        .catch(done);
    }
  )
);

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/auth/google", (req, res) => {
  passport.authenticate("google", { scope: ["profile"] })(req, res);
});

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect secrets route.
    res.redirect("/secrets");
  }
);

//This function will pass callback, scope and request new token
app.get(
  "/auth/vkontakte",
  passport.authenticate("vkontakte", {
    scope: ["status", "email", "friends", "notify"],
  })
);

app.get(
  "/auth/vkontakte/callback",
  passport.authenticate("vkontakte", {
    successRedirect: "/secrets",
    failureRedirect: "/login",
  })
);

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/secrets", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

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
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, (err) => {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/secrets");
      });
    }
  });
});

app.get("/submit", (req, res) => {
  res.render("submit");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
