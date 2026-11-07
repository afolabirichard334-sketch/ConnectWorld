const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const authenticate = require("../middleware/auth");

function publicUser(user) {
  return {
    id: user.id, username: user.username, country: user.country,
    interests: user.interests, bio: user.bio, age: user.age
  };
}

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, country, age, interests = "", bio = "" } = req.body;
    if (!username || !email || !password || !country || !age) {
      return res.status(400).json({ message: "Please complete all required fields." });
    }
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
      return res.status(400).json({ message: "Username must be 3–24 letters, numbers or underscores." });
    }
    if (!Number.isInteger(Number(age)) || Number(age) < 13 || Number(age) > 17) {
      return res.status(400).json({ message: "This supervised prototype is limited to ages 13–17." });
    }
    if (String(password).length < 10) {
      return res.status(400).json({ message: "Use a password with at least 10 characters." });
    }
    if (String(bio).length > 240 || String(interests).length > 300) {
      return res.status(400).json({ message: "Your bio or interests are too long." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({
      where: { [require("sequelize").Op.or]: [{ email: normalizedEmail }, { username }] }
    });
    if (existing) return res.status(409).json({ message: "That email or username is already registered." });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      username, email: normalizedEmail, passwordHash, country,
      age: Number(age), interests, bio
    });
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "2h" });
    res.cookie("connectworld_token", token, {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 2 * 60 * 60 * 1000
    });
    res.status(201).json({ message: "Account created.", user: publicUser(user), token });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Could not create account." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email: String(email || "").trim().toLowerCase(), isActive: true } });
    if (!user || !(await bcrypt.compare(String(password || ""), user.passwordHash))) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "2h" });
    res.cookie("connectworld_token", token, {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 2 * 60 * 60 * 1000
    });
    res.json({ message: "Welcome back.", user: publicUser(user), token });
  } catch {
    res.status(500).json({ message: "Could not log in." });
  }
});

router.get("/me", authenticate, async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user || !user.isActive) return res.status(401).json({ message: "Account unavailable." });
  res.json({ user: publicUser(user) });
});

router.post("/logout", (req, res) => {
  res.clearCookie("connectworld_token");
  res.json({ message: "Logged out." });
});

module.exports = router;
