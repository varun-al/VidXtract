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

app.post("/download", async (req, res) => {
    const { url, type, playlist } = req.body;
    const format = type === "audio" ? "bestaudio" : "bv+ba/b";
    const extraOptions = type === "audio" ? "--extract-audio --audio-format mp3 --audio-quality 0" : "--merge-output-format mp4";

    // Check if the URL is from Instagram
    const isInstagramReels = url.includes("instagram.com/reel/");

    if (isInstagramReels) {
        console.log("📸 Instagram Reel detected. Downloading reel...");

        exec(`${ytDlpPath} --no-playlist --get-title "${url}"`, (error, stdout) => {
            if (error) return res.status(500).json({ error: "Failed to get Instagram reel title" });

            const reelTitle = sanitizeFilename(stdout.trim()).slice(0, maxLength);
            const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
            const extension = type === "audio" ? "mp3" : "mp4";
            const fileName = `${reelTitle}-${uniqueSuffix}.${extension}`;
            const filePath = path.join(downloadsDir, fileName);

            const ytDlpArgs = [
                "--no-playlist", // Ensures it's a single video
                "-f", format,
                ...extraOptions.split(" "),
                "-o", filePath,
                url, // Instagram URL
                "--newline"
            ];

            const process = spawn(ytDlpPath, ytDlpArgs);

            process.stdout.on("data", (data) => {
                const output = data.toString().trim();
                console.log("🔹 yt-dlp stdout:", output);
            });

            process.stderr.on("data", (data) => {
                console.log("⚠️ yt-dlp stderr:", data.toString().trim());
            });

            process.on("close", (code) => {
                if (code === 0) {
                    res.download(filePath, fileName, (err) => {
                        if (err) console.error("Error sending file:", err);
                        fs.unlinkSync(filePath);
                    });
                } else {
                    res.status(500).json({ error: "Instagram reel download failed" });
                }
            });
        });
    } else if (playlist) {
        console.log("📂 Playlist detected. Downloading all videos...");

        // Get playlist title
        let playlistTitle = "Playlist";
        try {
            const { stdout } = await execPromise(`${ytDlpPath} --print "%(playlist_title)s" "${url}"`);
            playlistTitle = sanitizeFilename(stdout.split("\n")[0].trim()).slice(0, maxLength);
        } catch (err) {
            console.warn("⚠️ Failed to fetch playlist title. Using default name.");
        }        

        const playlistFolder = path.join(downloadsDir, playlistTitle);
        if (!fs.existsSync(playlistFolder)) fs.mkdirSync(playlistFolder);

        const outputTemplate = path.join(playlistFolder, `%(playlist_index)02d-%(title)s.%(ext)s`);
        
        const ytDlpArgs = [
            "-f", format,
            ...extraOptions.split(" "),
            "-o", outputTemplate,
            url,
            "--yes-playlist",
            "--newline"
        ];

        const process = spawn(ytDlpPath, ytDlpArgs);

        process.stdout.on("data", (data) => {
            const output = data.toString().trim();
            console.log("🔹 yt-dlp stdout:", output);
        });

        process.stderr.on("data", (data) => {
            console.log("⚠️ yt-dlp stderr:", data.toString().trim());
        });

        process.on("close", async (code) => {
            if (code === 0) {
                const zipPath = path.join(downloadsDir, `${playlistTitle}.zip`);
                const output = fs.createWriteStream(zipPath);
                const archive = archiver("zip", { zlib: { level: 9 } });

                output.on("close", () => {
                    console.log(`✅ ZIP file created: ${zipPath}`);
                    res.download(zipPath, `${playlistTitle}.zip`, (err) => {
                        if (err) console.error("Error sending ZIP:", err);
                        fs.unlinkSync(zipPath);
                        fs.rmSync(playlistFolder, { recursive: true, force: true });
                    });
                });

                archive.on("error", (err) => res.status(500).json({ error: err.message }));

                archive.pipe(output);
                archive.directory(playlistFolder, false);
                archive.finalize();
            } else {
                res.status(500).json({ error: "Playlist download failed" });
            }
        });
    } else {
        console.log("🎥 Downloading single video...");

        exec(`${ytDlpPath} --no-playlist --get-title "${url}"`, (error, stdout) => {
            if (error) return res.status(500).json({ error: "Failed to get video title" });
        
            const videoTitle = sanitizeFilename(stdout.trim()).slice(0, maxLength);
            const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
            const extension = type === "audio" ? "mp3" : "mp4";
            const fileName = `${videoTitle}-${uniqueSuffix}.${extension}`;
            const filePath = path.join(downloadsDir, fileName);
        
            const cleanedUrl = url.split("&list=")[0]; // ✅ Removes `list=...`
        
            const ytDlpArgs = [
                "--no-playlist", // ✅ Ensures it's a single video
                "-f", format,
                ...extraOptions.split(" "),
                "-o", filePath,
                cleanedUrl, // ✅ Use cleaned URL without playlist
                "--newline"
            ];
        
            const process = spawn(ytDlpPath, ytDlpArgs);
        
            process.stdout.on("data", (data) => {
                const output = data.toString().trim();
                console.log("🔹 yt-dlp stdout:", output);
            });
        
            process.stderr.on("data", (data) => {
                console.log("⚠️ yt-dlp stderr:", data.toString().trim());
            });
        
            process.on("close", (code) => {
                if (code === 0) {
                    res.download(filePath, fileName, (err) => {
                        if (err) console.error("Error sending file:", err);
                        fs.unlinkSync(filePath);
                    });
                } else {
                    res.status(500).json({ error: "Download failed" });
                }
            });
        });        
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

server.listen(5000, () => console.log("✅ Server running on port 5000 🚀"));
