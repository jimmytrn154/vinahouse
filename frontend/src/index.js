import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // You can keep the default css or delete the file

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);