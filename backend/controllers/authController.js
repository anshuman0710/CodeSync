const User = require("../models/User");
const { signToken } = require("../utils/token");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function issueSession(user) {
  const safeUser = user.toSafeJSON();
  return {
    user: safeUser,
    token: signToken({
      sub: safeUser.id,
      name: safeUser.name,
      email: safeUser.email,
    }),
  };
}

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !emailPattern.test(email || "") || !password || password.length < 6) {
      return res.status(400).json({
        message: "Enter a name, valid email, and password with at least 6 characters.",
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "An account already exists for this email." });

    const user = new User({ name: name.trim(), email: email.toLowerCase() });
    user.setPassword(password);
    await user.save();

    res.status(201).json(issueSession(user));
  } catch (err) {
    console.error("signup error:", err);
    res.status(500).json({ message: "Could not create account" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || "").toLowerCase() });

    if (!user || !user.validatePassword(password || "")) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json(issueSession(user));
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ message: "Could not sign in" });
  }
};

const me = async (req, res) => {
  const user = await User.findById(req.user.sub);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user: user.toSafeJSON() });
};

module.exports = { signup, login, me };
