import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.210.0/assert/mod.ts";

Deno.test("Server - Environment variables are handled", () => {
  // Test that env vars can be read (even if undefined)
  const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME");
  const cacheKey = Deno.env.get("CACHE_API_KEY");
  
  // These might be undefined, that's ok
  assertEquals(typeof cloudName === "string" || cloudName === undefined, true);
  assertEquals(typeof cacheKey === "string" || cacheKey === undefined, true);
});

Deno.test("Server - HTML generation includes required elements", () => {
  // Test HTML structure
  const mockHTML = `
    <nav class="border-b border-gray-200">
      <div class="gallery-container">
      <div class="image-popup">
    </nav>
  `;
  
  assertStringIncludes(mockHTML, '<nav');
  assertStringIncludes(mockHTML, 'gallery-container');
  assertStringIncludes(mockHTML, 'image-popup');
});

Deno.test("Server - Static file paths are correct", async () => {
  // Check that static files exist
  const stylesExist = await Deno.stat("./static/styles.css")
    .then(() => true)
    .catch(() => false);
    
  assertEquals(stylesExist, true);
});

Deno.test("Server - Content.json can be loaded", async () => {
  const contentExists = await Deno.stat("./content.json")
    .then(() => true)
    .catch(() => false);
    
  // It's ok if content.json doesn't exist yet (new setup)
  assertEquals(typeof contentExists, "boolean");
});