const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const LoginModel = require("./modules/Practiceusers");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Mongodb Connection Successful!"))
  .catch((error) => console.log("Mongodb Connection Error:", error.message));

app.listen(3001, () => {
  console.log("Server Running at http://localhost:3001");
});

app.get("/", (req, res) => res.send("Hello World!"));

// Middleware Function
const authenticationToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }
  const jwtToken = authHeader.split(" ")[1];
  jwt.verify(jwtToken, process.env.JWT_TOKEN, (error, payload) => {
    if (error) {
      return res.status(401).json({ message: "Invalid Access Token" });
    }
    req.id = payload.id;
    next();
  });
};

// Register API
app.post("/api/register", async (req, res) => {
  const { username, name, email, password } = req.body;
  const existingUser = await LoginModel.findOne({ username });
  if (existingUser) {
    return res.status(409).json({ message: "User already exists" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new LoginModel({
    username,
    name,
    email,
    password: hashedPassword,
  });
  await newUser.save();
  res.status(201).json({ message: "User Created Successfully" });
});

// Login API
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await LoginModel.findOne({ username });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const validUser = await bcrypt.compare(password, user.password);
  if (!validUser) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const payload = { id: user._id };
  const token = jwt.sign(payload, process.env.JWT_TOKEN, { expiresIn: "90d" });
  res.status(200).json({ message: "Login Successfully", token });
});

// Update API
app.put("/api/user/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  const updatedUser = await LoginModel.findByIdAndUpdate(
    id,
    { name, email },
    { new: true, runValidators: true }
  );
  if (!updatedUser) {
    return res.status(404).json({ message: "User not found" });
  }
  res.status(200).json({ message: "User updated successfully", updatedUser });
});

// Delete API
app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const deletedUser = await LoginModel.findByIdAndDelete(id);
  if (!deletedUser) {
    return res.status(404).json({ message: "User not found" });
  }
  res.status(200).json({ message: "User deleted successfully" });
});

// Profile API
app.get("/api/profile", authenticationToken, async (req, res) => {
  const user = await LoginModel.findById(req.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.status(200).json(user);
});

//All Users
app.get("/api/users", async (req, res) => {
  const users = await LoginModel.find();
  res.json(users);
});
