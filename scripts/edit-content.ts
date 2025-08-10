#!/usr/bin/env -S deno run -A

import { parse } from "https://deno.land/std@0.224.0/flags/mod.ts";
import { Select, Input, Confirm } from "https://deno.land/x/cliffy@v1.0.0-rc.4/prompt/mod.ts";

interface SiteContent {
  site: {
    title: string;
    description: string;
    owner: {
      name: string;
      bio: string;
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
  } catch {
    console.log("No existing content.json found. Creating new configuration...");
    return createDefaultContent();
  }
}

function createDefaultContent(): SiteContent {
  return {
    site: {
      title: "Hobby Media Outlet",
      description: "Personal gallery for hobby photos & curated content",
      owner: {
        name: "Your Name",
        bio: "Tell us about yourself and your hobbies",
        social: {}
      }
    },
    navigation: [
      { id: "home", title: "Home", path: "/", icon: "🏠" }
    ],
    galleries: [],
    inspiration: {
      title: "Inspiration",
      description: "Content that inspires and educates",
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

async function saveContent(content: SiteContent): Promise<void> {
  await Deno.writeTextFile("./content.json", JSON.stringify(content, null, 2));
  console.log("✅ Content saved to content.json");
}

async function editSiteInfo(content: SiteContent): Promise<void> {
  console.log("\n📝 Edit Site Information\n");
  
  content.site.title = await Input.prompt({
    message: "Site title:",
    default: content.site.title,
  });
  
  content.site.description = await Input.prompt({
    message: "Site description:",
    default: content.site.description,
  });
  
  content.site.owner.name = await Input.prompt({
    message: "Your name:",
    default: content.site.owner.name,
  });
  
  content.site.owner.bio = await Input.prompt({
    message: "Your bio:",
    default: content.site.owner.bio,
  });
}

async function manageGalleries(content: SiteContent): Promise<void> {
  while (true) {
    console.log("\n🖼️  Gallery Management\n");
    console.log("Current galleries:");
    content.galleries.forEach((g, i) => {
      console.log(`  ${i + 1}. ${g.title} (tag: ${g.cloudinaryTag})`);
    });
    
    const action = await Select.prompt({
      message: "What would you like to do?",
      options: [
        { value: "add", name: "Add new gallery" },
        { value: "edit", name: "Edit existing gallery" },
        { value: "remove", name: "Remove gallery" },
        { value: "back", name: "Back to main menu" },
      ],
    });
    
    if (action === "back") break;
    
    switch (action) {
      case "add": {
        const id = await Input.prompt("Gallery ID (used in URL):");
        const title = await Input.prompt("Gallery title:");
        const description = await Input.prompt("Gallery description:");
        const cloudinaryTag = await Input.prompt("Cloudinary tag:");
        
        content.galleries.push({
          id,
          title,
          description,
          cloudinaryTag,
          layout: "grid"
        });
        
        // Add to navigation
        if (!content.navigation.find(n => n.path === `/${id}`)) {
          content.navigation.push({
            id,
            title,
            path: `/${id}`,
            icon: "📸"
          });
        }
        
        console.log("✅ Gallery added");
        break;
      }
      
      case "edit": {
        if (content.galleries.length === 0) {
          console.log("No galleries to edit");
          continue;
        }
        
        const galleryIndex = parseInt(await Input.prompt({
          message: "Gallery number to edit:",
          validate: (v) => {
            const n = parseInt(v);
            return n > 0 && n <= content.galleries.length;
          }
        })) - 1;
        
        const gallery = content.galleries[galleryIndex];
        gallery.title = await Input.prompt({
          message: "Gallery title:",
          default: gallery.title,
        });
        gallery.description = await Input.prompt({
          message: "Gallery description:",
          default: gallery.description,
        });
        gallery.cloudinaryTag = await Input.prompt({
          message: "Cloudinary tag:",
          default: gallery.cloudinaryTag,
        });
        
        console.log("✅ Gallery updated");
        break;
      }
      
      case "remove": {
        if (content.galleries.length === 0) {
          console.log("No galleries to remove");
          continue;
        }
        
        const galleryIndex = parseInt(await Input.prompt({
          message: "Gallery number to remove:",
          validate: (v) => {
            const n = parseInt(v);
            return n > 0 && n <= content.galleries.length;
          }
        })) - 1;
        
        const gallery = content.galleries[galleryIndex];
        const confirm = await Confirm.prompt(`Remove gallery "${gallery.title}"?`);
        
        if (confirm) {
          content.galleries.splice(galleryIndex, 1);
          // Remove from navigation
          const navIndex = content.navigation.findIndex(n => n.path === `/${gallery.id}`);
          if (navIndex > -1) {
            content.navigation.splice(navIndex, 1);
          }
          console.log("✅ Gallery removed");
        }
        break;
      }
    }
  }
}

async function manageInspiration(content: SiteContent): Promise<void> {
  while (true) {
    console.log("\n✨ Inspiration Content Management\n");
    console.log("Current sections:");
    content.inspiration.sections.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.title} (${s.items.length} items)`);
    });
    
    const action = await Select.prompt({
      message: "What would you like to do?",
      options: [
        { value: "add-section", name: "Add new section" },
        { value: "add-item", name: "Add item to section" },
        { value: "edit-item", name: "Edit existing item" },
        { value: "remove-item", name: "Remove item" },
        { value: "remove-section", name: "Remove section" },
        { value: "back", name: "Back to main menu" },
      ],
    });
    
    if (action === "back") break;
    
    switch (action) {
      case "add-section": {
        const title = await Input.prompt("Section title:");
        content.inspiration.sections.push({
          title,
          items: []
        });
        console.log("✅ Section added");
        break;
      }
      
      case "add-item": {
        if (content.inspiration.sections.length === 0) {
          console.log("Please add a section first");
          continue;
        }
        
        const sectionIndex = parseInt(await Input.prompt({
          message: "Section number:",
          validate: (v) => {
            const n = parseInt(v);
            return n > 0 && n <= content.inspiration.sections.length;
          }
        })) - 1;
        
        const title = await Input.prompt("Item title:");
        const url = await Input.prompt("Item URL:");
        const description = await Input.prompt("Item description (optional):");
        
        const itemType = url.includes("youtube.com") || url.includes("youtu.be") ? "video" : "link";
        
        content.inspiration.sections[sectionIndex].items.push({
          title,
          url,
          type: itemType,
          description: description || undefined
        });
        
        console.log("✅ Item added");
        break;
      }
      
      case "edit-item": {
        if (content.inspiration.sections.length === 0) {
          console.log("No sections available");
          continue;
        }
        
        // Select section
        const sectionIndex = parseInt(await Input.prompt({
          message: "Section number:",
          validate: (v) => {
            const n = parseInt(v);
            return n > 0 && n <= content.inspiration.sections.length;
          }
        })) - 1;
        
        const section = content.inspiration.sections[sectionIndex];
        if (section.items.length === 0) {
          console.log("No items in this section");
          continue;
        }
        
        // Show items
        console.log("\nItems in this section:");
        section.items.forEach((item, i) => {
          console.log(`  ${i + 1}. ${item.title} (${item.type})`);
        });
        
        // Select item
        const itemIndex = parseInt(await Input.prompt({
          message: "Item number to edit:",
          validate: (v) => {
            const n = parseInt(v);
            return n > 0 && n <= section.items.length;
          }
        })) - 1;
        
        const item = section.items[itemIndex];
        
        // Edit item
        item.title = await Input.prompt({
          message: "Item title:",
          default: item.title,
        });
        
        item.url = await Input.prompt({
          message: "Item URL:",
          default: item.url,
        });
        
        const newDescription = await Input.prompt({
          message: "Item description:",
          default: item.description || "",
        });
        
        item.description = newDescription || undefined;
        item.type = (item.url.includes("youtube.com") || item.url.includes("youtu.be")) ? "video" : "link";
        
        console.log("✅ Item updated");
        break;
      }
      
      case "remove-item": {
        if (content.inspiration.sections.length === 0) {
          console.log("No sections available");
          continue;
        }
        
        // Select section
        const sectionIndex = parseInt(await Input.prompt({
          message: "Section number:",
          validate: (v) => {
            const n = parseInt(v);
            return n > 0 && n <= content.inspiration.sections.length;
          }
        })) - 1;
        
        const section = content.inspiration.sections[sectionIndex];
        if (section.items.length === 0) {
          console.log("No items in this section");
          continue;
        }
        
        // Show items
        console.log("\nItems in this section:");
        section.items.forEach((item, i) => {
          console.log(`  ${i + 1}. ${item.title} (${item.type})`);
        });
        
        // Select item to remove
        const itemIndex = parseInt(await Input.prompt({
          message: "Item number to remove:",
          validate: (v) => {
            const n = parseInt(v);
            return n > 0 && n <= section.items.length;
          }
        })) - 1;
        
        const item = section.items[itemIndex];
        const confirm = await Confirm.prompt(`Remove "${item.title}"?`);
        
        if (confirm) {
          section.items.splice(itemIndex, 1);
          console.log("✅ Item removed");
        }
        break;
      }
      
      case "remove-section": {
        if (content.inspiration.sections.length === 0) {
          console.log("No sections to remove");
          continue;
        }
        
        const sectionIndex = parseInt(await Input.prompt({
          message: "Section number to remove:",
          validate: (v) => {
            const n = parseInt(v);
            return n > 0 && n <= content.inspiration.sections.length;
          }
        })) - 1;
        
        const section = content.inspiration.sections[sectionIndex];
        const confirm = await Confirm.prompt(`Remove section "${section.title}"?`);
        
        if (confirm) {
          content.inspiration.sections.splice(sectionIndex, 1);
          console.log("✅ Section removed");
        }
        break;
      }
    }
  }
}

async function main() {
  console.log("🎨 Media Showcase - Content Editor\n");
  
  const content = await loadContent();
  
  while (true) {
    const action = await Select.prompt({
      message: "What would you like to edit?",
      options: [
        { value: "site", name: "Site information" },
        { value: "galleries", name: "Photo galleries" },
        { value: "inspiration", name: "Inspiration content" },
        { value: "save", name: "Save and exit" },
        { value: "exit", name: "Exit without saving" },
      ],
    });
    
    switch (action) {
      case "site":
        await editSiteInfo(content);
        break;
      
      case "galleries":
        await manageGalleries(content);
        break;
      
      case "inspiration":
        await manageInspiration(content);
        break;
      
      case "save":
        await saveContent(content);
        console.log("\n👋 Goodbye! Run 'deno task dev' to see your changes.");
        Deno.exit(0);
      
      case "exit":
        const confirm = await Confirm.prompt("Exit without saving?");
        if (confirm) {
          console.log("\n👋 Goodbye!");
          Deno.exit(0);
        }
        break;
    }
  }
}

if (import.meta.main) {
  await main();
}