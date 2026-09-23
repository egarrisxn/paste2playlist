import type { Metadata, Viewport } from "next";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://paste2playlist.vercel.app"),
  title: "Paste2Playlist",
  description: "Create Spotify playlists from text.",
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
    title: "Paste2Playlist",
    description: "Create Spotify playlists from text.",
    url: "https://paste2playlist.vercel.app",
    siteName: "Paste2Playlist",
  },
  twitter: {
    card: "summary_large_image",
    title: "Paste2Playlist",
    description: "Create Spotify playlists from text.",
    creator: "@ethanxgarrison",
    site: "@ethanxgarrison",
  },
};

export const viewport: Viewport = {
  initialScale: 1,
  width: "device-width",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-title" content="Paste2Playlist" />
      </head>
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
