import { create } from "zustand";
import { sessionSlice, type SessionState } from "@/context/slices";

export type AuthStoreState = SessionState;

export const useAuthStore = create<AuthStoreState>()((...args) => ({
  ...sessionSlice(...args),
}));
