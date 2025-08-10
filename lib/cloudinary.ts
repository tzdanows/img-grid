// Cloudinary API integration utility
export interface CloudinaryConfig {
  cloudName: string;
  apiKey?: string;
  apiSecret?: string;
}

export interface CloudinaryImage {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
}

export interface CloudinaryListResponse {
  resources: CloudinaryImage[];
  next_cursor?: string;
}

export class CloudinaryClient {
  private config: CloudinaryConfig;
  private baseUrl: string;

  constructor(config: CloudinaryConfig) {
    this.config = config;
    this.baseUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}`;
  }

  /**
   * Get images from a specific folder
   */
  async getImagesByFolder(folder: string, maxResults = 50): Promise<CloudinaryImage[]> {
    if (!this.config.apiKey || !this.config.apiSecret) {
      console.warn("Cloudinary API credentials not provided, using mock data");
      return this.getMockImages(folder, maxResults);
    }

    try {
      const url = `${this.baseUrl}/resources/image`;
      const params = new URLSearchParams({
        type: 'upload',
        prefix: folder,
        max_results: maxResults.toString(),
        resource_type: 'image'
      });

      const response = await fetch(`${url}?${params}`, {
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.apiKey}:${this.config.apiSecret}`)}`
        }
      });

      if (!response.ok) {
        throw new Error(`Cloudinary API error: ${response.status} ${response.statusText}`);
      }

      const data: CloudinaryListResponse = await response.json();
      return data.resources;
    } catch (error) {
      console.error("Error fetching from Cloudinary API:", error);
      return this.getMockImages(folder, maxResults);
    }
  }

  /**
   * Get images by tag
   */
  async getImagesByTag(tag: string, maxResults = 50): Promise<CloudinaryImage[]> {
    if (!this.config.apiKey || !this.config.apiSecret) {
      console.warn("Cloudinary API credentials not provided, using mock data");
      return this.getMockImages(tag, maxResults);
    }

    try {
      const url = `${this.baseUrl}/resources/image/tags/${tag}`;
      const params = new URLSearchParams({
        max_results: maxResults.toString(),
        resource_type: 'image'
      });

      const response = await fetch(`${url}?${params}`, {
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.apiKey}:${this.config.apiSecret}`)}`
        }
      });

      if (!response.ok) {
        throw new Error(`Cloudinary API error: ${response.status} ${response.statusText}`);
      }

      const data: CloudinaryListResponse = await response.json();
      return data.resources;
    } catch (error) {
      console.error("Error fetching from Cloudinary API:", error);
      return this.getMockImages(tag, maxResults);
    }
  }

  /**
   * Test Cloudinary connection
   */
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    if (!this.config.apiKey || !this.config.apiSecret) {
      return {
        success: false,
        message: "API credentials not provided"
      };
    }

    try {
      const url = `${this.baseUrl}/resources/image`;
      const params = new URLSearchParams({
        max_results: '1',
        resource_type: 'image'
      });

      const response = await fetch(`${url}?${params}`, {
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.apiKey}:${this.config.apiSecret}`)}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          message: `API error: ${response.status} ${response.statusText}`,
          details: errorText
        };
      }

      const data = await response.json();
      return {
        success: true,
        message: `Connected successfully! Found ${data.resources?.length || 0} images in account`,
        details: data
      };
    } catch (error) {
      return {
        success: false,
        message: `Network error: ${error instanceof Error ? error.message : String(error)}`,
        details: error
      };
    }
  }

  /**
   * Generate optimized image URL with transformations
   */
  getOptimizedUrl(publicId: string, options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
  } = {}): string {
    const {
      width = 800,
      height = 600,
      crop = 'fill',
      quality = 'auto',
      format = 'auto'
    } = options;

    const transformations = [
      width && `w_${width}`,
      height && `h_${height}`,
      crop && `c_${crop}`,
      quality && `q_${quality}`,
      format && `f_${format}`
    ].filter(Boolean).join(',');

    return `https://res.cloudinary.com/${this.config.cloudName}/image/upload/${transformations}/${publicId}`;
  }

  /**
   * Mock data for development/testing
   */
  private getMockImages(folder: string, count: number): CloudinaryImage[] {
    console.log(`📷 Using mock images for ${folder} tag (API authentication failed)`);
    const images: CloudinaryImage[] = [];
    
    for (let i = 1; i <= count; i++) {
      const colors = ['6366f1', '8b5cf6', '06b6d4', '10b981', 'ef4444', 'f59e0b'];
      const color = colors[(i - 1) % colors.length];
      
      // Use placeholder URLs directly instead of trying to generate Cloudinary URLs
      const placeholderUrl = `https://via.placeholder.com/800x600/${color}/ffffff?text=${encodeURIComponent(folder.toUpperCase())}+${i}`;
      
      images.push({
        public_id: `mock_${folder}_${i.toString().padStart(2, '0')}`,
        secure_url: placeholderUrl,
        width: 800,
        height: 600,
        format: 'jpg',
        resource_type: 'image',
        created_at: new Date().toISOString(),
        bytes: 150000 + Math.floor(Math.random() * 100000)
      });
    }
    
    return images;
  }
}

// Export function to get cloudinary instance with current environment
export function getCloudinary(): CloudinaryClient {
  return new CloudinaryClient({
    cloudName: Deno.env.get('CLOUDINARY_CLOUD_NAME') || 'demo-cloud',
    apiKey: Deno.env.get('CLOUDINARY_API_KEY'),
    apiSecret: Deno.env.get('CLOUDINARY_API_SECRET')
  });
}

// Export default instance with environment configuration (kept for compatibility)
export const cloudinary = getCloudinary();

// Utility functions
export function generateResponsiveImageSet(publicId: string, baseWidth = 800): string {
  const client = getCloudinary(); // Get fresh instance
  const sizes = [400, 600, 800, 1200];
  
  return sizes.map(width => {
    const height = Math.round(width * 0.75); // 4:3 aspect ratio
    const url = client.getOptimizedUrl(publicId, { width, height });
    return `${url} ${width}w`;
  }).join(', ');
}

export function getImageSizes(): string {
  return "(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw";
}