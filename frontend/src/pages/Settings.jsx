import React, { useState, useEffect } from "react";
import Sidebar from "../component/Sidebar";
import "./Settings.css"; // Custom styles
import axios from "axios"; // For API requests

function Settings() {
    // State for selected options
    const [selectedVideoQuality, setSelectedVideoQuality] = useState("Best");
    const [selectedCodec, setSelectedCodec] = useState("H264 (MP4)");
    const [selectedAudioFormat, setSelectedAudioFormat] = useState("MP3");
    const [selectedAudioBitrate, setSelectedAudioBitrate] = useState("Best");

    // Fetch settings on mount
    useEffect(() => {
        axios.get("http://localhost:5000/settings")
            .then(({ data }) => {
                setSelectedVideoQuality(data.videoQuality || "Best");
                setSelectedCodec(data.codec || "H264 (MP4)");
                setSelectedAudioFormat(data.audioFormat || "MP3");
                setSelectedAudioBitrate(data.audioBitrate || "Best");
            })
            .catch(console.error);
    }, []);

    // Save updated settings to the backend
    const saveSettings = (key, value) => {
        const updatedSettings = {
            videoQuality: selectedVideoQuality,
            codec: selectedCodec,
            audioFormat: selectedAudioFormat,
            audioBitrate: selectedAudioBitrate,
            [key]: value, // Update only the specific key
        };

        axios.post("http://localhost:5000/settings", updatedSettings)
            .then(({ data }) => {
                console.log("Settings saved:", data);
            })
            .catch(console.error);
    };

    return (
        <div className="settings-container">
            <Sidebar />
            <div className="settings-content">
                <h1>Settings</h1>

                <p className="settings-notice">
                    ⚠️ The settings below will apply to all YouTube downloads. These settings will not affect Instagram downloads.
                </p>

                <div className="settings-sections-container">
                    <div className="settings-section">
                        <h2>Video Quality</h2>
                        <div className="button-group">
                            {["Best", "4K", "1440p", "1080p", "720p", "480p", "360p", "240p", "144p"].map((quality) => (
                                <button
                                    key={quality}
                                    className={selectedVideoQuality === quality ? "selected" : ""}
                                    onClick={() => {
                                        setSelectedVideoQuality(quality);
                                        saveSettings("videoQuality", quality);
                                    }}
                                >
                                    {quality}
                                </button>
                            ))}
                        </div>
                        <p className="info-text">
                            Choose the preferred video resolution for downloads. If the selected quality isn't available, the next best option will be used.
                        </p>
                    </div>

                    <div className="settings-section">
                        <h2>Audio Bitrate</h2>
                        <div className="button-group">
                            {["Best", "320kb/s", "256kb/s", "128kb/s", "96kb/s", "64kb/s"].map((bitrate) => (
                                <button
                                    key={bitrate}
                                    className={selectedAudioBitrate === bitrate ? "selected" : ""}
                                    onClick={() => {
                                        setSelectedAudioBitrate(bitrate);
                                        saveSettings("audioBitrate", bitrate);
                                    }}
                                >
                                    {bitrate}
                                </button>
                            ))}
                        </div>
                        <p className="info-text">
                            Select the audio quality for downloads.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Settings;
