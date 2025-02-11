import React from "react";
import { NavLink } from "react-router-dom";
import { FaYoutube, FaInstagram, FaDownload, FaCog } from "react-icons/fa";
import "./Sidebar.css";

const Sidebar = () => {
    return (
        <div className="sidebar">
            <div className="sidebar-top">
                <NavLink to="/youtube" className={({ isActive }) => `action-btn ${isActive ? "active" : ""}`}>
                    <FaYoutube />
                    <span>YouTube</span>
                </NavLink>
                <NavLink to="/instagram" className={({ isActive }) => `action-btn ${isActive ? "active" : ""}`}>
                    <FaInstagram />
                    <span>Instagram</span>
                </NavLink>
            </div>

            <div className="sidebar-bottom">
                <NavLink to="/downloads" className={({ isActive }) => `nav-btn ${isActive ? "active" : ""}`}>
                    <FaDownload />
                    <span>Downloads</span>
                </NavLink>
                <NavLink to="/settings" className={({ isActive }) => `nav-btn ${isActive ? "active" : ""}`}>
                    <FaCog />
                    <span>Settings</span>
                </NavLink>
            </div>
        </div>
    );
};

export default Sidebar;
