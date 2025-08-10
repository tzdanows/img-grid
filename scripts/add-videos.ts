#!/usr/bin/env -S deno run -A

import { Input, Number, Select } from "https://deno.land/x/cliffy@v1.0.0-rc.4/prompt/mod.ts";

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

async function loadContent(): Promise<SiteContent> {
  try {
    const content = await Deno.readTextFile("./content.json");
    return JSON.parse(content);
  } catch (error) {
    console.error("❌ Error loading content.json:", error);
    console.log("Please run 'deno task setup' first to create your content.json file.");
    Deno.exit(1);
  }
}

async function saveContent(content: SiteContent): Promise<void> {
  await Deno.writeTextFile("./content.json", JSON.stringify(content, null, 2));
  console.log("✅ Content saved to content.json");
}

function extractVideoId(url: string): string | null {
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*&v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function formatDuration(url: string): string {
  // Extract duration from URL if present in format like &t=5m20s
  const timeMatch = url.match(/[&?]t=(\d+[hms]?)+/);
  if (timeMatch) {
    return timeMatch[1];
  }
  return "";
}

async function addVideos() {
  console.log("🎬 Add Videos to Inspiration Page\n");
  
  // Load existing content
  const content = await loadContent();
  
  // Ensure inspiration section exists
  if (!content.inspiration) {
    content.inspiration = {
      title: "Inspiration",
      description: "Content that inspires",
      sections: []
    };
  }
  
  // Show existing sections
  if (content.inspiration.sections.length > 0) {
    console.log("📂 Existing sections:");
    content.inspiration.sections.forEach((section, index) => {
      console.log(`  ${index + 1}. ${section.title} (${section.items.length} items)`);
    });
    console.log("");
  }
  
  // Choose section
  let sectionIndex: number;
  if (content.inspiration.sections.length === 0) {
    console.log("No sections found. Creating a new one...\n");
    const sectionTitle = await Input.prompt({
      message: "Section title:",
      default: "YouTube Videos"
    });
    content.inspiration.sections.push({
      title: sectionTitle,
      items: []
    });
    sectionIndex = 0;
  } else {
    const action = await Select.prompt({
      message: "Add videos to:",
      options: [
        ...content.inspiration.sections.map((s, i) => ({
          value: i.toString(),
          name: s.title
        })),
        { value: "new", name: "Create new section" }
      ]
    });
    
    if (action === "new") {
      const sectionTitle = await Input.prompt({
        message: "New section title:",
        default: "YouTube Videos"
      });
      content.inspiration.sections.push({
        title: sectionTitle,
        items: []
      });
      sectionIndex = content.inspiration.sections.length - 1;
    } else {
      sectionIndex = parseInt(action);
    }
  }
  
  // Ask how many videos to add
  const numVideos = await Number.prompt({
    message: "How many videos do you want to add?",
    default: 1,
    min: 1,
    max: 20,
  });
  
  console.log(`\n📹 Adding ${numVideos} video(s) to "${content.inspiration.sections[sectionIndex].title}":\n`);
  
  // Add each video
  for (let i = 0; i < numVideos; i++) {
    console.log(`\nVideo ${i + 1}:`);
    
    const title = await Input.prompt({
      message: "Video title:",
      validate: (value) => value.length > 0 || "Title is required"
    });
    
    const url = await Input.prompt({
      message: "YouTube URL:",
      validate: (value) => {
        if (!value.includes("youtube.com") && !value.includes("youtu.be")) {
          return "Please enter a valid YouTube URL";
        }
        return true;
      }
    });
    
    const description = await Input.prompt({
      message: "Description (optional, press Enter to skip):",
      default: ""
    });
    
    // Add video to section
    content.inspiration.sections[sectionIndex].items.push({
      title,
      url,
      type: "video",
      description: description || undefined
    });
    
    console.log(`✅ Added "${title}"`);
  }
  
  // Save updated content
  await saveContent(content);
  
  // Summary
  console.log("\n🎉 Videos added successfully!");
  console.log(`\n📊 Section "${content.inspiration.sections[sectionIndex].title}" now has ${content.inspiration.sections[sectionIndex].items.length} item(s)`);
  console.log("\n💡 Tips:");
  console.log("- Run 'deno task dev' to see your changes");
  console.log("- Run 'deno task edit' to manage all content");
  console.log("- Run this script again to add more videos");
}

if (import.meta.main) {
  await addVideos();
}