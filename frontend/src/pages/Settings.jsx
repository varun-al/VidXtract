import React from "react";
import Sidebar from "../component/Sidebar"; // Fix the path if needed

function Settings() {
    return (
        <div className="app-container">
            <Sidebar />
            <div className="container">
                <h1 style={{ color: "white", textAlign: "center" }}>Settings Page</h1>
                <p style={{ color: "white", textAlign: "center" }}>This is the Settings page. Adjust your preferences here.</p>
            </div>
        </div>
    );
}

export default Settings;
