
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

console.log("[System] Babel transpilation finished. Starting React...");

const mountApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error("[System] Root element not found.");
    return;
  }

  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("[System] App mounted successfully.");
  } catch (err) {
    console.error("[System] Render error:", err);
  }
};

// 確保在 Babel 轉譯後稍微等待 DOM 完全穩定再掛載
if (document.readyState === 'complete') {
  mountApp();
} else {
  window.addEventListener('load', mountApp);
}
