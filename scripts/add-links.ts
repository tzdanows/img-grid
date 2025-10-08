#!/usr/bin/env -S deno run -A

import {
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

async function loadContent(): Promise<SiteContent> {
  try {
    const content = await Deno.readTextFile("./content.json");
    return JSON.parse(content);
  } catch (error) {
    console.error("❌ Error loading content.json:", error);
    console.log(
      "Please run 'deno task setup' first to create your content.json file.",
    );
    Deno.exit(1);
  }
}

async function saveContent(content: SiteContent): Promise<void> {
  await Deno.writeTextFile("./content.json", JSON.stringify(content, null, 2));
  console.log("✅ Content saved to content.json");
}

function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
}

async function addLinks() {
  console.log("🔗 Add Links to Links Page\n");

  // Load existing content
  const content = await loadContent();

  // Ensure links section exists
  if (!content.links) {
    content.links = {
      title: "Links",
      description: "Content that inspires",
      sections: [],
    };
  }

  // Ensure we have at least one section (for backward compatibility)
  if (content.links.sections.length === 0) {
    content.links.sections.push({
      title: "Links",
      items: [],
    });
  }

  // Always add to the first section (since we're using a single list now)
  const sectionIndex = 0;

  // Show current link count
  const totalLinks = content.links.sections.reduce(
    (sum, section) => sum + section.items.length,
    0,
  );
  if (totalLinks > 0) {
    console.log(`📊 Currently ${totalLinks} link(s) on the links page\n`);
  }

  // Ask how many links to add
  const numLinks = await Number.prompt({
    message: "How many links do you want to add?",
    default: 1,
    min: 1,
    max: 20,
  });

  console.log(`\n🔗 Adding ${numLinks} link(s):\n`);

  // Add each link
  for (let i = 0; i < numLinks; i++) {
    console.log(`\nLink ${i + 1}:`);

    const title = await Input.prompt({
      message: "Link title:",
      validate: (value) => value.length > 0 || "Title is required",
    });

    const url = await Input.prompt({
      message: "URL:",
      validate: (value) => {
        if (!isValidUrl(value)) {
          return "Please enter a valid URL (must start with http:// or https://)";
        }
        return true;
      },
    });

    const description = await Input.prompt({
      message: "Description (optional, press Enter to skip):",
      default: "",
    });

    // Add link to section
    content.links.sections[sectionIndex].items.push({
      title,
      url,
      type: "link", // Always use generic "link" type
      description: description || undefined,
    });

    console.log(`✅ Added "${title}"`);
  }

  // Save updated content
  await saveContent(content);

  // Summary
  const newTotalLinks = content.links.sections.reduce(
    (sum, section) => sum + section.items.length,
    0,
  );
  console.log("\n🎉 Links added successfully!");
  console.log(`\n📊 Total links on links page: ${newTotalLinks}`);
  console.log("\n💡 Tips:");
  console.log("- Run 'deno task dev' to see your changes");
  console.log("- Run 'deno task edit' to manage all content");
  console.log("- Run this script again to add more links");
}

if (import.meta.main) {
  await addLinks();
}
