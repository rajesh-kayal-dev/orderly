import { createSlice } from '@reduxjs/toolkit';

const getSessionItem = (key) => {
  try {
    const item = sessionStorage.getItem(key);
    if (!item || item === 'undefined') return null;
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error parsing ${key} from sessionStorage:`, error);
    return null;
  }
};

const initialState = {
  user: getSessionItem('user'),
  profile: getSessionItem('profile'),
  token: sessionStorage.getItem('token') || null,
  isAuthenticated: !!sessionStorage.getItem('token'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, action) {
      state.user = action.payload.user;
      state.profile = action.payload.profile;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      
      // Save to sessionStorage for tab-specific persistence
      sessionStorage.setItem('token', action.payload.token);
      sessionStorage.setItem('user', JSON.stringify(action.payload.user));
      sessionStorage.setItem('profile', JSON.stringify(action.payload.profile));
    },
    logout(state) {
      state.user = null;
      state.profile = null;
      state.token = null;
      state.isAuthenticated = false;
      
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('profile');
    },
    updateProfile(state, action) {
      state.profile = { ...(state.profile || {}), ...action.payload };
      sessionStorage.setItem('profile', JSON.stringify(state.profile));
    },
  },
});

export const { loginSuccess, logout, updateProfile } = authSlice.actions;
export default authSlice.reducer;
