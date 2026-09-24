import { createSlice } from '@reduxjs/toolkit';

const getStoredItem = (key) => {
  try {
    const item = typeof window !== 'undefined'
      ? localStorage.getItem(key) || sessionStorage.getItem(key)
      : null;
    if (!item || item === 'undefined' || item === 'null') return null;
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error parsing ${key} from storage:`, error);
    return null;
  }
};

const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return (token && token !== 'undefined' && token !== 'null') ? token : null;
};

const initialToken = getStoredToken();
const initialUser = getStoredItem('user');
const initialProfile = getStoredItem('profile');

const initialState = {
  user: initialUser,
  profile: initialProfile,
  token: initialToken,
  isAuthenticated: Boolean(initialToken && initialUser),
  authInitialized: false,
  authStatus: initialToken ? 'loading' : 'unauthenticated',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, action) {
      state.user = action.payload.user;
      state.profile = action.payload.profile || null;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.authInitialized = true;
      state.authStatus = 'authenticated';

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('token', action.payload.token);
          localStorage.setItem('user', JSON.stringify(action.payload.user));
          if (action.payload.profile) {
            localStorage.setItem('profile', JSON.stringify(action.payload.profile));
          } else {
            localStorage.removeItem('profile');
          }
          // Clean up guest session storage on successful authenticated login
          localStorage.removeItem('guest_token');
          sessionStorage.removeItem('guest_token');
          localStorage.removeItem('guest_session_id');
          sessionStorage.removeItem('guest_session_id');

          // Mirror to sessionStorage for backwards compatibility
          sessionStorage.setItem('token', action.payload.token);
          sessionStorage.setItem('user', JSON.stringify(action.payload.user));
          if (action.payload.profile) {
            sessionStorage.setItem('profile', JSON.stringify(action.payload.profile));
          } else {
            sessionStorage.removeItem('profile');
          }
        } catch (e) {
          console.warn('Storage sync error:', e);
        }
      }
    },
    logout(state) {
      state.user = null;
      state.profile = null;
      state.token = null;
      state.isAuthenticated = false;
      state.authInitialized = true;
      state.authStatus = 'unauthenticated';

      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('profile');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('profile');
          localStorage.removeItem('guest_token');
          sessionStorage.removeItem('guest_token');
          localStorage.removeItem('guest_session_id');
          sessionStorage.removeItem('guest_session_id');
        } catch (e) {
          console.warn('Storage clear error:', e);
        }
      }
    },
    setAuthInitialized(state, action) {
      state.authInitialized = true;
      if (action.payload?.status) {
        state.authStatus = action.payload.status;
      } else {
        state.authStatus = state.isAuthenticated ? 'authenticated' : 'unauthenticated';
      }
    },
    updateProfile(state, action) {
      state.profile = { ...(state.profile || {}), ...action.payload };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('profile', JSON.stringify(state.profile));
          sessionStorage.setItem('profile', JSON.stringify(state.profile));
        } catch (e) {
          console.warn('Profile storage error:', e);
        }
      }
    },
  },
});

export const { loginSuccess, logout, setAuthInitialized, updateProfile } = authSlice.actions;
export default authSlice.reducer;
