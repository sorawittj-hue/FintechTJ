/**
 * Environment Security Utilities
 * 
 * Provides secure access to environment variables and validates
 * that no sensitive keys are exposed to the client.
 */

// ============================================================================
// Security Audit
// ============================================================================

/**
 * List of environment variable prefixes that should NEVER be in client code
 */
const SENSITIVE_PREFIXES = [
  'SECRET_',
  'PRIVATE_',
  'DATABASE_',
  'DB_',
  'CREDENTIAL',
  'PASSWORD',
  'TOKEN',
  'API_KEY', // Without VITE_ prefix
];

/**
 * Check if an environment variable might be sensitive
 */
export function isSensitiveKey(key: string): boolean {
  // Any key without VITE_ prefix that looks like a secret
  if (!key.startsWith('VITE_')) {
    return SENSITIVE_PREFIXES.some(prefix => 
      key.toUpperCase().includes(prefix)
    );
  }
  return false;
}

/**
 * Audit current environment for exposed secrets
 * Call this during development to catch accidental leaks
 */
export function auditEnvironment(): {
  safe: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check for common sensitive patterns in import.meta.env
  const envKeys = Object.keys(import.meta.env);
  
  for (const key of envKeys) {
    if (key.startsWith('VITE_')) continue; // Intentionally exposed
    
    // Check if sensitive key is accidentally exposed
    if (isSensitiveKey(key.replace('VITE_', ''))) {
      errors.push(`Sensitive key "${key}" may be exposed to client!`);
    }
  }

  // Check for common misconfigurations
  const sensitivePatterns = [
    { pattern: /sk-[a-zA-Z0-9]{48}/, name: 'OpenAI API key' },
    { pattern: /AIza[a-zA-Z0-9]{35}/, name: 'Google API key' },
    { pattern: /ghp_[a-zA-Z0-9]{36}/, name: 'GitHub token' },
    { pattern: /eyJ[a-zA-Z0-9_-]{20,}/, name: 'JWT token' },
  ];

  for (const key of envKeys) {
    const value = import.meta.env[key];
    if (!value) continue;

    for (const { pattern, name } of sensitivePatterns) {
      if (pattern.test(value)) {
        errors.push(`${name} detected in "${key}" - DO NOT expose to client!`);
      }
    }
  }

  return {
    safe: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Log security audit results (development only)
 */
export function logSecurityAudit(): void {
  if (!import.meta.env.DEV) return;

  const audit = auditEnvironment();
  
  if (audit.safe) {
    console.log('✅ Environment security audit passed');
  } else {
    console.error('❌ Environment security audit FAILED:');
    for (const error of audit.errors) {
      console.error(`   - ${error}`);
    }
  }
  
  for (const warning of audit.warnings) {
    console.warn(`⚠️ ${warning}`);
  }
}

// ============================================================================
// Secure Config Access
// ============================================================================

/**
 * Get a safe environment variable (client-side only)
 * Returns empty string if key looks sensitive
 */
export function getSafeEnv(key: string): string {
  const fullKey = key.startsWith('VITE_') ? key : `VITE_${key}`;
  const value = import.meta.env[fullKey] || '';
  
  // Extra check: don't return if value looks like a secret
  if (value && isSensitiveKey(key)) {
    console.warn(`[Security] Blocked access to potentially sensitive env var: ${key}`);
    return '';
  }
  
  return value;
}

/**
 * Get required environment variable (throws if missing)
 */
export function getRequiredEnv(key: string): string {
  const value = getSafeEnv(key);
  if (!value) {
    throw new Error(`Required environment variable VITE_${key} is not set`);
  }
  return value;
}

// ============================================================================
// Runtime Security Checks
// ============================================================================

/**
 * Check if running in a secure context (HTTPS or localhost)
 */
export function isSecureContext(): boolean {
  if (typeof window === 'undefined') return true;
  
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  return protocol === 'https:' || 
         hostname === 'localhost' || 
         hostname === '127.0.0.1';
}

/**
 * Check for development-only features that should be disabled in production
 */
export function validateProductionReadiness(): {
  ready: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check debug mode
  if (import.meta.env.VITE_DEBUG === 'true' && import.meta.env.PROD) {
    issues.push('Debug mode is enabled in production');
  }

  // Check for mock data
  if (import.meta.env.VITE_USE_MOCK === 'true' && import.meta.env.PROD) {
    issues.push('Mock data is enabled in production');
  }

  // Check secure context
  if (!isSecureContext() && import.meta.env.PROD) {
    issues.push('Application is not running in secure context (HTTPS)');
  }

  return {
    ready: issues.length === 0,
    issues,
  };
}

// ============================================================================
// Type-safe Environment Variables
// ============================================================================

/**
 * Define required environment variables for type safety
 */
export const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const;

/**
 * Validate all required environment variables are set
 */
export function validateRequiredEnvVars(): {
  valid: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  for (const key of requiredEnvVars) {
    const value = import.meta.env[key];
    if (!value) {
      missing.push(key);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
