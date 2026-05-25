import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "@/app/App";
import "@/styles/globals.css";

// Disable browser context-menu — this is a native desktop app, not a webpage.
document.addEventListener("contextmenu", (e) => e.preventDefault());

// Block Ctrl+Shift+I / F12 DevTools in production builds.
if (!import.meta.env.DEV) {
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "F12" ||
      (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) ||
      (e.ctrlKey && e.key === "U")
    ) {
      e.preventDefault();
    }
  });
}

const container = document.getElementById("root");
if (!container) throw new Error("#root not found");

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
