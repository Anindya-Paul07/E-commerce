import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '@/lib/api';

const initialState = {
  brands: [],
  categories: [],
  status: 'idle',
  error: null,
};

export const fetchBrands = createAsyncThunk('catalog/fetchBrands', async () => {
  const data = await api.get('/brands?limit=200&status=active');
  return data.items || [];
});

export const fetchCategories = createAsyncThunk('catalog/fetchCategories', async () => {
  const data = await api.get('/categories?limit=200');
  return data.items || [];
});

const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBrands.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.brands = action.payload;
      })
      .addCase(fetchBrands.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      });
  },
});

export default catalogSlice.reducer;
