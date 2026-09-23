import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';

// API BASE PATH
const API_URL = '/cart';

// Helper to load initial cart from localStorage
const loadLocalCart = () => {
    try {
        const saved = localStorage.getItem('orderly_cart');
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                items: parsed.items || [],
                restaurantId: parsed.restaurantId || null
            };
        }
    } catch (e) {}
    return { items: [], restaurantId: null };
};

const initialLocal = loadLocalCart();

// Async Thunks with Optimistic Instant Local State Updates
export const fetchCart = createAsyncThunk('cart/fetch', async (_, thunkAPI) => {
    try {
        const response = await axios.get(API_URL);
        return response.data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.message);
    }
});

export const addToCartAsync = createAsyncThunk('cart/add', async (itemData, thunkAPI) => {
    // 1. Optimistically update local Redux state for INSTANT (0ms) UI response
    thunkAPI.dispatch(addToCartLocal(itemData));

    // 2. Sync with backend API in the background
    try {
        await axios.post(`${API_URL}/items`, itemData);
        thunkAPI.dispatch(fetchCart());
    } catch (error) {
        // Local state was already updated, so user experience remains seamless
    }
});

export const updateQuantityAsync = createAsyncThunk('cart/updateQuantity', async ({ itemId, quantity }, thunkAPI) => {
    // 1. Optimistically update local Redux state for INSTANT UI response
    thunkAPI.dispatch(updateQuantityLocal({ itemId, quantity }));

    // 2. Sync with backend API
    try {
        await axios.put(`${API_URL}/items/${itemId}`, { quantity });
        thunkAPI.dispatch(fetchCart());
    } catch (error) {}
});

export const removeItemAsync = createAsyncThunk('cart/removeItem', async (itemId, thunkAPI) => {
    // 1. Optimistically update local Redux state for INSTANT UI response
    thunkAPI.dispatch(removeItemLocal(itemId));

    // 2. Sync with backend API
    try {
        await axios.delete(`${API_URL}/items/${itemId}`);
        thunkAPI.dispatch(fetchCart());
    } catch (error) {}
});

export const clearCartAsync = createAsyncThunk('cart/clear', async (_, thunkAPI) => {
    thunkAPI.dispatch(clearCartLocal());
    try {
        await axios.delete(API_URL);
    } catch (error) {}
    return null;
});

const initialState = {
    items: initialLocal.items,
    restaurantId: initialLocal.restaurantId,
    total: initialLocal.items.reduce((acc, i) => acc + (Number(i.price) * i.quantity), 0),
    loading: false,
    error: null
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addToCartLocal: (state, action) => {
            const payload = action.payload;
            const item = payload.item || payload;
            const menu_item_id = payload.menu_item_id || item.id;
            const quantity = Number(payload.quantity || 1);
            const restaurant_id = payload.restaurant_id || item.restaurant_id || 1;

            // Find existing item by ID or matching Name
            const existingIndex = state.items.findIndex(
                i => String(i.id) === String(menu_item_id) ||
                     String(i.cartItemId) === String(menu_item_id) ||
                     (item.name && i.name && i.name.trim().toLowerCase() === item.name.trim().toLowerCase())
            );

            if (existingIndex >= 0) {
                state.items[existingIndex].quantity += quantity;
            } else {
                state.items.push({
                    cartItemId: `local-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    id: menu_item_id,
                    name: item.name || 'Gourmet Food Item',
                    price: Number(item.price || 12.99),
                    image: item.image_url || item.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600',
                    quantity: quantity,
                    isAvailable: true,
                    restaurantName: item.restaurantName || item.restaurant_name || 'The Food Place'
                });
            }
            state.restaurantId = restaurant_id;
            state.total = state.items.reduce((acc, i) => acc + (Number(i.price) * i.quantity), 0);
            try {
                localStorage.setItem('orderly_cart', JSON.stringify({ items: state.items, restaurantId: state.restaurantId }));
            } catch (e) {}
        },
        updateQuantityLocal: (state, action) => {
            const { itemId, quantity } = action.payload;
            const item = state.items.find(i => String(i.cartItemId) === String(itemId) || String(i.id) === String(itemId));
            if (item) {
                if (quantity <= 0) {
                    state.items = state.items.filter(i => String(i.cartItemId) !== String(itemId) && String(i.id) !== String(itemId));
                } else {
                    item.quantity = quantity;
                }
            }
            state.total = state.items.reduce((acc, i) => acc + (Number(i.price) * i.quantity), 0);
            try {
                localStorage.setItem('orderly_cart', JSON.stringify({ items: state.items, restaurantId: state.restaurantId }));
            } catch (e) {}
        },
        removeItemLocal: (state, action) => {
            const itemId = action.payload;
            state.items = state.items.filter(i => String(i.cartItemId) !== String(itemId) && String(i.id) !== String(itemId));
            state.total = state.items.reduce((acc, i) => acc + (Number(i.price) * i.quantity), 0);
            try {
                localStorage.setItem('orderly_cart', JSON.stringify({ items: state.items, restaurantId: state.restaurantId }));
            } catch (e) {}
        },
        clearCartLocal: (state) => {
            state.items = [];
            state.restaurantId = null;
            state.total = 0;
            try {
                localStorage.removeItem('orderly_cart');
            } catch (e) {}
        },
        resetCartState: (state) => {
            state.items = [];
            state.restaurantId = null;
            state.total = 0;
            try {
                localStorage.removeItem('orderly_cart');
            } catch (e) {}
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCart.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchCart.fulfilled, (state, action) => {
                state.loading = false;
                const cartData = action.payload;
                const rawItems = cartData?.items || cartData?.CartItems || [];
                
                if (cartData && rawItems.length > 0) {
                    const fetchedItems = rawItems
                        .filter(ci => ci.menuItem || ci.MenuItem)
                        .map(ci => {
                            const mi = ci.menuItem || ci.MenuItem;
                            return {
                                cartItemId: ci.id,
                                id: mi.id,
                                name: mi.name,
                                price: Number(mi.price),
                                image: mi.image_url || mi.image,
                                quantity: ci.quantity,
                                isAvailable: mi.is_available !== undefined ? mi.is_available : true,
                                restaurantName: mi.restaurant?.name || 'The Food Place'
                            };
                        });

                    // Merge fetched items with any local items, matching by ID or Name
                    const merged = [...fetchedItems];
                    state.items.forEach(localItem => {
                        const existsIndex = merged.findIndex(
                            fi => String(fi.id) === String(localItem.id) ||
                                  (fi.name && localItem.name && fi.name.trim().toLowerCase() === localItem.name.trim().toLowerCase())
                        );
                        if (existsIndex >= 0) {
                            merged[existsIndex].quantity = Math.max(merged[existsIndex].quantity, localItem.quantity);
                        } else {
                            merged.push(localItem);
                        }
                    });

                    state.items = merged;
                    state.restaurantId = cartData.restaurant_id || state.restaurantId;
                    state.total = state.items
                        .filter(i => i.isAvailable)
                        .reduce((acc, i) => acc + (Number(i.price) * i.quantity), 0);
                    try {
                        localStorage.setItem('orderly_cart', JSON.stringify({ items: state.items, restaurantId: state.restaurantId }));
                    } catch (e) {}
                }
            })
            .addCase(fetchCart.rejected, (state) => {
                state.loading = false;
            })
            .addCase(clearCartAsync.fulfilled, (state) => {
                state.items = [];
                state.restaurantId = null;
                state.total = 0;
                try {
                    localStorage.removeItem('orderly_cart');
                } catch (e) {}
            });
    }
});

export const { 
    addToCartLocal, 
    updateQuantityLocal, 
    removeItemLocal, 
    clearCartLocal, 
    resetCartState 
} = cartSlice.actions;

export default cartSlice.reducer;
