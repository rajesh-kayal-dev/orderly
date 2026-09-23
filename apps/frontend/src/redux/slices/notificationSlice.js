import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notification',
  initialState: {
    notifications: [],
    unreadCount: 0,
  },
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    clearUnread: (state) => {
      state.unreadCount = 0;
    }
  },
});

export const { addNotification, clearUnread } = notificationSlice.actions;
export default notificationSlice.reducer;
