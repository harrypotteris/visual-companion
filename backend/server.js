const express = require("express");
const cors = require("cors");
const multer = require("multer");

const { analyzeImage } = require("./vision");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});

// ✅ ROOT ROUTE
app.get("/", (req, res) => {
    res.json({
        status: "ok",
        message: "Backend running ✅"
    });
});

// ✅ ANALYZE ROUTE
app.post("/analyze", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No image uploaded" });
        }

        const result = await analyzeImage(
            req.file.buffer,
            req.file.mimetype,
            "Describe this image"
        );

        res.json({ result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to analyze image" });
    }
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});