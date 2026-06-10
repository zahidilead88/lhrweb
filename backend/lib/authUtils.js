const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");

const hashPassword    = (password) => bcrypt.hash(password, 10);
const comparePassword = (password, hash) => bcrypt.compare(password, hash);
const signToken       = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

module.exports = { hashPassword, comparePassword, signToken };
