import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
import { waitForDynamicContent, scrollToLoadContent } from "@/lib/spa-handler";
import { extractContactForm } from "@/lib/form-extractor";

export async function POST(request: NextRequest) {
  let browser = null;

  try {
    const { url } = await request.json();

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

    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    await waitForDynamicContent(page, 30000);
    await scrollToLoadContent(page);

    const formStructure = await extractContactForm(page);

    return NextResponse.json({
      formStructure: formStructure,
    });
  } catch (error) {
    return NextResponse.json(
      {
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

