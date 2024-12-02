import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/navbar";

const inter = Inter({ subsets: ["latin"] });

//import Navbar from "./navbar";

export const metadata: Metadata = {
  title: "NTU Free Food Mapper",
  description: "Map of free food timings and locations scraped from NTUFreeFood telegram channel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar/>
          {children}

      </body>
    </html>
  );
}
