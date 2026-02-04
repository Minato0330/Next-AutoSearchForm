"use client";

import { useState } from "react";
import { CompanyInput, ReportSummary } from "@/lib/types";

export default function AnalyzePage() {
  const [companies, setCompanies] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Parse companies from textarea (format: name,url per line)
      const companyList: CompanyInput[] = companies
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => {
          const [name, url] = line.split(",").map((s) => s.trim());
          return { name, url };
        })
        .filter((c) => c.name && c.url);

      if (companyList.length === 0) {
        setError("Please enter at least one company");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companies: companyList }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Contact Form Analyzer</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Analyze contact forms on company websites
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Enter Companies</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Format: Company Name, URL (one per line)
          </p>
          <textarea
            className="w-full h-48 p-4 border rounded-lg font-mono text-sm bg-gray-50 dark:bg-gray-900"
            placeholder="Example Corp, https://example.com&#10;Test Company, https://test.com"
            value={companies}
            onChange={(e) => setCompanies(e.target.value)}
          />
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Analyzing..." : "Start Analysis"}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Results</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded">
                <div className="text-2xl font-bold">{result.totalCompanies}</div>
                <div className="text-sm">Total Companies</div>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-4 rounded">
                <div className="text-2xl font-bold">
                  {result.formDiscoverySuccessRate.toFixed(1)}%
                </div>
                <div className="text-sm">Form Discovery</div>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900 p-4 rounded">
                <div className="text-2xl font-bold">
                  {result.dynamicContentSuccessRate.toFixed(1)}%
                </div>
                <div className="text-sm">Dynamic Content</div>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded">
                <div className="text-2xl font-bold">
                  {result.fillabilityBreakdown.full}
                </div>
                <div className="text-sm">Fully Fillable</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Company</th>
                    <th className="text-left p-2">Form Found</th>
                    <th className="text-left p-2">Contact Page URL</th>
                    <th className="text-left p-2">Fillability</th>
                    <th className="text-left p-2">Fields</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((r, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-2">{r.companyName}</td>
                      <td className="p-2">{r.formPageFound ? "Yes" : "No"}</td>
                      <td className="p-2">
                        {r.formPageUrl ? (
                          <a
                            href={r.formPageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {r.formPageUrl.length > 50
                              ? r.formPageUrl.substring(0, 50) + "..."
                              : r.formPageUrl}
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-2">{r.fillabilityStatus}</td>
                      <td className="p-2">{r.formStructure?.fields.length || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

