import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';
import { initBirdFavicon } from './utils/favicon';

// Kích hoạt favicon hình chú chim hoàn chỉnh trên tab trình duyệt
initBirdFavicon();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
