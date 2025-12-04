import { io, Socket as ClientSocket } from "socket.io-client";
import { sessionStore } from "./state";
import {
  getchangeEnv,
  getenvObject,
  getEnvs,
  loginWithPhrase,
  updateProcessEnv,
  upgradeVersion,
  writeEnvFile,
} from "./utils";
import { DOMAIN } from "./const";

const SERVER_URL = DOMAIN;

export class SocketClient {
  public socket: ClientSocket;
  public project: string;
  public disconnected = 0;

  constructor({ project }) {
    this.project = project;
    // Initialize the socket inside the constructor
    this.socket = io(SERVER_URL, {
      reconnection: true,
      transports: ["websocket"], // force websocket
      auth: {
        token: sessionStore.getState().token,
        authKey: sessionStore.getState().authKey,
      }, // make sure token exists
    });

    this.registerEvents();
  }

  private registerEvents() {
    this.socket.on("connect", async () => {
      this.socket.emit("message", "Hello from Node.js client!");
      this.socket.emit("joinproject", { project: this.project });
      if (this.disconnected > 0) {
        console.log("reconnected....fetching envs");
        await getEnvs({ project: this.project, write: true });
      } else {
        console.log("Connected to server:", this.socket.id);
      }
    });
    this.socket.on("reconnect", () => {
      console.log("reonnected to server:", this.socket.id);
      // this.socket.emit("message", "Hello from Node.js client!");
      this.socket.emit("joinproject", { project: this.project });
    });
    this.socket.on("disconnect", async () => {
      this.disconnected += 1;

      console.log("Disconnected from server");
      let { token, authKey, secretPhrase, colabId } = sessionStore.getState();

      if (!token || !authKey) {
        console.log("⚠️ Token missing during reconnect, trying login...");

        try {
          await loginWithPhrase({ phrase: secretPhrase, colabId });
          // loginWithPhrase updates sessionStore directly

          // pull new values from store
          const { token: newToken, authKey: newAuthKey } =
            sessionStore.getState();

          (this.socket.io.opts as any).auth = {
            token: newToken,
            authKey: newAuthKey,
          };

          console.log("✅ Refreshed session during reconnect");
        } catch (err) {
          console.error("❌ Failed to refresh session", err);
          this.socket.disconnect();
          // In Node.js, no window.location
          process.exit(1); // or handle differently (e.g., retry logic)
        }
      } else {
        // token exists, just update auth for safety
        (this.socket.io.opts as any).auth = { token, authKey };
      }
    });

    this.socket.on("connect_error", (err) => {
      console.error("Connection error:", err.message);
    });

    this.socket.on("connect_timeout", () => {
      console.error("Connection timed out");
    });
    // lll=kks
    // sss=princejoy
    // fj=k
    // kk=knnnnn
    // sssssssssssssssss=ssssssssccccccccccccvvbbbbbb
    // asdfgfdawerdf=sdfgdsregf
    this.socket.on("envupdated", async (msg) => {
      setTimeout(async () => {
        upgradeVersion({ force: true });
        console.log("envupdated:", msg);
        let config = sessionStore.getState().config;
        let envs = await getchangeEnv(JSON.parse(msg));

        if (config.onSync) {
          config.onSync({
            list: envs.list,
            changes: getenvObject(envs.changes),
          });
        }

        updateProcessEnv(envs.changes);

        console.log("✅ Env updated from cloud:", envs.changes);
        console.log("✅ envs.list", envs.list);
        if (envs.changes.length > 0) {
          await writeEnvFile(envs.list, config.envfile);
        }
      }, 5000);
    });

    // this.socket.on("disconnect", () => {

    //   console.log("Disconnected from server");
    // });
  }
}
