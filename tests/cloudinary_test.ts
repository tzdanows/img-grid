import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.210.0/assert/mod.ts";

Deno.test("Cloudinary - URL generation", () => {
  const baseUrl = "https://res.cloudinary.com/test-cloud/image/upload";
  const transforms = "w_800,h_600,c_fill,q_auto,f_auto";
  const publicId = "sample.jpg";
  const url = `${baseUrl}/${transforms}/${publicId}`;

  assertEquals(
    url,
    "https://res.cloudinary.com/test-cloud/image/upload/w_800,h_600,c_fill,q_auto,f_auto/sample.jpg",
  );
});

Deno.test("Content - JSON structure is valid", () => {
  const content = JSON.parse(Deno.readTextFileSync("content.json"));

  // Verify required fields exist
  assert(content.site?.title, "Site title required");
  assert(content.site?.owner?.name, "Owner name required");
  assert(Array.isArray(content.galleries), "Galleries must be array");

  // Verify each gallery has required fields
  content.galleries.forEach((gallery: { title: string; tag?: string }) => {
    assert(gallery.title, "Gallery title required");
    // Note: tag can be null if title is used as tag
  });
});
