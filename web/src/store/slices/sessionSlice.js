import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '@/lib/api';

const initialState = {
  user: null,
  status: 'idle',
  error: null,
};

export const fetchSession = createAsyncThunk('session/fetchSession', async () => {
  const data = await api.get('/auth/me');
  return data.user || null;
});

export const login = createAsyncThunk('session/login', async (credentials, { rejectWithValue }) => {
  try {
    const data = await api.post('/auth/login', credentials);
    return data.user || null;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const register = createAsyncThunk('session/register', async (payload, { rejectWithValue }) => {
  try {
    const data = await api.post('/auth/register', payload);
    return data.user || null;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const logout = createAsyncThunk('session/logout', async () => {
  await api.post('/auth/logout', {});
  return null;
});

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSession.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSession.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(fetchSession.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
        state.user = null;
      })
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      })
      .addCase(register.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.status = 'idle';
      });
  },
});

export const { setUser } = sessionSlice.actions;
export default sessionSlice.reducer;
