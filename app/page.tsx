"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input, Typography, Tabs, message, Progress, Modal, Select, Checkbox } from "antd";
import type { TabsProps } from "antd";
import { FormStructure, FormField } from "@/lib/types";

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editableFormData, setEditableFormData] = useState<FormStructure | null>(null);
  const [isContactFormModalOpen, setIsContactFormModalOpen] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, any>>({});

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

      // Open modal with editable form data if extraction was successful
      if (data.formStructure && data.formStructure.fields.length > 0) {
        setEditableFormData(data.formStructure);
        setIsModalOpen(true);
      }
    } catch (error) {
      setFormProgress(100);
      setFormResult({
        error: error instanceof Error ? error.message : "不明なエラー",
      });
    } finally {
      setLoadingForm(false);
    }
  };

  const handleFieldUpdate = (index: number, field: string, value: any) => {
    if (!editableFormData) return;

    const updatedFields = [...editableFormData.fields];
    updatedFields[index] = {
      ...updatedFields[index],
      [field]: value,
    };

    setEditableFormData({
      ...editableFormData,
      fields: updatedFields,
    });
  };

  const handleAddOption = (fieldIndex: number) => {
    if (!editableFormData) return;

    const updatedFields = [...editableFormData.fields];
    const currentOptions = updatedFields[fieldIndex].options || [];
    updatedFields[fieldIndex] = {
      ...updatedFields[fieldIndex],
      options: [...currentOptions, ""],
    };

    setEditableFormData({
      ...editableFormData,
      fields: updatedFields,
    });
  };

  const handleRemoveOption = (fieldIndex: number, optionIndex: number) => {
    if (!editableFormData) return;

    const updatedFields = [...editableFormData.fields];
    const currentOptions = updatedFields[fieldIndex].options || [];
    updatedFields[fieldIndex] = {
      ...updatedFields[fieldIndex],
      options: currentOptions.filter((_, idx) => idx !== optionIndex),
    };

    setEditableFormData({
      ...editableFormData,
      fields: updatedFields,
    });
  };

  const handleUpdateOption = (fieldIndex: number, optionIndex: number, value: string) => {
    if (!editableFormData) return;

    const updatedFields = [...editableFormData.fields];
    const currentOptions = [...(updatedFields[fieldIndex].options || [])];
    currentOptions[optionIndex] = value;
    updatedFields[fieldIndex] = {
      ...updatedFields[fieldIndex],
      options: currentOptions,
    };

    setEditableFormData({
      ...editableFormData,
      fields: updatedFields,
    });
  };

  const handleSaveFormData = () => {
    if (!editableFormData) return;

    // Update the formResult with the edited data
    setFormResult({
      formStructure: editableFormData,
    });

    message.success("フォーム情報が保存されました");
    setIsModalOpen(false);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
  };

  const handleOpenContactForm = () => {
    if (!formResult?.formStructure) {
      message.warning("先にフォーム情報を抽出してください");
      return;
    }
    // Initialize form values
    const initialValues: Record<string, any> = {};
    formResult.formStructure.fields.forEach(field => {
      initialValues[field.name] = "";
    });
    setFormValues(initialValues);
    setIsContactFormModalOpen(true);
  };

  const handleFormValueChange = (fieldName: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleContactFormSubmit = () => {
    if (!formResult?.formStructure) return;

    // Validate required fields
    const missingFields: string[] = [];
    formResult.formStructure.fields.forEach(field => {
      if (field.required && !formValues[field.name]) {
        missingFields.push(field.label || field.name);
      }
    });

    if (missingFields.length > 0) {
      message.error(`以下の必須項目を入力してください: ${missingFields.join(", ")}`);
      return;
    }

    // Show success message with filled data
    console.log("Form submitted with values:", formValues);
    message.success("フォームが送信されました！");
    setIsContactFormModalOpen(false);
  };

  const handleContactFormCancel = () => {
    setIsContactFormModalOpen(false);
  };

  // Helper function to render form fields based on type
  const renderFormField = (field: FormField) => {
    const commonProps = {
      value: formValues[field.name] || "",
      placeholder: field.placeholder,
    };

    switch (field.type) {
      case "textarea":
        return (
          <TextArea
            {...commonProps}
            onChange={(e) => handleFormValueChange(field.name, e.target.value)}
            rows={4}
          />
        );

      case "select":
        return (
          <Select
            value={formValues[field.name] || undefined}
            onChange={(value) => handleFormValueChange(field.name, value)}
            placeholder={field.placeholder}
            className="w-full"
            options={field.options?.map(opt => ({ value: opt, label: opt }))}
          />
        );

      case "checkbox":
        if (field.options && field.options.length > 0) {
          // Multiple checkboxes
          return (
            <Checkbox.Group
              value={formValues[field.name] || []}
              onChange={(values) => handleFormValueChange(field.name, values)}
              options={field.options}
            />
          );
        } else {
          // Single checkbox
          return (
            <Checkbox
              checked={formValues[field.name] || false}
              onChange={(e) => handleFormValueChange(field.name, e.target.checked)}
            >
              {field.label}
            </Checkbox>
          );
        }

      case "radio":
        return (
          <Input.Group>
            {field.options?.map((option, idx) => (
              <div key={idx} className="mb-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name={field.name}
                    value={option}
                    checked={formValues[field.name] === option}
                    onChange={(e) => handleFormValueChange(field.name, e.target.value)}
                    className="mr-2"
                  />
                  {option}
                </label>
              </div>
            ))}
          </Input.Group>
        );

      case "email":
        return (
          <Input
            {...commonProps}
            type="email"
            onChange={(e) => handleFormValueChange(field.name, e.target.value)}
          />
        );

      case "tel":
        return (
          <Input
            {...commonProps}
            type="tel"
            onChange={(e) => handleFormValueChange(field.name, e.target.value)}
          />
        );

      case "number":
        return (
          <Input
            {...commonProps}
            type="number"
            onChange={(e) => handleFormValueChange(field.name, e.target.value)}
          />
        );

      case "url":
        return (
          <Input
            {...commonProps}
            type="url"
            onChange={(e) => handleFormValueChange(field.name, e.target.value)}
          />
        );

      case "date":
        return (
          <Input
            {...commonProps}
            type="date"
            onChange={(e) => handleFormValueChange(field.name, e.target.value)}
          />
        );

      default:
        // text and other types
        return (
          <Input
            {...commonProps}
            onChange={(e) => handleFormValueChange(field.name, e.target.value)}
          />
        );
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

                      {/* Button to open contact form modal */}
                      <div className="mt-4">
                        <Button
                          type="primary"
                          size="large"
                          onClick={handleOpenContactForm}
                          style={{ backgroundColor: '#9333ea' }}
                        >
                          フォームを開く
                        </Button>
                      </div>
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

      {/* Modal for editing form fields */}
      <Modal
        title="フォーム情報を編集"
        open={isModalOpen}
        onOk={handleSaveFormData}
        onCancel={handleModalCancel}
        width={900}
        okText="保存"
        cancelText="キャンセル"
      >
        {editableFormData && (
          <div className="space-y-4 max-h-[600px] overflow-y-auto py-4">
            <Paragraph className="text-gray-600 dark:text-gray-400 mb-4">
              抽出されたフォームフィールドを編集できます。各フィールドの情報を確認・修正してください。
            </Paragraph>

            {editableFormData.fields.map((field, index) => (
              <div
                key={index}
                className="p-5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm"
              >
                <div className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <Text strong className="text-base">
                    フィールド {index + 1}
                    {field.required && <span className="text-red-500 ml-2">*</span>}
                  </Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400 ml-3">
                    ({field.type})
                  </Text>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Label */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      ラベル
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <Input
                      value={field.label || ""}
                      onChange={(e) => handleFieldUpdate(index, "label", e.target.value)}
                      placeholder="例: お名前、メールアドレス"
                    />
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      名前 (name属性)
                    </label>
                    <Input
                      value={field.name || ""}
                      onChange={(e) => handleFieldUpdate(index, "name", e.target.value)}
                      placeholder="例: name, email"
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      タイプ
                    </label>
                    <Select
                      value={field.type}
                      onChange={(value) => handleFieldUpdate(index, "type", value)}
                      className="w-full"
                      options={[
                        { value: "text", label: "text" },
                        { value: "email", label: "email" },
                        { value: "tel", label: "tel" },
                        { value: "textarea", label: "textarea" },
                        { value: "select", label: "select" },
                        { value: "checkbox", label: "checkbox" },
                        { value: "radio", label: "radio" },
                        { value: "number", label: "number" },
                        { value: "url", label: "url" },
                        { value: "date", label: "date" },
                      ]}
                    />
                  </div>

                  {/* Placeholder */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      プレースホルダー
                    </label>
                    <Input
                      value={field.placeholder || ""}
                      onChange={(e) => handleFieldUpdate(index, "placeholder", e.target.value)}
                      placeholder="例: 山田太郎"
                    />
                  </div>

                  {/* Required */}
                  <div className="col-span-2">
                    <Checkbox
                      checked={field.required}
                      onChange={(e) => handleFieldUpdate(index, "required", e.target.checked)}
                    >
                      <span className="font-medium">必須フィールド</span>
                    </Checkbox>
                  </div>

                  {/* Options (for select, radio, checkbox) */}
                  {(field.type === "select" || field.type === "radio" || field.type === "checkbox") && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        選択肢
                        {(field.type === "radio" || (field.type === "checkbox" && field.options && field.options.length > 1)) && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            (グループ化されたフィールド)
                          </span>
                        )}
                      </label>
                      <div className="space-y-2">
                        {field.options && field.options.length > 0 ? (
                          field.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-2">
                              <span className="text-sm text-gray-500 dark:text-gray-400 w-8">
                                {optionIndex + 1}.
                              </span>
                              <Input
                                value={option}
                                onChange={(e) => handleUpdateOption(index, optionIndex, e.target.value)}
                                placeholder={`選択肢 ${optionIndex + 1}`}
                                className="flex-1"
                              />
                              <Button
                                type="text"
                                danger
                                size="small"
                                onClick={() => handleRemoveOption(index, optionIndex)}
                              >
                                削除
                              </Button>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                            選択肢がありません
                          </div>
                        )}
                        <Button
                          type="dashed"
                          onClick={() => handleAddOption(index)}
                          className="w-full mt-2"
                        >
                          + 選択肢を追加
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Submit Button */}
            {editableFormData.submitButton && (
              <div className="p-5 border border-gray-200 dark:border-gray-700 rounded-lg bg-blue-50 dark:bg-blue-900/20 shadow-sm">
                <div className="mb-3">
                  <Text strong className="text-base">送信ボタン</Text>
                </div>
                <Input
                  value={editableFormData.submitButton}
                  onChange={(e) => setEditableFormData({
                    ...editableFormData,
                    submitButton: e.target.value,
                  })}
                  placeholder="例: 送信する"
                />
              </div>
            )}

            {/* Form Action and Method Info */}
            {(editableFormData.action || editableFormData.method) && (
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm">
                <Text strong className="block mb-2">フォーム情報</Text>
                {editableFormData.action && (
                  <div className="mb-1">
                    <span className="text-gray-600 dark:text-gray-400">送信先: </span>
                    <span className="font-mono text-xs">{editableFormData.action}</span>
                  </div>
                )}
                {editableFormData.method && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">メソッド: </span>
                    <span className="font-mono text-xs">{editableFormData.method.toUpperCase()}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal for displaying contact form */}
      <Modal
        title={`お問い合わせフォーム${contactPageUrl ? ` - ${new URL(contactPageUrl).hostname}` : ''}`}
        open={isContactFormModalOpen}
        onOk={handleContactFormSubmit}
        onCancel={handleContactFormCancel}
        width={700}
        okText={formResult?.formStructure?.submitButton || "送信"}
        cancelText="キャンセル"
      >
        {formResult?.formStructure && (
          <div className="space-y-4 max-h-[600px] overflow-y-auto py-4">
            <Paragraph className="text-gray-600 dark:text-gray-400 mb-4">
              抽出されたお問い合わせフォームです。各フィールドに入力してください。
            </Paragraph>

            {formResult.formStructure.fields.map((field, index) => (
              <div key={index} className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  {field.label || field.name || `フィールド ${index + 1}`}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderFormField(field)}
              </div>
            ))}

            {/* Display form action and method info */}
            {(formResult.formStructure.action || formResult.formStructure.method) && (
              <div className="mt-6 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">
                {formResult.formStructure.action && (
                  <div>送信先: {formResult.formStructure.action}</div>
                )}
                {formResult.formStructure.method && (
                  <div>メソッド: {formResult.formStructure.method.toUpperCase()}</div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </main>
  );
}

