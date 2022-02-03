//jshint esversion:8

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const e = require('express');
const encrypt = require('mongoose-encryption');
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(express.static(__dirname));

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email:{type: 'string', required: true},
    password:{type: 'string', required: true}
});

userSchema.plugin(encrypt,{secret: process.env.SECRET, encryptedFields:['password']});

const User= new mongoose.model("User",userSchema);

app.get("/", function (req, res) {
    res.render("home");
});


app.get("/login", function (req, res) {
    res.render("login");
});
app.post("/login",  (req, res)=> {
    const username=req.body.username;
    const password=req.body.password;
    User.findOne({ email: username},(err,foundUser)=> {
        if(err){
            console.log(err);
        }else if(foundUser){
            // console.log(foundUser);
            if(foundUser.password===password){
                res.render("secrets");
            }
            else{
                console.warn("The password is incorrect.Please enter your password again.");
            }
        }
        else{
            console.error("The user doesn't exist. Please enter correct username.");
        }
    });
});


app.get("/register", function (req, res) {
    res.render("register");
});
app.post("/register",(req,res)=>{
    const username=req.body.username;
    const password=req.body.password;
    const newUser= new User({
        email:username,
        password:password
    });
    newUser.save((err)=>{
        if(err){
            res.send(err+ "Error please try again");
        }
        else{
            res.render("secrets");
        }
    });
});

app.listen(3000, function () {
    console.log("Server started on port 3000.");
});