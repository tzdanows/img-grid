import { assertEquals, assertExists } from "https://deno.land/std@0.210.0/assert/mod.ts";

Deno.test("Content - JSON structure is valid", async () => {
  const contentFile = await Deno.readTextFile("./content.json").catch(() => null);
  
  if (contentFile) {
    const content = JSON.parse(contentFile);
    
    // Check required fields exist
    assertExists(content.site);
    assertExists(content.site.title);
    assertExists(content.site.owner);
    assertExists(content.navigation);
    assertExists(content.galleries);
    assertExists(content.inspiration);
    assertExists(content.theme);
    
    // Check navigation has at least home
    assertEquals(content.navigation[0].id, "home");
    assertEquals(content.navigation[0].path, "/");
  }
});

Deno.test("Content - Theme colors are valid hex", async () => {
  const contentFile = await Deno.readTextFile("./content.json").catch(() => null);
  
  if (contentFile) {
    const content = JSON.parse(contentFile);
    const theme = content.theme;
    
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    
    // Test each theme color
    assertEquals(hexColorRegex.test(theme.primaryColor), true);
    assertEquals(hexColorRegex.test(theme.backgroundColor), true);
    assertEquals(hexColorRegex.test(theme.textColor), true);
    assertEquals(hexColorRegex.test(theme.accentColor), true);
  }
});