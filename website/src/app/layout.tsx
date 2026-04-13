import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BlinkGuard Operator",
  description:
    "Safe AI execution for Solana. Simulate, understand, and guard every onchain action before execution.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0A0B0F] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
