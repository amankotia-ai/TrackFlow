#!/usr/bin/env node

/**
 * Edge Function Manual Deployment Helper
 * 
 * This script helps users deploy the UTM tracking edge function to Supabase
 * by generating the code that can be pasted into the Supabase Edge Functions dashboard.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Path to the edge function
const edgeFunctionPath = path.join(__dirname, '..', 'supabase', 'functions', 'utm-tracking', 'index.ts');

// Check if the edge function exists
if (!fs.existsSync(edgeFunctionPath)) {
  console.error(`${colors.red}Error: Edge function not found at ${edgeFunctionPath}${colors.reset}`);
  process.exit(1);
}

// Read the edge function code
const edgeFunctionCode = fs.readFileSync(edgeFunctionPath, 'utf-8');

// Get Supabase project information if available
let supabaseProjectId = 'your-project-id';
let supabaseProjectUrl = null;

try {
  // Try to get Supabase URL from environment variables
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const supabaseUrlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(https:\/\/[^.]+\.supabase\.co)/);
    if (supabaseUrlMatch && supabaseUrlMatch[1]) {
      supabaseProjectUrl = supabaseUrlMatch[1];
      const projectIdMatch = supabaseProjectUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
      if (projectIdMatch && projectIdMatch[1]) {
        supabaseProjectId = projectIdMatch[1];
      }
    }
  }
} catch (error) {
  console.warn(`${colors.yellow}Warning: Could not extract Supabase project information from .env.local${colors.reset}`);
}

// Generate a temporary file with the formatted code
const tempFilePath = path.join(__dirname, 'utm-tracking-edge-function.ts');
fs.writeFileSync(tempFilePath, edgeFunctionCode);

console.log(`
${colors.bright}${colors.green}=== UTM Tracking Edge Function Deployment Helper ===${colors.reset}

This script will help you manually deploy the UTM tracking edge function to your Supabase project.

${colors.bright}Step 1:${colors.reset} Log in to your Supabase dashboard
  • Visit ${colors.cyan}https://app.supabase.com/${colors.reset}
  • Select your project

${colors.bright}Step 2:${colors.reset} Navigate to Edge Functions in the left sidebar
  • Click on ${colors.cyan}"Edge Functions"${colors.reset}
  • Click ${colors.cyan}"Create a new function"${colors.reset}

${colors.bright}Step 3:${colors.reset} Configure your function
  • Name: ${colors.cyan}utm-tracking${colors.reset}
  • Enter the following code:

${colors.bright}${colors.magenta}==================== COPY CODE BELOW THIS LINE ====================${colors.reset}

${edgeFunctionCode}

${colors.bright}${colors.magenta}==================== COPY CODE ABOVE THIS LINE ====================${colors.reset}

${colors.bright}Step 4:${colors.reset} Deploy the function
  • Click ${colors.cyan}"Deploy function"${colors.reset}

${colors.bright}Step 5:${colors.reset} Update your application with the correct project ID
  • Your Supabase project ID: ${colors.cyan}${supabaseProjectId}${colors.reset}
  • Edge function URL will be: ${colors.cyan}https://${supabaseProjectId}.supabase.co/functions/v1/utm-tracking${colors.reset}

${colors.bright}${colors.green}=== Need more help? ===${colors.reset}
  For more detailed instructions, check the documentation at:
  ${colors.cyan}JOURNEY_HEATMAP_SETUP.md${colors.reset}
`);

// Clean up the temporary file
fs.unlinkSync(tempFilePath);

console.log(`
${colors.bright}Would you like to test the edge function URL?${colors.reset}
Once deployed, you can visit this URL in your browser:
${colors.cyan}http://localhost:3000/analytics/test-tracking${colors.reset}

This will let you test sending events directly to your edge function.
`);

// Make the script executable
try {
  execSync(`chmod +x ${__filename}`);
} catch (error) {
  // Ignore error on Windows
} 