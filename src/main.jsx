// src/main.jsx — Vite entry point
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { ContentProvider } from './content/ContentContext';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ContentProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ContentProvider>
  </React.StrictMode>
);
