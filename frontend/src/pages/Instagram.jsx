import React from "react";
import Sidebar from "../component/Sidebar"; // Fix the path if needed

function Instagram() {
    return (
        <div className="app-container">
            <Sidebar />
            <div className="container">
                <h1 style={{ color: "white", textAlign: "center" }}>Instagram Page</h1>
                <p style={{ color: "white", textAlign: "center" }}>This is the Instagram page. Content coming soon!</p>
            </div>
        </div>
    );
}

export default Instagram;
