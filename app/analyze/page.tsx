"use client";

import { useState } from "react";
import { CompanyInput, ReportSummary } from "@/lib/types";
import { Button, Input, Typography, Progress, message } from "antd";

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

export default function AnalyzePage() {
  const [companies, setCompanies] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(0);
    setProgressText("");

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
        message.warning("少なくとも1社を入力してください");
        setLoading(false);
        return;
      }

      // Use streaming API for parallel processing with real-time progress
      const response = await fetch("/api/analyze-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companies: companyList }),
      });

      if (!response.ok) {
        throw new Error("分析に失敗しました");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("ストリームの読み取りに失敗しました");
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));

            if (data.type === "progress") {
              setProgress(data.percentage);
              setProgressText(
                `企業 ${data.completed} / ${data.total} を分析中: ${data.currentCompany}`
              );
            } else if (data.type === "complete") {
              setResult(data.data);
              setProgress(100);
              setProgressText("分析完了！");
            } else if (data.type === "error") {
              throw new Error(data.error);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "不明なエラー");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <Title level={1} className="mb-4">お問い合わせフォーム一括分析</Title>
        <Paragraph className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          複数企業のお問い合わせフォームを一括で分析します
        </Paragraph>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <Title level={2} className="mb-4">企業リストを入力</Title>
          <Paragraph className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            形式: 企業名, URL（1行に1社）
          </Paragraph>
          <TextArea
            rows={8}
            className="font-mono"
            placeholder="株式会社サンプル, https://example.com&#10;テスト株式会社, https://test.com"
            value={companies}
            onChange={(e) => setCompanies(e.target.value)}
          />
          <Button
            type="primary"
            size="large"
            onClick={handleAnalyze}
            loading={loading}
            className="mt-4"
          >
            {loading ? "分析中..." : "分析を開始"}
          </Button>

          {loading && (
            <div className="mt-4">
              <Progress
                percent={progress}
                status="active"
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
              <Paragraph className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {progressText || "分析を準備しています..."}
              </Paragraph>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <Title level={2} className="mb-4">分析結果</Title>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded">
                <div className="text-2xl font-bold">{result.totalCompanies}</div>
                <div className="text-sm">総企業数</div>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-4 rounded">
                <div className="text-2xl font-bold">
                  {result.formDiscoverySuccessRate.toFixed(1)}%
                </div>
                <div className="text-sm">フォーム検出率</div>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900 p-4 rounded">
                <div className="text-2xl font-bold">
                  {result.dynamicContentSuccessRate.toFixed(1)}%
                </div>
                <div className="text-sm">動的コンテンツ</div>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded">
                <div className="text-2xl font-bold">
                  {result.fillabilityBreakdown.full}
                </div>
                <div className="text-sm">完全入力可能</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">企業名</th>
                    <th className="text-left p-2">フォーム検出</th>
                    <th className="text-left p-2">お問い合わせページURL</th>
                    <th className="text-left p-2">入力可能性</th>
                    <th className="text-left p-2">フィールド数</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((r, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-2">{r.companyName}</td>
                      <td className="p-2">{r.formPageFound ? "有" : "無"}</td>
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

