import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
import { waitForDynamicContent, scrollToLoadContent } from "@/lib/spa-handler";
import { extractContactForm } from "@/lib/form-extractor";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
      // navigate to contact page
      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      // wait for dynamic content
      await waitForDynamicContent(page, 30000);
      await scrollToLoadContent(page);

      // extract form fields
      const formStructure = await extractContactForm(page);

      await browser.close();

      return NextResponse.json({
        formStructure: formStructure,
      });
    } catch (error) {
      await browser.close();
      throw error;
    }
  } catch (error) {
    console.error("Error extracting form:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

