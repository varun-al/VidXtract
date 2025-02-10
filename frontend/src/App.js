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
    const [progress, setProgress] = useState(0); // Progress state

    const isValidYoutubeUrl = (url) => {
        const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        return regex.test(url);
    };

    const handleDownload = async () => {
        if (!isValidYoutubeUrl(url.trim())) {
            toast.error("Please enter a valid YouTube URL!");
            return;
        }

        setLoading(true);
        setProgress(0); // Reset progress before download

        try {
            const response = await axios.post(
                "http://localhost:5000/download",
                { url, type: downloadType },
                {
                    responseType: "blob",
                    onDownloadProgress: (progressEvent) => {
                        const percentage = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                        setProgress(percentage); // Update progress
                    },
                }
            );

            let fileName = `download.${downloadType === "audio" ? "mp3" : "mp4"}`;
            const contentDisposition = response.headers["content-disposition"];
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^"]+)"?/);
                if (match && match[1]) {
                    fileName = decodeURIComponent(match[1]);
                }
            }

            const blob = new Blob([response.data], { type: downloadType === "audio" ? "audio/mpeg" : "video/mp4" });
            const downloadUrl = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = downloadUrl;
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(downloadUrl);
            toast.success("Download Started!");
        } catch (error) {
            const errorMessage =
                error.response?.data?.error || "Download failed. Please check the URL and try again.";
            toast.error(errorMessage);
        }

        setLoading(false);
        setProgress(0); // Reset progress after download
    };

    const pasteFromClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (!text) {
                toast.warn("Clipboard is empty!");
                return;
            }
            setUrl(text);
            toast.success("Link pasted from clipboard!");
        } catch (err) {
            toast.error("Failed to access clipboard. Please allow permissions.");
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleDownload();
        }
    };

    const isMobile = window.innerWidth <= 768;

    return (
        <div className="container">
            <ToastContainer
                position={isMobile ? "top-center" : "bottom-center"}
                autoClose={3000}
            />

            <div className="logo-container">
                <img src="/logo.png" alt="Logo" className="logo" />
            </div>

            <div className="input-container">
                <FaLink className="icon link-icon" onClick={pasteFromClipboard} />
                <input
                    type="text"
                    className="input-box"
                    placeholder="Enter YouTube URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={handleKeyPress}
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

            {/* Progress Bar */}
            {loading && (
                <div className="progress-bar-container">
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            )}

            <div
                style={{
                    textAlign: "center",
                    marginTop: "20px",
                    color: "#fff",
                    fontSize: "14px",
                    opacity: 0.7,
                }}
            >
                This web-app is created by{" "}
                <a
                    href="https://github.com/varun-al"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#00aaff", textDecoration: "none" }}
                >
                    Varun A L
                </a>
            </div>
        </div>
    );
}

export default App;
