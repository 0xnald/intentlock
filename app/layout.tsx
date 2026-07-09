import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IntentLock",
  description: "Enforceable intent for OKX.AI agent commerce."
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
