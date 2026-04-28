// ─────────────────────────────────────────────
//  React Entry Point
// ─────────────────────────────────────────────
// This is the very first JavaScript file that
// runs. It attaches the React app to the <div
// id="root"> in index.html.

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
