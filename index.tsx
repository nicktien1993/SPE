
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

console.log("[System] React module loaded. Attempting to mount...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("[System] Failed to find root element.");
} else {
  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("[System] App mounted successfully.");
  } catch (err) {
    console.error("[System] Mount error:", err);
    rootElement.innerHTML = `<div style="padding: 20px; color: red;">掛載發生錯誤: ${err.message}</div>`;
  }
}
