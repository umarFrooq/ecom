import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Adjust path as needed
import { Spinner, Container } from 'react-bootstrap'; // For loading state

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    // Show a loading spinner while auth state is being determined
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading authentication...</span>
        </Spinner>
      </Container>
    );
  }

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/account/login" state={{ from: location }} replace />;
  }

  // If roles are specified, check if the user has one of the required roles
  if (roles && roles.length > 0) {
    if (!user || !user.role || !roles.includes(user.role)) {
      // User does not have the required role, redirect to an unauthorized page or homepage
      // For simplicity, redirecting to homepage. Could be a specific '/unauthorized' page.
      return <Navigate to="/" replace />;
    }
  }

  return children; // User is authenticated (and has role if specified), render the children
};

export default ProtectedRoute;
