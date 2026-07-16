import { create } from 'zustand';
import { fetchCurrentUser, signIn as signInRequest, type CurrentUser } from '../api/auth';
import { clearTokens, loadTokens, saveTokens } from '../api/authTokens';

type AuthState = {
  status: 'checking' | 'signedOut' | 'signedIn';
  user: CurrentUser | null;
  // The account currently being viewed — defaults to the user's primary account_id,
  // but can be switched via switchAccount() without a fresh sign-in (see api/auth.ts:
  // accounts are scoped purely by :account_id in the URL, no server-side "switch" call).
  activeAccountId: number | null;
  error: string | null;
  restoreSession: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchAccount: (accountId: number) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: 'checking',
  user: null,
  activeAccountId: null,
  error: null,

  restoreSession: async () => {
    const tokens = await loadTokens();
    if (!tokens) {
      set({ status: 'signedOut' });
      return;
    }
    try {
      const user = await fetchCurrentUser();
      set({ status: 'signedIn', user, activeAccountId: user.account_id });
    } catch {
      await clearTokens();
      set({ status: 'signedOut' });
    }
  },

  signIn: async (email, password) => {
    set({ error: null });
    try {
      const { user, tokens } = await signInRequest(email, password);
      await saveTokens(tokens);
      set({ status: 'signedIn', user, activeAccountId: user.account_id });
    } catch (err) {
      set({ error: 'Invalid email or password' });
      throw err;
    }
  },

  signOut: async () => {
    await clearTokens();
    set({ status: 'signedOut', user: null, activeAccountId: null });
  },

  switchAccount: accountId => set({ activeAccountId: accountId }),
}));
