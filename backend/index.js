const { exec } = require("child_process");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] }
});

app.use(cors({ exposedHeaders: ["Content-Disposition"] }));
app.use(bodyParser.json());

const ytDlpPath = "yt-dlp";
const downloadsDir = path.join(__dirname, "downloads");

if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

const isPlaylistUrl = (url) => url.includes("list=");
const sanitizeFilename = (title) => title.replace(/[<>:"/\\|?*\n]+/g, "").trim();
const maxLength = 50;

io.on("connection", (socket) => {
    console.log("🔌 Client connected to WebSocket");
    socket.on("disconnect", () => console.log("🔌 Client disconnected"));
});

const { spawn } = require("child_process");

app.post("/download", async (req, res) => {
    const { url, type, playlist } = req.body;
    const format = type === "audio" ? "bestaudio" : "bv+ba/b";
    const extraOptions = type === "audio" ? "--extract-audio --audio-format mp3 --audio-quality 0" : "--merge-output-format mp4";
    const socketId = req.headers["socket-id"];

    io.to(socketId).emit("progressUpdate", { progress: 0, message: "Initializing download..." });

    console.log("🔄 Downloading video...");

    exec(`${ytDlpPath} --get-title "${url}"`, (error, stdout) => {
        if (error) return res.status(500).json({ error: "Failed to get video title" });

        const videoTitle = sanitizeFilename(stdout.trim()).slice(0, maxLength);
        const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
        const extension = type === "audio" ? "mp3" : "mp4";
        const fileName = `${videoTitle}-${uniqueSuffix}.${extension}`;
        const filePath = path.join(downloadsDir, fileName);

        const ytDlpArgs = [
            "-f", format,
            ...extraOptions.split(" "),
            "-o", filePath,
            url,
            "--newline"
        ];

        const process = spawn(ytDlpPath, ytDlpArgs);

        process.stdout.on("data", (data) => {
            const output = data.toString().trim();
            console.log("🔹 yt-dlp stdout:", output);

            const progressMatch = output.match(/(\d{1,3}(\.\d+)?)%/);
            if (progressMatch) {
                const progress = parseFloat(progressMatch[1]);
                io.to(socketId).emit("progressUpdate", { progress });
            }
        });

        process.stderr.on("data", (data) => {
            console.log("⚠️ yt-dlp stderr:", data.toString().trim());
        });

        process.on("close", (code) => {
            if (code === 0) {
                io.to(socketId).emit("progressUpdate", { progress: 100, message: "Download complete!" });
                res.download(filePath, fileName, (err) => {
                    if (err) console.error("Error sending file:", err);
                    fs.unlinkSync(filePath);
                });
            } else {
                res.status(500).json({ error: "Download failed" });
            }
        });
    });
});

const execPromise = (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) reject(stderr);
            else resolve({ stdout, stderr });
        });
    });
};

server.listen(5000, () => console.log("✅ Server running on port 5000 🚀"));
