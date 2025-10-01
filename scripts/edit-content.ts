#!/usr/bin/env -S deno run -A

import {
  Confirm,
  Input,
  Number,
  Select,
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
  } catch {
    console.log(
      "No existing content.json found. Creating new configuration...",
    );
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
        social: {},
      },
    },
    navigation: [
      { id: "home", title: "Home", path: "/" },
    ],
    galleries: [],
    links: {
      title: "Links",
      description: "Content that inspires and educates",
      sections: [],
    },
    theme: {
      primaryColor: "#2563eb",
      backgroundColor: "#000000",
      textColor: "#ffffff",
      accentColor: "#3b82f6",
    },
  };
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

// Homepage management
async function manageHomepage(content: SiteContent): Promise<void> {
  while (true) {
    console.log("\n🏠 Homepage Management\n");
    console.log("Current sections:");
    console.log(`  1. bio1: ${content.site.owner.bio.substring(0, 50)}...`);
    if (content.site.owner.bio2) {
      console.log(
        `  2. bio2: ${content.site.owner.bio2.substring(0, 50)}...`,
      );
    }
    if (content.site.owner.bio3) {
      console.log(
        `  3. bio3: ${content.site.owner.bio3.substring(0, 50)}...`,
      );
    }
    if (content.site.owner.bio4) {
      console.log(
        `  4. bio4: ${content.site.owner.bio4.substring(0, 50)}...`,
      );
    }
    if (content.site.owner.bio5) {
      console.log(
        `  5. bio5: ${content.site.owner.bio5.substring(0, 50)}...`,
      );
    }
    if (content.site.owner.hobbies && content.site.owner.hobbies.length > 0) {
      console.log(
        `  - hobbies: ${content.site.owner.hobbies.join(", ")}`,
      );
    }
    if (content.site.owner.quote) {
      console.log(`  - quote: "${content.site.owner.quote}"`);
    }

    const options = [
      { value: "edit-bio1", name: "Edit bio1 (main bio)" },
    ];

    // Add edit options for existing bios
    if (content.site.owner.bio2) {
      options.push({ value: "edit-bio2", name: "Edit bio2" });
    }
    if (content.site.owner.bio3) {
      options.push({ value: "edit-bio3", name: "Edit bio3" });
    }
    if (content.site.owner.bio4) {
      options.push({ value: "edit-bio4", name: "Edit bio4" });
    }
    if (content.site.owner.bio5) {
      options.push({ value: "edit-bio5", name: "Edit bio5" });
    }

    // Add "add bio" option if we haven't reached the limit
    const bioCount = [
      content.site.owner.bio,
      content.site.owner.bio2,
      content.site.owner.bio3,
      content.site.owner.bio4,
      content.site.owner.bio5,
    ].filter(Boolean).length;

    if (bioCount < 5) {
      options.push({ value: "add-bio", name: `Add bio${bioCount + 1}` });
    }

    // Add remove bio options
    if (content.site.owner.bio5) {
      options.push({ value: "remove-bio5", name: "Remove bio5" });
    }
    if (content.site.owner.bio4) {
      options.push({ value: "remove-bio4", name: "Remove bio4" });
    }
    if (content.site.owner.bio3) {
      options.push({ value: "remove-bio3", name: "Remove bio3" });
    }
    if (content.site.owner.bio2) {
      options.push({ value: "remove-bio2", name: "Remove bio2" });
    }

    options.push(
      { value: "edit-hobbies", name: "Edit hobbies" },
      { value: "edit-quote", name: "Edit quote" },
      { value: "back", name: "Back to main menu" },
    );

    // @ts-ignore: Cliffy returns value string despite options being objects
    const action: string = await Select.prompt({
      message: "What would you like to do?",
      options: options,
    });

    if (action === "back") break;

    switch (action) {
      case "edit-bio1":
        content.site.owner.bio = await Input.prompt({
          message: "Bio1 (main bio):",
          default: content.site.owner.bio,
        });
        console.log("✅ Bio1 updated");
        break;

      case "edit-bio2":
        content.site.owner.bio2 = await Input.prompt({
          message: "Bio2:",
          default: content.site.owner.bio2 || "",
        });
        console.log("✅ Bio2 updated");
        break;

      case "edit-bio3":
        content.site.owner.bio3 = await Input.prompt({
          message: "Bio3:",
          default: content.site.owner.bio3 || "",
        });
        console.log("✅ Bio3 updated");
        break;

      case "edit-bio4":
        content.site.owner.bio4 = await Input.prompt({
          message: "Bio4:",
          default: content.site.owner.bio4 || "",
        });
        console.log("✅ Bio4 updated");
        break;

      case "edit-bio5":
        content.site.owner.bio5 = await Input.prompt({
          message: "Bio5:",
          default: content.site.owner.bio5 || "",
        });
        console.log("✅ Bio5 updated");
        break;

      case "add-bio": {
        const bioNum = bioCount + 1;
        const bioText = await Input.prompt({
          message: `Bio${bioNum}:`,
          default: "",
        });

        if (bioText.trim()) {
          if (bioNum === 2) content.site.owner.bio2 = bioText;
          else if (bioNum === 3) content.site.owner.bio3 = bioText;
          else if (bioNum === 4) content.site.owner.bio4 = bioText;
          else if (bioNum === 5) content.site.owner.bio5 = bioText;

          console.log(`✅ Bio${bioNum} added`);
        }
        break;
      }

      case "remove-bio2":
        if (await Confirm.prompt("Remove bio2?")) {
          content.site.owner.bio2 = undefined;
          console.log("✅ Bio2 removed");
        }
        break;

      case "remove-bio3":
        if (await Confirm.prompt("Remove bio3?")) {
          content.site.owner.bio3 = undefined;
          console.log("✅ Bio3 removed");
        }
        break;

      case "remove-bio4":
        if (await Confirm.prompt("Remove bio4?")) {
          content.site.owner.bio4 = undefined;
          console.log("✅ Bio4 removed");
        }
        break;

      case "remove-bio5":
        if (await Confirm.prompt("Remove bio5?")) {
          content.site.owner.bio5 = undefined;
          console.log("✅ Bio5 removed");
        }
        break;

      case "edit-hobbies": {
        const currentHobbies = content.site.owner.hobbies?.join(", ") || "";
        const hobbyInput = await Input.prompt({
          message: "Hobbies (comma-separated, or press Enter to remove):",
          default: currentHobbies,
        });

        if (hobbyInput.trim()) {
          content.site.owner.hobbies = hobbyInput
            .split(",")
            .map((h) => h.trim())
            .filter((h) => h.length > 0);
          console.log("✅ Hobbies updated");
        } else {
          content.site.owner.hobbies = undefined;
          console.log("✅ Hobbies removed");
        }
        break;
      }

      case "edit-quote": {
        const currentQuote = content.site.owner.quote || "";
        const quoteInput = await Input.prompt({
          message: "Quote (or press Enter to remove):",
          default: currentQuote,
        });

        if (quoteInput.trim()) {
          content.site.owner.quote = quoteInput;
          console.log("✅ Quote updated");
        } else {
          content.site.owner.quote = undefined;
          console.log("✅ Quote removed");
        }
        break;
      }
    }
  }
}

// Gallery management
async function manageGalleries(content: SiteContent): Promise<void> {
  while (true) {
    console.log("\n📸 Gallery Management\n");
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
        const id = await Input.prompt({
          message: "Gallery ID (used in URL):",
          validate: (v) => v.length > 0 || "ID is required",
        });
        const title = await Input.prompt({
          message: "Gallery title:",
          default: id,
        });
        const description = await Input.prompt({
          message: "Gallery description:",
          default: `${title} photography`,
        });
        const cloudinaryTag = await Input.prompt({
          message: "Cloudinary tag:",
          default: id.toLowerCase(),
        });

        content.galleries.push({
          id,
          title,
          description,
          cloudinaryTag,
          layout: "grid",
        });

        // Add to navigation
        if (!content.navigation.find((n) => n.path === `/${id}`)) {
          content.navigation.push({
            id,
            title,
            path: `/${id}`,
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

        const galleryIndex = parseInt(
          await Input.prompt({
            message: "Gallery number to edit:",
            validate: (v) => {
              const n = parseInt(v);
              return (n > 0 && n <= content.galleries.length) ||
                "Invalid gallery number";
            },
          }),
        ) - 1;

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

        // Update navigation
        const navItem = content.navigation.find((n) =>
          n.path === `/${gallery.id}`
        );
        if (navItem) {
          navItem.title = gallery.title;
        }

        console.log("✅ Gallery updated");
        break;
      }

      case "remove": {
        if (content.galleries.length === 0) {
          console.log("No galleries to remove");
          continue;
        }

        const galleryIndex = parseInt(
          await Input.prompt({
            message: "Gallery number to remove:",
            validate: (v) => {
              const n = parseInt(v);
              return (n > 0 && n <= content.galleries.length) ||
                "Invalid gallery number";
            },
          }),
        ) - 1;

        const gallery = content.galleries[galleryIndex];
        const confirm = await Confirm.prompt(
          `Remove gallery "${gallery.title}"?`,
        );

        if (confirm) {
          content.galleries.splice(galleryIndex, 1);
          // Remove from navigation
          const navIndex = content.navigation.findIndex((n) =>
            n.path === `/${gallery.id}`
          );
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

// Links management
async function manageLinks(content: SiteContent): Promise<void> {
  while (true) {
    console.log("\n🔗 Links Management\n");

    const totalLinks = content.links.sections.reduce(
      (sum, section) => sum + section.items.length,
      0,
    );

    console.log(`Current links: ${totalLinks}`);
    if (totalLinks > 0) {
      console.log("\nLinks:");
      content.links.sections.forEach((section) => {
        section.items.forEach((item, i) => {
          console.log(`  ${i + 1}. ${item.title} - ${item.url}`);
        });
      });
    }

    const action = await Select.prompt({
      message: "What would you like to do?",
      options: [
        { value: "add", name: "Add link(s)" },
        { value: "edit", name: "Edit existing link" },
        { value: "remove", name: "Remove link" },
        { value: "back", name: "Back to main menu" },
      ],
    });

    if (action === "back") break;

    // Ensure we have at least one section
    if (content.links.sections.length === 0) {
      content.links.sections.push({
        title: "Links",
        items: [],
      });
    }

    const sectionIndex = 0; // Always use the first section

    switch (action) {
      case "add": {
        const numLinks = await Number.prompt({
          message: "How many links to add?",
          default: 1,
          min: 1,
          max: 20,
        });

        console.log(`\n🔗 Adding ${numLinks} link(s):\n`);

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

          content.links.sections[sectionIndex].items.push({
            title,
            url,
            type: "link",
            description: description || undefined,
          });

          console.log(`✅ Added "${title}"`);
        }
        break;
      }

      case "edit": {
        if (totalLinks === 0) {
          console.log("No links to edit");
          continue;
        }

        const allItems = content.links.sections.flatMap((s) => s.items);

        const itemIndex = parseInt(
          await Input.prompt({
            message: "Link number to edit:",
            validate: (v) => {
              const n = parseInt(v);
              return (n > 0 && n <= allItems.length) || "Invalid link number";
            },
          }),
        ) - 1;

        const item = allItems[itemIndex];

        item.title = await Input.prompt({
          message: "Link title:",
          default: item.title,
        });

        item.url = await Input.prompt({
          message: "URL:",
          default: item.url,
          validate: (value) => {
            if (!isValidUrl(value)) {
              return "Please enter a valid URL";
            }
            return true;
          },
        });

        const newDescription = await Input.prompt({
          message: "Description:",
          default: item.description || "",
        });

        item.description = newDescription || undefined;
        console.log("✅ Link updated");
        break;
      }

      case "remove": {
        if (totalLinks === 0) {
          console.log("No links to remove");
          continue;
        }

        const allItems = content.links.sections.flatMap((s) => s.items);

        const itemIndex = parseInt(
          await Input.prompt({
            message: "Link number to remove:",
            validate: (v) => {
              const n = parseInt(v);
              return (n > 0 && n <= allItems.length) || "Invalid link number";
            },
          }),
        ) - 1;

        const item = allItems[itemIndex];
        const confirm = await Confirm.prompt(`Remove "${item.title}"?`);

        if (confirm) {
          // Find and remove the item
          for (const section of content.links.sections) {
            const idx = section.items.indexOf(item);
            if (idx > -1) {
              section.items.splice(idx, 1);
              break;
            }
          }
          console.log("✅ Link removed");
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
        { value: "homepage", name: "Homepage (bio, hobbies, quote)" },
        { value: "galleries", name: "Galleries (photo collections)" },
        { value: "links", name: "Links (inspiration page)" },
        { value: "save", name: "Save and exit" },
        { value: "exit", name: "Exit without saving" },
      ],
    });

    switch (action) {
      case "homepage":
        await manageHomepage(content);
        break;

      case "galleries":
        await manageGalleries(content);
        break;

      case "links":
        await manageLinks(content);
        break;

      case "save":
        await saveContent(content);
        console.log("\n👋 Goodbye! Run 'deno task dev' to see your changes.");
        Deno.exit(0);
        break;

      case "exit": {
        const confirm = await Confirm.prompt("Exit without saving?");
        if (confirm) {
          console.log("\n👋 Goodbye!");
          Deno.exit(0);
        }
        break;
      }
    }
  }
}

if (import.meta.main) {
  await main();
}
