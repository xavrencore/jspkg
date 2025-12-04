import fs from "fs";
import chokidar from "chokidar";
import dotenv from "dotenv";
dotenv.config();
import { getenvObject, getEnvs, IConfig, initialize } from "./utils";

import { envStore, sessionStore } from "./state";
import { SocketClient } from "./websocket";

function watchEnv({
  filePath = ".env",
  onChange,
}: {
  filePath?: string;
  onChange: any;
  // secretPhrase: string;
  // key?: string;
}) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Env file not found at path: ${filePath}`);
    }
    const watcher = chokidar.watch(filePath, { persistent: true });

    watcher.on("change", (path: string) => {
      try {
        if (onChange) {
          let watcherActive = sessionStore.getState().watcherActive;
          if (watcherActive) {
            // const content = fs.readFileSync(path, "utf8"); // read file content
            onChange();
          }
        }
      } catch (err: any) {
        console.warn(`⚠️  Failed to read env file: ${err.message || err}`);
      }
    });

    watcher.on("error", (err: any) => {
      console.warn(`⚠️  Watcher error: ${err.message || err}`);
    });

    return watcher; // return watcher in case you want to close it later
  } catch (e) {}
}

// const readandsave

export const config = async (
  conf: IConfig
): Promise<{ getEnvs: () => Record<string, string> }> => {
  try {
    if (!conf?.key) {
      return;
    }

    let {
      sync,

      write,

      project,
      secretPhrase,

      fetchproject,
      watch,
    } = await initialize(conf);
    let socket = new SocketClient({ project });
    if (fetchproject?.success) {
      socket.socket.emit("joinproject", { project: project });
    } else {
      console.warn("Invalid project");
      return;
    }

    await getEnvs({ project: project, write });
    // await mount({
    //   secretPhrase,

    //   sync,
    //   project,
    // });
    if (watch) {
      // watchEnv({
      //   onChange: async () => {
      //     await onChange({
      //       secretPhrase,
      //       sync,
      //       project,
      //     });
      //   },
      // });
    }
    let getEnvs_ = () => {
      let envs = envStore.getState().envs;
      return getenvObject(envs);
    };

    if (conf.onLoad) {
      conf.onLoad({ envs: envStore.getState().envs });
    }

    return {
      getEnvs: getEnvs_,
    };
  } catch (e) {}
};

let v = async () => {
  let key = "";

  config({
    key,
    omit: ["key"],
    branch: "test",
    write: true,
    watch: true,
    updateCloud: true,
  });
};

// v();
