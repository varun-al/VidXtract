import React, { useState } from "react";
import axios from "axios";
import { FaLink, FaTimes, FaArrowRight } from "react-icons/fa";
import { ClipLoader } from "react-spinners";
import { ToastContainer, toast } from "react-toastify";
import { Tooltip } from "react-tooltip";
import Sidebar from "../component/Sidebar";
import "react-toastify/dist/ReactToastify.css";
import "./Instagram.css";

function Instagram() {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);

    const isValidInstagramUrl = (url) => {
        const regex = /^(https?:\/\/)?(www\.)?instagram\.com\/(reel|p)\/.+$/;
        return regex.test(url);
    };

    const handleDownload = async () => {
        if (!isValidInstagramUrl(url.trim())) {
            toast.error("Please enter a valid Instagram Reel/Post URL!");
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                "http://localhost:5000/download",
                { url },
                { responseType: "blob" }
            );

            let fileName = "download.mp4";
            const contentDisposition = response.headers["content-disposition"];
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^"]+)"?/);
                if (match && match[1]) {
                    fileName = decodeURIComponent(match[1]);
                }
            }

            const blob = new Blob([response.data], { type: "video/mp4" });
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

        setTimeout(() => setLoading(false), 1000);
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
        <div className="app-container">
            <Sidebar />

            <div className="container">
                <ToastContainer position={isMobile ? "top-center" : "bottom-center"} autoClose={3000} />

                <div className="logo-container">
                    <img src="/iglogo.png" alt="Logo" className="logo" />
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
                        placeholder="Enter Instagram Reel/Post URL"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={handleKeyPress}
                    />
                    {url && (
                        <button className="clear-btn" onClick={() => setUrl("")}> <FaTimes /> </button>
                    )}
                    <button className="submit-btn" onClick={handleDownload} disabled={loading}>
                        {loading ? <ClipLoader size={20} color="#ffffff" /> : <FaArrowRight />}
                    </button>
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

export default Instagram;
