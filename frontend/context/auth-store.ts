import { create } from "zustand";
import { sessionSlice, type SessionState } from "./slices/session-slice";

export type AuthStoreState = SessionState;

export const useAuthStore = create<AuthStoreState>()((...args) => ({
  ...sessionSlice(...args),
}));
