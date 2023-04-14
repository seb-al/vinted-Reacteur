const express = require("express");
const router = express.Router();
const User = require("../models/User");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

//
//   ======CREATE======
//
router.post("/user/create", async (req, res) => {
  try {
    const { username, email, password, newsletter } = req.body;
    if (!username) {
      return res.status(409).json({ message: "User not defined" });
    }
    const existingEmail = await User.findOne({ email: email });
    if (existingEmail === null) {
      const salt = uid2(16);
      const hash = SHA256(salt + password).toString(encBase64);
      const token = uid2(64);
      const newUser = new User({
        email: email,
        account: {
          username: username,
        },
        hash: hash,
        token: token,
        salt: salt,
        newsletter: newsletter,
      });
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        token: newUser.token,
        account: newUser.account,
      });
    } else {
      return res.status(409).json({ message: "User already exists" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//
//   ======LOGIN======
//

router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email: email });
    if (existingUser === null) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const newHash = SHA256(existingUser.salt + password).toString(encBase64);

    //
    if (newHash !== existingUser.hash) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.status(201).json({
      _id: existingUser._id,
      token: existingUser.token,
      account: existingUser.account,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
