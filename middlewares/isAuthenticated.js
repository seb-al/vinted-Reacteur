const express = require("express");
const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  try {
    //console.log(req.headers.authorization);
    if (!req.headers.authorization) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = req.headers.authorization.replace("Bearer ", "");
    //console.log(token);
    const user = await User.findOne({ token: token }).select("account");
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = user;
    // console.log(req.user);
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = isAuthenticated;
