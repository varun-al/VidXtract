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
const io = new Server(server);

app.use(cors({ exposedHeaders: ["Content-Disposition"] }));
app.use(bodyParser.json());

const ytDlpPath = "yt-dlp"; // Ensure yt-dlp is installed globally
const downloadsDir = path.join(__dirname, "downloads");

// Ensure downloads directory exists
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

// Function to check if URL is a playlist
const isPlaylistUrl = (url) => url.includes("list=");

// Function to sanitize filenames
const sanitizeFilename = (title) => title.replace(/[<>:"/\\|?*\n]+/g, "").trim();
const maxLength = 50; // Limit filename length

// Handle client connections for real-time updates
io.on("connection", (socket) => {
    console.log("🔌 Client connected");
    socket.on("disconnect", () => console.log("🔌 Client disconnected"));
});

app.post("/download", async (req, res) => {
    const { url, type } = req.body;
    const format = type === "audio" ? "bestaudio" : "bv+ba/b";
    const extraOptions = type === "audio" ? "--extract-audio --audio-format mp3 --audio-quality 0" : "--merge-output-format mp4";

    if (isPlaylistUrl(url)) {
        console.log("🔄 Playlist detected, downloading all videos...");

        exec(`${ytDlpPath} --print "%(playlist_title)s" "${url}"`, (error, stdout, stderr) => {
            if (error) {
                console.error("Failed to fetch playlist title:", stderr);
                return res.status(500).json({ error: "Failed to get playlist title" });
            }

            const playlistTitle = sanitizeFilename(stdout.split("\n")[0]) || "Playlist";
            console.log(`🎵 Playlist title: ${playlistTitle}`);

            const playlistFolder = path.join(downloadsDir, playlistTitle);
            if (!fs.existsSync(playlistFolder)) fs.mkdirSync(playlistFolder, { recursive: true });

            exec(`${ytDlpPath} --flat-playlist --print "url" "${url}"`, async (error, stdout, stderr) => {
                if (error) {
                    console.error("Failed to fetch playlist videos:", stderr);
                    return res.status(500).json({ error: "Failed to get playlist videos" });
                }

                const videoUrls = stdout.trim().split("\n");
                console.log(`📜 Found ${videoUrls.length} videos in playlist.`);

                const downloadPromises = videoUrls.map((videoUrl, index) => {
                    return new Promise((resolve, reject) => {
                        const fileNumber = (index + 1).toString().padStart(2, '0');
                        const extension = type === "audio" ? "mp3" : "mp4";
                        const fileName = `${fileNumber}-%(title)s.${extension}`;

                        const command = `${ytDlpPath} -f "${format}" ${extraOptions} -o "${playlistFolder}/${fileName}" "${videoUrl}"`;

                        const process = exec(command, { maxBuffer: 1024 * 1024 * 100 });

                        process.stderr.on("data", (data) => {
                            const progressMatch = data.match(/(\d+(\.\d+)?)%/);
                            if (progressMatch) {
                                const progress = parseFloat(progressMatch[1]);
                                io.emit("progressUpdate", { video: videoUrl, progress });
                            }
                        });

                        process.on("close", (code) => {
                            if (code === 0) {
                                console.log(`✅ Downloaded ${videoUrl}`);
                                resolve();
                            } else {
                                console.error(`❌ Failed to download ${videoUrl}`);
                                reject(new Error(`Failed to download ${videoUrl}`));
                            }
                        });
                    });
                });

                try {
                    await Promise.all(downloadPromises);
                    console.log("✅ All videos downloaded successfully!");

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
                    console.error("Batch download failed:", err);
                    res.status(500).json({ error: "Batch download failed" });
                }
            });
        });
    } else {
        console.log("🔄 Single video detected, fetching title...");

        exec(`${ytDlpPath} --get-title "${url}"`, (error, stdout, stderr) => {
            if (error) {
                console.error("Failed to fetch title:", stderr);
                return res.status(500).json({ error: "Failed to get video title" });
            }

            const videoTitle = sanitizeFilename(stdout.trim()).slice(0, maxLength);
            const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
            const extension = type === "audio" ? "mp3" : "mp4";
            const fileName = `${videoTitle}-${uniqueSuffix}.${extension}`;
            const filePath = path.join(downloadsDir, fileName);

            const command = `${ytDlpPath} -f "${format}" ${extraOptions} -o "${filePath}" "${url}"`;

            const process = exec(command, { maxBuffer: 1024 * 1024 * 100 });

            process.stderr.on("data", (data) => {
                const progressMatch = data.match(/(\d+(\.\d+)?)%/);
                if (progressMatch) {
                    const progress = parseFloat(progressMatch[1]);
                    io.emit("progressUpdate", { video: url, progress });
                }
            });

            process.on("close", (code) => {
                if (code === 0) {
                    console.log(`✅ Video downloaded successfully: ${fileName}`);

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

server.listen(5000, () => console.log("✅ Server running on port 5000 🚀"));
