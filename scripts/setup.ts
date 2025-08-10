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
  console.log("🎨 Media Showcase - Initial Setup\n");
  console.log("This setup will help you configure your portfolio site with custom galleries.\n");

  // Site owner information
  console.log("📝 Let's start with your information:\n");
  
  const ownerName = await Input.prompt({
    message: "What's your name/handle?",
    default: "untitled",
  });
  
  const ownerBio = await Input.prompt({
    message: "Brief bio (one word or phrase):",
    default: "Passionate.",
  });
  
  const ownerQuote = await Input.prompt({
    message: "Your favorite quote:",
    default: "live life at your own tempo; memento mori",
  });

  // Site title
  const siteTitle = await Input.prompt({
    message: "Site title:",
    default: "My Portfolio",
  });

  // Define primary routes
  console.log("\n🗂️  Now let's define your gallery routes:");
  console.log("Each route will automatically use its name as the Cloudinary tag.\n");
  console.log("For example: route 'portrait' → Cloudinary tag 'portrait'\n");
  
  const numRoutes = await Number.prompt({
    message: "How many gallery routes do you want? (e.g., 3 for portrait, landscape & street)",
    default: 3,
    min: 1,
    max: 10,
  });

  const galleries: SiteContent['galleries'] = [];
  const navigation: SiteContent['navigation'] = [
    { id: "home", title: "Home", path: "/" }
  ];
  const hobbies: string[] = [];

  for (let i = 0; i < numRoutes; i++) {
    console.log(`\n📸 Gallery ${i + 1}:`);
    
    const routeId = await Input.prompt({
      message: "Route ID (lowercase, no spaces - e.g., 'portrait', 'landscape', 'street'):",
      validate: (value) => {
        if (!value.match(/^[a-z0-9-]+$/)) {
          return "Please use only lowercase letters, numbers, and hyphens";
        }
        return true;
      },
    });
    
    const routeTitle = await Input.prompt({
      message: "Display title (e.g., 'Portrait Photography'):",
      default: routeId.charAt(0).toUpperCase() + routeId.slice(1),
    });
    
    const routeDescription = await Input.prompt({
      message: "Brief description:",
      default: `Collection of ${routeTitle.toLowerCase()}`,
    });

    galleries.push({
      id: routeId,
      title: routeTitle,
      description: routeDescription,
      cloudinaryTag: routeId, // Automatically use route ID as Cloudinary tag
      layout: "grid"
    });

    navigation.push({
      id: routeId,
      title: routeTitle.split(' ')[0], // Use first word for nav
      path: `/${routeId}`
    });
  }

  // Ask about inspiration page
  const hasInspo = await Confirm.prompt({
    message: "Do you want an 'inspo' (inspiration/links) page?",
    default: true,
  });

  if (hasInspo) {
    navigation.push({
      id: "inspo",
      title: "Inspo",
      path: "/inspo"
    });
  }

  // Hobbies list
  console.log("\n🎯 Your hobbies/interests (comma-separated):");
  const hobbyInput = await Input.prompt({
    message: "Hobbies:",
    default: "photography, art, traveling, reading",
  });
  
  if (hobbyInput) {
    const hobbyList = hobbyInput.split(',').map(h => h.trim()).filter(h => h.length > 0);
    hobbies.push(...hobbyList);
  }

  // Create content configuration
  const content: SiteContent = {
    site: {
      title: siteTitle,
      description: "Personal gallery for hobby photos & curated content",
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
      title: "Inspiration & Learning",
      description: "Content that inspires and educates",
      sections: hasInspo ? [
        {
          title: "Videos & Links",
          items: [
            {
              title: "Example Video",
              url: "https://www.youtube.com/watch?v=example",
              type: "video",
              description: "Replace with your content"
            }
          ]
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
  console.log("\n✅ Configuration saved to content.json");

  // Create .env file if it doesn't exist
  const envExists = await Deno.stat(".env").catch(() => null);
  if (!envExists) {
    const createEnv = await Confirm.prompt({
      message: "Create .env file for Cloudinary configuration?",
      default: true,
    });

    if (createEnv) {
      console.log("\n☁️  Cloudinary Setup:");
      console.log("Get your credentials from: https://cloudinary.com/console\n");
      
      const cloudName = await Input.prompt({
        message: "Cloudinary Cloud Name:",
        default: "your-cloud-name",
      });
      
      const apiKey = await Input.prompt({
        message: "Cloudinary API Key:",
        default: "your-api-key",
      });
      
      const apiSecret = await Input.prompt({
        message: "Cloudinary API Secret:",
        default: "your-api-secret",
      });

      const envContent = `# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=${cloudName}
CLOUDINARY_API_KEY=${apiKey}
CLOUDINARY_API_SECRET=${apiSecret}`;

      await Deno.writeTextFile("./.env", envContent);
      console.log("✅ .env file created");
    }
  }

  // Instructions
  console.log("\n🎉 Setup complete!\n");
  console.log("📋 Next steps:");
  console.log("1. Upload images to Cloudinary with these tags:");
  galleries.forEach(g => {
    console.log(`   - Tag '${g.cloudinaryTag}' for ${g.title}`);
  });
  console.log("\n2. Run the development server:");
  console.log("   deno task dev");
  console.log("\n3. Edit content anytime:");
  console.log("   deno task edit");
  console.log("\n4. View your site at:");
  console.log("   http://localhost:8737");
}

if (import.meta.main) {
  await setupSite();
}