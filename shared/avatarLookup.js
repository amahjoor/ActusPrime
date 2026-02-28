const REQUEST_TIMEOUT_MS = 8000;

const REQUEST_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
};

function withTimeout(fetchImpl, url, init = {}) {
  return fetchImpl(url, {
    ...init,
    headers: {
      ...REQUEST_HEADERS,
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

export function sanitizePersonName(name) {
  const raw = String(name || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!raw) return "";

  return raw.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

export function normalizeImageUrl(url) {
  const raw = String(url || "")
    .replace(/\\u003d/g, "=")
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/")
    .trim();

  if (!/^https?:\/\//i.test(raw)) return null;
  if (raw.length > 2048) return null;

  return raw;
}

export function extractGoogleImageUrlsFromHtml(html) {
  const source = String(html || "");
  if (!source) return [];

  const out = [];
  const seen = new Set();
  const patterns = [
    /"ou":"(https?:\/\/[^"]+)"/g,
    /"imgurl":"(https?:\/\/[^"]+)"/g,
    /\["(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp|avif)(?:\?[^"]*)?)",\d+,\d+\]/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source)) !== null) {
      const normalized = normalizeImageUrl(match[1]);
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      out.push(normalized);
    }
  }

  return out;
}

function firstValidImage(candidates = []) {
  for (const candidate of candidates) {
    const normalized = normalizeImageUrl(candidate);
    if (normalized) return normalized;
  }
  return null;
}

async function lookupViaSerpApi(personName, fetchImpl, env) {
  const apiKey = env.SERPAPI_API_KEY || env.SERP_API_KEY || "";
  if (!apiKey) return null;

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_images");
  url.searchParams.set("q", `${personName} portrait`);
  url.searchParams.set("hl", "en");
  url.searchParams.set("gl", "us");
  url.searchParams.set("safe", "active");
  url.searchParams.set("api_key", apiKey);

  const res = await withTimeout(fetchImpl, url.toString());
  if (!res.ok) return null;

  const data = await res.json();
  const image = firstValidImage(
    (data.images_results || []).flatMap((result) => [
      result.original,
      result.thumbnail,
      result.thumbnail_original,
    ]),
  );

  if (!image) return null;
  return { url: image, source: "serpapi-google-images" };
}

async function lookupViaGoogleScrape(personName, fetchImpl) {
  const query = encodeURIComponent(`${personName} portrait`);
  const url = `https://www.google.com/search?tbm=isch&hl=en&safe=active&q=${query}`;

  const res = await withTimeout(fetchImpl, url);
  if (!res.ok) return null;

  const html = await res.text();
  const image = firstValidImage(extractGoogleImageUrlsFromHtml(html));
  if (!image) return null;

  return { url: image, source: "google-images-scrape" };
}

async function lookupViaDuckDuckGo(personName, fetchImpl) {
  const query = `${personName} portrait`;
  const landingUrl = `https://duckduckgo.com/?q=${encodeURIComponent(
    query,
  )}&iax=images&ia=images`;

  const landingRes = await withTimeout(fetchImpl, landingUrl);
  if (!landingRes.ok) return null;

  const landingHtml = await landingRes.text();
  const vqdMatch =
    landingHtml.match(/vqd=['"]([^'"]+)['"]/) ||
    landingHtml.match(/vqd=([0-9-]+)/);
  if (!vqdMatch) return null;

  const vqd = vqdMatch[1];
  const apiUrl = new URL("https://duckduckgo.com/i.js");
  apiUrl.searchParams.set("l", "us-en");
  apiUrl.searchParams.set("o", "json");
  apiUrl.searchParams.set("q", query);
  apiUrl.searchParams.set("vqd", vqd);
  apiUrl.searchParams.set("f", ",,,");
  apiUrl.searchParams.set("p", "1");

  const apiRes = await withTimeout(fetchImpl, apiUrl.toString(), {
    headers: {
      Referer: "https://duckduckgo.com/",
    },
  });
  if (!apiRes.ok) return null;

  const data = await apiRes.json();
  const image = firstValidImage(
    (data.results || []).flatMap((result) => [result.image, result.thumbnail]),
  );
  if (!image) return null;

  return { url: image, source: "duckduckgo-images" };
}

async function lookupViaWikipedia(personName, fetchImpl) {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("redirects", "1");
  url.searchParams.set("prop", "pageimages");
  url.searchParams.set("piprop", "thumbnail");
  url.searchParams.set("pithumbsize", "512");
  url.searchParams.set("titles", personName);

  const res = await withTimeout(fetchImpl, url.toString());
  if (!res.ok) return null;

  const data = await res.json();
  const pages = data?.query?.pages ? Object.values(data.query.pages) : [];
  const image = firstValidImage(
    pages.map((page) => page?.thumbnail?.source).filter(Boolean),
  );
  if (!image) return null;

  return { url: image, source: "wikipedia-pageimages" };
}

export async function lookupAvatarImage(personName, options = {}) {
  const name = sanitizePersonName(personName);
  if (!name) return null;

  const fetchImpl = options.fetchImpl || fetch;
  const env = options.env || process.env;

  // Order matters: explicit Google API first, then scrape fallback, then other sources.
  const attempts = [
    () => lookupViaSerpApi(name, fetchImpl, env),
    () => lookupViaGoogleScrape(name, fetchImpl),
    () => lookupViaDuckDuckGo(name, fetchImpl),
    () => lookupViaWikipedia(name, fetchImpl),
  ];

  for (const attempt of attempts) {
    try {
      const result = await attempt();
      if (result?.url) return result;
    } catch {
      // Continue to next source if one provider fails.
    }
  }

  return null;
}
