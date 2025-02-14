import React, { useState } from "react";
import Sidebar from "../component/Sidebar";
import "./Settings.css"; // Custom styles

function Settings() {
    // State for selected options
    const [selectedVideoQuality, setSelectedVideoQuality] = useState("1080p");
    const [selectedCodec, setSelectedCodec] = useState("H264 (MP4)");
    const [selectedAudioFormat, setSelectedAudioFormat] = useState("MP3");
    const [selectedAudioBitrate, setSelectedAudioBitrate] = useState("128kb/s");

    return (
        <div className="settings-container">
            <Sidebar />
            <div className="settings-content">
                <h1>Settings</h1>
                
                {/* Notice about YouTube settings */}
                <p className="settings-notice">
                    ⚠️ The settings below only affect YouTube downloads. Instagram downloads are not affected.
                </p>

                <div className="settings-sections-container">
                    {/* Video Settings */}
                    <div className="settings-section">
                        <h2>Video Quality</h2>
                        <div className="button-group">
                            {["8K+", "4K", "1440p", "1080p", "720p", "480p", "360p", "240p", "144p"].map((quality) => (
                                <button 
                                    key={quality} 
                                    className={selectedVideoQuality === quality ? "selected" : ""}
                                    onClick={() => setSelectedVideoQuality(quality)}
                                >
                                    {quality}
                                </button>
                            ))}
                        </div>
                        <p className="info-text">
                            If preferred video quality isn't available, the next best option is chosen automatically.
                        </p>

                        <h2>YouTube Codec & Container</h2>
                        <div className="button-group">
                            {["H264 (MP4)", "AV1 (WebM)", "VP9 (WebM)"].map((codec) => (
                                <button 
                                    key={codec} 
                                    className={selectedCodec === codec ? "selected" : ""}
                                    onClick={() => setSelectedCodec(codec)}
                                >
                                    {codec}
                                </button>
                            ))}
                        </div>
                        <p className="info-text">
                            H264: Best compatibility, average quality. Max resolution 1080p.<br/>
                            AV1: Best quality and efficiency, supports 8K & HDR.<br/>
                            VP9: Same quality as AV1 but ~2x larger file size, supports 4K & HDR.<br/>
                            If AV1 or VP9 aren't available, H264 is used instead.
                        </p>
                    </div>

                    {/* Audio Settings */}
                    <div className="settings-section">
                        <h2>Audio Format</h2>
                        <div className="button-group">
                            {["Best", "MP3", "OGG", "WAV", "Opus"].map((format) => (
                                <button 
                                    key={format} 
                                    className={selectedAudioFormat === format ? "selected" : ""}
                                    onClick={() => setSelectedAudioFormat(format)}
                                >
                                    {format}
                                </button>
                            ))}
                        </div>
                        <p className="info-text">
                            All formats except "Best" are converted, which may cause some quality loss.<br/>
                            When "Best" is selected, the original format is kept whenever possible.
                        </p>

                        <h2>Audio Bitrate</h2>
                        <div className="button-group">
                            {["320kb/s", "256kb/s", "128kb/s", "96kb/s", "64kb/s", "8kb/s"].map((bitrate) => (
                                <button 
                                    key={bitrate} 
                                    className={selectedAudioBitrate === bitrate ? "selected" : ""}
                                    onClick={() => setSelectedAudioBitrate(bitrate)}
                                >
                                    {bitrate}
                                </button>
                            ))}
                        </div>
                        <p className="info-text">
                            Bitrate is applied only when converting to a lossy format.<br/>
                            Choosing a bitrate above 128kbps may increase file size without significant quality improvement.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Settings;
