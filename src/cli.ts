#!/usr/bin/env node
// import { Command } from 'commander';
// import fs from 'fs';
// import path from 'path';
// import { addEnv, getEnvs, initialize } from './utils';
// const program = new Command();

// program
//   .name('xavren')
//   .description('xavren CLI for env sync')
//   .version('1.0.0');

// // --- clone command ---



// program
//   .command('clone')
//   .description('Clone something using a key from file or argument')
//   .option('--key <key>', 'Specify the key manually')
//   .option('--keyfile <file>', 'Specify a custom keyfile path (optional)')
//   .option('--write', 'Write the cloned data into a .xav file', false)
//   .option('--branch', 'specify branch  of vault', "main")
//   .option('--env', 'specify branch  of vault', ".env")
//   .action(async (options) => {
//     const defaultKeyFile = path.resolve('./keyfile.txt');
//     const keyFilePath = options.keyfile ? path.resolve(options.keyfile) : defaultKeyFile;

//     let key;

//     // --- Step 1: Check keyfile ---
//     if (fs.existsSync(keyFilePath)) {
//       try {
//         key = fs.readFileSync(keyFilePath, 'utf8').trim();
//         console.log(`📁 Loaded key from ${keyFilePath}`);
//       } catch (err) {
//         console.error('❌ Failed to read keyfile:', err.message);
//         process.exit(1);
//       }
//     } 
//     // --- Step 2: Fallback to --key ---
//     else if (options.key) {
//       key = options.key;
//       console.log('🔑 Using provided --key value');
//     } 
//     // --- Step 3: No key found ---
//     else {
//       console.error('❌ Error: No keyfile found and no --key provided.');
//       process.exit(1);
//     }

//     // await addEnv

//     // --- Step 4: Simulate cloning ---
//     // console.log(`✅ Using key: ${key}`);
//     // console.log('📦 Cloning in progress...');

//     // Dummy cloned content
//     // const clonedData = `Cloned data for key: ${key}\nTimestamp: ${new Date().toISOString()}`;

//     // // --- Step 5: Handle write option ---
//     // if (options.write) {
//     //   const outputFile = path.resolve(`./clone_${Date.now()}.xav`);
//     //   fs.writeFileSync(outputFile, clonedData);
//     //   console.log(`💾 Saved cloned data to ${outputFile}`);
//     // } else {
//     //   console.log('🪄 Skipped writing to file (use --write to save).');
//     // }

//     console.log('✅ Clone operation complete!');
// let {env,sync,onSync,omit,updateCloud,write,branch,project,secretPhrase,email,keyy,fetchproject,watch} = await initialize({
//     write:options.write,key,branch:options.branch,env:options.env
// })

//   await getEnvs({ project: project, key: fetchproject.data,write:!!write });
// //   await addEnv({ key: fetchproject, secretPhrase, sync, body: c, project });
    
//   });

// program.parse();


import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { ACTIONS, addEnv, getEnvs, initialize, mount } from './utils';
import dotenv from "dotenv"

(()=>{


  try{

dotenv.config()

const program = new Command();

program
  .name('xavren')
  .description('xavren CLI for env sync')
  .version('1.0.0');

program
  .command('clone')
  .description('Clone something using a key from file or argument')
  .option('--key <key>', 'Specify the key manually')
  .option('--keyfile <file>', 'Specify a custom keyfile path (optional)')
  .option('--keyenv <file>', 'Specify a custom env key  (optional)')
  .option('--write', 'Write the cloned data into a .xav file', false)
  .option('--branch <branch>', 'Specify branch of vault')
  .option('--env <env>', 'Specify env file name', '.env')
  .option('--omit <omit>', 'Specify env file name', '')
  .action(async (options) => {
    const defaultKeyFile = path.resolve('./keyfile.txt');
    const keyFilePath = options.keyfile ? path.resolve(options.keyfile) : defaultKeyFile;

    let key: string;
   
    let omit_ = options.omit.split(",")
   

    // --- Step 1: Check keyfile ---
    if (fs.existsSync(keyFilePath)) {
      try {
        key = fs.readFileSync(keyFilePath, 'utf8').trim();
        console.log(`📁 Loaded key from ${keyFilePath}`);
      } catch (err: any) {
        console.error('❌ Failed to read keyfile:', err.message);
        process.exit(1);
      }
    } 
    // --- Step 2: Fallback to --key ---
    else if (options.key) {
      key = options.key;
      console.log('🔑 Using provided --key value');
    } else if(options.keyenv){

      omit_.push(options.keyenv)

      key = process.env[options.keyenv]
      
    }
    // --- Step 3: No key found ---
    else {
      console.error('❌ Error: No keyfile found and no --key provided.');
      process.exit(1);
    }

    console.log('✅ Clone operation started...');

    // --- Step 4: Initialize environment ---
    const { env, sync, onSync, omit, updateCloud, write, branch, project, secretPhrase, email, keyy, fetchproject, watch,action } =
      await initialize({
       task:"clone",
        write: options.write,
        key,
        branch: options.branch,
        env: options.env,
        omit:omit_
      });
      if(action){
       
        switch(action){
          case ACTIONS.KILL:{
            return ;
          }
        }
      }
      console.log("getting envs")

    // --- Step 5: Fetch environments ---
    await getEnvs({ project, write: !!write });

    console.log('\n✅ Clone operation complete!');

    process.exit(0);
  });



  program
  .command('push')
  .description('Push envs using a key to cloud')
  .option('--key <key>', 'Specify the key manually')
  .option('--keyfile <file>', 'Specify a custom keyfile path (optional)')
  .option('--keyenv <file>', 'Specify a custom env key  (optional)')
  .option('--write', 'Write the cloned data into a .xav file', false)
  .option('--sync', 'sync to cloud .xav file', false)
  .option('--branch <branch>', 'Specify branch of vault')
  .option('--env <env>', 'Specify env file name', '.env')
  .option('--omit <omit>', 'Specify env file name', '')
  .action(async (options) => {
    const defaultKeyFile = path.resolve('./keyfile.txt');
    const keyFilePath = options.keyfile ? path.resolve(options.keyfile) : defaultKeyFile;

    let key: string;
  
    // let omit_ = []
     let omit_ = options.omit.split(",")

    // --- Step 1: Check keyfile ---
    if (fs.existsSync(keyFilePath)) {
      try {
        key = fs.readFileSync(keyFilePath, 'utf8').trim();
        console.log(`📁 Loaded key from ${keyFilePath}`);
      } catch (err: any) {
        console.error('❌ Failed to read keyfile:', err.message);
        process.exit(1);
      }
    } 
    // --- Step 2: Fallback to --key ---
    else if (options.key) {
      key = options.key;
      console.log('🔑 Using provided --key value');
    } else if(options.keyenv){

      omit_.push(options.keyenv)

      key = process.env[options.keyenv]
      
    }
    // --- Step 3: No key found ---
    else {
      console.error('❌ Error: No keyfile found and no --key provided.');
      process.exit(1);
    }

    console.log('✅ Push operation started...');

    // --- Step 4: Initialize environment ---
    const { env, sync, onSync, omit, updateCloud, write, branch, project, secretPhrase, email, keyy, fetchproject, watch } =
      await initialize({
        write: options.write,
        key,
        branch: options.branch,
        sync: options.sync,
        env: options.env,
        omit:omit_,
        
      });
      

    // --- Step 5: Fetch environments ---
  // path,
  // secretPhrase,
  // key,
  // sync,
  // project,
  // fetchproject,

    await mount({
      fetchproject:fetchproject.data,secretPhrase,project,sync,key,path:env
    })

    console.log('\n✅ Push operation complete!');

    process.exit(0);
  });
program.parse();

  }catch(e){
    console.log(e)
  }
})()
