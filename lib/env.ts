// Simple .env file loader for Deno
export function loadEnv(filePath = ".env"): void {
  try {
    const env = Deno.readTextFileSync(filePath);
    const lines = env.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip comments and empty lines
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }
      
      // Parse KEY=VALUE format
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        
        // Remove quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, '');
        
        // Set environment variable if not already set
        if (!Deno.env.get(key.trim())) {
          Deno.env.set(key.trim(), cleanValue);
        }
      }
    }
    
    console.log("✅ Environment variables loaded from .env");
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.log("ℹ️  No .env file found, using system environment variables");
    } else {
      console.error("❌ Error loading .env file:", error instanceof Error ? error.message : String(error));
    }
  }
}