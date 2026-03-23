const express = require("express");
const cors = require("cors");
const multer = require("multer");

const { analyzeImage } = require("./vision");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Only images allowed"), false);
        }
        cb(null, true);
    }
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});