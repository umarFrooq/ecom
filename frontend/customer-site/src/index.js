import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext"; // Import CartProvider
import { BrowserRouter } from "react-router-dom"; // Import BrowserRouter

import './locales/i18n';

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <AuthProvider>
        <CartProvider> {/* Wrap App/Router with CartProvider, inside AuthProvider */}
          <BrowserRouter>
            <Suspense fallback={<div>Loading...</div>}>
              <App />
            </Suspense>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </HelmetProvider>
  </React.StrictMode>
);

reportWebVitals();
