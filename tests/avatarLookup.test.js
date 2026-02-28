import test from "node:test";
import assert from "node:assert/strict";

import {
  extractGoogleImageUrlsFromHtml,
  normalizeImageUrl,
  sanitizePersonName,
} from "../shared/avatarLookup.js";

test("sanitizePersonName trims whitespace and trailing parentheticals", () => {
  assert.equal(sanitizePersonName("  Steve Jobs (Apple) "), "Steve Jobs");
  assert.equal(sanitizePersonName("Marcus Aurelius"), "Marcus Aurelius");
});

test("normalizeImageUrl decodes escaped separators and rejects non-http urls", () => {
  assert.equal(
    normalizeImageUrl("https:\\/\\/example.com\\/img.jpg\\u003d1\\u0026v=2"),
    "https://example.com/img.jpg=1&v=2",
  );
  assert.equal(normalizeImageUrl("data:image/png;base64,abc"), null);
});

test("extractGoogleImageUrlsFromHtml returns deduped https candidates", () => {
  const html = `
    {"ou":"https:\\/\\/images.example.com\\/person.jpg"}
    {"imgurl":"https://images.example.com/person.jpg"}
    ["https://cdn.example.com/photo.webp",200,300]
  `;

  const urls = extractGoogleImageUrlsFromHtml(html);
  assert.deepEqual(urls, [
    "https://images.example.com/person.jpg",
    "https://cdn.example.com/photo.webp",
  ]);
});
