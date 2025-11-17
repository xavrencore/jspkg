import moment from "moment";
import _ from "lodash";
import { decryptMessageFromKeyPair, handleDecrypt, handleDecryptEnv, handleDecryptKeyPairLongData, handleEncrypt, handleEncryptEnv } from "./cryption";

export const getreadabledate = (date: string) => {
  return moment(date).fromNow();
};

export function parseEnvToList(
  envContent: string
): { title: string; value: string }[] {


  return _.uniqBy(
    envContent
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const [key, ...rest] = line.split("=");
        let value = rest.join("=").trim();

        // Remove wrapping quotes if present
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        return { title: key.trim(), value };
      }),
    "title"
  );
}

export const parseAndUniqueEnv = (envContent: string) => {
  let v = envStore.getState().envs;

  let parseContent = parseEnvToList(envContent);

  return _.uniqBy(parseContent, "title");
};

export function cleanEnvString(envContent: string): string {
  return envContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const [key, ...rest] = line.split("=");
      let value = rest.join("=").trim();

      // Strip surrounding quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      return `${key.trim()}=${value}`;
    })
    .join("\n");
}

export function listToEnvString(list: any[]): string {
  const raw = list.map((item) => `${item.title}=${item.value}`).join("\n");
  return cleanEnvString(raw);
}

export const getProjectById = async ({id,versioncontrol=true,task}:{id:string,versioncontrol?:boolean,task?:string}) => {
  try {
    let secretPhrase = sessionStore.getState();
    if (!secretPhrase) {
      return;
    }

    let data = await httpRequest({ url: GETPROJECTBYIDURL + `?id=${id}` });
    if (data.success) {


if(versioncontrol){

  let d:any =  await   upgradeVersion({colab:data.data})
  if(d?.success){
data = d
  }
}
    } else {
    }
    return data;
  } catch (e: any) {
    throw e;
  } finally {
  }
};

export const mount = async ({
  path,
  secretPhrase,
  key,
  sync,
  project,
  fetchproject,
}) => {

  const content = fs.readFileSync(path, "utf8");

  await onChange({ content, secretPhrase, key, sync, project, fetchproject });
};
export const onChange = async ({
  content,
  secretPhrase,
  key,
  sync,
  project,
  fetchproject,
}) => {
  let c = parseAndUniqueEnv(content);
  // await getEnvs({ project: project, key: fetchproject.data,write:false });
  await addEnv({  secretPhrase, sync, body: c, project });
};


// let    addEnvHelper = async()=>{

// }

export const addEnv = async ({
  project,
  body,
  key,
  sync = false,
  secretPhrase,
}: {
  project: any;
  body: Record<string, any>[];
  key?: string;
  secretPhrase?: string;
  sync?: boolean;
}) => {
  try {

key = key ||  sessionStore.getState().project.colab.key
secretPhrase = secretPhrase ||  sessionStore.getState().secretPhrase
let commitId =   sessionStore.getState().config.commitId
let commit =   sessionStore.getState().config.commit

// console.log(key)

      await getEnvs({ project: project, key: key,write:false });
    let branch  = sessionStore.getState().config.branch||"main"
    let envs = envStore.getState().envs;

    if (!secretPhrase) {
      return;
    }

    let deHashedKey = (await handleDecrypt({
      encrypted: key,
      passphrase: secretPhrase,
    })) as string;
 
    if (!deHashedKey) {
      return;
    }

      let omit:string[] = sessionStore.getState().config.omit||[]
     const loader = new TerminalLoader("encrypting envs", 50);
     const step = 50/body.length
    const hashedData_: any = await Promise.all(
      body.map(async (item) => {
        loader.tick(step)
        const encryptedKey = handleEncryptEnv({
          data: item,
          passphrase: deHashedKey,
        });

        let v = envs.find((e) => e.title == item.title);


        return {
          ...encryptedKey,
          changed: (v?._id) ? (v?.value != item?.value):(true),
          item: { ...item, ...(v?._id ? { _id: v?._id } : {}) },
          ...(v?._id ? { _id: v?._id } : {}),
        };
      })
    );

  const  hashedData = hashedData_.filter((item) => !omit.includes(item.item.title))

    envStore
      .getState()
      .setEnvs(
        _.uniqBy(
          [
            ...hashedData_.filter((e) => e.item).map((e) => ({...e.item,dItem:e.item,eItem:e })),
            ...(envs || []),
          ],
          "title"
        )
      );
      let config = sessionStore.getState().config
      
if(!config.updateCloud){
  return
}


let httpdata = hashedData.filter((e:any)=>e.changed).map((e:any) => _.omit(e, ["item"]))

    let data = httpdata.length>0?  await httpRequest({
      url: (sync ? UPDATEENVURL : ADDENVURL) + `?id=${project}`,
      method: "PUT",
      body: {data:httpdata,branch,commitId,commit},
    }):{};

    if (data?.success) {
      let v = data?.data || [];
      const decripted = await Promise.all(
        v.map(async (item) => {
          let c = handleDecryptEnv(item, deHashedKey);

          return { ...item, ...c ,dItem:c,eItem:item };
        })
      );
  let envs_ = envStore.getState().envs;
      envStore
        .getState()
        .setEnvs(_.uniqBy([...decripted, ...(envs_ || [])], "title"));
      return {
        data: hashedData.map((e) => {
          let c = v.find((ee) => ee.title == e.title);
          if (c) {
            return { ...c, ...e.item };
          }
          return e;
        }),
      };
    } else {
    }


  } catch (e: any) {

    
    throw e;
  } finally {
  }
};


export const mergeEnvToFile = (envdata)=>{

        let projectId = sessionStore.getState().projectId;
      
        let envs = envStore.getState().envs
        let omit = sessionStore.getState().config.omit

      let v = []
if(projectId==process.env.envProjectId){

   v= _.uniqBy([...envdata, ...(envs||[])], "title")
}else{
   v= _.uniqBy([...envdata, ...(envs||[]).filter((e)=>{
    return omit.includes(e.title)
  })], "title")

}

return v
}
export const getEnvs = async ({
  project,
  key,
  write=true,
}: {
  project: string;
  key?: string;
  write?:boolean
}) => {

key = key ||  sessionStore.getState().project.colab.key
      let branch  = sessionStore.getState().config.branch||"main"
  const secretPhrase = sessionStore.getState().secretPhrase;
  const config = sessionStore.getState().config;
  let commitId =   sessionStore.getState().config.commitId
let commit =   sessionStore.getState().config.commit
  try {
    if (!secretPhrase) {
      return;
    }

   

    let deHashedKey = (await handleDecrypt({
      encrypted: key,
      passphrase: secretPhrase as string,
    })) as string;
    if (!deHashedKey) {
      return;
    }

    let data = await httpRequest({ url: FETCHENVURL + `?id=${project}&branch=${branch||"main"}&commitId=${commitId}`});
   const omit = sessionStore.getState().config.omit ||[];
    if (data.success) {
      const loader = new TerminalLoader("Decrypting env", 50);
      const step =   50/ data.data.length
      let envs_ = envStore.getState().envs
      const decripted_ = await Promise.all(
        data.data.map(async (item) => {
          let c = handleDecryptEnv(item, deHashedKey);
          // console.log("dddddddddd",step)
          loader.tick(step);
    const existing = envs_.find((e) => e.title === c.title);
    let obj = { ...item, ...c,dItem:c,eItem:item   }
       if(existing){
          obj.pItem = existing
         }
          return obj;
        })
      )
         const decripted =  decripted_ .filter((item) => !omit.includes(item.title));

         let envs = envStore.getState().envs
         
         let v = mergeEnvToFile(decripted)
         updateProcessEnv(decripted);
      if(write){
        await writeEnvFile(v, config.envfile);
      }

      // envStore.getState().setEnvs(decripted);
      envStore.getState().setEnvs(v);
      return { decripted };
    } else {

      return null
    }
  } catch (e: any) {
    console.log(e)
  } finally {
  }
};

import axios, { AxiosRequestConfig } from "axios";
import { envStore, sessionStore } from "./state";
import {
  ADDENVURL,
  FETCHENVURL,
  GETPROJECTBYIDURL,
  GETSIGNEDKEYURL,
  LOGINWITHPHRASE,
  PRIVATEKEY,
  UPDATEENVURL,
  UPGRADEVERSIONURL,
} from "./const";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// export getsignedkey()=>{

// }
export enum ACTIONS{
  KILL="KILL"
}
export const loginWithPhrase = async ({
  phrase,task,colabId
}:
{  phrase: string,
  task?:string
  // email: string,
  colabId?:string}
): Promise<any> => {
  try {

  let logginin  = sessionStore.getState().logginin
  if(logginin){
    await sleep(5000);
    return   await loginWithPhrase({phrase, colabId});
  }
  let authKey  = sessionStore.getState().authKey
  let token  = sessionStore.getState().token
    if(authKey && token){
      return

    }
  sessionStore.getState().setLogginIn(true)

     let keydata =  await httpRequest({url:GETSIGNEDKEYURL,login:false,   method: "POST",
      body: { colabId },})


  let decryptedkeydata ;

  if(keydata.success)
  {

    if(task=="clone"){
      if(process.env.envVersion==keydata.data.colab.project.envVersion &&process.env.envProjectId==keydata.data.colab.project._id){
        return {action:ACTIONS.KILL,message:"everything up to date"}
      }
    }
    //   let secretKey  =  await handleDecrypt({encrypted:{...keydata?.data?.user,encrypted:keydata?.data?.user?.privateKey},passphrase:phrase})
    //  decryptedkeydata = await decryptMessageFromKeyPair({encrypted:keydata?.data.signedData,privateKey:secretKey})
    let secretKey  =  await handleDecrypt({encrypted:keydata.data.colab.privateKey,passphrase:phrase})
    
    decryptedkeydata = await decryptMessageFromKeyPair({encrypted:keydata?.data.signedData,privateKey:secretKey})
   
  }


  else{
       await sleep(3000);
   return   await loginWithPhrase({phrase, colabId});
    // toast.error(keydata?.message||"An error occured")
     
    
  }
    let req = await httpRequest({
      url: LOGINWITHPHRASE,
      login: false,
      method: "POST",
      body: { secret: decryptedkeydata?.decrypted, colabId },
    });

    if (req.success) {
        sessionStore.getState().setLogginIn(false)
      sessionStore.getState().login(req.data.user, req.data.token,req.data.authKey);
      setTimeout(()=>{
        sessionStore.getState().setAuthKey(null)

      // loginWithPhrase(phrase, email);

      },1000*50)

      let savedProject =   sessionStore.getState().project

if(savedProject){

  upgradeVersion({force:true})
}
    } else {
      console.warn("Login failed, retrying in 3s...");
      await sleep(3000);
   return   await loginWithPhrase({phrase, colabId});
      
       
    }
  } catch (e) {
    console.error("Error in loginWithPhrase:", e);
    console.warn("Retrying in 3s...");
    await sleep(3000);
  return  await loginWithPhrase({phrase, colabId});
  }
};

// General HTTP function
// your re-login fn

export async function httpRequest<T = any>(data_: {
  url: string;
  method?: string;
  login?: boolean;
  params?: Record<string, any>;
  body?: any;
  headers?: Record<string, string>;
}): Promise<T> {
  let { url, method = "GET", login = true, params, body, headers = {} } = data_;
  // 🔑 Get token from session

  let token = sessionStore.getState().token;
  let authKey = sessionStore.getState().authKey;

 

  // If login required but no token → try re-login
  if ((!token || !authKey) && login) {
    const phrase = sessionStore.getState().secretPhrase;
    const email = sessionStore.getState().email;
    const colabId = sessionStore.getState().colabId;
    if (phrase) {
      let data = await loginWithPhrase({phrase, colabId});
      token = sessionStore.getState().token; // refresh token after login
    }

    if (!token) {
      throw new Error("Unauthorized: No token available");
    }
  }

  // Merge Authorization header
  const authHeaders = (token && authKey)
  ?{Authorization:`Bearer ${((token||"") + "123456789"  + (authKey||"")) ||""}`}
    // ? { Authorization: `Bearer ${token} `, ...headers }
    : headers;

  // ---- Axios request ----
  const config: AxiosRequestConfig = {
    url,
    method: method as any,
    headers: {...authHeaders, "x-device-id":getDeviceId(),   "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",},
    params, // Axios handles params automatically
    data: body,
  };
try{

  const response = await axios.request<T>(config);

  return response.data;
}catch(e){

console.error(e?.response?.data?.message||e?.message||"An error occured")

  // throw(e)
  return e?.response?.data||{success:false}
  // process.kill(0)
  
}
}

export const getchangeEnv = async (updatedenvs = []) => {
  const secretPhrase = sessionStore.getState().secretPhrase;
  const project = sessionStore.getState().project;
  const envs = envStore.getState().envs;
  const omit = sessionStore.getState().config.omit ||[];
  try {
    if (!secretPhrase) {
      return;
    }

    let deHashedKey = (await handleDecrypt({
      encrypted: project.colab.key,
      passphrase: secretPhrase as string,
    })) as string;
    if (!deHashedKey) {
      return;
    }

    const decriptedenvs_ = await Promise.all(
      updatedenvs.map(async (item) => {
        let c = handleDecryptEnv(item, deHashedKey);
         const existing = envs.find((e) => e.title === c.title||(e?._id && e?._id==item?._id));
         let obj = { ...item, ...c ,dItem:c,eItem:item  }
         if(existing){
          obj.pItem = existing
         }

        return  obj;
      })
    );
  const  decriptedenvs = decriptedenvs_.filter((item) => !omit.includes(item.title))

    let v = decriptedenvs.reduce(
      (acc, env) => {
        const existing = envs.find((e) => e.title === env.title ||(e?._id && e?._id==env?._id));

        if (!existing || existing.value !== env.value || existing.title!=env.title) {
          acc.changes.push(env);
        }
  // let v = 
        return acc;
      },
      {
        list: _.uniqBy(_.uniqBy(mergeEnvToFile(decriptedenvs), "title"), "_id"),
        changes: [],
      }
    );
    envStore.getState().setEnvs(v.list);
    return v;
  } catch (e) {}
};

import fs from "fs";
import path from "path";
import { ISyncData } from "./types";

export interface EnvItem {
  title: string;
  value: string;
}

/**
 * Write env objects to .env file
 * @param envs array of {title, value}
 * @param filePath optional path to env file
 */


// function customEnvUnique(c = [], envs = []) {
//   const seen = new Set();
//   const merged = [];

//   const getKey = (item) => {
//     if (item?._id != null && item._id !== "") return item._id;
//     if (item?.ditem?.title != null && item.ditem.title !== "") return item.ditem.title;
//     if (item?.title != null && item.title !== "") return item.title;
//     return null;
//   };

//   for (const item of [...c, ...envs]) {
//     const key = getKey(item);
//     if (!key || seen.has(key)) continue;
//     seen.add(key);
//     merged.push(item);
//   }

//   return merged;
// }

function customEnvUnique(c = [], envs = []) {
  const merged = [];
  const seenIds = new Set();
  const seenDitemTitles = new Set();
  const seenTitles = new Set();

  for (const item of [...c, ...envs]) {
    const id = item?._id;
    const ditemTitle = item?.pItem?.dItem?.title;
    const citemTitle = item?.dItem?.title;
    const title = item?.title;

    

    const alreadyExists =
      (id && seenIds.has(id)) ||
      (ditemTitle && seenDitemTitles.has(ditemTitle)) ||
      (title && seenTitles.has(title));

    if (alreadyExists) continue;

    if (id) seenIds.add(id);
    if (ditemTitle) seenDitemTitles.add(ditemTitle);
    if (title) seenTitles.add(title);

    merged.push(item);
  }

  return merged;
}

export const  getmetadata = ()=>{

    let project =  sessionStore.getState().project

  let proj = project.colab.project
      let metadata = [
        {title:"envVersion",value:proj.envVersion},
        {title:"envName",value:proj.name},
        {title:"envDescription",value:proj.description},
        {title:"envProjectId",value:proj._id},
      ]

      return metadata

}
export const writeEnvFile = async (
  envs: EnvItem[],
  filePath: string = path.resolve(process.cwd(), ".env")
): Promise<{ success: boolean; error?: string }> => {
  try {

    
    sessionStore.getState().setWatcherActive(false)


    let   write =  sessionStore.getState().config.write
    // console.log(envs,write)
    if(!write){
      return
    }
    // Convert env objects to "KEY=VALUE" lines
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Env file not found at path: ${filePath}`);
    }
let c = []
    // try{

    //   const content_ = fs.readFileSync(filePath, "utf8");
    //      c = parseAndUniqueEnv(content_);
    // }catch(e){

    // }
    // let lines_ = _.uniqBy([...envs,...c],  (item) =>  item?._id)
    // let lines_ = customEnvUnique(envs,c)
    let lines = _.uniqBy([...getmetadata(),...envs,...c],  (item) =>  item?.dItem?.title || item?.title
 ).map((env) => `${env.title}="${env.value}"`);
        // lines = _.uniqBy([...lines, ...c.map((e) => `${e.title}=${e.value}`)], (line) => line.split("=")[0]);

    // Join lines with newlines
    const content = lines.join("\n");

    // Write to file
    await fs.promises.writeFile(filePath, content, { encoding: "utf8" });

    return { success: true };
  } catch (err: any) {
    console.error("Error writing .env file:", err);
    return { success: false, error: err.message || String(err) };
  }finally{
     sessionStore.getState().setWatcherActive(true)

  }
};

export const getenvObject = (envList) => {
  return envList.reduce((acc, env) => {
    acc[env.title] = env.value;
    return acc;
  }, {} as Record<string, string>);
};

export const updateProcessEnv = (envList: EnvItem[]) => {
  if (!Array.isArray(envList)) return;

  [...getmetadata(),...envList].forEach(({ title, value }) => {
    if (title) {
      process.env[title] = value;
    }
  });
};



export interface IConfig  {
  key: string;
  task?: string;
  // projectKey: string;
  env?: string;
  commit?: string;
  commitId?: string;
  branch?: string;
  sync?: boolean;
  write?: boolean;
  watch?: boolean;
   omit?:string[];
   updateCloud?:boolean
  onSync?: (data: ISyncData) => void;
  onLoad?: (data: any) => void;
}


export const upgradeVersion = async ({colab,secretPhrase ,force=false}:{colab?:any,secretPhrase?:string,force?:boolean})=>{
try{

  
  let savedProject =   sessionStore.getState().project
   secretPhrase =  secretPhrase || sessionStore.getState().secretPhrase
  //  console.log("upvers",force,colab.colab.keyVersion != colab.project.keyVersion,colab.colab.keyVersion , colab.project.keyVersion)
   
  //  console.log(colab)
   if(force){
  
  let   proj =    await getProjectById({id:(colab||savedProject).project._id,versioncontrol:false})
  colab = proj.data
    }
    // console.log(colab?.colab)
    if(colab.colab.keyVersion != colab.project.keyVersion){
  
  // let key = colab.key

let privateKey = await handleDecrypt({encrypted:colab.colab.privateKey,passphrase:secretPhrase})

let decryptedKey = await decryptMessageFromKeyPair({encrypted:colab.colab.key,privateKey:privateKey})


let version = colab.project.keyVersion
let encryptedKey =  await handleEncrypt({
  data:decryptedKey.decrypted,
  passphrase:secretPhrase,
  stringify:true
})
// console.log(encryptedKey,"encryptedKey")
  
  
  
  
  
  
  
  
   let project =   await httpRequest({
        url:UPGRADEVERSIONURL,
      
        body:{version,hashedkey:encryptedKey,id:colab.project._id},
        method:"POST"
  
      })
  
  //  let project =    await getProjectById(colab.project._id)
   if(project.success){
    sessionStore.getState().setProject(project.data);
  
    // await getEnvs({project:colab.project._id,write:true})
   }

   return project
  
  
    }

}catch(e){
  console.log(e)
}

}
export const initialize = async (data_:IConfig)=>{

let {
  key:key__,
  updateCloud=true,
  task,
  // projectKey,
  env = ".env",
  branch ,
  commit,
  commitId
  ,
  sync = false,
  write = false,
  watch = false,
  onSync = () => {},
   omit=[]
} = data_

branch = branch || getCurrentBranch()
let data =await  handleDecryptKeyPairLongData({encryptedString:key__,privateKey:PRIVATEKEY})
let {projectId:project,userKey:secretPhrase,userEmail:email,projectKey:keyy,colabId}=data
  // const [secretPhrase, email] = authPhrase.split("_kk_");
  sessionStore.getState().setSecretPhrase(secretPhrase);
  sessionStore.getState().setEmail(email);
  sessionStore.getState().setProjectId(project);
  sessionStore.getState().setColabId(colabId);
 
  
  // const [keyy, project] = projectKey.split("_kk_");
// console.log("ddd",data)
let logindata = await loginWithPhrase({phrase:secretPhrase,colabId,task})

if(logindata?.action){
  let action =logindata.action
  switch(action){
    case ACTIONS.KILL:{
      console.log(logindata?.message||"process killed")
      return logindata
    }
  }
}
// console.log("ddddd")

  let fetchproject = await getProjectById({id:project,task});

  if(fetchproject.success){
    // console.log(fetchproject.data)
  }
  sessionStore.getState().setProject(fetchproject.data);
  let commitInfo = getLatestGitCommit()
  sessionStore
    .getState()
    .setConfig({ envfile: env,commit:commit||commitInfo?.message,commitId:commitId||commitInfo?.commitId, sync, onSync ,omit:[...omit,...DEFAULTOMIT],updateCloud,write,branch,projectKey:keyy});
    setinitalEnv(key__)
  


    return  {env,sync,onSync,omit,updateCloud,write,branch,project,secretPhrase,email,keyy,fetchproject,watch}
}

const readenv  =()=>{
  let path = sessionStore.getState().config.envfile
    const content = fs.readFileSync(path, "utf8");
      let c = parseAndUniqueEnv(content);
     
return c
}

const setinitalEnv = (key)=>{

  try{
    
      let c = readenv()
      let omit = sessionStore.getState().config.omit||[]
      for (let val of c){
        if(val.value==key){
             omit.push(val.title)
        }
      }

      sessionStore.getState().config.omit=omit

 

       envStore.getState().setEnvs(c)

  }catch(e){

  }
}

import { execSync } from 'child_process';

function getCurrentBranch() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    return branch || 'main'; // fallback if output is empty
  } catch {
    return 'main'; // fallback if git fails or not a repo
  }
}



const DEVICE_ID_FILE = path.join(process.cwd(), ".device-id"); // hidden file in project root

export function getDeviceId(): string {
  // --- Browser ---
  // if (typeof window !== "undefined" && window.localStorage) {
  //   let deviceId = localStorage.getItem("x-device-id");
  //   if (!deviceId) {
  //     deviceId = crypto.randomUUID(); // generate UUID
  //     localStorage.setItem("x-device-id", deviceId);
  //   }
  //   return deviceId;
  // }

  // --- Node.js ---
  if (typeof process !== "undefined") {
    if (fs.existsSync(DEVICE_ID_FILE)) {
      return fs.readFileSync(DEVICE_ID_FILE, "utf-8");
    } else {
      const deviceId = crypto.randomUUID();
      fs.writeFileSync(DEVICE_ID_FILE, deviceId, { encoding: "utf-8", flag: "w" });
      return deviceId;
    }
  }

  throw new Error("Cannot generate device ID in this environment");
}


import readline from "readline";

export class TerminalLoader {
  private total: number;
  private current: number;
  private spinnerChars: string[];
  private spinnerIndex: number;
  private startTime: number;
  private loadText: string;

  constructor(loadText: string, total: number) {
    this.total = total;
    this.current = 0;
    this.spinnerChars = ["|", "/", "-", "\\"];
    this.spinnerIndex = 0;
    this.startTime = Date.now();
    this.loadText = loadText;
  }

  /**
   * Advance progress by a step (can be decimal) or move to a specific point.
   * @param step - Amount to increment (optional if specifying `point`)
   * @param message - Optional message override
   * @param point - Optional specific position to move to (0..total)
   */
  tick(step?: number, message?: string, point?: number): boolean {
    if (point !== undefined) {
      this.current = Math.min(point, this.total);
    } else if (step !== undefined) {
      this.current = Math.min(this.current + step, this.total);
    }

    this.spinnerIndex++;
    const percentage = Math.floor((this.current * 100) / this.total);
    const filledLength = Math.floor((this.current / this.total) * 50); // bar size
    const filled = "=".repeat(filledLength);
    const empty = " ".repeat(50 - filledLength);
    const elapsed = (Date.now() - this.startTime) / 1000;
    const statusMsg = message || this.loadText;

    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(
      `${statusMsg} ${this.spinnerChars[this.spinnerIndex % this.spinnerChars.length]} [${filled}>${empty}] ${percentage}% | ⏱ ${elapsed.toFixed(1)}s`
    );

    if (this.current >= this.total) {
      console.log(`\n✅ Done in ${elapsed.toFixed(1)}s!`);
      return true;
    }

    return false;
  }

  /** Restart loader from beginning (for reuse) */
  reset(loadText: string) {
    this.current = 0;
    this.spinnerIndex = 0;
    this.startTime = Date.now();
    this.loadText = loadText;
  }
}



import os from "os";

export const DEFAULTOMIT = ["envVersion","envName","envDescription","envProjectId"]

export function getOrCreateConfig(updates = {}) {
  const configDir = path.join(os.homedir(), ".config", "myapp");
  const configPath = path.join(configDir, "config.json");

  // Ensure directory exists
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  let configData = {};

  // Read existing file if present
  if (fs.existsSync(configPath)) {
    try {
      const fileContent = fs.readFileSync(configPath, "utf-8");
      configData = JSON.parse(fileContent);
    } catch (err) {
      console.warn("⚠️ Invalid JSON in config file, resetting...");
      configData = {};
    }
  } else {
    configData = { envVersion: 1 };
  }

  // Merge updates without overwriting existing keys
  const newConfig = { ...configData, ...updates };

  // Write back only if changed
  fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), "utf-8");

  return newConfig;
}

// john=aaa
// amakassss=nnnnnn
// import { execSync } from  "child_process";

/**
 * Get the latest git commit ID and message
 * @returns {{ commitId: string, message: string } | null}
 */
export function getLatestGitCommit() {
  try {
    // Get the latest commit hash
    const commitId = execSync("git rev-parse HEAD")
      .toString()
      .trim();

    // Get the latest commit messagef
    const message = execSync("git log -1 --pretty=%B")
      .toString()
      .trim();

    return { commitId, message };
  } catch (err) {
    // If any error occurs (not a git repo, etc.)
    return {commitId:null,message:null};
  }
}

// Example usage
// const latest = getLatestGitCommit();
// console.log(latest);
