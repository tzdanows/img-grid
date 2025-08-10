#!/usr/bin/env -S deno run -A

import { loadEnv } from "./lib/env.ts";
import { getCloudinary, type CloudinaryImage, generateResponsiveImageSet, getImageSizes } from "./lib/cloudinary.ts";

// Load environment variables from .env file
loadEnv();

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

// Get images from Cloudinary by tag
async function getCloudinaryImagesByTag(tag: string): Promise<CloudinaryImage[]> {
  try {
    const cloudinary = getCloudinary();
    const images = await cloudinary.getImagesByTag(tag, 12);
    return images;
  } catch (error) {
    console.error(`Error fetching ${tag} tagged images:`, error);
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
  const sections = content.inspiration.sections.map(section => {
    const items = section.items.map(item => `
      <li class="simple-content-item">
        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="content-link">
          ${item.title}
        </a>
        ${item.description ? `<span class="content-duration">${item.description}</span>` : ''}
      </li>
    `).join('');

    return `
      <div class="mb-8">
        <h2 class="text-lg font-semibold text-gray-800 mb-3">${section.title}</h2>
        <ul class="simple-content-list">
          ${items}
        </ul>
      </div>
    `;
  }).join('');

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

            ${sections}
        </main>
    </div>
</body>
</html>`;
}

function generateHomePage(content: SiteContent): string {
  const hobbies = content.site.owner.hobbies || [
    "keyboards", "artisans", "esports", "programming", "community", "events", "cooking"
  ];
  
  const hobbyList = hobbies.map(hobby => 
    `<li class="simple-content-item">${hobby}</li>`
  ).join('');

  const quote = content.site.owner.quote || "live life at your own tempo; memento mori";

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
                <p class="text-lg text-gray-700 leading-relaxed mb-6">
                    <b>hi!</b> I'm ${content.site.owner.name} and I made this site to provide a platform to share media associated 
                    with my interests. I hope you'll enjoy your stay
                </p>
                
                <p class="text-lg text-gray-700 leading-relaxed mb-6">
                    ${content.site.owner.bio.toLowerCase()} a fellow enthusiast of the following:
                </p>
                
                <ul class="simple-content-list mb-12">
                    ${hobbyList}
                </ul>
                
                <br><br>
                <p class="text-base text-gray-600 italic">
                    "${quote}"
                </p>
            </div>
        </main>
    </div>
</body>
</html>`;
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const { pathname } = url;
  
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