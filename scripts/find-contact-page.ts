#!/usr/bin/env tsx
// find contact page URL from a company website
import { chromium } from "playwright";
import { findContactPage } from "../lib/contact-page-discovery";

async function main() {
  const companyUrl = process.argv[2];

  if (!companyUrl) {
    console.error("Usage: npm run find-contact <company-url>");
    console.error("Example: npm run find-contact https://www.mozilla.org");
    process.exit(1);
  }

  console.log(`\nSearching for contact page on: ${companyUrl}\n`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const result = await findContactPage(page, companyUrl);

    if (result.found && result.url) {
      console.log("Contact page found!");
      console.log(`URL: ${result.url}\n`);
    } else {
      console.log("Contact page not found");
      if (result.error) {
        console.log(`Error: ${result.error}\n`);
      }
    }
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
  } finally {
    await browser.close();
  }
}

main();

