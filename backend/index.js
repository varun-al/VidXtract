const { exec, spawn } = require("child_process");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const http = require("http");

const app = express();
const server = http.createServer(app);

app.use(cors({ exposedHeaders: ["Content-Disposition"] }));
app.use(bodyParser.json());

const ytDlpPath = "yt-dlp";
const downloadsDir = path.join(__dirname, "downloads");
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

const settingsFile = path.join(__dirname, "settings.json");

const settingsMap = {
    videoQuality: {
        Best: "bv+ba/b",
        AudioOnly: "bestaudio",
        "4K": "bestvideo[height<=2160]+bestaudio/best[height<=2160]",
        "1440p": "bestvideo[height<=1440]+bestaudio/best[height<=1440]",
        "1080p": "bestvideo[height<=1080]+bestaudio/best[height<=1080]",
        "720p": "bestvideo[height<=720]+bestaudio/best[height<=720]",
        "480p": "bestvideo[height<=480]+bestaudio/best[height<=480]",
        "360p": "bestvideo[height<=360]+bestaudio/best[height<=360]",
        "240p": "bestvideo[height<=240]+bestaudio/best[height<=240]",
        "144p": "bestvideo[height<=144]+bestaudio/best[height<=144]",
    },
    audioBitrate: {
        Best: "0",
        "320kb/s": "320k",
        "256kb/s": "256k",
        "128kb/s": "128k",
        "96kb/s": "96k",
        "64kb/s": "64k",
    },
};

// Load settings
const loadSettings = () => {
    if (fs.existsSync(settingsFile)) {
        return JSON.parse(fs.readFileSync(settingsFile, "utf8"));
    }
    return { videoQuality: "Best", audioBitrate: "Best" };
};

// Save settings
const saveSettings = (settings) => {
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), "utf8");
};

const sanitizeFilename = (title) => title.replace(/[<>:"/\\|?*\n]+/g, "").trim();
const maxLength = 50;

// Check yt-dlp installation
exec(`${ytDlpPath} --version`, (error, stdout) => {
    if (error) {
        console.error("❌ yt-dlp is not installed or not found in PATH!");
        process.exit(1);
    } else {
        console.log(`✅ yt-dlp version: ${stdout.trim()}`);
    }
});

// Helper: Exec promise wrapper
const execPromise = (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) reject(stderr);
            else resolve({ stdout, stderr });
        });
    });
};

// Fetch settings
app.get("/settings", (req, res) => {
    res.json(loadSettings());
});

// Update settings
app.post("/settings", (req, res) => {
    saveSettings(req.body);
    res.json({ message: "Settings updated successfully." });
});

// Download endpoint
app.post("/download", async (req, res) => {
    const settings = loadSettings();
    const { url, type, resolution, playlist } = req.body;
    const isInstagramReel = url.includes("instagram.com/reel/");

    const format =
        type === "audio"
            ? "bestaudio"
            : resolution
            ? settingsMap.videoQuality[resolution] || `bestvideo[height<=${resolution}]+bestaudio/best[height<=${resolution}]`
            : settingsMap.videoQuality[settings.videoQuality] || "bv+ba/b";
    
    const extraOptions =
        type === "audio"
            ? ["--extract-audio", "--audio-format", "mp3", "--audio-quality", settingsMap.audioBitrate[settings.audioBitrate] || "0"]
            : ["--merge-output-format", "mp4"];

    if (isInstagramReel) {
        console.log("📸 Instagram Reel detected. Downloading...");
        const process = spawn(ytDlpPath, ["--no-playlist", "--get-title", url]);

        let reelTitle = "Instagram_Reel";
        process.stdout.on("data", (data) => {
            reelTitle = sanitizeFilename(data.toString().trim()).slice(0, maxLength);
        });

        process.on("close", (code) => {
            if (code !== 0) return res.status(500).json({ error: "Failed to get Instagram reel title" });

            const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
            const fileName = `${reelTitle}-${uniqueSuffix}.${type === "audio" ? "mp3" : "mp4"}`;
            const filePath = path.join(downloadsDir, fileName);

            const ytDlpArgs = ["--no-playlist", "-f", format, ...extraOptions, "-o", filePath, url];
            const downloadProcess = spawn(ytDlpPath, ytDlpArgs);

            downloadProcess.on("close", (code) => {
                if (code === 0) {
                    res.download(filePath, fileName, () => fs.unlinkSync(filePath));
                } else {
                    res.status(500).json({ error: "Instagram reel download failed" });
                }
            });
        });
    } else if (playlist) {
        console.log("📂 Playlist detected. Downloading...");
        let playlistTitle = "Playlist";

        try {
            const { stdout } = await execPromise(`${ytDlpPath} --print "%(playlist_title)s" "${url}"`);
            playlistTitle = sanitizeFilename(stdout.split("\n")[0].trim()).slice(0, maxLength);
        } catch (err) {
            console.warn("⚠️ Failed to fetch playlist title.");
        }

        const playlistFolder = path.join(downloadsDir, playlistTitle);
        if (!fs.existsSync(playlistFolder)) fs.mkdirSync(playlistFolder);

        const outputTemplate = path.join(playlistFolder, "%(playlist_index)02d-%(title)s.%(ext)s");
        const ytDlpArgs = ["-f", format, ...extraOptions, "-o", outputTemplate, url, "--yes-playlist"];
        const process = spawn(ytDlpPath, ytDlpArgs);

        process.on("close", async (code) => {
            if (code === 0) {
                const zipPath = path.join(downloadsDir, `${playlistTitle}.zip`);
                const output = fs.createWriteStream(zipPath);
                const archive = archiver("zip", { zlib: { level: 9 } });

                archive.pipe(output);
                archive.directory(playlistFolder, false);
                archive.finalize();

                output.on("close", () => {
                    res.download(zipPath, `${playlistTitle}.zip`, () => {
                        fs.unlinkSync(zipPath);
                        fs.rmSync(playlistFolder, { recursive: true, force: true });
                    });
                });
            } else {
                res.status(500).json({ error: "Playlist download failed" });
            }
        });
    } else {
        console.log("🎥 Downloading single video...");
        const process = spawn(ytDlpPath, ["--no-playlist", "--get-title", url]);
        let videoTitle = "Video";

        process.stdout.on("data", (data) => {
            videoTitle = sanitizeFilename(data.toString().trim()).slice(0, maxLength);
        });

        process.on("close", (code) => {
            if (code !== 0) return res.status(500).json({ error: "Failed to get video title" });

            const fileName = `${videoTitle}-${Date.now()}.${type === "audio" ? "mp3" : "mp4"}`;
            const filePath = path.join(downloadsDir, fileName);
            const ytDlpArgs = ["--no-playlist", "-f", format, ...extraOptions, "-o", filePath, url];

            spawn(ytDlpPath, ytDlpArgs).on("close", (code) => {
                res.download(filePath, fileName, () => fs.unlinkSync(filePath));
            });
        });
    }
});

server.listen(5000, () => console.log("✅ Server running on port 5000 🚀"));
