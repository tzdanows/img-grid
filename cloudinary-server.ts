#!/usr/bin/env -S deno run -A

import { loadEnv } from "./lib/env.ts";
import { getCloudinary, type CloudinaryImage, generateResponsiveImageSet, getImageSizes } from "./lib/cloudinary.ts";

// Load environment variables from .env file
loadEnv();

// Cache for Cloudinary images with promise support for request coalescing
interface ImageCacheEntry {
  images: CloudinaryImage[];
  promise?: Promise<CloudinaryImage[]>;
  lastFetched: number;
  lastAccessed: number;
  count: number;
  sizeBytes: number;
}

interface ImageCache {
  [tag: string]: ImageCacheEntry;
}

const imageCache: ImageCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB max cache size
const MAX_CACHE_ENTRIES = 20; // Maximum number of gallery caches

// Track current cache size
let currentCacheSize = 0;

// Calculate approximate size of image metadata
function calculateImageDataSize(images: CloudinaryImage[]): number {
  // Rough estimate: ~1KB per image metadata object
  return images.length * 1024;
}

// Evict least recently used entries when cache is full
function evictLRUEntries(): void {
  const entries = Object.entries(imageCache);
  
  // Check if eviction is needed
  if (entries.length <= MAX_CACHE_ENTRIES && currentCacheSize <= MAX_CACHE_SIZE) {
    return;
  }
  
  // Sort by last accessed time (oldest first)
  entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
  
  // Evict entries until we're under limits
  while ((entries.length > MAX_CACHE_ENTRIES || currentCacheSize > MAX_CACHE_SIZE) && entries.length > 0) {
    const [tag, entry] = entries.shift()!;
    
    // Don't evict entries with active promises
    if (entry.promise) {
      continue;
    }
    
    console.log(`🗑️ Evicting cache for ${tag} (size: ${entry.sizeBytes} bytes, age: ${Math.round((Date.now() - entry.lastAccessed) / 1000)}s)`);
    currentCacheSize -= entry.sizeBytes;
    delete imageCache[tag];
  }
}

// Clean up expired cache entries
function cleanupExpiredEntries(): number {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [tag, entry] of Object.entries(imageCache)) {
    // Skip entries with active promises
    if (entry.promise) {
      continue;
    }
    
    // Remove expired entries
    if (now - entry.lastFetched > CACHE_DURATION) {
      console.log(`🧹 Removing expired cache for ${tag} (age: ${Math.round((now - entry.lastFetched) / 1000)}s)`);
      currentCacheSize -= entry.sizeBytes;
      delete imageCache[tag];
      cleaned++;
    }
  }
  
  return cleaned;
}

// Periodic cleanup interval (runs every minute)
let cleanupInterval: number | undefined;

function startPeriodicCleanup(): void {
  if (cleanupInterval) {
    return; // Already running
  }
  
  cleanupInterval = setInterval(() => {
    const cleaned = cleanupExpiredEntries();
    if (cleaned > 0) {
      console.log(`🧹 Periodic cleanup removed ${cleaned} expired entries`);
    }
  }, 60 * 1000); // Run every minute
}

// Security: Validate cache management API access
function validateCacheApiAccess(req: Request): boolean {
  const cacheApiKey = Deno.env.get('CACHE_API_KEY');
  
  // If no key is configured, deny access (secure by default)
  if (!cacheApiKey) {
    console.warn('⚠️ Cache API access denied: CACHE_API_KEY not configured');
    return false;
  }
  
  // Check Authorization header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const providedKey = authHeader.slice(7); // Remove 'Bearer ' prefix
  return providedKey === cacheApiKey;
}

// Content configuration interface
interface SiteContent {
  site: {
    title: string;
    description: string;
    owner: {
      name: string;
      bio: string;
      quote?: string;
      hobbies?: string[];
      social?: Record<string, string>;
    };
  };
  navigation: Array<{
    id: string;
    title: string;
    path: string;
    icon?: string;
  }>;
  galleries: Array<{
    id: string;
    title: string;
    description: string;
    cloudinaryTag: string;
    layout: string;
  }>;
  inspiration: {
    title: string;
    description: string;
    sections: Array<{
      title: string;
      items: Array<{
        title: string;
        url: string;
        type: string;
        description?: string;
      }>;
    }>;
  };
  theme: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    accentColor: string;
  };
}

// Load content configuration
async function loadContent(): Promise<SiteContent> {
  try {
    const content = await Deno.readTextFile("./content.json");
    return JSON.parse(content);
  } catch (error) {
    console.error("Error loading content.json:", error);
    // Return default content if file doesn't exist
    return {
      site: {
        title: "Media Showcase",
        description: "Personal gallery",
        owner: {
          name: "Owner",
          bio: "Welcome to my portfolio"
        }
      },
      navigation: [
        { id: "home", title: "Home", path: "/" }
      ],
      galleries: [],
      inspiration: {
        title: "Inspiration",
        description: "Content that inspires",
        sections: []
      },
      theme: {
        primaryColor: "#2563eb",
        backgroundColor: "#000000",
        textColor: "#ffffff",
        accentColor: "#3b82f6"
      }
    };
  }
}

// Get images from Cloudinary by tag with intelligent caching and request coalescing
async function getCloudinaryImagesByTag(tag: string, limit: number = 400): Promise<CloudinaryImage[]> {
  try {
    const now = Date.now();
    const cached = imageCache[tag];
    
    // Check if we have valid cache
    if (cached && cached.images && (now - cached.lastFetched) < CACHE_DURATION) {
      console.log(`📦 Using cached images for ${tag} (${cached.images.length} images)`);
      cached.lastAccessed = now; // Update access time for LRU
      return cached.images;
    }
    
    // If a fetch is already in progress, return the existing promise
    if (cached?.promise) {
      console.log(`⏳ Waiting for in-progress fetch for ${tag}`);
      return cached.promise;
    }
    
    // Create new fetch promise
    console.log(`🔄 Fetching fresh images for ${tag} tag (limit: ${limit})`);
    const fetchPromise = (async () => {
      const cloudinary = getCloudinary();
      const images = await cloudinary.getImagesByTag(tag, limit);
      
      const dataSize = calculateImageDataSize(images);
      const now = Date.now();
      
      // Update cache size tracking
      if (cached?.sizeBytes) {
        currentCacheSize -= cached.sizeBytes;
      }
      currentCacheSize += dataSize;
      
      // Evict old entries if needed before adding new one
      evictLRUEntries();
      
      // Update cache with fetched data
      imageCache[tag] = {
        images: images,
        lastFetched: now,
        lastAccessed: now,
        count: images.length,
        sizeBytes: dataSize,
        promise: undefined // Clear promise after completion
      };
      
      // Check if the image count has changed
      if (cached && cached.count !== images.length) {
        console.log(`📊 Image count changed for ${tag}: ${cached.count} → ${images.length}`);
      }
      
      return images;
    })();
    
    // Store promise immediately to prevent duplicate requests
    imageCache[tag] = {
      images: cached?.images || [],
      promise: fetchPromise,
      lastFetched: cached?.lastFetched || 0,
      lastAccessed: now,
      count: cached?.count || 0,
      sizeBytes: cached?.sizeBytes || 0
    };
    
    // Handle errors and cleanup
    return fetchPromise.catch((error) => {
      console.error(`Error fetching ${tag} tagged images:`, error);
      
      // Clear failed promise from cache
      if (imageCache[tag]?.promise === fetchPromise) {
        imageCache[tag].promise = undefined;
      }
      
      // If there's an error and we have cached data, return it
      if (cached?.images && cached.images.length > 0) {
        console.log(`⚠️ Using stale cache for ${tag} due to error`);
        return cached.images;
      }
      
      return [];
    });
  } catch (error) {
    console.error(`Unexpected error in cache handler for ${tag}:`, error);
    return [];
  }
}

function generateNavigation(content: SiteContent): string {
  const navItems = content.navigation.map(item => {
    if (item.path === '/') {
      return `
        <a href="/" class="text-lg font-medium hover:text-blue-600 transition-colors">
          home
        </a>
      `;
    }
    return '';
  }).join('');

  const links = content.navigation.filter(item => item.path !== '/').map(item => `
    <a href="${item.path}" class="text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base">
      ${item.title.toLowerCase()}
    </a>
  `).join('');

  return `
    <nav class="border-b border-gray-200">
      <div class="max-w-full mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          ${navItems}
          <div class="flex space-x-6 sm:space-x-8">
            ${links}
          </div>
        </div>
      </div>
    </nav>
  `;
}

function generatePhotoGrid(images: CloudinaryImage[], title: string): string {
  const cloudinary = getCloudinary();
  
  // Info box as first grid item
  const infoItem = `
    <div class="gallery-info-item">
      <div class="gallery-info-content">
        <h1 class="gallery-info-title">${title.toLowerCase()}.</h1>
      </div>
    </div>
  `;
  
  const imageItems = images.map(img => {
    let imageUrl: string;
    let srcsetAttr = '';
    let sizesAttr = '';
    
    imageUrl = cloudinary.getOptimizedUrl(img.public_id, {
      width: 800,
      height: 600,
      crop: 'fill',
      quality: 'auto',
      format: 'auto'
    });
    
    const responsiveSet = generateResponsiveImageSet(img.public_id);
    const sizes = getImageSizes();
    srcsetAttr = `srcset="${responsiveSet}"`;
    sizesAttr = `sizes="${sizes}"`;
    
    const altText = img.public_id.replace(/^.*\//, '').replace(/_/g, ' ');
    
    return `
      <div class="photo-item group cursor-pointer">
        <div class="aspect-4-3 overflow-hidden rounded-lg bg-gray-100">
          <img 
            src="${imageUrl}" 
            ${srcsetAttr}
            ${sizesAttr}
            alt="${altText}"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
      </div>
    `;
  }).join('');

  return `${infoItem}${imageItems}`;
}

async function generateGalleryPage(gallery: SiteContent['galleries'][0], content: SiteContent): Promise<string> {
  const images = await getCloudinaryImagesByTag(gallery.cloudinaryTag);
  const galleryItems = generatePhotoGrid(images, gallery.title);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${gallery.title} - ${content.site.owner.name}</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <div class="min-h-screen bg-white">
        ${generateNavigation(content)}
        
        <main class="gallery-container">
            ${galleryItems}
        </main>
    </div>
</body>
</html>`;
}

async function generateInspoPage(content: SiteContent): Promise<string> {
  // Flatten all items from all sections into a single list
  const allItems = content.inspiration.sections.flatMap(section => section.items);
  
  const items = allItems.map(item => `
    <li class="simple-content-item">
      <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="content-link">
        ${item.title}
      </a>
      ${item.description ? `<span class="content-duration">${item.description}</span>` : ''}
    </li>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.inspiration.title} - ${content.site.owner.name}</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <div class="min-h-screen bg-white">
        ${generateNavigation(content)}
        
        <main class="max-w-2xl mx-auto px-4 py-8">
            <h1 class="homepage-title mb-8">${content.inspiration.title.toLowerCase()}.</h1>
            
            <p class="content-description mb-8">
                ${content.inspiration.description}
            </p>

            <ul class="simple-content-list">
              ${items}
            </ul>
        </main>
    </div>
</body>
</html>`;
}

function generateHomePage(content: SiteContent): string {
  // Parse bio which may contain multiple paragraphs separated by |
  const bioParagraphs = content.site.owner.bio.split('|').map(p => p.trim()).filter(p => p.length > 0);
  
  // Generate bio HTML with bold first word of first paragraph
  const bioHtml = bioParagraphs.map((paragraph, index) => {
    if (index === 0) {
      // Bold the first word of the first paragraph
      const words = paragraph.split(' ');
      const firstWord = words[0];
      const restOfParagraph = words.slice(1).join(' ');
      return `<p class="text-lg text-gray-700 leading-relaxed mb-6">
                    <b>${firstWord}</b> ${restOfParagraph}
                </p>`;
    } else {
      return `<p class="text-lg text-gray-700 leading-relaxed mb-6">
                    ${paragraph}
                </p>`;
    }
  }).join('');
  
  // Only show hobbies section if hobbies exist
  const hobbies = content.site.owner.hobbies;
  let hobbySection = '';
  
  if (hobbies && hobbies.length > 0) {
    const hobbyList = hobbies.map(hobby => 
      `<li class="simple-content-item">${hobby}</li>`
    ).join('');
    
    hobbySection = `
                <p class="text-lg text-gray-700 leading-relaxed mb-6">
                    an enthusiast of the following:
                </p>
                
                <ul class="simple-content-list mb-12">
                    ${hobbyList}
                </ul>`;
  }

  // Only show quote if it exists
  const quote = content.site.owner.quote;
  const quoteSection = quote ? `
                <br><br>
                <p class="text-base text-gray-600 italic">
                    "${quote}"
                </p>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.site.owner.name}</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <div class="min-h-screen bg-white">
        ${generateNavigation(content)}
        
        <main class="max-w-2xl mx-auto px-4 py-8">
            <div class="mb-8">
                ${bioHtml}
                ${hobbySection}
                ${quoteSection}
            </div>
        </main>
    </div>
</body>
</html>`;
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const { pathname } = url;
  
  // Cache control endpoints (protected)
  if (pathname.startsWith("/api/cache/")) {
    // Validate API access
    if (!validateCacheApiAccess(req)) {
      return new Response(JSON.stringify({ error: "Unauthorized. Please provide a valid API key in the Authorization header." }), {
        status: 401,
        headers: { 
          "Content-Type": "application/json",
          "WWW-Authenticate": "Bearer realm=\"Cache API\""
        },
      });
    }
    
    if (pathname === "/api/cache/clear") {
      // Clear all cache
      let clearedEntries = 0;
      let clearedSize = 0;
      
      for (const key in imageCache) {
        clearedSize += imageCache[key].sizeBytes;
        delete imageCache[key];
        clearedEntries++;
      }
      
      currentCacheSize = 0; // Reset cache size counter
      console.log(`🗑️ Image cache cleared: ${clearedEntries} entries, ${Math.round(clearedSize / 1024)}KB`);
      
      return new Response(JSON.stringify({ 
        message: "Cache cleared successfully",
        entriesCleared: clearedEntries,
        sizeCleared: Math.round(clearedSize / 1024)
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    
    if (pathname === "/api/cache/status") {
      // Get cache status
      const now = Date.now();
      const status = Object.entries(imageCache).map(([tag, data]) => ({
        tag,
        imageCount: data.count,
        sizeKB: Math.round(data.sizeBytes / 1024),
        lastFetched: new Date(data.lastFetched).toISOString(),
        lastAccessed: new Date(data.lastAccessed).toISOString(),
        ageSeconds: Math.floor((now - data.lastFetched) / 1000),
        expired: now - data.lastFetched > CACHE_DURATION,
        hasActiveRequest: !!data.promise
      }));
      
      return new Response(JSON.stringify({ 
        cacheEntries: status,
        totalEntries: Object.keys(imageCache).length,
        totalSizeMB: Math.round(currentCacheSize / 1024 / 1024 * 100) / 100,
        maxSizeMB: MAX_CACHE_SIZE / 1024 / 1024,
        maxEntries: MAX_CACHE_ENTRIES,
        cacheDurationSeconds: CACHE_DURATION / 1000
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }
  }
  
  // Load content for each request to allow hot reloading
  const content = await loadContent();

  // Handle static files
  if (pathname === "/styles.css") {
    try {
      const css = await Deno.readTextFile("./static/styles.css");
      return new Response(css, {
        headers: { "Content-Type": "text/css" },
      });
    } catch {
      return new Response("CSS not found", { status: 404 });
    }
  }

  // Handle home route
  if (pathname === "/") {
    return new Response(generateHomePage(content), {
      headers: { "Content-Type": "text/html" },
    });
  }

  // Handle gallery routes dynamically
  const gallery = content.galleries.find(g => `/${g.id}` === pathname);
  if (gallery) {
    const galleryPage = await generateGalleryPage(gallery, content);
    return new Response(galleryPage, {
      headers: { "Content-Type": "text/html" },
    });
  }

  // Handle inspiration/inspo route
  if (pathname === "/inspo" || pathname === "/inspiration") {
    const inspoPage = await generateInspoPage(content);
    return new Response(inspoPage, {
      headers: { "Content-Type": "text/html" },
    });
  }

  // Handle legacy redirects
  if (pathname === "/content" || pathname === "/links") {
    return new Response("", {
      status: 301,
      headers: { "Location": "/inspo" }
    });
  }

  return new Response("Not Found", { status: 404 });
}

if (import.meta.main) {
  const content = await loadContent();
  
  // Start periodic cache cleanup
  startPeriodicCleanup();
  
  console.log(`🚀 ${content.site.title} starting on http://localhost:8737`);
  console.log("📱 Full-span gallery pages with tag-based image loading:");
  console.log("   http://localhost:8737/ (Home)");
  
  content.galleries.forEach(gallery => {
    console.log(`   http://localhost:8737/${gallery.id} (${gallery.title})`);
  });
  
  console.log("   http://localhost:8737/inspo (Inspiration)");
  
  // Show Cloudinary configuration status
  const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME');
  const hasApiKey = !!Deno.env.get('CLOUDINARY_API_KEY');
  const hasApiSecret = !!Deno.env.get('CLOUDINARY_API_SECRET');
  
  console.log("\n☁️ Cloudinary Status:");
  console.log(`   Cloud Name: ${cloudName || '❌ Not set'}`);
  console.log(`   API Key: ${hasApiKey ? '✅ Set' : '❌ Not set'}`);
  console.log(`   API Secret: ${hasApiSecret ? '✅ Set' : '❌ Not set'}`);
  
  if (!cloudName || !hasApiKey || !hasApiSecret) {
    console.log("   ⚠️  Using mock data - update .env file for real images");
  } else {
    console.log("   ✅ Ready to fetch real Cloudinary images by tags!");
  }
  
  console.log("\n📝 Content Configuration:");
  console.log("   Edit content.json to customize your site");
  console.log("   Run 'deno task edit' for interactive content editor");
  
  console.log("\n🔐 Cache API Security:");
  const hasCacheKey = !!Deno.env.get('CACHE_API_KEY');
  console.log(`   Cache API Key: ${hasCacheKey ? '✅ Configured' : '❌ Not set (endpoints disabled)'}`);
  if (hasCacheKey) {
    console.log("   Endpoints: /api/cache/status, /api/cache/clear");
    console.log("   Usage: Include 'Authorization: Bearer <key>' header");
  }
  
  console.log("\n🌐 Server Status:");
  console.log("   Listening on http://localhost:8737/\n");
  
  Deno.serve({ 
    port: 8737,
    onListen: () => {} // Suppress default "Listening on..." message
  }, handler);
}