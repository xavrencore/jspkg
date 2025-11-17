export type SessionStore = {
  user: any | null;
  project: any | null;
  token: string | null;
  config: any| null;
  secretPhrase: string | null;
  projectId: string | null;
  colabId: string | null;
  authKey: string | null;
  logginin: boolean | null;
  watcherActive: boolean | null;
  email: string | null;
  login: (user: any, token: string,authKey:string) => void;
  logout: () => void;
  setSecretPhrase: (secretPhrase: string) => void;
  setProjectId: (projectId: string) => void;
  setColabId: (colabId: string) => void;
  setAuthKey: (key: string) => void;
  setLogginIn: (d: boolean) => void;
  setEmail: (email: string) => void;
  setWatcherActive: (active: boolean) => void;
  setProject: (project: string) => void;
  setConfig: (config: any) => void;
};


export type EnvItem = Record<string, any>;

export type EnvStore = {
  envs: EnvItem[];
  addEnv: (env: EnvItem) => void;
  setEnvs: (env: EnvItem[]) => void;
  removeEnv: (index: number) => void;
  clearEnvs: () => void;
  getEnv: (index: number) => EnvItem | null;
};

 export type ISyncData = { list: EnvItem[]; changes: Record<string,string> };

