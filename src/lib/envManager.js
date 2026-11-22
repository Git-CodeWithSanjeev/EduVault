import fs from 'fs';
import path from 'path';

const ENV_PATH = path.resolve(process.cwd(), '.env');

/**
 * Reads all environment variables from .env as a clean key-value object
 */
export function readEnvConfig() {
  const config = {};
  if (!fs.existsSync(ENV_PATH)) {
    return config;
  }

  try {
    const content = fs.readFileSync(ENV_PATH, 'utf-8');
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const firstEquals = trimmed.indexOf('=');
        const key = trimmed.slice(0, firstEquals).trim();
        let val = trimmed.slice(firstEquals + 1).trim();

        // Strip outer quotes if any
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }

        config[key] = val;
      }
    }
  } catch (err) {
    console.error('[EnvManager Read Error]:', err.message);
  }

  return config;
}

/**
 * Updates or adds keys in .env preserving comments and formatting
 */
export function updateEnvConfig(updates = {}) {
  let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf-8') : '';
  const lines = content.split(/\r?\n/);
  const updatedKeys = new Set();

  const newLines = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const firstEquals = trimmed.indexOf('=');
      const key = trimmed.slice(0, firstEquals).trim();

      if (key in updates) {
        updatedKeys.add(key);
        const val = updates[key];
        process.env[key] = val; // hot-reload into process.env
        // Quote value if it contains spaces
        const formattedVal = val.includes(' ') && !val.startsWith('"') ? `"${val}"` : val;
        return `${key}=${formattedVal}`;
      }
    }
    return line;
  });

  // Append any brand new keys
  for (const [key, val] of Object.entries(updates)) {
    if (!updatedKeys.has(key)) {
      process.env[key] = val;
      const formattedVal = val.includes(' ') && !val.startsWith('"') ? `"${val}"` : val;
      newLines.push(`${key}=${formattedVal}`);
    }
  }

  fs.writeFileSync(ENV_PATH, newLines.join('\n'), 'utf-8');
  return readEnvConfig();
}
