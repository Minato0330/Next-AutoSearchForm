import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
import { findContactPage } from "@/lib/contact-page-discovery";

export async function POST(request: NextRequest) {
  let browser = null;

  try {
    const { url, preferredLanguage } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-extensions',
        '--disable-component-extensions-with-background-pages',
      ],
    });

    const page = await browser.newPage();

    const contactResult = await findContactPage(page, url, {
      preferredLanguage: preferredLanguage || "ja",
      returnAllMatches: true,
    });

    return NextResponse.json(contactResult);
  } catch (error) {
    return NextResponse.json(
      {
        found: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    if (browser) {
      try {
        const pages = browser.contexts().flatMap(context => context.pages());
        await Promise.all(pages.map(page => page.close().catch(() => {})));
        await browser.close();
      } catch (error) {
        try {
          await browser.close();
        } catch {
        }
      }
    }
  }
}

