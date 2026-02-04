# 使い方ガイド

## 📖 目次

1. [基本的な使い方](#基本的な使い方)
2. [Webインターフェース](#webインターフェース)
3. [コマンドライン](#コマンドライン)
4. [API使用方法](#api使用方法)
5. [トラブルシューティング](#トラブルシューティング)

## 基本的な使い方

### 1. 開発サーバーの起動

```bash
npm run dev
```

サーバーが起動したら、ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

### 2. お問い合わせページの検索

1. **企業URL**を入力欄に入力（例: `https://www.nidec.com/`）
2. **「お問い合わせページを検索」**ボタンをクリック
3. 検出されたお問い合わせページのURLが表示されます

### 3. フォーム情報の抽出

お問い合わせページが見つかったら:
1. **「フォーム情報を抽出」**ボタンをクリック
2. フォームフィールドの詳細が表示されます

## Webインターフェース

### ホームページ（/）

**機能:**
- 企業URLからお問い合わせページを検索
- 検出されたページからフォーム情報を抽出
- 2ステップのシーケンシャルワークフロー

**使用例:**

```
1. 企業URL入力: https://www.nidec.com/
2. 「お問い合わせページを検索」をクリック
3. 結果: https://www.nidec.com/jp/contact/
4. 「フォーム情報を抽出」をクリック
5. フォームフィールドの詳細が表示される
```

### 分析ページ（/analyze）

**機能:**
- 複数企業の一括分析
- CSV/JSON形式でレポート生成
- 成功率の統計表示

**使用方法:**

1. 企業リストを入力（1行に1社）:
```
日本電産,https://www.nidec.com/
オムロン,https://components.omron.com
SMC,https://www.smcworld.com
```

2. 「分析開始」ボタンをクリック
3. 結果が表形式で表示されます
4. 「CSVダウンロード」または「JSONダウンロード」でエクスポート

## コマンドライン

### お問い合わせページの検索

```bash
npm run find-contact -- --url https://www.nidec.com/
```

**オプション:**
- `--url`: 企業のホームページURL（必須）
- `--lang`: 優先言語（デフォルト: `ja`）

### 一括分析

1. `data/sample-companies.ts` を編集:

```typescript
export const sampleCompanies = [
  { name: "日本電産", url: "https://www.nidec.com/" },
  { name: "オムロン", url: "https://components.omron.com" },
  { name: "SMC", url: "https://www.smcworld.com" },
];
```

2. 分析を実行:

```bash
npm run analyze
```

3. 結果は `results/` ディレクトリに保存されます

## API使用方法

### 1. お問い合わせページ検索API

**エンドポイント:** `POST /api/find-contact`

**リクエスト:**
```json
{
  "url": "https://www.nidec.com/",
  "preferredLanguage": "ja"
}
```

**レスポンス:**
```json
{
  "found": true,
  "url": "https://www.nidec.com/jp/contact/",
  "allContactUrls": [
    "https://www.nidec.com/jp/contact/"
  ]
}
```

### 2. フォーム抽出API

**エンドポイント:** `POST /api/extract-form`

**リクエスト:**
```json
{
  "url": "https://www.nidec.com/jp/contact/"
}
```

**レスポンス:**
```json
{
  "found": true,
  "fields": [
    {
      "name": "name",
      "type": "text",
      "label": "お名前",
      "required": true
    }
  ],
  "fillability": "Full"
}
```

### 3. 一括分析API

**エンドポイント:** `POST /api/analyze`

**リクエスト:**
```json
{
  "companies": [
    { "name": "日本電産", "url": "https://www.nidec.com/" }
  ]
}
```

## トラブルシューティング

### お問い合わせページが見つからない

**原因:**
- 日本語のお問い合わせページが存在しない
- URLパターンが認識されていない
- ページの読み込みに時間がかかっている

**解決方法:**
1. ブラウザで手動でお問い合わせページを確認
2. URLパターンを確認（`/jp/`、`/ja/`など）
3. タイムアウト設定を増やす

### タイムアウトエラー

**エラーメッセージ:**
```
Error [TimeoutError]: page.goto: Timeout 30000ms exceeded.
```

**解決方法:**
- `lib/analyzer.ts` の `timeout` 設定を増やす:
```typescript
const config = {
  timeout: 60000, // 30秒 → 60秒に変更
};
```

### 英語ページが検出される

**原因:**
- 日本語ページが存在しない
- 言語設定が正しくない

**解決方法:**
1. `preferredLanguage: "ja"` が設定されているか確認
2. デバッグログを確認:
```
[Contact Discovery] Found X Japanese contact links:
  - https://example.com/jp/contact/
```

## デバッグモード

デバッグログを有効にするには、ブラウザの開発者ツールのコンソールまたはターミナルを確認してください。

**ログの例:**
```
[Contact Discovery] Found 10 contact-related links from 158 total links
[Contact Discovery] Found 1 Japanese contact links:
  - https://www.nidec.com/jp/contact/ (text: "お問い合わせ")
[Contact Discovery] Found 10 contact links. Top 10 scored:
  1. [Score: 570] https://www.nidec.com/jp/contact/
      Text: "お問い合わせ" | isJapanese: true | hasOtherLang: false
```

