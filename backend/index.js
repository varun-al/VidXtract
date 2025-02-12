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

const isPlaylistUrl = (url) => url.includes("list=");
const sanitizeFilename = (title) => title.replace(/[<>:"/\\|?*\n]+/g, "").trim();
const maxLength = 50;

// Check if yt-dlp is installed
exec(`${ytDlpPath} --version`, (error, stdout, stderr) => {
    if (error) {
        console.error("❌ yt-dlp is not installed or not found in PATH!");
        process.exit(1);
    } else {
        console.log(`✅ yt-dlp version: ${stdout.trim()}`);
    }
});

const execPromise = (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) reject(stderr);
            else resolve({ stdout, stderr });
        });
    });
};

app.post("/download", async (req, res) => {
    const { url, type, playlist } = req.body;
    const format = type === "audio" ? "bestaudio" : "bv+ba/b";
    const extraOptions = type === "audio" ? ["--extract-audio", "--audio-format", "mp3", "--audio-quality", "0"] : ["--merge-output-format", "mp4"];
    
    const isInstagramReels = url.includes("instagram.com/reel/");

    if (isInstagramReels) {
        console.log("📸 Instagram Reel detected. Downloading...");

        const process = spawn(ytDlpPath, ["--no-playlist", "--get-title", url]);
        let reelTitle = "Instagram_Reel";

        process.stdout.on("data", (data) => {
            reelTitle = sanitizeFilename(data.toString().trim()).slice(0, maxLength);
        });

        process.on("close", (code) => {
            if (code !== 0) return res.status(500).json({ error: "Failed to get Instagram reel title" });

            const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
            const extension = type === "audio" ? "mp3" : "mp4";
            const fileName = `${reelTitle}-${uniqueSuffix}.${extension}`;
            const filePath = path.join(downloadsDir, fileName);

            const ytDlpArgs = ["--no-playlist", "-f", format, ...extraOptions, "-o", filePath, url, "--newline"];
            const downloadProcess = spawn(ytDlpPath, ytDlpArgs);

            downloadProcess.on("close", (code) => {
                if (code === 0) {
                    res.download(filePath, fileName, (err) => {
                        try { fs.unlinkSync(filePath); } catch (err) { console.warn("⚠️ File cleanup failed:", err.message); }
                    });
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

        const outputTemplate = path.join(playlistFolder, `%(playlist_index)02d-%(title)s.%(ext)s`);
        const ytDlpArgs = ["-f", format, ...extraOptions, "-o", outputTemplate, url, "--yes-playlist", "--newline","--cookies", "./cookies.txt",];
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
                    res.download(zipPath, `${playlistTitle}.zip`, (err) => {
                        try {
                            fs.unlinkSync(zipPath);
                            fs.rmSync(playlistFolder, { recursive: true, force: true });
                        } catch (err) { console.warn("⚠️ Cleanup failed:", err.message); }
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
            if (code !== 0) {
                console.error("Failed to get video title. Exit code:", code);
                return res.status(500).json({ error: "Failed to get video title" });
            }

            const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
            const extension = type === "audio" ? "mp3" : "mp4";
            const fileName = `${videoTitle}-${uniqueSuffix}.${extension}`;
            const filePath = path.join(downloadsDir, fileName);

            const ytDlpArgs = ["--no-playlist", "-f", format, ...extraOptions, "-o", filePath, url, "--newline","--cookies", "./cookies.txt",];
            const downloadProcess = spawn(ytDlpPath, ytDlpArgs);

            downloadProcess.on("close", (code) => {
                if (code === 0) {
                    res.download(filePath, fileName, (err) => {
                        try { fs.unlinkSync(filePath); } catch (err) { console.warn("⚠️ File cleanup failed:", err.message); }
                    });
                } else {
                    res.status(500).json({ error: "Download failed" });
                }
            });
        });
    }
});

server.listen(5000, () => console.log("✅ Server running on port 5000 🚀"));
