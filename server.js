


require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors());

const JWT_SECRET = process.env.JWT_SECRET || "savi";
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://savithaseenivasan82:Savi123@cluster0.vepay.mongodb.net/hotel-booking";

// ✅ Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ User Schema & Model
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: String,
});
const User = mongoose.model("User", userSchema);

// ✅ Booking Schema & Model
const bookingSchema = new mongoose.Schema({
  guestName: String,
  phone: String,
  checkInDate: String,
  checkOutDate: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // ✅ Link booking to user
});
const Booking = mongoose.model("Booking", bookingSchema);

//✅ Middleware to Protect Routes
const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization");
  console.log("🔹 Received Token in Backend:", token);

  if (!token) {
    
    return res.status(401).json({ message: "Access Denied" });
  }

  try {
    const verified = jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
    req.user = verified;
    console.log("✅ Token Verified. User ID:", req.user.id);
    next();
  } catch (error) {
    console.error("❌ Invalid Token:", error.message);
    res.status(400).json({ message: "Invalid Token" });
  }
};


// const authenticateToken = (req, res, next) => {
//   console.log("🔹 Incoming Headers:", req.headers);  // Debugging

//   const authHeader = req.headers["authorization"];  // Ensure correct header retrieval
//   console.log("🔹 Received Authorization Header:", authHeader);

//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     console.log("❌ No Valid Token Provided");
//     return res.status(401).json({ message: "Access Denied" });
//   }

//   const token = authHeader.split(" ")[1]; // Extract token after "Bearer"
//   console.log("✅ Extracted Token:", token);

//   try {
//     const verified = jwt.verify(token, JWT_SECRET);
//     req.user = verified;
//     console.log("✅ Token Verified. User ID:", req.user.id);
//     next();
//   } catch (error) {
//     console.error("❌ Invalid Token:", error.message);
//     res.status(400).json({ message: "Invalid Token" });
//   }
// };

// ✅ User Registration
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "✅ User registered successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error });
  }
});

// ✅ User Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "12h" });

    res.status(200).json({ 
      message: "✅ Login successful", 
      token, 
      user: { id: user._id, name: user.name, email: user.email } 
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error });
  }
});



app.post("/api/bookings", authenticateToken, async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "Unauthorized: Please log in first!" });
  }

  const { guestName, phone, checkInDate, checkOutDate } = req.body;
  if (!guestName || !phone || !checkInDate || !checkOutDate) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const newBooking = new Booking({
    guestName,
    phone,
    checkInDate,
    checkOutDate,
    userId: req.user.id,
  });

  await newBooking.save();
  res.status(201).json({ message: "✅ Booking Confirmed!", booking: newBooking });
});


// ✅ Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
