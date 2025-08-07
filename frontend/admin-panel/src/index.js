import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import 'bootstrap/dist/css/bootstrap.min.css';
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { AdminAuthProvider } from "./contexts/AdminAuthContext"; // Import AdminAuthProvider

import './locales/i18n';

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AdminAuthProvider> {/* Wrap with AdminAuthProvider */}
      <Suspense fallback={<div>Loading Admin Panel...</div>}>
        <App />
      </Suspense>
    </AdminAuthProvider>
  </React.StrictMode>
);

reportWebVitals();
