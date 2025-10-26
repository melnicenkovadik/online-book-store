import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";
import { Footer } from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { QueryProvider } from "@/providers/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Магазин підручників",
  description: "Онлайн магазин підручників",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <NuqsAdapter>
          <QueryProvider>
            <Header />
            <main>
              <div
                style={{ maxWidth: 1480, margin: "0 auto", padding: "16px" }}
              >
                {children}
              </div>
            </main>
            <Footer />
          </QueryProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
