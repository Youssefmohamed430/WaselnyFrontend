import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';
import './styles/auth.css';

// Get base path from environment variable (for GitHub Pages)
// If your repo is https://github.com/username/repo-name, set VITE_BASE_PATH=/repo-name/
const basePath = import.meta.env.VITE_BASE_PATH || '/';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter basename={basePath}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);


