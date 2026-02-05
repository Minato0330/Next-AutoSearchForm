/**
 * API route for streaming analysis with real-time progress updates
 */

import { NextRequest } from "next/server";
import { analyzeCompanies } from "@/lib/analyzer";
import { generateSummary } from "@/lib/report-generator";
import { CompanyInput, AnalysisResult } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companies } = body as { companies: CompanyInput[] };

    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid companies data" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const results: AnalysisResult[] = [];
          
          // Run analysis with progress callback
          const finalResults = await analyzeCompanies(
            companies,
            {
              timeout: 30000,
              headless: true,
              maxRetries: 2,
              contactPageKeywords: [],
            },
            (completed, total, currentCompany) => {
              // Send progress update
              const progressData = {
                type: "progress",
                completed,
                total,
                currentCompany,
                percentage: Math.round((completed / total) * 100),
              };
              
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(progressData)}\n\n`)
              );
            }
          );

          // Send final results
          const summary = generateSummary(finalResults);
          const resultData = {
            type: "complete",
            data: summary,
          };
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(resultData)}\n\n`)
          );
          
          controller.close();
        } catch (error) {
          const errorData = {
            type: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          };
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`)
          );
          
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

