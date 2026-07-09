import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IntentLock",
  description: "Enforceable intent for OKX.AI agent commerce.",
  icons: {
    icon: "/intentlock-logo.png",
    shortcut: "/intentlock-logo.png",
    apple: "/intentlock-logo.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
