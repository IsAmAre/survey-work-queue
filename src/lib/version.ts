/**
 * Version information for the Survey Work Queue application
 * This file is auto-generated during build process
 * DO NOT EDIT MANUALLY - changes will be overwritten
 */

// Version from package.json
export const APP_VERSION = '0.2.0';

// Build information
export const BUILD_TIMESTAMP = '2025-08-30T06:00:59.946Z';
export const COMMIT_HASH = '8888f9e';
export const GIT_BRANCH = 'main';

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
  
  return `v${APP_VERSION}-${commitHash} (${buildDate})`;
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
