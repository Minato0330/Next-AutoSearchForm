import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "./globals.css";

export const metadata: Metadata = {
  title: "お問い合わせフォーム自動検出システム",
  description: "企業ウェブサイトから日本語のお問い合わせページとフォームを自動的に検出・分析します",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  );
}

