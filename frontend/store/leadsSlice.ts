import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchNewLeadsCount = createAsyncThunk(
  "leads/fetchNewLeadsCount",
  async () => {
    const res  = await fetch("http://localhost:8000/api/leads?status=new&limit=1");
    const data = await res.json();
    return (data.total ?? 0) as number;
  }
);

const leadsSlice = createSlice({
  name: "leads",
  initialState: {
    newCount:    0,
    recentLeads: [] as { _id: string; name: string; email: string; service: string; createdAt: string }[],
  },
  reducers: {
    decrementNewCount: (state) => {
      state.newCount = Math.max(0, state.newCount - 1);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchNewLeadsCount.fulfilled, (state, action) => {
      state.newCount = action.payload;
    });
  },
});

export const { decrementNewCount } = leadsSlice.actions;
export default leadsSlice.reducer;
