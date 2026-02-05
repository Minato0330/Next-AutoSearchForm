#!/usr/bin/env tsx
import { chromium } from "playwright";
import { findContactPage } from "../lib/contact-page-discovery";

async function main() {
  const companyUrl = process.argv[2];

  if (!companyUrl) {
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await findContactPage(page, companyUrl);
  } finally {
    await browser.close();
  }
}

main();

