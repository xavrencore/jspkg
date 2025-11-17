import fs from "fs";
import chokidar from "chokidar";
import dotenv from "dotenv"
dotenv.config()
import {
  addEnv,
  EnvItem,
  getenvObject,
  getEnvs,
  getProjectById,
  httpRequest,
  IConfig,
  initialize,
  loginWithPhrase,
  mount,
  onChange,
  parseAndUniqueEnv,
  parseEnvToList,
} from "./utils";
import { LOGINWITHPHRASE, PRIVATEKEY } from "./const";
import { envStore, sessionStore } from "./state";
import { SocketClient } from "./websocket";
import { ISyncData } from "./types";
import { handleDecryptKeyPairLongData } from "./cryption";

function watchEnv({
  filePath = ".env",
  onChange,
  secretPhrase,
  key,

}: {
  filePath?: string;
  onChange: any;
  secretPhrase: string;
  key?: string;
 
}) {

  try{

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Env file not found at path: ${filePath}`);
    }
    const watcher = chokidar.watch(filePath, { persistent: true });
  
    watcher.on("change", (path: string) => {
      try {
        if (onChange) {
          let watcherActive = sessionStore.getState().watcherActive
          if(watcherActive){

            const content = fs.readFileSync(path, "utf8"); // read file content
            onChange(content, path);
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
  }catch(e){

  }
}

// const readandsave








export const config = async (
//   {
//   key:key__,
//   updateCloud=true,
//   // projectKey,
//   env = ".env",
//   branch = "main",
//   sync = false,
//   write = false,
//   watch = false,
//   onSync = () => {},
//    omit=[]
// }

conf
:IConfig) :Promise<{getEnvs:()=>Record<string,string>}> => {

  try{


// let data =await  handleDecryptKeyPairLongData({encryptedString:key__,privateKey:PRIVATEKEY})
// let {projectId:project,userKey:secretPhrase,userEmail:email,projectKey:keyy}=data
//   // const [secretPhrase, email] = authPhrase.split("_kk_");
//   sessionStore.getState().setSecretPhrase(secretPhrase);
//   sessionStore.getState().setEmail(email);
  
//   // const [keyy, project] = projectKey.split("_kk_");

//   await loginWithPhrase(secretPhrase,email)

//   let fetchproject = await getProjectById(project);
//   sessionStore.getState().setProject(fetchproject.data);
//   sessionStore
//     .getState()
//     .setConfig({ envfile: env, sync, onSync ,omit,updateCloud,write,branch});
//     setinitalEnv()

let {env,sync,onSync,omit,updateCloud,write,branch,project,secretPhrase,email,keyy,fetchproject,watch} = await initialize(conf)
  let socket = new SocketClient({project});
  if (fetchproject?.success) {
    socket.socket.emit("joinproject", { project: project });
  }else{

    console.warn("Invalid project")
    return
  }
 
  await getEnvs({ project: project ,write});
  await mount({
    path: env,
    secretPhrase,
    key: keyy,
    sync,
    project,
    fetchproject: fetchproject.data,
  });
  if(watch){

    watchEnv({
      onChange: async (content) => {
        await onChange({
          content,
          secretPhrase,
          key: keyy,
          sync,
          project,
          fetchproject: fetchproject.data,
        });
      },
      secretPhrase,
    });
  }
  let getEnvs_ = ()=>{
    let envs = envStore.getState().envs
   return getenvObject(envs)
  }

  if(conf.onLoad){
   conf.onLoad({envs:envStore.getState().envs})
  }

  return {

    getEnvs:getEnvs_


  }

  }catch(e){

  }
};





let v =async ()=>{

let key = ""

config({
  key,
  omit:["key"],
  branch:"main",
  write:true,
  watch:true,
  updateCloud:true,

})

}

// v()