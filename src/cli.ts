#!/usr/bin/env node

import { Command } from "commander";
import fs from "fs";
import path from "path";
import {
  ACTIONS,
  getEnvs,
  initialize,
  listToEnvString,
  mount,
  objectToList,
} from "./utils";
import dotenv from "dotenv";
import { XavrenParser } from "./parser";

(() => {
  try {
    // dotenv.config()
    // console.log(process.env["-dddddd"],"kddddddsss")

    // console.log(process.env["ss"],"kddddddsss")
    // console.log(process.env["data"],"kddddddsss")

    const program = new Command();

    program
      .name("xavren")
      .description("xavren CLI for env sync")
      .version("1.0.0");

    program
      .command("clone")
      .description("Clone something using a key from file or argument")
      .option("--key <key>", "Specify the key manually")
      .option("--keyfile <file>", "Specify a custom keyfile path (optional)")
      .option("--keyenv <file>", "Specify a custom env key  (optional)")
      .option("--write", "Write the cloned data into a .xav file", false)
      .option("--branch <branch>", "Specify branch of vault")
      .option("--env <env>", "Specify env file name", ".env")
      .option("--commit <commit>", "Specify env file name (optional)")
      .option("--commitId <commitId>", "Specify commit id to clone (optional)")
      .option("--omit <omit>", "Specify env file name", "")
      .action(async (options) => {
        const defaultKeyFile = path.resolve("./keyfile.txt");
        const keyFilePath = options.keyfile
          ? path.resolve(options.keyfile)
          : defaultKeyFile;

        let key: string;

        let omit_ = options.omit.split(",");

        // --- Step 1: Check keyfile ---
        if (fs.existsSync(keyFilePath)) {
          try {
            key = fs.readFileSync(keyFilePath, "utf8").trim();
            console.log(`📁 Loaded key from ${keyFilePath}`);
          } catch (err: any) {
            console.error("❌ Failed to read keyfile:", err.message);
            process.exit(1);
          }
        }
        // --- Step 2: Fallback to --key ---
        else if (options.key) {
          key = options.key;
          console.log("🔑 Using provided --key value");
        } else if (options.keyenv) {
          omit_.push(options.keyenv);

          key = process.env[options.keyenv];
        }
        // --- Step 3: No key found ---
        else {
          console.error("❌ Error: No keyfile found and no --key provided.");
          process.exit(1);
        }

        console.log("✅ Clone operation started...");

        console.log(options?.commitId);

        // --- Step 4: Initialize environment ---
        const {
          write,

          project,

          action,
        } = await initialize({
          task: "clone",
          write: options.write,
          key,
          branch: options.branch,
          env: options.env,
          omit: omit_,
          commit: options?.commit,
          commitId: options?.commitId,
        });
        if (action) {
          switch (action) {
            case ACTIONS.KILL: {
              return;
            }
          }
        }
        console.log("getting envs");

        // --- Step 5: Fetch environments ----
        await getEnvs({ project, write: !!write });

        console.log("\n✅ Clone operation complete!");

        process.exit(0);
      });

    program
      .command("push")
      .description("Push envs using a key to cloud")
      .option("--key <key>", "Specify the key manually")
      .option("--env <env>", "Specify env file name", ".env")
      .option("--branch <branch>", "Specify branch of vault")
      .option("--keyfile <file>", "Specify a custom keyfile path (optional)")
      .option("--keyenv <file>", "Specify a custom env key  (optional)")
      .option("--write", "Write the cloned data into a .xav file", false)
      .option("--sync", "sync to cloud .xav file", false)

      .option("--commit <commit>", "Specify env file name (optional)")
      .option("--commitId <commitId>", "Specify commit id to clone (optional)")
      .option("--omit <omit>", "Specify env file name", "")
      .action(async (options) => {
        const defaultKeyFile = path.resolve("./keyfile.txt");
        const keyFilePath = options.keyfile
          ? path.resolve(options.keyfile)
          : defaultKeyFile;

        let key: string;

        // let omit_ = []
        let omit_ = options.omit.split(",");

        // --- Step 1: Check keyfile ---
        if (fs.existsSync(keyFilePath)) {
          try {
            key = fs.readFileSync(keyFilePath, "utf8").trim();
            console.log(`📁 Loaded key from ${keyFilePath}`);
          } catch (err: any) {
            console.error("❌ Failed to read keyfile:", err.message);
            process.exit(1);
          }
        }
        // --- Step 2: Fallback to --key ---
        else if (options.key) {
          key = options.key;
          console.log("🔑 Using provided --key value");
        } else if (options.keyenv) {
          omit_.push(options.keyenv);

          key = process.env[options.keyenv];
        }
        // --- Step 3: No key found ---
        else {
          console.error("❌ Error: No keyfile found and no --key provided.");
          process.exit(1);
        }

        console.log(
          "✅ Push operation started...",
          options?.commitId == "unique",
          options?.commitId
        );

        // --- Step 4: Initialize environment ---
        const {
          env,
          sync,
          onSync,
          omit,
          updateCloud,
          write,
          branch,
          project,
          secretPhrase,
          email,
          keyy,
          fetchproject,
          watch,
        } = await initialize({
          write: options.write,
          key,
          branch: options.branch,
          sync: options.sync,
          env: options.env,
          omit: omit_,
          commit: options?.commit,
          commitId: options?.commitId,
        });

        // --- Step 5: Fetch environments ---
        // path,
        // secretPhrase,
        // key,
        // sync,
        // project,
        // fetchproject,

        await mount({
          secretPhrase,
          project,
          sync,
        });

        console.log("\n✅ Push operation complete!");

        process.exit(0);
      });

    program
      .command("switchbranch")
      .description("switch env file branch")

      .option("--env <env>", "Specify env file name", ".env")
      .option("--branch <branch>", "Specify branch to switch to")
      .action(async (options) => {
        let parser = new XavrenParser();
        parser.load(options?.env);
        if (options?.branch) {
          parser.switchBranch({ branch: options?.branch });
        }
      });

    program
      .command("getbranch")
      .description("switch env file branch")

      .option("--env <env>", "Specify env file name", ".env")
      .option("--branch <branch>", "Specify branch to switch to")
      .action(async (options) => {
        let parser = new XavrenParser();
        parser.load(options?.env);
        if (options?.branch) {
          let v = parser.get({ branch: options?.branch, standalone: true });

          let envlist = objectToList(v);
          let string = listToEnvString(envlist);

          console.log(string);
        }
      });

    program.parse();
  } catch (e) {
    console.log(e);
  }
})();
