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

app.post("/download", async (req, res) => {
    const { url, type, playlist } = req.body;
    const format = type === "audio" ? "bestaudio" : "bv+ba/b";
    const extraOptions = type === "audio" ? "--extract-audio --audio-format mp3 --audio-quality 0" : "--merge-output-format mp4";
    const socketId = req.headers["socket-id"];

    if (isPlaylistUrl(url) && playlist) {
        console.log("🔄 Playlist mode enabled, downloading entire playlist...");

        exec(`${ytDlpPath} --print "%(playlist_title)s" "${url}"`, (error, stdout) => {
            if (error) return res.status(500).json({ error: "Failed to get playlist title" });

            const playlistTitle = sanitizeFilename(stdout.trim().split("\n")[0]);
            console.log(`🎵 Playlist title: ${playlistTitle}`);

            const playlistFolder = path.join(downloadsDir, playlistTitle);
            if (!fs.existsSync(playlistFolder)) fs.mkdirSync(playlistFolder, { recursive: true });

            exec(`${ytDlpPath} --flat-playlist --print "url" "${url}"`, async (error, stdout) => {
                if (error) return res.status(500).json({ error: "Failed to get playlist videos" });

                const videoUrls = stdout.trim().split("\n");
                console.log(`📜 Found ${videoUrls.length} videos.`);

                let completed = 0;
                const downloadPromises = videoUrls.map((videoUrl, index) => {
                    return new Promise((resolve, reject) => {
                        const fileNumber = (index + 1).toString().padStart(2, '0');
                        const extension = type === "audio" ? "mp3" : "mp4";
                        const fileName = `${fileNumber}-%(title)s.${extension}`;

                        const command = `${ytDlpPath} -f "${format}" ${extraOptions} -o "${playlistFolder}/${fileName}" "${videoUrl}"`;
                        const process = exec(command, { maxBuffer: 1024 * 1024 * 100 });

                        process.stderr.on("data", (data) => {
                            const progressMatch = data.match(/(\d{1,3}\.\d)%/);
                            if (progressMatch) {
                                const progress = parseFloat(progressMatch[1]);
                                io.to(socketId).emit("progressUpdate", { progress, videoIndex: index + 1 });
                            }
                        });

                        process.on("close", (code) => {
                            if (code === 0) {
                                completed++;
                                io.to(socketId).emit("playlistProgress", { completed, total: videoUrls.length });
                                resolve();
                            } else reject(new Error(`Download failed: ${videoUrl}`));
                        });
                    });
                });

                try {
                    await Promise.all(downloadPromises);
                    console.log("✅ Playlist download complete!");

                    const zipFile = path.join(downloadsDir, `${playlistTitle}.zip`);
                    const output = fs.createWriteStream(zipFile);
                    const archive = archiver("zip");

                    archive.pipe(output);
                    archive.directory(playlistFolder, false);
                    archive.finalize();

                    output.on("close", () => {
                        res.download(zipFile, `${playlistTitle}.zip`, (err) => {
                            if (err) console.error("Error sending zip:", err);
                            fs.rmSync(playlistFolder, { recursive: true, force: true });
                            fs.unlinkSync(zipFile);
                        });
                    });
                } catch (err) {
                    res.status(500).json({ error: "Batch download failed" });
                }
            });
        });
    } else {
        console.log("🔄 Single video mode detected...");

        let singleVideoUrl = url;
        if (isPlaylistUrl(url) && !playlist) {
            console.log("🎯 Extracting first video from playlist...");
            try {
                const { stdout } = await execPromise(`${ytDlpPath} --flat-playlist --print "url" "${url}"`);
                const videoUrls = stdout.trim().split("\n");
                singleVideoUrl = videoUrls[0];
                console.log(`✅ Selected first video: ${singleVideoUrl}`);
            } catch (error) {
                return res.status(500).json({ error: "Failed to fetch first video from playlist" });
            }
        }

        exec(`${ytDlpPath} --get-title "${singleVideoUrl}"`, (error, stdout) => {
            if (error) return res.status(500).json({ error: "Failed to get video title" });

            const videoTitle = sanitizeFilename(stdout.trim()).slice(0, maxLength);
            const uniqueSuffix = Math.floor(1000 + Math.random() * 9000); // 4-digit random suffix
            const extension = type === "audio" ? "mp3" : "mp4";
            const fileName = `${videoTitle}-${uniqueSuffix}.${extension}`;
            const filePath = path.join(downloadsDir, fileName);

            const command = `${ytDlpPath} -f "${format}" ${extraOptions} -o "${filePath}" "${singleVideoUrl}"`;
            const process = exec(command, { maxBuffer: 1024 * 1024 * 100 });

            process.stderr.on("data", (data) => {
                const progressMatch = data.match(/(\d{1,3}(\.\d+)?)%/);
                if (progressMatch) {
                    const progress = parseFloat(progressMatch[1]);
                    io.to(socketId).emit("progressUpdate", { progress });
                }
            });

            process.on("close", (code) => {
                if (code === 0) {
                    res.download(filePath, fileName, (err) => {
                        if (err) console.error("Error sending file:", err);
                        fs.unlinkSync(filePath);
                    });
                } else res.status(500).json({ error: "Download failed" });
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
