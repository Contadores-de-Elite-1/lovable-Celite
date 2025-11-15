/**
 * Environment Variable Validation
 * Validates required environment variables at startup
 * Prevents deployment with missing configuration
 */

interface EnvConfig {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

/**
 * Get and validate environment variables
 */
export function validateEnv(): EnvConfig {
  const errors: string[] = [];

  // Required variables
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Validate Supabase URL
  if (!SUPABASE_URL) {
    errors.push('VITE_SUPABASE_URL is not defined');
  } else if (!SUPABASE_URL.startsWith('http')) {
    errors.push('VITE_SUPABASE_URL must be a valid URL');
  }

  // Validate Supabase Anon Key
  if (!SUPABASE_ANON_KEY) {
    errors.push('VITE_SUPABASE_ANON_KEY is not defined');
  } else if (SUPABASE_ANON_KEY.length < 100) {
    errors.push('VITE_SUPABASE_ANON_KEY appears invalid (too short)');
  }

  // Check for common mistakes
  if (SUPABASE_URL?.includes('localhost') && import.meta.env.PROD) {
    console.warn('[ENV] ⚠️  Warning: Using localhost Supabase URL in production build');
  }

  if (SUPABASE_ANON_KEY?.includes('example') || SUPABASE_ANON_KEY?.includes('your-')) {
    errors.push('VITE_SUPABASE_ANON_KEY appears to be a placeholder value');
  }

  // If errors, throw with helpful message
  if (errors.length > 0) {
    const errorMessage = [
      '❌ Environment Configuration Errors:',
      '',
      ...errors.map(e => `  • ${e}`),
      '',
      'Please check your .env file and ensure all required variables are set.',
      'See .env.example for reference.',
    ].join('\n');

    throw new Error(errorMessage);
  }

  // Log success in development
  if (import.meta.env.DEV) {
    console.log('[ENV] ✅ Environment variables validated');
    console.log('[ENV] 📍 Supabase URL:', SUPABASE_URL);
    console.log('[ENV] 🔑 Anon Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
  }

  return {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
  };
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV;
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return import.meta.env.PROD;
}

/**
 * Get current environment name
 */
export function getEnvironment(): 'development' | 'production' | 'test' {
  if (import.meta.env.DEV) return 'development';
  if (import.meta.env.PROD) return 'production';
  return 'test';
}

/**
 * Validate environment and return config
 * Call this at app startup
 */
export function initializeEnvironment(): EnvConfig {
  try {
    const config = validateEnv();

    console.log(`[ENV] 🚀 Running in ${getEnvironment()} mode`);

    return config;
  } catch (error) {
    console.error(error);

    // In production, show user-friendly error
    if (isProduction()) {
      document.body.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; font-family: system-ui;">
          <div style="max-width: 600px; text-align: center;">
            <h1 style="color: #dc2626; margin-bottom: 16px;">⚙️ Erro de Configuração</h1>
            <p style="color: #6b7280; margin-bottom: 24px;">
              O aplicativo não está configurado corretamente. Entre em contato com o suporte.
            </p>
            <a href="mailto:suporte@contadoresdeelite.com" style="color: #2563eb; text-decoration: none;">
              suporte@contadoresdeelite.com
            </a>
          </div>
        </div>
      `;
    }

    throw error;
  }
}

export default {
  validateEnv,
  initializeEnvironment,
  isDevelopment,
  isProduction,
  getEnvironment,
};
