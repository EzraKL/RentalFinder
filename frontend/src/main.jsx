// frontend/src/main.jsx (partial update)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

import { AuthProvider } from './AuthContext.jsx'; // <-- NEW

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider> {/* <-- WRAP THE APP */}
      <App />
    </AuthProvider>
  </React.StrictMode>,
);