/**
 * API route for analyzing a single company
 */

import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
import { findContactPage } from "@/lib/contact-page-discovery";
import { extractContactForm } from "@/lib/form-extractor";
import { waitForDynamicContent, scrollToLoadContent } from "@/lib/spa-handler";
import { assessFillability } from "@/lib/fillability-assessor";
import { FillabilityStatus, AnalysisResult } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { name, url } = await request.json();

    if (!name || !url) {
      return NextResponse.json(
        { error: "Company name and URL are required" },
        { status: 400 }
      );
    }

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
      // Step 1: Find contact page
      const contactResult = await findContactPage(page, url, {
        preferredLanguage: "ja",
        returnAllMatches: false,
      });

      if (!contactResult.found || !contactResult.url) {
        await browser.close();
        return NextResponse.json({
          companyName: name,
          companyUrl: url,
          formPageFound: false,
          dynamicContentLoaded: false,
          fillabilityStatus: FillabilityStatus.NO_FORM,
          timestamp: new Date().toISOString(),
        } as AnalysisResult);
      }

      // Step 2: Extract form
      await page.goto(contactResult.url, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      await waitForDynamicContent(page, 30000);
      await scrollToLoadContent(page);

      const formStructure = await extractContactForm(page);
      const dynamicContentLoaded = true;

      // Step 3: Assess fillability
      const fillabilityResult = assessFillability(formStructure);

      await browser.close();

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
      await browser.close();
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
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

