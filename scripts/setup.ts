#!/usr/bin/env -S deno run -A

import {
  Confirm,
  Input,
  Number,
} from "https://deno.land/x/cliffy@v1.0.0-rc.4/prompt/mod.ts";

interface SiteContent {
  site: {
    title: string;
    description: string;
    owner: {
      name: string;
      bio: string;
      bio2?: string;
      bio3?: string;
      bio4?: string;
      bio5?: string;
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
  links: {
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

  // Site title first
  const siteTitle = await Input.prompt({
    message: "Site title:",
    default: "My Portfolio",
  });

  // Owner information
  console.log("\n👤 Personal Information");
  const ownerName = await Input.prompt({
    message: "Your name:",
    default: "untitled",
  });

  // Main bio
  console.log("\n📝 Bio Section");
  const mainBio = await Input.prompt({
    message: "Main bio (bio1):",
    default:
      "I made this site to provide a platform to share media associated with my interests. I hope you'll enjoy your stay",
  });

  // Additional bios (optional)
  const numAdditionalBios = await Number.prompt({
    message: "How many additional bio paragraphs? (0-4):",
    default: 0,
    min: 0,
    max: 4,
  });

  const additionalBios: string[] = [];
  for (let i = 0; i < numAdditionalBios; i++) {
    const bio = await Input.prompt({
      message: `Bio ${i + 2}:`,
      default: "",
    });
    if (bio.trim()) {
      additionalBios.push(bio);
    }
  }

  // Quote (optional)
  const ownerQuote = await Input.prompt({
    message: "Favorite quote (optional, press Enter to skip):",
    default: "",
  });

  // Gallery routes
  console.log("\n📸 Gallery Setup");
  console.log(
    "Routes must match your Cloudinary tags exactly (e.g., 'portrait', 'landscape')\n",
  );

  const routeInput = await Input.prompt({
    message: "Enter gallery routes (comma-separated):",
    default: "portrait, landscape, street",
  });

  const routes = routeInput.split(",").map((r) => r.trim()).filter((r) =>
    r.length > 0
  );

  const galleries: SiteContent["galleries"] = [];
  const navigation: SiteContent["navigation"] = [
    { id: "home", title: "Home", path: "/" },
  ];

  // Create galleries from routes
  for (const route of routes) {
    galleries.push({
      id: route.toLowerCase(),
      title: route.toLowerCase(),
      description: `${route} photography`,
      cloudinaryTag: route.toLowerCase(),
      layout: "grid",
    });

    navigation.push({
      id: route.toLowerCase(),
      title: route.toLowerCase(),
      path: `/${route.toLowerCase()}`,
    });
  }

  // Add links page
  const hasLinks = await Confirm.prompt({
    message: "Include links page?",
    default: true,
  });

  if (hasLinks) {
    navigation.push({
      id: "links",
      title: "Links",
      path: "/links",
    });
  }

  // Hobbies (optional)
  console.log("\n🎯 Hobbies (optional - leave empty to skip this section)");
  const hobbyInput = await Input.prompt({
    message: "Your hobbies (comma-separated, or press Enter to skip):",
    default: "",
  });

  const hobbies = hobbyInput
    ? hobbyInput.split(",").map((h) => h.trim()).filter((h) => h.length > 0)
    : [];

  // Create content
  const owner: SiteContent["site"]["owner"] = {
    name: ownerName,
    bio: mainBio,
    quote: ownerQuote.length > 0 ? ownerQuote : undefined,
    hobbies: hobbies.length > 0 ? hobbies : undefined,
  };

  // Add additional bios
  if (additionalBios.length > 0) owner.bio2 = additionalBios[0];
  if (additionalBios.length > 1) owner.bio3 = additionalBios[1];
  if (additionalBios.length > 2) owner.bio4 = additionalBios[2];
  if (additionalBios.length > 3) owner.bio5 = additionalBios[3];

  const content: SiteContent = {
    site: {
      title: siteTitle,
      description: "Personal gallery for photos & curated content",
      owner: owner,
    },
    navigation: navigation,
    galleries: galleries,
    links: {
      title: "Links",
      description: "Content that inspires",
      sections: hasLinks
        ? [
          {
            title: "Links",
            items: [],
          },
        ]
        : [],
    },
    theme: {
      primaryColor: "#2563eb",
      backgroundColor: "#000000",
      textColor: "#ffffff",
      accentColor: "#3b82f6",
    },
  };

  // Save configuration
  await Deno.writeTextFile("./content.json", JSON.stringify(content, null, 2));
  console.log("\n✅ Configuration saved!");

  // Cloudinary setup
  console.log("\n☁️  Cloudinary Configuration");
  const envExists = await Deno.stat(".env").catch(() => null);

  if (envExists) {
    const overwriteCloudinary = await Confirm.prompt({
      message:
        "Cloudinary configuration already exists. Do you want to update it?",
      default: false,
    });

    if (overwriteCloudinary) {
      await setupCloudinary();
    } else {
      console.log("✅ Keeping existing Cloudinary configuration");
    }
  } else {
    const setupCloud = await Confirm.prompt({
      message: "Would you like to set up Cloudinary now?",
      default: true,
    });

    if (setupCloud) {
      await setupCloudinary();
    } else {
      console.log("⚠️  Skipping Cloudinary setup - site will use mock images");
    }
  }

  // Instructions
  console.log("\n🎉 Setup complete!");
  console.log("\n📋 Next steps:");
  console.log(`1. Upload images to Cloudinary with tags: ${routes.join(", ")}`);
  console.log("2. Run: deno task dev");
  console.log("3. Visit: http://localhost:8737");
}

async function setupCloudinary() {
  console.log("\n📋 Get your credentials from https://cloudinary.com/console");

  const cloudName = await Input.prompt({
    message: "Cloud Name:",
    validate: (value) => value.length > 0 || "Cloud Name is required",
  });

  const apiKey = await Input.prompt({
    message: "API Key:",
    validate: (value) => value.length > 0 || "API Key is required",
  });

  const apiSecret = await Input.prompt({
    message: "API Secret:",
    validate: (value) => value.length > 0 || "API Secret is required",
  });

  // Generate a secure random API key for cache management
  const cacheApiKey = crypto.randomUUID();
  console.log("\n🔐 Generated Cache API Key (save this!):");
  console.log(`   ${cacheApiKey}`);
  console.log(
    "   Use this key with 'Authorization: Bearer <key>' header for /api/cache/* endpoints",
  );

  const envContent = `CLOUDINARY_CLOUD_NAME=${cloudName}
CLOUDINARY_API_KEY=${apiKey}
CLOUDINARY_API_SECRET=${apiSecret}
CACHE_API_KEY=${cacheApiKey}`;

  await Deno.writeTextFile("./.env", envContent);
  console.log("\n✅ Configuration saved to .env");
}

if (import.meta.main) {
  await setupSite();
}
