import { createSlice } from '@reduxjs/toolkit';

const restaurantSlice = createSlice({
  name: 'restaurant',
  initialState: {
    list: [],
    menu: [],
  },
  reducers: {
    setRestaurants: (state, action) => {
      state.list = action.payload;
    },
    setMenu: (state, action) => {
      state.menu = action.payload;
    }
  },
});

export const { setRestaurants, setMenu } = restaurantSlice.actions;
export default restaurantSlice.reducer;
