const express = require("express");
const Users = express.Router();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const User = require("../models/User");
Users.use(cors());

process.env.SECRET_KEY = "secret";

Users.post("/register", (req, res) => {
  const today = new Date();
  const userData = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password,
    username: req.body.username,
    created: today,
  };

  User.findOne({
    where: {
      email: req.body.email,
    },
  })
    //TODO bcrypt
    .then((user) => {
      if (!user) {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          userData.password = hash;
          User.create(userData)
            .then((user) => {
              res.json({ status: user.email + "Registered!" });
            })
            .catch((err) => {
              res.send("error: " + err);
            });
        });
      } else {
        res.json({ error: "User already exists" });
      }
    })
    .catch((err) => {
      res.send("error: " + err);
    });
});

Users.post("/login", (req, res) => {
  User.findOne({
    where: {
      email: req.body.email,
    },
  })
    .then((user) => {
      if (user) {
        if (bcrypt.compareSync(req.body.password, user.password)) {
          let token = jwt.sign(user.dataValues, process.env.SECRET_KEY, {
            expiresIn: 1440,
          });
          res.send({ email: req.body.email, token });
        }
      } else {
        res.status(404).json({ error: "User does not exist" });
      }
    })
    .catch((err) => {
      res.status(400).json({ error: err });
    });
});

Users.get("/profile", (req, res) => {
  var decoded = jwt.verify(
    req.headers["authorization"],
    process.env.SECRET_KEY
  );

  User.findOne({
    where: {
      id: decoded.id,
    },
  })
    .then((user) => {
      if (user) {
        res.json(user);
      } else {
        res.send("User does not exist");
      }
    })
    .catch((err) => {
      res.send("error: " + err);
    });
});

Users.get("/userDetails", (req, res) => {
  var decoded = jwt.verify(
    req.headers["authorization"],
    process.env.SECRET_KEY
  );

  User.findOne({
    where: {
      id: decoded.id,
    },
  }).then((user) => {
    if (user) {
      fetch("https://jsonplaceholder.typicode.com/users", {
        method: "get",
        headers: { "Content-Type": "application/json" },
      })
        .then((data) => data.json())
        .then((data) => res.json(data))
        .catch((err) => {
          res.send("error: " + err);
        });
    }
  });
});

module.exports = Users;
