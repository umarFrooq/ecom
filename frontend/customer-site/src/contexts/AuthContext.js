import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
    loginUser as apiLoginUser,
    registerUser as apiRegisterUser,
    getMe as apiGetMe,
    logoutUser as apiLogoutUser,
    updateUserDetails as apiUpdateUserDetails
} from '../services/apiService'; // Adjust path as needed

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null); // Initialize token as null
    const [authAttempted, setAuthAttempted] = useState(false); // Tracks if initial auth attempt is done
    const [operationLoading, setOperationLoading] = useState(false); // For login, register, update operations
    const [error, setError] = useState(null);

    const initialLoadAttempted = useRef(false);

    // Effect 1: Load token from localStorage and attempt initial auth ONCE on mount
    useEffect(() => {
        if (initialLoadAttempted.current) {
            return;
        }
        initialLoadAttempted.current = true;

        const storedToken = localStorage.getItem('authToken');

        if (storedToken) {
            setToken(storedToken);
            // Validation will happen in the effect below that depends on `token`.
            // Set authAttempted to false initially; validation effect will set it to true.
            setAuthAttempted(false);
        } else {
            setAuthAttempted(true); // No token, auth resolved as not logged in.
            setUser(null);
        }
    }, []); // Runs only once on mount

    // Effect 2: Validate token when it's set (either from initial load or login/register)
    useEffect(() => {
        const validateToken = async () => {
            if (token) {
                // Show loading if this is the initial validation pass.
                if (!authAttempted) {
                    setOperationLoading(true);
                }

                try {
                    const response = await apiGetMe(token);
                    if (response.data && response.data.success) {
                        setUser(response.data.data);
                        // Ensure localStorage is consistent
                        localStorage.setItem('authUser', JSON.stringify(response.data.data));
                        localStorage.setItem('authToken', token);
                    } else {
                        setUser(null);
                        setToken(null);
                        localStorage.removeItem('authToken');
                        localStorage.removeItem('authUser');
                    }
                } catch (err) {
                    console.error("Token validation error:", err);
                    setUser(null);
                    setToken(null);
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('authUser');
                } finally {
                    if (!authAttempted) {
                        setAuthAttempted(true);
                    }
                    // Always turn off operationLoading if it was turned on by this effect.
                    // Avoids issues if login/register also manage operationLoading.
                    if (!authAttempted || operationLoading) {
                        setOperationLoading(false);
                    }
                }
            } else {
                // No token, or token was cleared.
                setUser(null); // Ensure user is null.
                if (!authAttempted) {
                    setAuthAttempted(true); // Mark auth as attempted if it wasn't.
                }
            }
        };

        // Run validation if there's a token to validate,
        // OR if auth hasn't been attempted yet (to correctly set authAttempted from a no-token state).
        if (token || !authAttempted) {
            validateToken();
        } else if (authAttempted && !token && user !== null) {
            // Edge case: if somehow auth is attempted, token is null, but user isn't. Correct it.
            setUser(null);
        }

    }, [token, authAttempted]); // React to token changes and initial authAttempted state.

    const login = useCallback(async (credentials) => {
        setOperationLoading(true);
        setError(null);
        try {
            const response = await apiLoginUser(credentials);
            if (response.data && response.data.success && response.data.token) {
                localStorage.setItem('authToken', response.data.token);
                localStorage.setItem('authUser', JSON.stringify(response.data.user));
                // Setting token will trigger the validation useEffect.
                // setUser optimistically, validation effect will confirm/override.
                setUser(response.data.user);
                setToken(response.data.token);
                setAuthAttempted(true); // After login, auth is considered resolved.
                // operationLoading will be handled by the useEffect triggered by setToken
                return response.data;
            } else {
                setError(response.data.message || 'Login failed.');
                setOperationLoading(false);
                throw new Error(response.data.message || 'Login failed.');
            }
        } catch (err) {
            setError(err.error || err.message || 'An error occurred during login.');
            setOperationLoading(false);
            throw err;
        }
    }, []);

    const register = useCallback(async (userData) => {
        setOperationLoading(true);
        setError(null);
        try {
            const response = await apiRegisterUser(userData);
            if (response.data && response.data.success && response.data.token) {
                localStorage.setItem('authToken', response.data.token);
                localStorage.setItem('authUser', JSON.stringify(response.data.user));
                setUser(response.data.user);
                setToken(response.data.token);
                setAuthAttempted(true);
                // operationLoading will be handled by the useEffect
                return response.data;
            } else {
                setError(response.data.message || 'Registration failed.');
                setOperationLoading(false);
                throw new Error(response.data.message || 'Registration failed.');
            }
        } catch (err) {
            setError(err.error || err.message || 'An error occurred during registration.');
            setOperationLoading(false);
            throw err;
        }
    }, []);

    const logout = useCallback(async () => {
        setOperationLoading(true);
        try {
            const currentTokenForApi = token || localStorage.getItem('authToken');
            if (currentTokenForApi) {
                await apiLogoutUser(currentTokenForApi);
            }
        } catch (logoutError) {
            console.error("Backend logout error:", logoutError);
        } finally {
            setUser(null);
            setToken(null);
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            setAuthAttempted(true);
            setOperationLoading(false);
        }
    }, [token]); // Added token dependency for currentTokenForApi logic

    const updateUser = useCallback(async (userDataToUpdate) => {
        if (!token) {
            setError("Not authenticated to update user.");
            throw new Error("Not authenticated to update user.");
        }
        setOperationLoading(true);
        setError(null);
        try {
            const response = await apiUpdateUserDetails(userDataToUpdate, token);
            if (response.data && response.data.success) {
                setUser(response.data.data);
                localStorage.setItem('authUser', JSON.stringify(response.data.data));
                return response.data.data;
            } else {
                setError(response.data.message || "Failed to update user details.");
                throw new Error(response.data.message || "Failed to update user details.");
            }
        } catch (err) {
            setError(err.error || err.message || "An error occurred while updating details.");
            throw err;
        } finally {
            setOperationLoading(false);
        }
    }, [token]);

    const refreshUser = useCallback(async () => {
        if (token) {
            setOperationLoading(true);
            try {
                const response = await apiGetMe(token);
                if (response.data && response.data.success) {
                    setUser(response.data.data);
                    localStorage.setItem('authUser', JSON.stringify(response.data.data));
                } else {
                    await logout();
                }
            } catch (err) {
                console.error("Error refreshing user:", err);
                await logout();
            } finally {
                setOperationLoading(false);
            }
        } else {
             // If no token, ensure logged out state
            if (user || localStorage.getItem('authToken')) {
                await logout();
            }
        }
    }, [token, logout, user]);


    const isLoadingAuth = !authAttempted;

    const value = {
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading: isLoadingAuth,
        operationLoading,
        error,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
        setError
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
