const { exec } = require("child_process");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors({
    exposedHeaders: ["Content-Disposition"]  // Allow frontend to read Content-Disposition
}));
app.use(bodyParser.json());

// Function to sanitize filenames
const sanitizeFilename = (title) => title.replace(/[<>:"/\\|?*]+/g, "").trim();
const maxLength = 50; // Limit filename length

app.post("/download", async (req, res) => {
    const { url, type } = req.body;
    const format = type === "audio" ? "bestaudio" : "bv+ba/b";
    const ytDlpPath = "yt-dlp"; // Ensure yt-dlp is installed globally

    exec(`${ytDlpPath} --get-title "${url}"`, (error, stdout, stderr) => {
        if (error) {
            console.error("Failed to fetch title:", stderr);
            return res.status(500).json({ error: "Failed to get video title" });
        }

        const videoTitle = sanitizeFilename(stdout.trim());
        const truncatedTitle = videoTitle.length > maxLength ? videoTitle.substring(0, maxLength) + "..." : videoTitle;
        const fileName = `${truncatedTitle}.${type === "audio" ? "mp3" : "mp4"}`;
        const filePath = path.join(__dirname, "downloads", fileName);

        if (!fs.existsSync("./downloads")) {
            fs.mkdirSync("./downloads");
        }

        const command = `${ytDlpPath} -f "${format}" --merge-output-format mp4 -o "${filePath}" "${url}"`;

        exec(command, { maxBuffer: 1024 * 1024 * 100 }, (error, stdout, stderr) => {
            if (error) {
                console.error("yt-dlp error:", stderr);
                return res.status(500).json({ error: "Download failed" });
            }

            console.log(`✅ Download complete: ${fileName}`);
            console.log(`📄 Sending Content-Disposition: attachment; filename="${fileName}"`);

            // Set proper headers
            res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
            res.setHeader("Content-Type", type === "audio" ? "audio/mpeg" : "video/mp4");

            res.sendFile(filePath, (err) => {
                if (err) console.error("Error sending file:", err);
                fs.unlinkSync(filePath); // Delete file after sending
            });
        });
    });
});

app.listen(5000, () => console.log("✅ Server running on port 5000 🚀"));