//jshint esversion:8

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const e = require('express');
// const encrypt = require('mongoose-encryption');
// const md5 = require('md5');
// const bcrypt = require('bcrypt');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
var findOrCreate = require('mongoose-findorcreate');
const passportLocalMongoose = require('passport-local-mongoose');
const app = express();

// const saltRounds = 10;

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(function (req, res, next) {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
});

app.use(express.static(__dirname));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin-raghav:Test123@cluster0.o3gli.mongodb.net/userDB");

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
// userSchema.plugin(encrypt,{secret: process.env.SECRET, encryptedFields:['password']});

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        cb(null, {
            id: user.id,
            username: user.username,
            name: user.displayName
        });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});

passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        scope: 'profile'
    },
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile);
        User.findOrCreate({
            googleId: profile.id
        }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.get("/", function (req, res) {
    res.render("home");
});

app.get('/auth/google',
    passport.authenticate('google', {
        scope: ['profile']
    })
);

app.get('/auth/google/secrets',
    passport.authenticate('google', {
        failureRedirect: '/login'
    }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });

app.get("/secrets", (req, res) => {
    User.find({"secret":{$ne:null}},(err,foundUsers)=>{
        if (err) {console.log(err);}
        else{
            res.render("secrets",{usersWithSecret:foundUsers});
        }
    });

    // if (req.isAuthenticated()) {
    //     res.render("secrets");
    // } else {
    //     res.redirect("/login");
    // }
});

app.get("/logout", function (req, res) {
    req.logOut();
    // res.redirect("/logout");
    // res.reload();
    res.redirect("/");
    // req.session.destroy(err => {
    //     if (!err) {
    //         res.clearCookie('sid', {
    //             path: '/'
    //         });
    //         res.redirect('/');
    //         //   res.redirect("/");
    //     } else {
    //         console.log(err);
    //     }
    // });
});

app.get("/login", function (req, res) {
    res.render("login");
});


app.post("/login", passport.authenticate("local"), function (req, res) {
    res.redirect("/secrets");

    // const username = req.body.username;
    // const password = req.body.password;
    // User.findOne({
    //     email: username
    // }, (err, foundUser) => {
    //     if (err) {
    //         console.log(err);
    //     } else if (foundUser) {
    //         // console.log(foundUser);
    //         bcrypt.compare(password,foundUser.password).then(function (result) {
    //             // result == true
    //             if (result === true) {
    //                 res.render("secrets");
    //             } else {
    //                 console.warn("The password is incorrect.Please enter your password again.");
    //             }

    //         });
    //     } else {
    //         console.error("The user doesn't exist. Please enter correct username.");
    //     }
    // });
});

app.get("/register", function (req, res) {
    res.render("register");
});
app.post("/register", (req, res) => {

    User.register({
        username: req.body.username
    }, req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            console.log(req.body.password);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });


    // const username = req.body.username;
    // bcrypt.hash(req.body.password, saltRounds).then(function (hash) {
    //     // Store hash in your password DB.
    //     const newUser = new User({
    //         email: username,
    //         password: hash
    //     });
    //     newUser.save((err) => {
    //         if (err) {
    //             res.send(err + "Error please try again");
    //         } else {
    //             res.render("secrets");
    //         }
    //     });
    // });

});

app.get("/submit", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

app.post("/submit", (req, res) => {
    const submittedSecret = req.body.secret;

    User.findById(req.user.id,(err,foundUser)=>{
        if (err) {console.log(err);}
        else{
            foundUser.secret=submittedSecret;
            foundUser.save(()=>{
                res.redirect("/secrets");
            });
        }
    });
});

app.listen(process.env.PORT||3000, function () {
    console.log("Server started on port 3000.");
});