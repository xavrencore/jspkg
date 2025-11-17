#!/usr/bin/env node

import fs from "fs";
import path from "path";
import readline from "readline";
import { execSync } from "child_process";

const CONFIG_FILE = "xav_push_config.json";

async function askUserConfig() {
  const input = fs.createReadStream('/dev/tty');
  const rl = readline.createInterface({
    input: input,
    output: process.stdout,
  });

  const askQuestion = (question: string, defaultValue = ""): Promise<string> => {
    return new Promise((resolve) => {
      const prompt = defaultValue
        ? `${question} (default: ${defaultValue}): `
        : `${question}: `;
      
      rl.question(prompt, (answer) => {
        resolve(answer.trim() || defaultValue);
      });
    });
  };

  try {
    console.log("\n🪝 Setting up your xavcli pre-push configuration...\n");
    
    const consent = await askQuestion(
      "Would you like to configure xavcli for automatic push encryption? (y/n)",
      "y"
    );

    if (consent.toLowerCase() !== "y") {
      console.log("❌ Skipped xavcli configuration.");
      rl.close();
      input.close();
      return null;
    }

    const method = await askQuestion(
      "How would you like to provide your encryption key? (keyfile / keyenv / key)",
      "keyenv"
    );

    let keyValue;
    switch (method) {
      case "keyfile":
        keyValue = await askQuestion("Enter the path to your key file");
        break;
      case "key":
        keyValue = await askQuestion("Enter your encryption key");
        break;
      case "keyenv":
      default:
        keyValue = await askQuestion("Enter your environment variable name", "XAVKEY");
        break;
    }

    rl.close();
    input.close();

    return { method, keyValue };
  } catch (err) {
    rl.close();
    input.close();
    throw err;
  }
}

function saveConfig(config: { method: string; keyValue: string }) {
  const gitDir = path.resolve(process.cwd(), ".git");
  
  if (!fs.existsSync(gitDir)) {
    console.log("❌ Not a git repository. Cannot save configuration.");
    return false;
  }

  const configPath = path.join(gitDir, CONFIG_FILE);
  console.log(configPath)
  
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
    console.log(`✅ Configuration saved to .git/${CONFIG_FILE}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to save configuration: ${err.message}`);
    return false;
  }
}

function loadConfig(): { method: string; keyValue: string } | null {
  const gitDir = path.resolve(process.cwd(), ".git");
  const configPath = path.join(gitDir, CONFIG_FILE);

  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const configData = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(configData);
  } catch (err) {
    console.error(`⚠️  Failed to read configuration: ${err.message}`);
    return null;
  }
}

function runXavcli(config: { method: string; keyValue: string }) {
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf-8" }).trim();
    console.log(`🚀 Running xavcli on branch: ${branch}`);

    let keyArg = "";
    switch (config.method) {
      case "keyfile":
        keyArg = `--keyfile ${config.keyValue}`;
        break;
      case "key":
        keyArg = `--key ${config.keyValue}`;
        break;
      case "keyenv":
      default:
        keyArg = `--keyenv ${config.keyValue}`;
        break;
    }

    const command = `xavcli push --branch ${branch} ${keyArg}`;
    console.log(`Executing: ${command}`);
    
    execSync(command, { stdio: "inherit" });
    
    console.log("✅ xavcli completed successfully!");
     process.exit(0);
  } catch (err) {
    console.error("❌ xavcli execution failed:", err.message);
    process.exit(1);
  }
}

(async () => {
  try {
    // Skip in CI environments
    if (process.env.CI) {
      console.log("CI environment detected, skipping xavcli configuration.");
      process.exit(0);
    }

    // Check if config already exists
    let config = loadConfig();

    if (config) {
      console.log("✅ Found existing xavcli configuration");
      console.log(`   Method: ${config.method}`);
      console.log(`   Key: ${config.keyValue}`);
      
      // Ask if they want to reconfigure
      const input = fs.createReadStream('/dev/tty');
      const rl = readline.createInterface({
        input: input,
        output: process.stdout,
      });

      const reconfigure = await new Promise<string>((resolve) => {
        rl.question("\nWould you like to reconfigure? (y/n, default: n): ", (answer) => {
          rl.close();
          input.close();
          resolve(answer.trim() || "n");
        });
      });

      if (reconfigure.toLowerCase() !== "y") {
        console.log("\nUsing existing configuration...");
        runXavcli(config);
        return;
      }

      // User wants to reconfigure
      config = await askUserConfig();
      if (!config) {
        process.exit(0);
      }
      saveConfig(config);
    } else {
      // No config exists, ask for configuration
      console.log("📝 No xavcli configuration found. Let's set it up!");
      config = await askUserConfig();
      
      if (!config) {
        process.exit(0);
      }

      saveConfig(config);
    }

    // Run xavcli with the configuration
    runXavcli(config);

  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
})();