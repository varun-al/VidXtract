const { spawn } = require("child_process");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors({
    exposedHeaders: ["Content-Disposition"]
}));
app.use(bodyParser.json());

const sanitizeFilename = (title) => title.replace(/[<>:"/\\|?*]+/g, "").trim();
const maxLength = 50;

let downloadProgress = 0; // Store progress globally

app.post("/download", async (req, res) => {
    const { url, type } = req.body;
    const format = type === "audio" ? "bestaudio" : "bv+ba/b";
    const ytDlpPath = "yt-dlp";

    // Get video title
    const titleProcess = spawn(ytDlpPath, ["--get-title", url]);

    let videoTitle = "";
    titleProcess.stdout.on("data", (data) => {
        videoTitle += data.toString();
    });

    titleProcess.on("close", () => {
        videoTitle = sanitizeFilename(videoTitle.trim());
        const truncatedTitle = videoTitle.length > maxLength ? videoTitle.substring(0, maxLength) + "..." : videoTitle;
        const fileName = `${truncatedTitle}.${type === "audio" ? "mp3" : "mp4"}`;
        const filePath = path.join(__dirname, "downloads", fileName);

        if (!fs.existsSync("./downloads")) {
            fs.mkdirSync("./downloads");
        }

        // Spawn yt-dlp with progress
        const command = [
            "-f", format,
            "--merge-output-format", "mp4",
            "-o", filePath,
            "--progress-template", "%(progress._percent_str)s", // Output only percentage
            url
        ];

        const downloadProcess = spawn(ytDlpPath, command);

        downloadProcess.stdout.on("data", (data) => {
            const progressMatch = data.toString().match(/(\d+(\.\d+)?)%/); // Extract numeric percentage
            if (progressMatch) {
                downloadProgress = parseFloat(progressMatch[1]);
            }
        });

        downloadProcess.stderr.on("data", (data) => {
            console.error("Error:", data.toString());
        });

        downloadProcess.on("close", () => {
            console.log(`✅ Download complete: ${fileName}`);
            downloadProgress = 100; // Mark completion
        });

        res.json({ message: "Download started!" });
    });
});

// Progress API
app.get("/progress", (req, res) => {
    res.json({ progress: downloadProgress });
});

app.listen(5000, () => console.log("✅ Server running on port 5000 🚀"));
