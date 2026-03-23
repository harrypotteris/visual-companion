const express = require("express");
const cors = require("cors");
const multer = require("multer");

const { analyzeImage } = require("./vision");

const app = express();

// Allow frontend (Vercel)
app.use(cors({
  origin: "*"
}));

app.use(express.json());

// File upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// In-memory storage (simple DB)
let savedPeople = [];

// ==============================
// ROOT
// ==============================
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend running ✅"
  });
});

// ==============================
// DESCRIBE IMAGE
// ==============================
app.post("/describe", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const result = await analyzeImage(
      req.file.buffer,
      req.file.mimetype,
      "Describe this image"
    );

    res.json({ description: result });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to analyze image" });
  }
});

// ==============================
// SAVE PERSON
// ==============================
app.post("/save-person", upload.single("image"), (req, res) => {
  try {
    const name = req.body.name || "Unknown";

    const newPerson = {
      id: Date.now(),
      name: name,
      timestamp: new Date()
    };

    savedPeople.push(newPerson);

    res.json({
      success: true,
      person: newPerson
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save person" });
  }
});

// ==============================
// GET PEOPLE
// ==============================
app.get("/people", (req, res) => {
  res.json(savedPeople);
});

// ==============================
// START SERVER
// ==============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
