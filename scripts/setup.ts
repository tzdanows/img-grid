#!/usr/bin/env -S deno run -A

import { Input, Confirm, Number } from "https://deno.land/x/cliffy@v1.0.0-rc.4/prompt/mod.ts";

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

async function setupSite() {
  console.log("🎨 Media Showcase - Setup\n");

  // Quick personal info
  const ownerName = await Input.prompt({
    message: "Your name:",
    default: "untitled",
  });
  
  const ownerBio = await Input.prompt({
    message: "Bio:",
    default: "Passionate about photography",
  });
  
  const ownerQuote = await Input.prompt({
    message: "Quote:",
    default: "Everything you can imagine is real",
  });

  const siteTitle = await Input.prompt({
    message: "Site title:",
    default: "My Portfolio",
  });

  // Gallery routes
  console.log("\n📸 Gallery Setup");
  console.log("Routes must match your Cloudinary tags exactly (e.g., 'portrait', 'landscape')\n");
  
  const routeInput = await Input.prompt({
    message: "Enter gallery routes (comma-separated):",
    default: "portrait, landscape, street",
  });

  const routes = routeInput.split(',').map(r => r.trim()).filter(r => r.length > 0);
  
  const galleries: SiteContent['galleries'] = [];
  const navigation: SiteContent['navigation'] = [
    { id: "home", title: "Home", path: "/" }
  ];

  // Create galleries from routes
  for (const route of routes) {
    galleries.push({
      id: route.toLowerCase(),
      title: route.toLowerCase(),
      description: `${route} photography`,
      cloudinaryTag: route.toLowerCase(),
      layout: "grid"
    });

    navigation.push({
      id: route.toLowerCase(),
      title: route.toLowerCase(),
      path: `/${route.toLowerCase()}`
    });
  }

  // Add inspo page
  const hasInspo = await Confirm.prompt({
    message: "Include inspiration page?",
    default: true,
  });

  if (hasInspo) {
    navigation.push({
      id: "inspo",
      title: "Inspo",
      path: "/inspo"
    });
  }

  // Hobbies
  const hobbyInput = await Input.prompt({
    message: "Your hobbies (comma-separated):",
    default: "photography, art, traveling",
  });
  
  const hobbies = hobbyInput ? hobbyInput.split(',').map(h => h.trim()) : [];

  // Create content
  const content: SiteContent = {
    site: {
      title: siteTitle,
      description: "Personal gallery for photos & curated content",
      owner: {
        name: ownerName,
        bio: ownerBio,
        quote: ownerQuote,
        hobbies: hobbies
      }
    },
    navigation: navigation,
    galleries: galleries,
    inspiration: {
      title: "Inspiration",
      description: "Content that inspires",
      sections: hasInspo ? [
        {
          title: "Videos",
          items: []
        }
      ] : []
    },
    theme: {
      primaryColor: "#2563eb",
      backgroundColor: "#000000",
      textColor: "#ffffff",
      accentColor: "#3b82f6"
    }
  };

  // Save configuration
  await Deno.writeTextFile("./content.json", JSON.stringify(content, null, 2));
  console.log("\n✅ Configuration saved!");

  // Cloudinary setup
  const envExists = await Deno.stat(".env").catch(() => null);
  if (!envExists) {
    console.log("\n☁️  Cloudinary Setup (get from https://cloudinary.com/console)");
    
    const cloudName = await Input.prompt("Cloud Name:");
    const apiKey = await Input.prompt("API Key:");
    const apiSecret = await Input.prompt("API Secret:");

    const envContent = `CLOUDINARY_CLOUD_NAME=${cloudName}
CLOUDINARY_API_KEY=${apiKey}
CLOUDINARY_API_SECRET=${apiSecret}`;

    await Deno.writeTextFile("./.env", envContent);
    console.log("✅ .env created");
  }

  // Instructions
  console.log("\n🎉 Setup complete!");
  console.log("\n📋 Next steps:");
  console.log(`1. Upload images to Cloudinary with tags: ${routes.join(', ')}`);
  console.log("2. Run: deno task dev");
  console.log("3. Visit: http://localhost:8737");
}

if (import.meta.main) {
  await setupSite();
}