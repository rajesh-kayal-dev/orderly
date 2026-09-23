import { createSlice } from '@reduxjs/toolkit';

const orderSlice = createSlice({
  name: 'order',
  initialState: {
    orders: [],
    currentOrder: null,
    trackingStatus: null,
    activeCount: 0, // For Sidebar Badge
  },
  reducers: {
    setOrders: (state, action) => {
      state.orders = action.payload;
    },
    updateOrderStatus: (state, action) => {
      if (state.currentOrder && state.currentOrder.id === action.payload.id) {
        state.currentOrder.status = action.payload.status;
      }
    },
    setActiveCount: (state, action) => {
      state.activeCount = action.payload;
    },
    incrementActiveCount: (state) => {
      state.activeCount += 1;
    },
    decrementActiveCount: (state) => {
      state.activeCount = Math.max(0, state.activeCount - 1);
    }
  },
});

export const { setOrders, updateOrderStatus, setActiveCount, incrementActiveCount, decrementActiveCount } = orderSlice.actions;
export default orderSlice.reducer;
