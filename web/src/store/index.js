import { configureStore } from '@reduxjs/toolkit';
import sessionReducer from './slices/sessionSlice.js';
import cartReducer from './slices/cartSlice.js';
import catalogReducer from './slices/catalogSlice.js';

export const store = configureStore({
  reducer: {
    session: sessionReducer,
    cart: cartReducer,
    catalog: catalogReducer,
  },
});
