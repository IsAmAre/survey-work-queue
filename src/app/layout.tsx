import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ระบบค้นหาสถานะงานรังวัด | สำนักงานที่ดินจังหวัดเชียงราย สาขาพญาเม็งราย",
  description: "ค้นหาสถานะงานรังวัดด้วยเลขที่คำขอและเลขที่เอกสารสิทธิ์ สำนักงานที่ดินจังหวัดเชียงราย สาขาพญาเม็งราย",
  icons: {
    icon: "/land-logo.png",
    apple: "/land-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
