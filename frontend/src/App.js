import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./component/Sidebar";
import YouTube from "./pages/YouTube";
import Instagram from "./pages/Instagram"; // Create this later
import Settings from "./pages/Settings"; // Create this later
import "./App.css";

function App() {
    return (
        <Router>
            <div className="app-container">
                <Sidebar />
                <div className="main-content">
                    <Routes>
                        <Route path="/" element={<Navigate to="/youtube" />} />
                        <Route path="/youtube" element={<YouTube />} />
                        <Route path="/instagram" element={<Instagram />} />
                        <Route path="/settings" element={<Settings />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;
