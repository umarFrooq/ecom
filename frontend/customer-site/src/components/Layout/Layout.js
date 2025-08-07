import React from 'react';
import GlobalNavbar from './Navbar';
import Footer from './Footer';
import FloatingWhatsAppButton from '../Common/FloatingWhatsAppButton'; // Import the button
import { Container } from 'react-bootstrap';
import './Layout.css'; // For any layout-specific styles

const Layout = ({ children }) => {
  return (
    <>
      <GlobalNavbar />
      <main className="main-content">
        {/* Using a Container for the main content area, can be fluid or fixed based on design */}
        {/* If some pages need full width and others need a container, this can be conditional */}
        <Container fluid className="page-container mt-4 mb-4">
          {children}
        </Container>
      </main>
      <Footer />
      <FloatingWhatsAppButton /> {/* Add the button here */}
    </>
  );
};

export default Layout;
