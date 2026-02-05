"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input, Typography, Tabs, message, Progress } from "antd";
import type { TabsProps } from "antd";
import { FormStructure } from "@/lib/types";

const { Title, Paragraph, Text } = Typography;

export default function Home() {
  const [companyName, setCompanyName] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [contactPageUrl, setContactPageUrl] = useState("");
  const [loadingContact, setLoadingContact] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [contactProgress, setContactProgress] = useState(0);
  const [formProgress, setFormProgress] = useState(0);
  const [contactResult, setContactResult] = useState<{
    found: boolean;
    url?: string;
    error?: string;
    allContactUrls?: string[];
  } | null>(null);
  const [formResult, setFormResult] = useState<{
    formStructure?: FormStructure;
    error?: string;
  } | null>(null);

  const handleFindContact = async () => {
    if (!companyUrl.trim()) {
      message.warning("企業URLを入力してください");
      return;
    }

    setLoadingContact(true);
    setContactResult(null);
    setFormResult(null);
    setContactPageUrl("");
    setContactProgress(0);

    try {
      // Simulate progress stages
      setContactProgress(20); // Starting analysis

      const response = await fetch("/api/find-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: companyUrl,
          preferredLanguage: "ja", // Always prefer Japanese contact pages
        }),
      });

      setContactProgress(80); // Processing response

      if (!response.ok) {
        throw new Error("お問い合わせページの検索に失敗しました");
      }

      const data = await response.json();
      setContactProgress(100); // Complete

      setContactResult(data);
      if (data.found && data.url) {
        setContactPageUrl(data.url);
      }
    } catch (error) {
      setContactProgress(100);
      setContactResult({
        found: false,
        error: error instanceof Error ? error.message : "不明なエラー",
      });
    } finally {
      setLoadingContact(false);
    }
  };

  const handleExtractForm = async () => {
    if (!contactPageUrl) {
      message.warning("先にお問い合わせページを検索してください");
      return;
    }

    setLoadingForm(true);
    setFormResult(null);
    setFormProgress(0);

    try {
      // Simulate progress stages
      setFormProgress(15); // Starting extraction

      const response = await fetch("/api/extract-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: contactPageUrl }),
      });

      setFormProgress(85); // Processing form data

      if (!response.ok) {
        throw new Error("フォーム情報の抽出に失敗しました");
      }

      const data = await response.json();
      setFormProgress(100); // Complete

      setFormResult(data);
    } catch (error) {
      setFormProgress(100);
      setFormResult({
        error: error instanceof Error ? error.message : "不明なエラー",
      });
    } finally {
      setLoadingForm(false);
    }
  };

  const tabItems: TabsProps['items'] = [
    {
      key: 'search',
      label: 'お問い合わせページ検索',
      children: (
        <div className="p-4">
          <div className="mb-8">
            <Title level={2}>ステップ1: お問い合わせページを検索</Title>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  企業名（任意）
                </label>
                <Input
                  size="large"
                  placeholder="株式会社サンプル"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  企業URL
                </label>
                <Input
                  size="large"
                  type="url"
                  placeholder="https://example.com"
                  value={companyUrl}
                  onChange={(e) => setCompanyUrl(e.target.value)}
                />
              </div>
              <Button
                type="primary"
                size="large"
                onClick={handleFindContact}
                loading={loadingContact}
              >
                {loadingContact ? "検索中..." : "お問い合わせページを検索"}
              </Button>
            </div>

            {loadingContact && (
              <div className="mt-4">
                <Progress
                  percent={contactProgress}
                  status="active"
                  strokeColor={{
                    '0%': '#1890ff',
                    '100%': '#52c41a',
                  }}
                />
                <Paragraph className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {contactProgress < 50 ? "お問い合わせページを検索しています..." :
                   contactProgress < 100 ? "検索結果を処理しています..." :
                   "検索完了"}
                </Paragraph>
              </div>
            )}

            {contactResult && (
              <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                {contactResult.found && contactResult.url ? (
                  <div>
                    <Paragraph className="font-semibold text-green-600 dark:text-green-400 mb-2">
                      お問い合わせページが見つかりました！
                    </Paragraph>
                    {companyName && (
                      <Paragraph className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        企業名: {companyName}
                      </Paragraph>
                    )}
                    <Paragraph className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      検出されたお問い合わせページURL:
                    </Paragraph>
                    <a
                      href={contactResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline break-all block mb-4"
                    >
                      {contactResult.url}
                    </a>

                    {contactResult.allContactUrls && contactResult.allContactUrls.length > 1 && (
                      <details className="mt-4">
                        <summary className="text-sm font-medium cursor-pointer text-gray-700 dark:text-gray-300">
                          その他のお問い合わせページ ({contactResult.allContactUrls.length - 1}件)
                        </summary>
                        <ul className="mt-2 space-y-1 pl-4">
                          {contactResult.allContactUrls
                            .filter(url => url !== contactResult.url)
                            .map((url, index) => (
                              <li key={index}>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-500 dark:text-blue-400 hover:underline break-all"
                                >
                                  {url}
                                </a>
                              </li>
                            ))}
                        </ul>
                      </details>
                    )}
                  </div>
                ) : (
                  <div>
                    <Paragraph className="font-semibold text-red-600 dark:text-red-400 mb-2">
                      お問い合わせページが見つかりませんでした
                    </Paragraph>
                    {contactResult.error && (
                      <Paragraph className="text-sm text-gray-600 dark:text-gray-400">
                        {contactResult.error}
                      </Paragraph>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {contactPageUrl && (
            <div>
              <Title level={2}>ステップ2: フォーム情報を抽出</Title>
              <Paragraph className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                お問い合わせページ: <Text code className="text-xs">{contactPageUrl}</Text>
              </Paragraph>
              <Button
                type="primary"
                size="large"
                onClick={handleExtractForm}
                loading={loadingForm}
                style={{ backgroundColor: '#16a34a' }}
              >
                {loadingForm ? "抽出中..." : "フォーム情報を抽出"}
              </Button>

              {loadingForm && (
                <div className="mt-4">
                  <Progress
                    percent={formProgress}
                    status="active"
                    strokeColor={{
                      '0%': '#16a34a',
                      '100%': '#22c55e',
                    }}
                  />
                  <Paragraph className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {formProgress < 50 ? "フォーム情報を抽出しています..." :
                     formProgress < 100 ? "フォームデータを処理しています..." :
                     "抽出完了"}
                  </Paragraph>
                </div>
              )}

              {formResult && (
                <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                  {formResult.formStructure && formResult.formStructure.fields.length > 0 ? (
                    <div>
                      <Paragraph className="font-semibold text-green-600 dark:text-green-400 mb-3">
                        フォームフィールド ({formResult.formStructure.fields.length}個):
                      </Paragraph>
                      <div className="space-y-2">
                        {formResult.formStructure.fields.map((field, index) => (
                          <div
                            key={index}
                            className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <Paragraph className="font-medium text-sm">
                                  {field.label || field.name || "名前なしフィールド"}
                                  {field.required && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </Paragraph>
                                <Paragraph className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  タイプ: {field.type}
                                  {field.name && ` | 名前: ${field.name}`}
                                </Paragraph>
                                {field.placeholder && (
                                  <Paragraph className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    プレースホルダー: {field.placeholder}
                                  </Paragraph>
                                )}
                                {field.options && field.options.length > 0 && (
                                  <Paragraph className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    選択肢: {field.options.slice(0, 3).join(", ")}
                                    {field.options.length > 3 && "..."}
                                  </Paragraph>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {formResult.formStructure.submitButton && (
                        <Paragraph className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                          送信ボタン: {formResult.formStructure.submitButton}
                        </Paragraph>
                      )}
                    </div>
                  ) : formResult.formStructure && formResult.formStructure.fields.length === 0 ? (
                    <Paragraph className="text-sm text-yellow-600 dark:text-yellow-400">
                      このページにフォームフィールドが見つかりませんでした
                    </Paragraph>
                  ) : formResult.error ? (
                    <div>
                      <Paragraph className="font-semibold text-red-600 dark:text-red-400 mb-2">
                        フォーム抽出に失敗しました
                      </Paragraph>
                      <Paragraph className="text-sm text-gray-600 dark:text-gray-400">
                        {formResult.error}
                      </Paragraph>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'batch',
      label: '一括分析',
      children: (
        <div className="p-4">
          <Title level={2}>一括分析</Title>
          <Paragraph className="text-gray-600 dark:text-gray-400 mb-6">
            複数の企業を一度に分析し、詳細なレポートを生成します。
          </Paragraph>
          <Link href="/analyze">
            <Button type="primary" size="large">
              一括分析を開始
            </Button>
          </Link>
        </div>
      )
    }
  ];

  return (
    <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div>
        <Title level={1} className="mb-4">お問い合わせフォーム自動検出システム</Title>
        <Paragraph className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          企業ウェブサイトから日本語のお問い合わせページとフォームを自動的に検出・分析します
        </Paragraph>

        <Tabs
          defaultActiveKey="search"
          centered
          items={tabItems}
          size="large"
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg"
        />
      </div>
    </main>
  );
}

