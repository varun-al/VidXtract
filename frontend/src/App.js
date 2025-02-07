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
    const [progress, setProgress] = useState(0);

    const isValidYoutubeUrl = (url) => {
        const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        return regex.test(url);
    };

    const checkProgress = () => {
        axios.get("http://localhost:5000/progress").then((response) => {
            setProgress(response.data.progress);
            console.log(`Progress: ${response.data.progress}%`);
            if (response.data.progress >= 100) {
                toast.success("Download Completed!");
                setLoading(false);
                clearInterval(progressInterval);
            }
        }).catch(() => {
            clearInterval(progressInterval);
        });
    };

    let progressInterval;

    const handleDownload = async () => {
        if (!isValidYoutubeUrl(url.trim())) {
            toast.error("Please enter a valid YouTube URL!");
            return;
        }

        setLoading(true);
        setProgress(0);

        try {
            await axios.post("http://localhost:5000/download", { url, type: downloadType });
            
            // Start checking progress every second
            progressInterval = setInterval(checkProgress, 1000);

        } catch (error) {
            toast.error("Download failed. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="container">
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

            {/* Progress Bar */}
            {loading && (
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                </div>
            )}

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
