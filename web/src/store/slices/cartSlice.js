import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import { logout } from './sessionSlice.js';

const initialState = {
  items: [],
  subtotal: 0,
  discount: 0,
  total: 0,
  coupon: null,
  status: 'idle',
  error: null,
};

const normalize = (payload) => ({
  items: payload?.cart?.items || [],
  subtotal: payload?.subtotal ?? 0,
  discount: payload?.discount ?? payload?.cart?.coupon?.amount ?? 0,
  total: payload?.total ?? (payload?.subtotal ?? 0) - (payload?.discount ?? payload?.cart?.coupon?.amount ?? 0),
  coupon: payload?.cart?.coupon || null,
});

export const fetchCart = createAsyncThunk('cart/fetch', async () => {
  const data = await api.get('/cart');
  return normalize(data);
});

export const addToCart = createAsyncThunk('cart/add', async ({ productId, qty = 1 }) => {
  const data = await api.post('/cart/add', { productId, qty });
  return normalize(data);
});

export const updateCartItem = createAsyncThunk('cart/update', async ({ productId, qty }) => {
  const data = await api.patch(`/cart/item/${productId}`, { qty });
  return normalize(data);
});

export const removeCartItem = createAsyncThunk('cart/remove', async ({ productId }) => {
  const data = await api.delete(`/cart/item/${productId}`);
  return normalize(data);
});

export const clearCart = createAsyncThunk('cart/clear', async () => {
  const data = await api.delete('/cart');
  return normalize(data);
});

export const applyCoupon = createAsyncThunk('cart/applyCoupon', async ({ code }) => {
  const data = await api.post('/cart/coupon', { code });
  return normalize(data);
});

export const removeCoupon = createAsyncThunk('cart/removeCoupon', async () => {
  const data = await api.delete('/cart/coupon');
  return normalize(data);
});

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.subtotal = action.payload.subtotal;
        state.discount = action.payload.discount;
        state.total = action.payload.total;
        state.coupon = action.payload.coupon;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
        state.items = [];
        state.subtotal = 0;
        state.discount = 0;
        state.total = 0;
        state.coupon = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.subtotal = action.payload.subtotal;
        state.discount = action.payload.discount;
        state.total = action.payload.total;
        state.coupon = action.payload.coupon;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.subtotal = action.payload.subtotal;
        state.discount = action.payload.discount;
        state.total = action.payload.total;
        state.coupon = action.payload.coupon;
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.subtotal = action.payload.subtotal;
        state.discount = action.payload.discount;
        state.total = action.payload.total;
        state.coupon = action.payload.coupon;
      })
      .addCase(clearCart.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.subtotal = action.payload.subtotal;
        state.discount = action.payload.discount;
        state.total = action.payload.total;
        state.coupon = action.payload.coupon;
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.subtotal = action.payload.subtotal;
        state.discount = action.payload.discount;
        state.total = action.payload.total;
        state.coupon = action.payload.coupon;
      })
      .addCase(removeCoupon.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.subtotal = action.payload.subtotal;
        state.discount = action.payload.discount;
        state.total = action.payload.total;
        state.coupon = action.payload.coupon;
      })
      .addCase(logout.fulfilled, (state) => {
        state.items = [];
        state.subtotal = 0;
        state.discount = 0;
        state.total = 0;
        state.coupon = null;
        state.status = 'idle';
        state.error = null;
      });
  },
});

export default cartSlice.reducer;
