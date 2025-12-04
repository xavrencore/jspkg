const fs = require('fs');
const path = require('path');

export class XavrenParser {
  cache;
  _configData;

  constructor() {
    this.cache = {};
    this._configData = null;
  }

  /**
   * Load and parse config file (works like dotenv)
   */
  load(configPath = '.env') {
    try {
      const fullPath = path.isAbsolute(configPath) 
        ? configPath 
        : path.resolve(process.cwd(), configPath);

      const content = fs.readFileSync(fullPath, 'utf-8');
      this._configData = this.parse(content, path.dirname(fullPath));
      return this._configData;
    } catch (err) {
      console.error(`Error loading config: ${err.message}`);
      return null;
    }
  }

  /**
   * Get data from loaded config by branch name or all data
   */
  get({ branch = null, standalone = false }) {
    try {
      if (!this._configData) {
        console.warn('No config loaded. Call .load() first.');
        return null;
      }

      if (branch) {
        // let standaloneObj = {};
        let branchObj = {};

        if (standalone) {
          for (const [key, value] of Object.entries(this._configData)) {
            if (typeof value !== 'object' || value === null ) {
              branchObj[key] = String(value);
            }
            if(key == branch && typeof value === 'object' ){
                branchObj = {...branchObj,...value}
            }
          }
        }else{

            if (!this._configData[branch]) {
              console.warn(`Branch "${branch}" not found in config.`);
              branchObj = {};
            } else {
              branchObj = this._configData[branch];
            }
        }


        return branchObj;
      }

      return this._configData;
    } catch (err) {
      console.error(`Error getting data: ${err.message}`);
      return null;
    }
  }

  /**
   * Static method - Spawn env data to process.env
   */
  static spawnenv(configData = {}, branch = null) {
    try {
      if (!configData || typeof configData !== 'object') {
        console.error('Invalid config data passed to spawnenv');
        return false;
      }

      // Add all top-level (non-section) vars to process.env
      for (const [key, value] of Object.entries(configData)) {
        if (typeof value !== 'object' || value === null) {
          process.env[key] = String(value);
        }
      }

      // Add branch-specific vars if specified
      if (branch && configData[branch]) {
        for (const [key, value] of Object.entries(configData[branch])) {
          if (typeof value !== 'object' || value === null) {
            process.env[key] = String(value);
          }
        }
      }

      console.log(`Spawned env vars${branch ? ` from branch "${branch}"` : ''}`);
      return true;
    } catch (err) {
      console.error(`Error spawning env: ${err.message}`);
      return false;
    }
  }

  /**
   * Load and spawn env to process.env in one call
   */
  loadAndSpawn(loadEnvData: any = {}) {
    try {
      const envPath = loadEnvData.envs || '.env';
      const branch = loadEnvData.branch;

      this.load(envPath);
      XavrenParser.spawnenv(this._configData, branch);

      return true;
    } catch (err) {
      console.error(`Error in loadAndSpawn: ${err.message}`);
      return false;
    }
  }

  /**
   * Switch active branch for other env parsers
   * Marks selected branch without hyphen, others with hyphen prefix
   * flags: a=append, r=rewrite, o=old first, n=new first
   * populated: if true, resolves references; if false, keeps references as-is
   */
  switchBranch({ branch, configPath = '.env', flags = 'r', populated = false }) {
    try {
      if (!this._configData) {
        console.warn('No config loaded. Call .load() first.');
        return false;
      }

      const fullPath = path.isAbsolute(configPath) 
        ? configPath 
        : path.resolve(process.cwd(), configPath);
      
      const baseDir = path.dirname(fullPath);

      let rawData = this._configData;

      // If not populated, parse raw file without resolving
      if (!populated) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          rawData = this.parseRaw(content);
        } catch (err) {
          console.warn('Could not read raw file, using resolved data');
        }
      }

      let finalData = {};

  

      // Process all branches
      for (const [branchName, branchData] of Object.entries(rawData)) {

           if ((typeof branchData !== 'object'  )|| branchData === null) {
           // top-level variables (without hyphen)
          finalData[branchName] = branchData;
        //   continue
        }
        if (typeof branchData !== 'object' || branchData === null || Array.isArray(branchData)) {
          continue; // Skip non-section entries
        }

        const isActiveBranch = branchName === branch;
        const sectionKey = isActiveBranch ? `[${branchName}]` : `[-${branchName}]`;

        finalData[sectionKey] = {};

        for (const [key, value] of Object.entries(branchData)) {
          // Add hyphen prefix to keys in inactive branches
          const keyPrefix = !isActiveBranch ? '-' : '';
          finalData[sectionKey][`${keyPrefix}${key}`] = value;
        }
      }

      // Prepare write data with merge support
      let writeData = finalData;
      
      if (flags.includes('a')) {
        let existingData = {};
        
        if (fs.existsSync(fullPath)) {
          const existingContent = fs.readFileSync(fullPath, 'utf-8');
          existingData = this.parseForWrite(existingContent);
        }

        if (!flags.includes('o')) {
          // New first
          writeData = this.mergeDeep(finalData, existingData);
        } else {
          // Old first
          writeData = this.mergeDeep(existingData, finalData);
        }
      }

      // Build content string
      let content = '';

    

      // Write sections
      for (const [key, value] of Object.entries(writeData)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        //   content += `\n${key}\n{\n`;
          content += `\n${key}\n`;
          for (const [sectionKey, sectionValue] of Object.entries(value)) {
            const finalValue = this.formatValue(sectionValue);
            content += `${sectionKey}=${finalValue}\n`;
          }
          content += `@end\n`;
        }else     if (typeof value !== 'object' || value === null) {
            // no branch
          const finalValue = this.formatValue(value);
          content += `${key}=${finalValue}\n`;
        }
      }

      fs.writeFileSync(fullPath, content, 'utf-8');
      console.log(`Switched branch to "${branch}" in ${fullPath}`);
      return true;
    } catch (err) {
      console.error(`Error switching branch: ${err.message}`);
      return false;
    }
  }

  /**
   * Write config data back to file
   * flags: a=append, r=rewrite, o=old first, n=new first
   */
  write({ writeObj, configPath = '.env', flags = 'r' }) {
    try {
      const fullPath = path.isAbsolute(configPath) 
        ? configPath 
        : path.resolve(process.cwd(), configPath);

      let finalData = writeObj;

      

      // Parse flags
      const hasAppend = flags.includes('a');
      const oldFirst = flags.includes('o');

      // If append flag is set, merge with existing data
      if (hasAppend) {
        let existingData = {};
        
        if (fs.existsSync(fullPath)) {
          const existingContent = fs.readFileSync(fullPath, 'utf-8');
          existingData = this.parse(existingContent);
        
        }

        if (!oldFirst) {
        
          // New first: {...new, ...existing}
          finalData = this.mergeDeep( existingData,writeObj);
        } else {
          
          // Old first: {...existing, ...new}
          finalData = this.mergeDeep(writeObj,existingData);
        }
      }
   
      finalData = this.rerefrence({data:finalData})
    
      // Build content string
      let content = '';

      // Write top-level variables
    //   for (const [key, value] of Object.entries(finalData)) {
       
    //   }

      // Write sections
      for (const [key, value] of Object.entries(finalData)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        //   content += `\n[${key}]\n{\n`;
          content += `\n[${key}]\n`;
          for (const [sectionKey, sectionValue] of Object.entries(value)) {
            content += `${sectionKey}=${this.formatValue(sectionValue)}\n`;
          }
        //   content += `}\n`;
          content += `@end\n`;
        }else  if (typeof value !== 'object' || value === null) {
          content += `${key}=${this.formatValue(value)}\n`;
        }
      }

      fs.writeFileSync(fullPath, content, 'utf-8');
      console.log(`Config written to ${fullPath}`);
      return true;
    } catch (err) {
      console.error(`Error writing config: ${err.message}`);
      return false;
    }
  }

  /**
   * Parse raw config without resolving references (word for word)
   */
  parseRaw(content) {
    const result = {};
    let currentSection = null;
    let currentData = {};
    let sectionBraced = false;
    const lines = content.split('\n');

    let i = 0;
    while (i < lines.length) {
      let line = lines[i].trim();
      i++;

      // Skip empty lines and comments
      if (!line || line.startsWith('--') || line.startsWith('#')) continue;

      // Handle opening brace
      if (line === '{') {
        sectionBraced = true;
        continue;
      }

      // Handle closing brace
      if (line === '}' || line=="@end" ||line==="---") {
        if (currentSection) {
          result[currentSection] = currentData;
        }
        currentSection = null;
        currentData = {};
        sectionBraced = false;
        continue;
      }

      // Handle sections (strip hyphen for internal storage)
      const sectionMatch = line.match(/^\[(-?)([\w.]+)\]$/);
      if (sectionMatch) {
        if (currentSection && !sectionBraced) {
          result[currentSection] = currentData;
        }
        currentSection = sectionMatch[2];
        currentData = {};
        sectionBraced = false;
        continue;
      }

      // If no section yet, add to result as top-level (don't strip quotes)
      if (!currentSection) {
        const [key, ...valueParts] = line.split('=');
        if (key) {
          const trimmedKey = key.trim();
          const value = valueParts.join('=').trim();
          result[trimmedKey] = value;
        }
        continue;
      }

      // Parse key=value pairs in sections (strip hyphen from key, keep quotes in value)
      const [key, ...valueParts] = line.split('=');
      if (key) {
        const trimmedKey = key.trim();
        const cleanKey = trimmedKey.startsWith('-') ? trimmedKey.slice(1) : trimmedKey;
        const value = valueParts.length > 0 ? valueParts.join('=').trim() : cleanKey;
        currentData[cleanKey] = value;
      }
    }

    if (currentSection && !sectionBraced) {
      result[currentSection] = currentData;
    }

    return result;
  }





  /**
   * Format value: if starts with {, keep as-is; otherwise wrap in quotes
   */
  formatValue(value) {
    const strValue = String(value);
    if (strValue.startsWith('{')) {
      return strValue;
    }
    // Add quotes if not already quoted
    if (!strValue.startsWith('"') && !strValue.startsWith("'")) {
      return `"${strValue}"`;
    }
    return strValue;
  }


 isSubset(big, small) {
  for (const [k, v] of Object.entries(small)) {
    if (big[k] !== v) return false;
  }
  return true;
}


 resolveGlobalRefs(obj, globalObj,key) {
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    let found = false;

    // Check top-level globals
    for (const gKey of Object.keys(globalObj)) {
        if(key ===gKey){
            continue
        }
      const gVal = globalObj[gKey];
      if (v === gVal) {
        result[k] = `{${gKey}}`;
        found = true;
        break;
      }

      // If nested object, check each section
      if (gVal && typeof gVal === "object") {
        for (const [sKey, sVal] of Object.entries(gVal)) {
          if (v === sVal) {
            result[k] = `{${gKey}.${sKey}}`;
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }

    if (!found) {
      result[k] = v; // keep original
    }
  }
  return result;
}

  /**
   * Deep merge two objects
   */

  mergeDeep(target, source,reference=false) {
    const result = { ...target };
  

    for (const [key, value] of Object.entries(source)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) {
         let obj  = { ...result[key], ...value };

    

          result[key] =obj

        } else {
          result[key] = value;
        }
      } else {
        result[key] = value;
      }
    }
    
  
   return  result;
  }


  rerefrence({data:result}){

        const sortedResultdata = {}
    const realdata = {}
    const realdata_ = {}
    const entries = Object.entries(result);
    if(true){
        

for (let i = 0; i < entries.length; i++) {
  const [key, value] = entries[i];

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    realdata[key] = value;
    continue;
  }

  let bestMatchKey = null;
  let bestMatchCount = 0;

  const prevEntries = entries.slice(0, i);

  for (const [otherKey, otherValue] of prevEntries) {
    if (
      otherValue &&
      typeof otherValue === "object" &&
      !Array.isArray(otherValue)
    ) {
      if (this.isSubset(value, otherValue)) {
        const count = Object.keys(otherValue).length;
        if (count > bestMatchCount) {
          bestMatchCount = count;
          bestMatchKey = otherKey;
        }
      }
    }
  }

  if (bestMatchKey) {
    // remove fields from the included object
    const remaining = { ...value };
    for (const k of Object.keys(result[bestMatchKey])) {
      delete remaining[k];
    }

    // resolve remaining fields to global references if applicable
    const resolved = this.resolveGlobalRefs(remaining, Object.fromEntries(prevEntries),key);

    realdata[key] = {
      ...resolved,
      inherit: `{${bestMatchKey}}`,
    };
  } else {
    // resolve all fields if no include
    realdata[key] = this.resolveGlobalRefs(value, Object.fromEntries(prevEntries),key);
  }
}


}


return realdata

  }



  /**
   * Parse file content for write operations (preserves section structure with hyphens)
   */
  parseForWrite(content) {
    const result = {};
    let currentSection = null;
    const lines = content.split('\n');

    let i = 0;
    while (i < lines.length) {
      let line = lines[i].trim();
      i++;

      if (!line || line.startsWith('--') || line.startsWith('#')) continue;

      if (line === '{' || line === '}' || line==="@end" ||line==="---") continue;

      // Handle sections (preserves the bracketed format with hyphens)
      const sectionMatch = line.match(/^\[(-?[\w.]+)\]$/);
      if (sectionMatch) {
        currentSection = sectionMatch[1];
        result[currentSection] = {};
        continue;
      }

      if (!currentSection) {
        const [key, ...valueParts] = line.split('=');
        if (key) {
          const trimmedKey = key.trim();
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          result[trimmedKey] = value;
        }
        continue;
      }

      const [key, ...valueParts] = line.split('=');
      if (key) {
        const trimmedKey = key.trim();
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        result[currentSection][trimmedKey] = value;
      }
    }

    return result;
  }

  /**
   * Parse plain .env file into key-value pairs
   */
  parseEnvFile(filePath) {
    if (this.cache[filePath]) return this.cache[filePath];

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const env = {};
      
      content.split('\n').forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return;
        
        const [key, ...valueParts] = line.split('=');
        if (key) {
          env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      });
      
      this.cache[filePath] = env;
      return env;
    } catch (err) {
      console.warn(`Could not read env file: ${filePath}`);
      return {};
    }
  }

  /**
   * Parse the Xavren config format
   */

  parse(content, baseDir = process.cwd()) {
    const result = {};
    let currentSection = null;
    let currentData = {};
    let sectionBraced = false;
    const lines = content.split('\n');

    let i = 0;
    while (i < lines.length) {
      let line = lines[i].trim();
      i++;

      // Skip empty lines and comments
      if (!line || line.startsWith('--') || line.startsWith('#')) continue;

      // Handle opening brace for section
      if (line === '{') {
        sectionBraced = true;
        continue;
      }

      // Handle closing brace for section
      if (line === '}' || line==="@end"||line==="---") {
        if (currentSection) {
          result[currentSection] = this.resolveValues(
            currentData,
            result,
            baseDir
          );
        }
        currentSection = null;
        currentData = {};
        sectionBraced = false;
        continue;
      }

      // Handle sections (including dots in section names, with optional hyphen prefix)
      const sectionMatch = line.match(/^\[(-?)([\w.]+)\]$/);
      if (sectionMatch) {
        if (currentSection) {
          result[currentSection] = this.resolveValues(
            currentData,
            result,
            baseDir
          );
        }
        // Remove the hyphen when storing section name internally
        currentSection = sectionMatch[2];
        currentData = {};
        sectionBraced = false;
        continue;
      }

      // If no section yet, add to result as top-level
      if (!currentSection) {
        const [key, ...valueParts] = line.split('=');
        if (key) {
          const trimmedKey = key.trim();
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          result[trimmedKey] = value;
        }
        continue;
      }

      // Parse key=value pairs in sections
      const [key, ...valueParts] = line.split('=');
      if (key) {
        const trimmedKey = key.trim();
        // Remove leading hyphen from key if present
        const cleanKey = trimmedKey.startsWith('-') ? trimmedKey.slice(1) : trimmedKey;
        const value = valueParts.length > 0 ? valueParts.join('=').trim() : cleanKey;
        currentData[cleanKey] = value;
      }
    }

    // Don't forget the last section if not braced
    if (currentSection && !sectionBraced) {
      result[currentSection] = this.resolveValues(currentData, result, baseDir);
    }

    return result;
  }

  /**
   * Resolve values including references and inheritance
   */
  resolveValues(data, context, baseDir) {
    const resolved = {};
    const visited = new Set();

    const resolve = (key, value, depth = 0) => {
      if (depth > 10) {
        console.warn(`Circular reference detected for key: ${key}`);
        return value;
      }

      if (visited.has(key)) return value;
      visited.add(key);

      // Handle include/inherit - MUST use {} notation
      if (key === 'include' || key === 'inherit') {
        const braceMatch = value.match(/^\{(.+)\}$/);
        
        if (!braceMatch) {
          // Without {}, it's treated as a regular env variable
          return value;
        }
        
        const innerValue = braceMatch[1].replace(/^["']|["']$/g, '');
        
        // If it's for include, it's a file path
        if (key === 'include') {
          const envPath = this.resolvePath(innerValue, baseDir);
          return this.parseEnvFile(envPath);
        }
        
        // For inherit, it's a section reference
        if (key === 'inherit') {
          const [section] = innerValue.split('.');
          if (context[section]) {
            return context[section];
          }
          return {};
        }
      }

      // Handle reference like {global.skyline} or {section.key} or {project}
      if (typeof value === 'string' && value.match(/^\{[\w.]+\}$/)) {
        const refMatch = value.match(/^\{([\w.]+)\}$/);
        if (refMatch) {
          const refPath = refMatch[1];
          const [section, refKey] = refPath.split('.');
          
          // If it's a section.key reference
          if (refKey && context[section] && context[section][refKey]) {
            return resolve(key, context[section][refKey], depth + 1);
          }
          
          // If it's just a section reference
          if (!refKey) {
            // First check if section exists as a branch
            if (context[section] && typeof context[section] === 'object') {
              return context[section];
            }
            
            // Fallback: check if section exists as top-level variable
            if (context[section] && typeof context[section] !== 'object') {
              return context[section];
            }
          }
        }
        return value;
      }

      // Remove quotes from string values
      if (typeof value === 'string') {
        return value.replace(/^["']|["']$/g, '');
      }

      return value;
    };

    for (const [key, value] of Object.entries(data) as any) {
      // Check if value uses {} (command notation)
      const isCommand = value.match(/^\{.+\}$/);
      
      if (isCommand) {
        const resolved_value = resolve(key, value);
        
        // Only merge if it was actually resolved as a command
        if ((key === 'include' || key === 'inherit') && typeof resolved_value === 'object') {
          Object.assign(resolved, resolved_value);
        } else {
          resolved[key] = resolved_value;
        }
      } else {
        // No {}, treat as regular env variable
        resolved[key] = value.replace(/^["']|["']$/g, '');
      }
    }

    return resolved;
  }

  /**
   * Resolve file path relative to baseDir
   */
  resolvePath(filePath, baseDir) {
    if (path.isAbsolute(filePath)) return filePath;
    return path.resolve(baseDir, filePath);
  }


updateXavLock(obj: Record<string, string>,env) {
      if(!this._configData){

    this.load(env)
  }

  
  const formerLock = this._configData["xavlock"] || {};
  // console.log(formerLock)
  const entries = Object.entries(obj);
console.log(entries)
  for (const [key, value] of entries) {
    
    // Check if already locked: key ends with @lock(...)
    const isLocked = /@lock\(.+\)$/.test(key);
    if (isLocked) {
      // Already locked, do not lock again
      formerLock[key] = value;
      continue;
    }

    // Not locked → lock it
    // console.log("Locking key:", value);
    const safeValue = value?.toString()?.replaceAll("=", "_");
    const newKey = `${key}@lock(${safeValue})`;

    formerLock[newKey] = value;
  }

  this._configData["xavlock"] = formerLock;

  this.write({flags:"an",writeObj:{"xavlock":formerLock,},configPath:env})
  return formerLock;
}


getXavLock(env) {
    if(!this._configData){

    this.load(env)
  }
  const locked = this._configData["xavlock"] || {};
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(locked)) {
    // Remove the @lock(...) part
    const originalKey = key.replace(/@lock\(.+\)$/, "");
    result[originalKey] = value as string;
  }

  return result;
}
lockExist(key_,value_,env) {
    if(!this._configData){

    this.load(env)
  }
  const locked = this._configData["xavlock"] || {};
  let result = false;

  for (const [key, value] of Object.entries(locked)) {
    // Remove the @lock(...) part
    const originalKey = key.replace(/@lock\(.+\)$/, "");
    // result[originalKey] = value as string;
    if(originalKey == key_ && value == value_){
      result=true
      break
    }

  }

  return result;
}


}