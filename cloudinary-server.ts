#!/usr/bin/env -S deno run -A

import { loadEnv } from "./lib/env.ts";
import { getCloudinary, type CloudinaryImage, generateResponsiveImageSet, getImageSizes } from "./lib/cloudinary.ts";

// Load environment variables from .env file
loadEnv();

// Cache for Cloudinary images
interface ImageCache {
  [tag: string]: {
    images: CloudinaryImage[];
    lastFetched: number;
    count: number;
  };
}

const imageCache: ImageCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

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

// Get images from Cloudinary by tag with intelligent caching
async function getCloudinaryImagesByTag(tag: string, limit: number = 400): Promise<CloudinaryImage[]> {
  try {
    const now = Date.now();
    const cached = imageCache[tag];
    
    // Check if we have valid cache
    if (cached && (now - cached.lastFetched) < CACHE_DURATION) {
      console.log(`📦 Using cached images for ${tag} (${cached.images.length} images)`);
      return cached.images;
    }
    
    // Fetch fresh data from Cloudinary
    console.log(`🔄 Fetching fresh images for ${tag} tag (limit: ${limit})`);
    const cloudinary = getCloudinary();
    const images = await cloudinary.getImagesByTag(tag, limit);
    
    // Update cache
    imageCache[tag] = {
      images: images,
      lastFetched: now,
      count: images.length
    };
    
    // Check if the image count has changed significantly (for smart cache invalidation)
    if (cached && cached.count !== images.length) {
      console.log(`📊 Image count changed for ${tag}: ${cached.count} → ${images.length}`);
    }
    
    return images;
  } catch (error) {
    console.error(`Error fetching ${tag} tagged images:`, error);
    
    // If there's an error and we have cache, return cached data
    if (imageCache[tag]) {
      console.log(`⚠️ Using stale cache for ${tag} due to error`);
      return imageCache[tag].images;
    }
    
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
  
  // Cache control endpoints
  if (pathname === "/api/cache/clear") {
    // Clear all cache
    for (const key in imageCache) {
      delete imageCache[key];
    }
    console.log("🗑️ Image cache cleared");
    return new Response(JSON.stringify({ message: "Cache cleared successfully" }), {
      headers: { "Content-Type": "application/json" },
    });
  }
  
  if (pathname === "/api/cache/status") {
    // Get cache status
    const status = Object.entries(imageCache).map(([tag, data]) => ({
      tag,
      imageCount: data.count,
      lastFetched: new Date(data.lastFetched).toISOString(),
      ageInSeconds: Math.floor((Date.now() - data.lastFetched) / 1000)
    }));
    
    return new Response(JSON.stringify({ cacheEntries: status, cacheDurationSeconds: CACHE_DURATION / 1000 }), {
      headers: { "Content-Type": "application/json" },
    });
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
  
  console.log("\n🌐 Server Status:");
  console.log("   Listening on http://localhost:8737/\n");
  
  Deno.serve({ 
    port: 8737,
    onListen: () => {} // Suppress default "Listening on..." message
  }, handler);
}