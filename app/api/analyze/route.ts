/**
 * API route for triggering analysis
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzeCompanies } from "@/lib/analyzer";
import { generateSummary } from "@/lib/report-generator";
import { CompanyInput } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companies } = body as { companies: CompanyInput[] };

    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      return NextResponse.json(
        { error: "Invalid companies data" },
        { status: 400 }
      );
    }

    // Run analysis
    const results = await analyzeCompanies(companies, {
      timeout: 30000,
      headless: true,
      maxRetries: 2,
      contactPageKeywords: [],
    });

    // Generate summary
    const summary = generateSummary(results);

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

