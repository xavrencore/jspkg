

````markdown
# Xavrem Documentation

Secure environment variable management with real-time synchronization and zero-knowledge encryption.

---

## 🚀 Installation

Install the EnvaultSecure package using npm:

```bash
npm install xavren
````

---

## ⚙️ Configuration

Basic configuration to get started with **EnvaultSecure**:

```javascript
import dotenv from "xavren"

dotenv.config({
  env: "/path/to/.env",
  onSync: (data) => {
    console.log("Sync data received:", data);
  },
  key: "your-api-key",
  authPhrase: process.env.authphrase,
  projectKey: process.env.projectkey,
  omit: ["projectkey", "authphrase"]
})
```

---

## 👀 Monitor for Changes with `onSync`

Set up real-time monitoring for environment variable changes:

```javascript
import dotenv from "envaultsecure"

dotenv.config({
  env: "/path/to/.env",
  updateCloud: true,   // default: true
  sync: false,         // default: false
  onSync: (data:{ list: EnvItem[]; changes: Record<string,string> }) => {
    console.log("Environment file reloaded");
    console.log("All env variables:", data.list);
    console.log("Changed variables:", data.changes);
  },
  projectKey: "YOUR_PROJECT_KEY",
  authPhrase: "YOUR_APP_AUTHPHRASE"
});
```

---

## 📑 Configuration Parameters

| Parameter       | Type     | Required | Description                                                                                             |
| --------------- | -------- | -------- | ------------------------------------------------------------------------------------------------------- |
| **env**         | string   | No       | Path to the environment file to load (e.g., `.env` or custom path).                                     |
| **onSync**      | Function | No       | Callback executed whenever environment variables are reloaded or changed. Receives `{ list, changes }`. |
| **projectKey**  | string   | Yes      | Project key for secure access to environment management.                                                |
| **authPhrase**  | string   | Yes      | Secret for authentication or encryption.                                                                |
| **omit**        | array    | No       | Omit selected env vars from syncing to the cloud.                                                       |
| **sync**        | boolean  | No       | Force cloud env to match local env. Default: `false`.                                                   |
| **updateCloud** | boolean  | No       | Sync local changes to cloud. Default: `true`.                                                           |

---

## 🔄 onSync Callback

The **onSync** callback provides:

* **list** → All environment variables after reload.
* **changes** → Only variables modified since the last load.

Example:

```javascript
onSync: ({ list, changes }) => {
  if (changes["DB_URL"]) {
    console.log("Database URL updated:", changes["DB_URL"]);
    reconnectDatabase(changes["DB_URL"]);
  }
}
```

---

## 🛠️ Production Workflow

Example setup with multiple services:

```javascript
import mongoose from "mongoose";

let currentUri = process.env.MONGO_URI;

dotenv.config({
  env: ".env.production",
  onSync: ({ list, changes }) => {
    if (changes["MONGO_URI"]) {
      connectDB(changes["MONGO_URI"]);
    }
    if (changes["API_KEY"]) {
      refreshAPIKey(changes["API_KEY"]);
    }
  },
  projectKey: "my-app",
  authPhrase: "super-secret"
});

async function connectDB(uri) {
  try {
    if (currentUri === uri && mongoose.connection.readyState === 1) {
      console.log("Already connected to MongoDB");
      return;
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("Disconnected from previous MongoDB connection");
    }

    await mongoose.connect(uri, { autoIndex: true });
    currentUri = uri;
    console.log("✅ MongoDB connected to new URI");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
}

connectDB();
```

---

## ⚠️ Important Notes

* Always validate changed environment variables before applying them to critical services (e.g., DB, Redis).
* Sensitive info (`projectKey`, `authPhrase`) should **not** be logged.
* Works seamlessly with file watchers or reload triggers for `.env`.
* All data is encrypted end-to-end using **AES-256**.
* Your API key and authPhrase should be stored in your `.env` file and omitted from syncing.

---

## 📞 Support

* **API Reference** → Coming soon
* **Need help?** → [Contact Support](./contact)

