"use client";

import { useState } from "react";
import Link from "next/link";
import { FormStructure } from "@/lib/types";

export default function Home() {
  const [companyName, setCompanyName] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [contactPageUrl, setContactPageUrl] = useState("");
  const [loadingContact, setLoadingContact] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
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
      alert("企業URLを入力してください");
      return;
    }

    setLoadingContact(true);
    setContactResult(null);
    setFormResult(null);
    setContactPageUrl("");

    try {
      const response = await fetch("/api/find-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: companyUrl,
          preferredLanguage: "ja", // Always prefer Japanese contact pages
        }),
      });

      if (!response.ok) {
        throw new Error("お問い合わせページの検索に失敗しました");
      }

      const data = await response.json();
      setContactResult(data);
      if (data.found && data.url) {
        setContactPageUrl(data.url);
      }
    } catch (error) {
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
      alert("先にお問い合わせページを検索してください");
      return;
    }

    setLoadingForm(true);
    setFormResult(null);

    try {
      const response = await fetch("/api/extract-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: contactPageUrl }),
      });

      if (!response.ok) {
        throw new Error("フォーム情報の抽出に失敗しました");
      }

      const data = await response.json();
      setFormResult(data);
    } catch (error) {
      setFormResult({
        error: error instanceof Error ? error.message : "不明なエラー",
      });
    } finally {
      setLoadingForm(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-200">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">お問い合わせフォーム自動検出システム</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          企業ウェブサイトから日本語のお問い合わせページとフォームを自動的に検出・分析します
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">ステップ1: お問い合わせページを検索</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                企業名（任意）
              </label>
              <input
                type="text"
                className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-900"
                placeholder="株式会社サンプル"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                企業URL
              </label>
              <input
                type="url"
                className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-900"
                placeholder="https://example.com"
                value={companyUrl}
                onChange={(e) => setCompanyUrl(e.target.value)}
              />
            </div>
            <button
              onClick={handleFindContact}
              disabled={loadingContact}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loadingContact ? "検索中..." : "お問い合わせページを検索"}
            </button>
          </div>

          {contactResult && (
            <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
              {contactResult.found && contactResult.url ? (
                <div>
                  <p className="font-semibold text-green-600 dark:text-green-400 mb-2">
                    お問い合わせページが見つかりました！
                  </p>
                  {companyName && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      企業名: {companyName}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    検出されたお問い合わせページURL:
                  </p>
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
                  <p className="font-semibold text-red-600 dark:text-red-400 mb-2">
                    お問い合わせページが見つかりませんでした
                  </p>
                  {contactResult.error && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {contactResult.error}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {contactPageUrl && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">ステップ2: フォーム情報を抽出</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              お問い合わせページ: <span className="font-mono text-xs">{contactPageUrl}</span>
            </p>
            <button
              onClick={handleExtractForm}
              disabled={loadingForm}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loadingForm ? "抽出中..." : "フォーム情報を抽出"}
            </button>

            {formResult && (
              <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                {formResult.formStructure && formResult.formStructure.fields.length > 0 ? (
                  <div>
                    <p className="font-semibold text-green-600 dark:text-green-400 mb-3">
                      フォームフィールド ({formResult.formStructure.fields.length}個):
                    </p>
                    <div className="space-y-2">
                      {formResult.formStructure.fields.map((field, index) => (
                        <div
                          key={index}
                          className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {field.label || field.name || "名前なしフィールド"}
                                {field.required && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                タイプ: {field.type}
                                {field.name && ` | 名前: ${field.name}`}
                              </p>
                              {field.placeholder && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  プレースホルダー: {field.placeholder}
                                </p>
                              )}
                              {field.options && field.options.length > 0 && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  選択肢: {field.options.slice(0, 3).join(", ")}
                                  {field.options.length > 3 && "..."}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {formResult.formStructure.submitButton && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                        送信ボタン: {formResult.formStructure.submitButton}
                      </p>
                    )}
                  </div>
                ) : formResult.formStructure && formResult.formStructure.fields.length === 0 ? (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    このページにフォームフィールドが見つかりませんでした
                  </p>
                ) : formResult.error ? (
                  <div>
                    <p className="font-semibold text-red-600 dark:text-red-400 mb-2">
                      フォーム抽出に失敗しました
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formResult.error}
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">一括分析</h2>
          <p className="mb-4">
            複数の企業を一度に分析し、詳細なレポートを生成します。
          </p>
          <Link
            href="/analyze"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            一括分析を開始
          </Link>
        </div>
      </div>
    </main>
  );
}

