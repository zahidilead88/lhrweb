const User = require("../models/User");

exports.getUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};

exports.createUser = async (req, res) => {
  const { name, email } = req.body;
  const user = new User({ name, email });
  await user.save();
  res.status(201).json(user);
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndUpdate(id, req.body, { new: true });
  res.json(user);
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  await User.findByIdAndDelete(id);
  res.status(204).send();
};
