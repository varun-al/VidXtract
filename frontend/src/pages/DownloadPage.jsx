import React, { useState, useEffect } from "react";
import Sidebar from "../component/Sidebar";
import "./DownloadPage.css"; // Import the CSS

function DownloadPage() {
    const [downloads, setDownloads] = useState([
        {
            id: 1,
            progress: 0,
            eta: "Calculating...",
            fileSize: "0 MB",
            thumbnail: "https://via.placeholder.com/150",
            title: "Downloading File 1",
        },
        {
            id: 2,
            progress: 0,
            eta: "Calculating...",
            fileSize: "0 MB",
            thumbnail: "https://via.placeholder.com/150",
            title: "Downloading File 2",
        },
    ]);

    useEffect(() => {
        const interval = setInterval(() => {
            setDownloads((prevDownloads) =>
                prevDownloads.map((download) =>
                    download.progress >= 100
                        ? { ...download, eta: "Completed" }
                        : {
                              ...download,
                              progress: Math.min(100, download.progress + 10),
                              eta: `${Math.max(0, (100 - download.progress) / 10)}s`,
                              fileSize: `${((download.progress + 10) / 10) * 5} MB`,
                          }
                )
            );
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="download-page">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="download-content">
                <h1 className="download-title">Download Progress</h1>

                <div className="download-list">
                    {downloads.map((download) => (
                        <div key={download.id} className="download-card">
                            {/* Header Section */}
                            <div className="download-header">
                                <img src={download.thumbnail} alt="Thumbnail" className="thumbnail" />
                                <h2 className="file-title">{download.title}</h2>
                            </div>

                            {/* Progress Section */}
                            <div className="download-progress-container">
                                <div className="progress-info">
                                    <span className="progress-percentage"><strong>Progress:</strong> {download.progress}%</span>
                                </div>
                                <div className="progress-bar-container">
                                    <div
                                        className="progress-bar"
                                        style={{ width: `${download.progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* File Info */}
                            <div className="download-info">
                                <p><strong>ETA:</strong> {download.eta}</p>
                                <p><strong>File Size:</strong> {download.fileSize}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default DownloadPage;
