import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
import { findContactPage } from "@/lib/contact-page-discovery";

export async function POST(request: NextRequest) {
  try {
    const { url, preferredLanguage } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
      const contactResult = await findContactPage(page, url, {
        preferredLanguage: preferredLanguage || "ja", // Default to Japanese
        returnAllMatches: true, // return all matches for debugging
      });
      await browser.close();

      // Log the result for debugging
      console.log(`[${url}] Contact page found:`, contactResult.url);
      console.log(`[${url}] All contact URLs:`, contactResult.allContactUrls);

      return NextResponse.json(contactResult);
    } catch (error) {
      await browser.close();
      throw error;
    }
  } catch (error) {
    console.error("Error finding contact page:", error);
    return NextResponse.json(
      {
        found: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

