import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
import { findContactPage } from "@/lib/contact-page-discovery";
import { extractContactForm } from "@/lib/form-extractor";
import { waitForDynamicContent, scrollToLoadContent } from "@/lib/spa-handler";
import { assessFillability } from "@/lib/fillability-assessor";
import { FillabilityStatus, AnalysisResult } from "@/lib/types";

export async function POST(request: NextRequest) {
  let browser = null;

  try {
    const { name, url } = await request.json();

    if (!name || !url) {
      return NextResponse.json(
        { error: "Company name and URL are required" },
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

    try {
      const contactResult = await findContactPage(page, url, {
        preferredLanguage: "ja",
        returnAllMatches: false,
      });

      if (!contactResult.found || !contactResult.url) {
        return NextResponse.json({
          companyName: name,
          companyUrl: url,
          formPageFound: false,
          dynamicContentLoaded: false,
          fillabilityStatus: FillabilityStatus.NO_FORM,
          timestamp: new Date().toISOString(),
        } as AnalysisResult);
      }

      await page.goto(contactResult.url, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      await waitForDynamicContent(page, 30000);
      await scrollToLoadContent(page);

      const formStructure = await extractContactForm(page);
      const dynamicContentLoaded = true;

      if (!formStructure) {
        return NextResponse.json({
          companyName: name,
          companyUrl: url,
          formPageFound: true,
          formPageUrl: contactResult.url,
          dynamicContentLoaded,
          fillabilityStatus: FillabilityStatus.NO_FORM,
          errorMessage: "フォーム構造の抽出に失敗しました",
          timestamp: new Date().toISOString(),
        } as AnalysisResult);
      }

      const fillabilityResult = assessFillability(formStructure);

      return NextResponse.json({
        companyName: name,
        companyUrl: url,
        formPageFound: true,
        formPageUrl: contactResult.url,
        dynamicContentLoaded,
        fillabilityStatus: fillabilityResult.status,
        formStructure,
        mappedFields: fillabilityResult.mappedFields,
        unmappedRequiredFields: fillabilityResult.unmappedRequiredFields,
        timestamp: new Date().toISOString(),
      } as AnalysisResult);
    } catch (error) {
      return NextResponse.json({
        companyName: name,
        companyUrl: url,
        formPageFound: false,
        dynamicContentLoaded: false,
        fillabilityStatus: FillabilityStatus.NO_FORM,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      } as AnalysisResult);
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
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

