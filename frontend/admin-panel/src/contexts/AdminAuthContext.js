import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    adminLogin as apiAdminLogin,
    getAdminProfile as apiGetAdminProfile
} from '../services/adminApiService'; // Adjust path

const AdminAuthContext = createContext(null);

export const useAdminAuth = () => useContext(AdminAuthContext);

export const AdminAuthProvider = ({ children }) => {
    const [adminUser, setAdminUser] = useState(null);
    const [adminToken, setAdminToken] = useState(localStorage.getItem('adminAuthToken'));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initializeAuth = async () => {
            if (adminToken) {
                setLoading(true);
                try {
                    // Verify token by fetching admin profile
                    const response = await apiGetAdminProfile(); // This uses the token from interceptor
                    if (response.data && response.data.success) {
                        // Ensure the user has an admin/editor role
                        if (['admin', 'editor'].includes(response.data.data.role)) {
                            setAdminUser(response.data.data);
                            localStorage.setItem('adminUser', JSON.stringify(response.data.data));
                        } else {
                            setError('User does not have sufficient privileges for admin panel.');
                            throw new Error('Insufficient privileges.'); // Will be caught below
                        }
                    } else {
                        throw new Error(response.data.message || 'Failed to verify admin token.');
                    }
                } catch (err) {
                    console.error("Admin Auth Init Error:", err.message);
                    localStorage.removeItem('adminAuthToken');
                    localStorage.removeItem('adminUser');
                    setAdminToken(null);
                    setAdminUser(null);
                    // setError might be set by the catch block or above
                    if(!error) setError(err.message || 'Admin session invalid.');
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        initializeAuth();
    }, [adminToken, error]); // Rerun if token changes or if an error was set previously that needs clearing

    const login = useCallback(async (credentials) => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiAdminLogin(credentials);
            if (response.data && response.data.success && response.data.token) {
                 if (!['admin', 'editor'].includes(response.data.user.role)) {
                    setError('Access Denied: User does not have admin/editor privileges.');
                    throw new Error('Access Denied: Insufficient privileges.');
                }
                setAdminToken(response.data.token);
                setAdminUser(response.data.user);
                localStorage.setItem('adminAuthToken', response.data.token);
                localStorage.setItem('adminUser', JSON.stringify(response.data.user));
                return response.data; // Success
            } else {
                setError(response.data.message || 'Admin login failed.');
                throw new Error(response.data.message || 'Admin login failed.');
            }
        } catch (err) {
            setError(err.error || err.message || 'An error occurred during admin login.');
            throw err; // Re-throw for page to handle
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        // No backend logout call for admin in this example, but could be added
        setAdminUser(null);
        setAdminToken(null);
        localStorage.removeItem('adminAuthToken');
        localStorage.removeItem('adminUser');
        // setError(null); // Clear any existing auth errors on logout
        // Navigation will be handled by the component calling logout
    }, []);

    const value = {
        adminUser,
        adminToken,
        isAuthenticated: !!adminToken && !!adminUser,
        loading,
        error,
        login,
        logout,
        setError // To clear errors from components
    };

    return (
        <AdminAuthContext.Provider value={value}>
            {children}
        </AdminAuthContext.Provider>
    );
};
