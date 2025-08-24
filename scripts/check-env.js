#!/usr/bin/env node
/*
  Environment validator using Zod.
  Fails with non-zero exit if required vars are missing or invalid.
*/

// This script uses CommonJS since it needs to run in Node directly
// without TypeScript compilation
const { execSync } = require('child_process');
const path = require('path');

function main() {
  try {
    // Run the TypeScript validator using ts-node
    const result = execSync(
      'npx ts-node -e "import { validateEnv } from \'../src/lib/env\'; validateEnv();"',
      {
        cwd: path.resolve(__dirname),
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );
    
    console.log('[check-env] ✅ Environment validation successful');
    return 0;
  } catch (error) {
    // The error output from the validation is already printed by the ts-node process
    return 1;
  }
}

process.exit(main());