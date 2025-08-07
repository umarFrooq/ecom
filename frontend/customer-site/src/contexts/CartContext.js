import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext'; // To get user token
import {
    getCart as apiGetCart,
    addItemToCart as apiAddItemToCart,
    updateCartItemQuantity as apiUpdateCartItemQuantity,
    removeCartItem as apiRemoveCartItem,
    clearCart as apiClearCart
} from '../services/apiService'; // Adjust path as needed

const CartContext = createContext(null);

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const { token, isAuthenticated, user } = useAuth();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const calculateTotals = (items) => {
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = items.reduce((sum, item) => {
            // Ensure item.product exists and has a price; otherwise, treat its contribution as 0
            const price = item.product && typeof item.product.price === 'number' ? item.product.price : 0;
            return sum + (item.quantity * price);
        }, 0);
        // TODO: Add tax and shipping calculation if needed
        const tax = 0; // Placeholder
        const shipping = 0; // Placeholder
        const total = subtotal + tax + shipping;
        return { itemCount, subtotal, tax, shipping, total };
    };

    const [cartTotals, setCartTotals] = useState(calculateTotals([]));

    useEffect(() => {
        setCartTotals(calculateTotals(cartItems));
    }, [cartItems]);

    const fetchCart = useCallback(async () => {
        if (!isAuthenticated || !token) {
            setCartItems([]); // Clear cart if not authenticated
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await apiGetCart(token);
            if (response.data && response.data.success) {
                setCartItems(response.data.data || []);
            } else {
                setError(response.data.message || 'Failed to fetch cart.');
                setCartItems([]);
            }
        } catch (err) {
            setError(err.error || err.message || 'Error fetching cart.');
            setCartItems([]);
        } finally {
            setLoading(false);
        }
    }, [token, isAuthenticated]);

    useEffect(() => {
        // Fetch cart when user becomes authenticated or token changes
        // Or when component mounts if already authenticated
        if (isAuthenticated && token) {
            fetchCart();
        } else {
            setCartItems([]); // Clear cart if user logs out
        }
    }, [isAuthenticated, token, fetchCart]);


    const addToCart = async (productId, quantity = 1) => {
        if (!isAuthenticated || !token) {
            setError('Please log in to add items to your cart.');
            // Or redirect to login: throw new Error('UserNotAuthenticated');
            return false;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await apiAddItemToCart({ productId, quantity }, token);
            if (response.data && response.data.success) {
                setCartItems(response.data.data);
                return true;
            } else {
                setError(response.data.message || 'Failed to add item to cart.');
                return false;
            }
        } catch (err) {
            setError(err.error || err.message || 'Error adding item to cart.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (productId, quantity) => {
        if (!isAuthenticated || !token) return false;
        setLoading(true);
        setError(null);
        try {
            const response = await apiUpdateCartItemQuantity(productId, { quantity }, token);
            if (response.data && response.data.success) {
                setCartItems(response.data.data);
                return true;
            } else {
                setError(response.data.message || 'Failed to update quantity.');
                return false;
            }
        } catch (err) {
            setError(err.error || err.message || 'Error updating quantity.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const removeFromCart = async (productId) => {
        if (!isAuthenticated || !token) return false;
        setLoading(true);
        setError(null);
        try {
            const response = await apiRemoveCartItem(productId, token);
            if (response.data && response.data.success) {
                setCartItems(response.data.data);
                return true;
            } else {
                setError(response.data.message || 'Failed to remove item.');
                return false;
            }
        } catch (err) {
            setError(err.error || err.message || 'Error removing item.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const clearClientCart = async () => { // Renamed from clearCart to avoid conflict with apiClearCart
        if (!isAuthenticated || !token) return false;
        setLoading(true);
        setError(null);
        try {
            const response = await apiClearCart(token);
            if (response.data && response.data.success) {
                setCartItems([]);
                return true;
            } else {
                setError(response.data.message || 'Failed to clear cart.');
                return false;
            }
        } catch (err) {
            setError(err.error || err.message || 'Error clearing cart.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    // This effect ensures that if the user logs out, the cart is cleared.
    // AuthContext's user object is a dependency.
    useEffect(() => {
        if (!user) { // If user object becomes null (logged out)
            setCartItems([]);
        }
    }, [user]);


    const value = {
        cartItems,
        cartTotals,
        loading,
        error,
        fetchCart, // Expose fetchCart if manual refresh is needed
        addToCart,
        updateQuantity,
        removeFromCart,
        clearClientCart, // Expose the renamed clear cart function
        setError // To allow clearing errors from components
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
