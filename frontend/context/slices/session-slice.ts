import { StateCreator } from "zustand";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type Session = {
  id: string;
  userId: string;
  expiresAt: Date;
  token: string;
};

export interface AuthSession {
  session: Session;
  user: SessionUser;
}

export interface SessionState {
  session: AuthSession | null;
  isLoading: boolean;
  setSession: (session: AuthSession | null) => void;
  clearSession: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const sessionSlice: StateCreator<SessionState> = (set) => ({
  session: null,
  isLoading: true,
  setSession: (session) => set({ session, isLoading: false }),
  clearSession: () => set({ session: null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
});
