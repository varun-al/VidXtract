import React, { useState } from "react";
import axios from "axios";
import { FaVolumeUp, FaVideo, FaLink, FaTimes, FaArrowRight } from "react-icons/fa";
import "./App.css";

function App() {
    const [url, setUrl] = useState("");
    const [downloadType, setDownloadType] = useState("video"); // Default: Video selected
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        if (!url.trim()) {
            alert("Please enter a valid YouTube URL!");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post("http://localhost:5000/download", { url, type: downloadType }, { responseType: "blob" });

            // Extract filename from Content-Disposition header
            const contentDisposition = response.headers["content-disposition"];
            let fileName = `download.${downloadType === "audio" ? "mp3" : "mp4"}`; // Default fallback

            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/);
                if (match && match[1]) {
                    fileName = match[1]; // Use the filename sent from the server
                }
            }

            // Create a downloadable link
            const blob = new Blob([response.data], { type: downloadType === "audio" ? "audio/mpeg" : "video/mp4" });
            const downloadUrl = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = downloadUrl;
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error("Error downloading:", error);
            alert("Download failed. Please check the URL and try again.");
        }
        setLoading(false);
    };

    return (
        <div className="container">
            {/* Logo */}
            <div className="logo-container">
                <img src="/logo.png" alt="Logo" className="logo" />
            </div>

            {/* Input Section */}
            <div className="input-container">
                <FaLink className="icon link-icon" />
                <input
                    type="text"
                    className="input-box"
                    placeholder="Enter YouTube URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                />
                {url && (
                    <button className="clear-btn" onClick={() => setUrl("")}>
                        <FaTimes />
                    </button>
                )}
                <button className="submit-btn" onClick={handleDownload} disabled={loading}>
                    <FaArrowRight />
                </button>
            </div>

            {/* Selection Buttons */}
            <div className="toggle-group">
                <button
                    className={`toggle-btn ${downloadType === "audio" ? "active" : ""}`}
                    onClick={() => setDownloadType("audio")}
                >
                    <FaVolumeUp className="icon-audio" /> Audio
                </button>
                <button
                    className={`toggle-btn ${downloadType === "video" ? "active" : ""}`}
                    onClick={() => setDownloadType("video")}
                >
                    <FaVideo className="icon-video" /> Video
                </button>
            </div>
        </div>
    );
}

export default App;
