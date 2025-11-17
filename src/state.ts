import { createStore } from "zustand/vanilla";
import { EnvStore, SessionStore } from "./types";



// Create store without React
export const sessionStore = createStore<SessionStore>((set) => ({
  user: null,
  project: null,
  projectId: null,
  colabId: null,
  token: null,
  email: null,
  logginin: false,
  watcherActive: true,
  secretPhrase: null,
  config:null,
  authKey:null,

  login: (user, token,authKey) => set({ user, token,authKey }),
  logout: () => set({ user: null, token: null }),
  setSecretPhrase: (secretPhrase) => set({ secretPhrase }),
  setAuthKey: (authKey) => set({ authKey }),
  setWatcherActive: (watcherActive) => set({ watcherActive }),
  setEmail: (email) => set({ email }),
  setLogginIn: (logginin) => set({ logginin }),
  setProjectId: (projectId) => set({ projectId }),
  setColabId: (colabId) => set({ colabId }),
  setProject: (project) => set({ project }),
  setConfig: (config) => set({ config }),
}));








// Vanilla zustand store
export const envStore = createStore<EnvStore>((set, get) => ({
  envs: [],

  addEnv: (env) =>
    set((state) => ({
      envs: [...state.envs, env],
    })),
  setEnvs: (env) =>
    set({
      envs: env,
    }),

  removeEnv: (index) =>
    set((state) => ({
      envs: state.envs.filter((_, i) => i !== index),
    })),

  clearEnvs: () => set({ envs: [] }),

  getEnv: (index) => {
    const envs = get().envs;
    return envs[index] || null;
  },
}));

