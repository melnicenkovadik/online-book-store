#!/usr/bin/env node
/*
  Simple env checker. Fails with non-zero exit if required vars are missing.
*/

const REQUIRED = [
  "MONGODB_URI",
  "JWT_SECRET",
  "NEXT_PUBLIC_SITE_URL",
  "ADMIN_PASSWORD",
];

const OPTIONAL = [
  "NP_API_KEY",
  "UKR_TOKEN",
  "FONDY_MERCHANT_ID",
  "FONDY_SECRET_KEY",
  "FONDY_SANDBOX",
  "LIQPAY_PUBLIC_KEY",
  "LIQPAY_PRIVATE_KEY",
  "LIQPAY_SANDBOX",
  "NEXT_PUBLIC_GA_ID",
  "NEXT_PUBLIC_META_PIXEL_ID",
  "S3_ENDPOINT",
  "S3_REGION",
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "S3_PUBLIC_BASE_URL",
  "RATE_LIMIT_WINDOW_MS",
  "RATE_LIMIT_MAX",
];

function main() {
  const missing = REQUIRED.filter(
    (k) => !process.env[k] || String(process.env[k]).trim() === "",
  );

  // quick sanity checks
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const urlLooksOk =
    /^https?:\/\//i.test(siteUrl) || siteUrl === "http://localhost:3000";

  if (missing.length) {
    console.error("[check-env] Missing required env vars:", missing.join(", "));
  }
  if (!urlLooksOk) {
    console.error(
      "[check-env] NEXT_PUBLIC_SITE_URL must start with http(s)://. Got:",
      siteUrl,
    );
  }

  if (missing.length || !urlLooksOk) {
    process.exit(1);
  }

  console.log("[check-env] OK");
  // Print optional hints
  const unsetOptional = OPTIONAL.filter((k) => !process.env[k]);
  if (unsetOptional.length) {
    console.log("[check-env] Optional vars not set:", unsetOptional.join(", "));
  }
}

main();
