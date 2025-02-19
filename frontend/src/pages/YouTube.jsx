import React, { useState } from "react";
import axios from "axios";
import { FaVolumeUp, FaVideo, FaList, FaLink, FaTimes, FaArrowRight } from "react-icons/fa";
import { ClipLoader } from "react-spinners";
import { ToastContainer, toast } from "react-toastify";
import { Tooltip } from "react-tooltip";
import Sidebar from "../component/Sidebar"; // Import Sidebar
import "react-toastify/dist/ReactToastify.css";
import "./YouTube.css";

function YouTube() {
    const [url, setUrl] = useState("");
    const [downloadType, setDownloadType] = useState("video");
    const [playlistMode, setPlaylistMode] = useState(false);
    const [loading, setLoading] = useState(false);
    // const [toastId, setToastId] = useState(null); // Store toast ID

    const isValidYoutubeUrl = (url) => {
        const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        return regex.test(url);
    };

    const isPlaylistUrl = (url) => url.includes("list=");

    const listenForProgress = (initializingToastId) => {
        const eventSource = new EventSource("http://localhost:5000/progress");
        const toastId = "progressToast"; // Fixed ID for updating

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.progress) {
                // Dismiss the initializing toast
                toast.dismiss(initializingToastId);

                if (!toast.isActive(toastId)) {
                    toast.info(`Download Progress: ${data.progress}%`, {
                        autoClose: false,
                        toastId: toastId,
                    });
                } else {
                    toast.update(toastId, {
                        render: `Download Progress: ${data.progress}%`,
                        autoClose: false,
                    });
                }

                // ✅ Close progress toast and show success toast on completion
                if (data.progress >= 100 || data.status === "completed") {
                    toast.update(toastId, {
                        render: "Download Completed! 🎉",
                        type: "success", // ✅ Correct usage
                        autoClose: 3000,
                    });

                    setTimeout(() => {
                        toast.dismiss(toastId); // Ensure toast is removed
                    }, 500);

                    eventSource.close(); // Stop listening for updates
                }
            }
        };

        eventSource.onerror = () => {
            console.log("EventSource closed or errored.");
            eventSource.close();
        };
    };

    const handleDownload = async () => {
        if (!isValidYoutubeUrl(url.trim())) {
            toast.error("Please enter a valid YouTube URL!");
            return;
        }

        setLoading(true);
        const initializingToastId = toast.info("Initializing...", { autoClose: false });
        listenForProgress(initializingToastId); // Start listening for progress

        try {
            const response = await axios.post(
                "http://localhost:5000/download",
                { url, type: downloadType, playlist: playlistMode },
                { responseType: "blob" }
            );

            let fileName = `download.${downloadType === "audio" ? "mp3" : "mp4"}`;
            const contentDisposition = response.headers["content-disposition"];
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^";]+)"?/);
                if (match && match[1]) fileName = decodeURIComponent(match[1]);
            }

            const blob = new Blob([response.data], {
                type: downloadType === "audio" ? "audio/mpeg" : "video/mp4",
            });
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
            console.error(error);
            toast.error("Download failed. Please check the URL and try again.");
        } finally {
            setLoading(false);
        }
    };

    const pasteFromClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (!text) {
                toast.warn("Clipboard is empty!");
                return;
            }
            setUrl(text);
            // toast.success("Link pasted from clipboard!");
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
        <div className="youtube-page">
            <Sidebar />

            <div className="container">
                <ToastContainer position={isMobile ? "top-center" : "bottom-center"} autoClose={3000} />

                <div className="logo-container">
                    <img src="/logo.png" alt="Logo" className="logo" />
                </div>

                <div className="input-container">
                    <FaLink
                        className="icon link-icon"
                        onClick={pasteFromClipboard}
                        data-tooltip-id="paste-tooltip"
                        data-tooltip-content="Click to paste link"
                    />
                    <Tooltip id="paste-tooltip" place="top" effect="solid" />
                    <input
                        type="text"
                        className="input-box"
                        placeholder="Enter YouTube URL"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={handleKeyPress}
                    />
                    {url && (
                        <button
                            className="clear-btn"
                            onClick={() => {
                                setUrl("");
                                setPlaylistMode(false);
                            }}
                        >
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

                    {isPlaylistUrl(url) && (
                        <button
                            className={`toggle-btn ${playlistMode ? "active" : ""}`}
                            data-tooltip-id="playlist-tooltip"
                            data-tooltip-content="Select to Download Playlist"
                            onClick={() => setPlaylistMode(!playlistMode)}
                        >
                            <Tooltip id="playlist-tooltip" place="top" effect="solid" />
                            <FaList className="icon-playlist" /> Playlist
                        </button>
                    )}
                </div>

                <div style={{ textAlign: "center", marginTop: "20px", color: "#fff", fontSize: "14px", opacity: 0.7 }}>
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
        </div>
    );
}

export default YouTube;
