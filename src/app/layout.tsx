import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "The NorthStar | Assessment Hub",
  description: "Nền tảng luyện Aptitude và Logic cho tài năng trẻ Việt Nam",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className={`${inter.className} min-h-full bg-background text-foreground`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
