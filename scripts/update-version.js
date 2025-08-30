#!/usr/bin/env node

/**
 * Script to automatically update version info before build
 * This script updates the version.ts file with current package.json version
 * and git information for deployment tracking
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getGitCommitHash() {
  try {
    // Get short commit hash
    const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    return hash;
  } catch (error) {
    console.log('Git not available, using fallback commit hash');
    return 'unknown';
  }
}

function getGitBranch() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    return branch;
  } catch (error) {
    return 'unknown';
  }
}

function updateVersionFile() {
  try {
    // Read package.json to get current version
    const packageJsonPath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const version = packageJson.version;

    // Get git info
    const commitHash = getGitCommitHash();
    const branch = getGitBranch();
    const buildTimestamp = new Date().toISOString();

    // Create updated version.ts content
    const versionFileContent = `/**
 * Version information for the Survey Work Queue application
 * This file is auto-generated during build process
 * DO NOT EDIT MANUALLY - changes will be overwritten
 */

// Version from package.json
export const APP_VERSION = '${version}';

// Build information
export const BUILD_TIMESTAMP = '${buildTimestamp}';
export const COMMIT_HASH = '${commitHash}';
export const GIT_BRANCH = '${branch}';

/**
 * Get the current git commit hash (short version)
 */
export function getCommitHash(): string {
  // Use Vercel environment variables if available, fallback to build-time values
  if (typeof window === 'undefined') {
    return process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || COMMIT_HASH;
  }
  return COMMIT_HASH;
}

/**
 * Get formatted version string
 * Format: v{version}-{commit_hash} ({date})
 */
export function getVersionString(): string {
  const commitHash = getCommitHash();
  const buildDate = new Date(BUILD_TIMESTAMP).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return \`v\${APP_VERSION}-\${commitHash} (\${buildDate})\`;
}

/**
 * Get detailed version info
 */
export function getVersionInfo() {
  return {
    version: APP_VERSION,
    commitHash: getCommitHash(),
    buildTimestamp: BUILD_TIMESTAMP,
    buildDate: new Date(BUILD_TIMESTAMP).toLocaleDateString('th-TH'),
    gitBranch: GIT_BRANCH,
    environment: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isVercel: !!process.env.VERCEL,
    vercelUrl: process.env.VERCEL_URL || null
  };
}

/**
 * Version component data for UI display
 */
export const VERSION_INFO = {
  app: APP_VERSION,
  build: BUILD_TIMESTAMP,
  commit: COMMIT_HASH,
  formatted: getVersionString()
};
`;

    // Write updated version.ts file
    const versionFilePath = path.join(__dirname, '../src/lib/version.ts');
    fs.writeFileSync(versionFilePath, versionFileContent, 'utf8');

    console.log(`✅ Version updated successfully:`);
    console.log(`   Version: ${version}`);
    console.log(`   Commit: ${commitHash}`);
    console.log(`   Branch: ${branch}`);
    console.log(`   Build Time: ${buildTimestamp}`);
    
  } catch (error) {
    console.error('❌ Error updating version file:', error.message);
    process.exit(1);
  }
}

// Run the update
updateVersionFile();