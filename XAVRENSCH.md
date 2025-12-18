# Xavren Environment Configuration Documentation

## Overview

Xavren is an advanced environment configuration parser that extends traditional `.env` file functionality with powerful features like branching, inheritance, references, and locking mechanisms. It provides a structured way to manage environment variables across different deployment contexts.

---

## Syntax Guide

### Basic Structure

```env
# Top-level variables (available globally)
project="Real estate api"
version="1.0.0"

# Branch/Section definition
[branch_name]
KEY="value"
OTHER_KEY="another value"
@end
```

### Key Features

#### 1. **Top-Level Variables**
Variables defined outside any branch are globally accessible:

```env
project="Real estate api"
environment="production"
```

#### 2. **Branches (Sections)**
Organize variables into logical groups using brackets:

```env
[globals]
jwt="seluhsdjflkssbdjfvallckjsdkussssdzbcsjkdnfvz"
NODENV="false"
@end

[development]
DEBUG="true"
PORT="3000"
@end

[production]
DEBUG="false"
PORT="8080"
@end
```

**Branch Naming Rules:**
- Alphanumeric characters, underscores, hyphens
- Special characters: `!#$%&()+=\/.,@{}`
- Case-sensitive

#### 3. **References**
Reference other variables using `{reference}` syntax:

**Simple Reference:**
```env
project="Real estate api"

[main]
NUBAN_ID={project}
# Resolves to: NUBAN_ID="Real estate api"
@end
```

**Branch.Key Reference:**
```env
[globals]
dddd="global_value"
@end

[main]
gggg={globals.dddd}
# Resolves to: gggg="global_value"
@end
```

**Branch Reference (inherit all variables):**
```env
[maineeeedddde]
inherit={main}
# Inherits all key-value pairs from [main]
@end
```

#### 4. **Inheritance**
Two ways to inherit configuration:

**Using `inherit` keyword:**
```env
[base]
HOST="localhost"
PORT="3000"
@end

[development]
inherit={base}
DEBUG="true"
# Result: HOST="localhost", PORT="3000", DEBUG="true"
@end
```

**Direct reference:**
```env
[main]
dddd="globals"
@end

[maineeeedddde]
sdsd="SDs"
gggg={main.dddd}
inherit={main}
@end
```

#### 5. **Include External Files**
Import variables from standard `.env` files:

```env
[config]
include={./secrets.env}
@end
```

#### 6. **Branch Activation/Deactivation**
Prefix branches or keys with `-` to mark them as inactive:

```env
# Active branch
[production]
PORT="8080"
@end

# Inactive branch (commented out)
[-staging]
-PORT="5000"
@end
```

#### 7. **Comments**
Two comment styles supported:

```env
# Single line comment
-- Alternative comment style

[main]
# This is ignored
KEY="value"  # Inline comments not supported
@end
```

#### 8. **Section Terminators**
Three ways to end a branch:

```env
[branch1]
KEY="value"
@end

[branch2]
KEY="value"
---

[branch3]
KEY="value"
}
```

---

## Example Configuration

```env
# Global configuration
project="Real estate api"
version="2.1.0"

# Shared secrets
[globals]
jwt="seluhsdjflkssbdjfvallckjsdkussssdzbcsjkdnfvz"
NODENV="false"
api_key="abc123xyz"
@end

# Base configuration
[base]
HOST="localhost"
DATABASE="postgresql"
@end

# Main application config
[main]
inherit={base}
NUBAN_ID={project}
JWT_SECRET={globals.jwt}
PORT="3000"
@end

# Extended configuration with inheritance
[maineeeedddde]
sdsd="SDs"
gggg={globals.api_key}
inherit={main}
@end

# Final configuration chain
[maineeeee]
inherit={maineeeedddde}
EXTRA_FEATURE="enabled"
@end

# Inactive staging branch
[-staging]
-PORT="5000"
-DEBUG="true"
@end
```

---

## Special Syntax Rules

### Reference Resolution
- `{variable}` - References top-level variable or branch
- `{branch.key}` - References specific key in a branch
- References are resolved at parse time
- Circular references are detected (max depth: 10)

### Value Quoting
```env
# Recommended: use quotes
KEY="value with spaces"

# Without quotes (treated as-is)
KEY=simple_value

# References don't need quotes
KEY={other_key}
```

### Reserved Keywords
- `inherit` - Merge variables from another branch
- `include` - Import external `.env` file

### Key Naming
- Keys can contain alphanumeric, underscore, hyphen
- Leading `-` marks key as inactive
- Case-sensitive

---

## Advanced Patterns

### Cascading Configuration
```env
[defaults]
TIMEOUT="30"
RETRIES="3"
@end

[development]
inherit={defaults}
DEBUG="true"
@end

[production]
inherit={defaults}
TIMEOUT="60"
LOG_LEVEL="error"
@end
```

### Multi-level Inheritance
```env
[base]
A="1"
@end

[level1]
inherit={base}
B="2"
@end

[level2]
inherit={level1}
C="3"
# Result: A="1", B="2", C="3"
@end
```

### Cross-referencing
```env
APP_NAME="MyApp"

[database]
DB_NAME="{APP_NAME}_db"
@end

[cache]
CACHE_PREFIX={database.DB_NAME}
@end
```

---

# XavrenParser API Documentation

## Class: `XavrenParser`

A comprehensive parser for Xavren-formatted environment configuration files with support for branching, inheritance, references, and locking.

---

## Installation & Setup

```javascript
const { XavrenParser } = require('./xavren-parser');

const parser = new XavrenParser();
```

---

## Core Methods

### `load(configPath)`
Load and parse a configuration file.

**Parameters:**
- `configPath` (string, optional): Path to config file. Default: `'.env'`

**Returns:** Parsed configuration object or `null` on error

**Example:**
```javascript
const config = parser.load('./config.xav');
// config = { project: "Real estate api", main: {...}, globals: {...} }
```

---

### `get({ branch, standalone })`
Retrieve configuration data.

**Parameters:**
- `branch` (string, optional): Specific branch name to retrieve
- `standalone` (boolean, optional): If true, merge top-level vars with branch vars

**Returns:** Configuration object or `null`

**Examples:**
```javascript
// Get all configuration
const allConfig = parser.get({});

// Get specific branch
const mainConfig = parser.get({ branch: 'main' });
// Returns: { NUBAN_ID: "Real estate api", dddd: "globals" }

// Get branch with top-level vars merged
const standalone = parser.get({ branch: 'main', standalone: true });
// Returns: { project: "Real estate api", NUBAN_ID: "Real estate api", dddd: "globals" }
```

---

### `static spawnenv(configData, branch)`
Inject configuration into `process.env`.

**Parameters:**
- `configData` (object): Parsed configuration object
- `branch` (string, optional): Specific branch to spawn

**Returns:** `true` on success, `false` on failure

**Example:**
```javascript
const config = parser.load('.env');

// Spawn all top-level vars
XavrenParser.spawnenv(config);

// Spawn specific branch
XavrenParser.spawnenv(config, 'production');
// Now: process.env.NUBAN_ID, process.env.PORT, etc. are set
```

---

### `loadAndSpawn(loadEnvData)`
Convenience method: load config and spawn to `process.env` in one call.

**Parameters:**
- `loadEnvData` (object):
  - `envs` (string): Path to config file
  - `branch` (string, optional): Branch to spawn

**Example:**
```javascript
parser.loadAndSpawn({
  envs: './config.xav',
  branch: 'production'
});
```

---

### `write({ writeObj, configPath, flags })`
Write configuration data to file.

**Parameters:**
- `writeObj` (object): Configuration object to write
- `configPath` (string, optional): Output file path. Default: `'.env'`
- `flags` (string, optional): Write behavior flags. Default: `'r'`

**Flags:**
- `r` - Rewrite (overwrite file)
- `a` - Append (merge with existing)
- `o` - Old first (existing data takes precedence)
- `n` - New first (new data takes precedence, default with `a`)

**Example:**
```javascript
parser.write({
  writeObj: {
    project: "New Project",
    main: {
      PORT: "4000",
      DEBUG: "true"
    }
  },
  configPath: './output.xav',
  flags: 'r'
});

// Append mode (merge with existing, new values win)
parser.write({
  writeObj: { production: { PORT: "8080" } },
  flags: 'a'
});

// Append mode (merge with existing, old values win)
parser.write({
  writeObj: { production: { PORT: "8080" } },
  flags: 'ao'
});
```

**Features:**
- Automatically detects and preserves references
- Converts duplicate values to `{reference}` notation
- Handles inheritance with `inherit={branch}` syntax

---

### `switchBranch({ branch, configPath, flags, populated })`
Switch active branch by prefixing inactive branches with `-`.

**Parameters:**
- `branch` (string): Branch to activate
- `configPath` (string, optional): Config file path. Default: `'.env'`
- `flags` (string, optional): Write flags. Default: `'r'`
- `populated` (boolean, optional): If true, resolve references; if false, keep raw. Default: `false`

**Example:**
```javascript
// Before:
// [production]
// PORT="8080"
// @end
//
// [development]
// PORT="3000"
// @end

parser.switchBranch({
  branch: 'development',
  configPath: './config.xav'
});

// After:
// [-production]
// -PORT="8080"
// @end
//
// [development]
// PORT="3000"
// @end
```

---

## Advanced Methods

### `parse(content, baseDir)`
Parse Xavren format string into configuration object.

**Parameters:**
- `content` (string): Configuration file content
- `baseDir` (string, optional): Base directory for resolving includes. Default: `process.cwd()`

**Returns:** Parsed configuration object

**Example:**
```javascript
const content = `
project="MyApp"

[main]
APP={project}
@end
`;

const config = parser.parse(content);
// config = { project: "MyApp", main: { APP: "MyApp" } }
```

---

### `parseRaw(content)`
Parse configuration without resolving references (preserves original syntax).

**Returns:** Raw configuration object with unresolved references

**Example:**
```javascript
const content = `
[main]
APP={project}
@end
`;

const raw = parser.parseRaw(content);
// raw = { main: { APP: "{project}" } }
```

---

## Locking Mechanism

### `updateXavLock(obj, env)`
Lock variables to track changes and prevent accidental modifications.

**Parameters:**
- `obj` (object): Key-value pairs to lock
- `env` (string): Path to config file

**Example:**
```javascript
parser.updateXavLock({
  API_KEY: "secret123",
  DATABASE_URL: "postgres://localhost"
}, './config.xav');

// Creates [xavlock] section:
// [xavlock]
// API_KEY@lock(secret123)="secret123"
// DATABASE_URL@lock(postgres://localhost)="postgres://localhost"
// @end
```

---

### `getXavLock(env)`
Retrieve all locked variables.

**Parameters:**
- `env` (string): Path to config file

**Returns:** Object with unlocked keys

**Example:**
```javascript
const locked = parser.getXavLock('./config.xav');
// { API_KEY: "secret123", DATABASE_URL: "postgres://localhost" }
```

---

### `lockExist(key, value, env)`
Check if a specific key-value pair is locked.

**Parameters:**
- `key` (string): Variable key
- `value` (string): Expected value
- `env` (string): Path to config file

**Returns:** `true` if locked with matching value, `false` otherwise

**Example:**
```javascript
const isLocked = parser.lockExist('API_KEY', 'secret123', './config.xav');
// true if API_KEY@lock(secret123) exists in [xavlock]
```

---

## Utility Methods

### `parseEnvFile(filePath)`
Parse standard `.env` file (cached).

**Example:**
```javascript
const env = parser.parseEnvFile('./.env');
```

---

### `resolveValues(data, context, baseDir)`
Internal method to resolve references and inheritance.

---

### `mergeDeep(target, source)`
Deep merge two configuration objects.

**Example:**
```javascript
const merged = parser.mergeDeep(
  { a: 1, b: { c: 2 } },
  { b: { d: 3 }, e: 4 }
);
// Result: { a: 1, b: { c: 2, d: 3 }, e: 4 }
```

---

## Complete Usage Example

```javascript
const { XavrenParser } = require('./xavren-parser');

// Initialize parser
const parser = new XavrenParser();

// Load configuration
const config = parser.load('./config.xav');

// Get specific branch
const prodConfig = parser.get({ branch: 'production' });

// Spawn to environment
XavrenParser.spawnenv(config, 'production');
console.log(process.env.PORT); // "8080"

// Switch active branch
parser.switchBranch({
  branch: 'development',
  configPath: './config.xav'
});

// Lock sensitive variables
parser.updateXavLock({
  JWT_SECRET: config.globals.jwt,
  API_KEY: config.globals.api_key
}, './config.xav');

// Check if variable is locked
if (parser.lockExist('JWT_SECRET', config.globals.jwt, './config.xav')) {
  console.log('JWT secret is locked');
}

// Write new configuration
parser.write({
  writeObj: {
    newBranch: {
      inherit: '{production}',
      FEATURE_FLAG: 'enabled'
    }
  },
  flags: 'a' // Append mode
});
```

---

## Error Handling

All methods include try-catch blocks and log errors to console. Methods return `null` or `false` on error:

```javascript
const config = parser.load('./nonexistent.xav');
if (!config) {
  console.error('Failed to load config');
}

const success = parser.write({ writeObj: {} });
if (!success) {
  console.error('Failed to write config');
}
```

---

## Best Practices

1. **Use descriptive branch names**: `production`, `development`, `testing`
2. **Lock sensitive data**: Always lock API keys, secrets, tokens
3. **Leverage inheritance**: Create base configurations and extend them
4. **Use references**: Avoid duplication with `{reference}` syntax
5. **Version control**: Track changes with the locking mechanism
6. **Validate before spawning**: Check configuration validity before injecting to `process.env`

---

## Circular Reference Protection

The parser detects circular references up to depth 10:

```env
[bad]
A={bad.B}
B={bad.A}
@end
# Warning logged: "Circular reference detected for key: A"
```

---

## File Caching

External `.env` files referenced via `include` are cached automatically to improve performance on repeated access.