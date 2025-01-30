
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
