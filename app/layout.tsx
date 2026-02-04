import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Contact Form Analyzer",
  description: "Automatically discover and analyze contact forms on company websites",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

