import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const SITE_URL = "https://paste2playlist.vercel.app";
export const SITE_TITLE = "Paste2Playlist";
export const SITE_DESC = "The official page for Paste2Playlist!";
export const SITE_HANDLE = "@ethanxgarrison";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
  },
  title: SITE_TITLE,
  description: SITE_DESC,
  referrer: "origin-when-cross-origin",
  keywords: [
    "spotify",
    "spotify playlist",
    "spotify playlist generator",
    "spotify playlist creator",
    "spotify playlist maker",
    "spotify playlist converter",
  ],
  openGraph: {
    locale: "en_US",
    type: "website",
    title: SITE_TITLE,
    description: SITE_DESC,
    url: SITE_URL,
    siteName: SITE_TITLE,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESC,
    creator: SITE_HANDLE,
    site: SITE_HANDLE,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
