import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shababik Menu",
  description: "Digital menu for Shababik Cafe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
