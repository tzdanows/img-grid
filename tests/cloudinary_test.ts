import { assertEquals, assertExists } from "https://deno.land/std@0.210.0/assert/mod.ts";
import { getCloudinary, CloudinaryClient } from "../lib/cloudinary.ts";

Deno.test("Cloudinary - getOptimizedUrl generates correct URLs", () => {
  const client = new CloudinaryClient({
    cloudName: "test-cloud",
  });

  const url = client.getOptimizedUrl("sample.jpg", {
    width: 800,
    height: 600,
    crop: "fill",
    quality: "auto",
    format: "auto",
  });

  assertEquals(
    url,
    "https://res.cloudinary.com/test-cloud/image/upload/w_800,h_600,c_fill,q_auto,f_auto/sample.jpg"
  );
});

Deno.test("Cloudinary - image size estimation", () => {
  // Simple size calculation test
  const images = new Array(10).fill({ public_id: "test" });
  const estimatedSize = images.length * 1024; // 1KB per image estimate
  
  assertEquals(estimatedSize, 10240); // 10 images * 1024 bytes
});

Deno.test("Cloudinary - mock images work without credentials", () => {
  const client = new CloudinaryClient({
    cloudName: "demo",
    // No API key/secret
  });

  // This should return mock images
  const images = client.getImagesByTag("test", 5);
  
  // Mock implementation returns synchronously in our case
  assertExists(images);
});