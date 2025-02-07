import React, { useState } from "react";
import axios from "axios";
import { FaVolumeUp, FaVideo, FaLink, FaTimes, FaArrowRight } from "react-icons/fa";
import { ClipLoader } from "react-spinners";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

function App() {
    const [url, setUrl] = useState("");
    const [downloadType, setDownloadType] = useState("video");
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        if (!url.trim()) {
            toast.error("Please enter a valid YouTube URL!");
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                "http://localhost:5000/download",
                { url, type: downloadType },
                { responseType: "blob" }
            );

            console.log("📩 Response headers:", response.headers);

            // Extract filename from headers
            let fileName = `download.${downloadType === "audio" ? "mp3" : "mp4"}`;
            const contentDisposition = response.headers["content-disposition"];

            if (contentDisposition) {
                console.log("📄 Raw Content-Disposition:", contentDisposition);

                // Improved regex to properly extract the filename
                const match = contentDisposition.match(/filename="?([^"]+)"?/);

                if (match && match[1]) {
                    fileName = decodeURIComponent(match[1]); // Decode filename
                }
            }

            console.log("✅ Final filename:", fileName);

            const blob = new Blob([response.data], { type: downloadType === "audio" ? "audio/mpeg" : "video/mp4" });
            const downloadUrl = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = downloadUrl;
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(downloadUrl);
            // toast.success(`Download complete: ${fileName}`);
            toast.success(`Download Started..!`);
        } catch (error) {
            console.error("❌ Error downloading:", error);
            toast.error("Download failed. Please check the URL and try again.");
        }

        setLoading(false);
    };

    // Function to handle Enter key press
    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleDownload();
        }
    };

    return (
        <div className="container">
            {/* Toast container with bottom center position */}
            <ToastContainer position="bottom-center" autoClose={3000} />

            <div className="logo-container">
                <img src="/logo.png" alt="Logo" className="logo" />
            </div>

            <div className="input-container">
                <FaLink className="icon link-icon" />
                <input
                    type="text"
                    className="input-box"
                    placeholder="Enter YouTube URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={handleKeyPress} // Added event listener for Enter key
                />
                {url && (
                    <button className="clear-btn" onClick={() => setUrl("")}>
                        <FaTimes />
                    </button>
                )}
                <button className="submit-btn" onClick={handleDownload} disabled={loading}>
                    {loading ? <ClipLoader size={20} color="#ffffff" /> : <FaArrowRight />}
                </button>
            </div>

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
