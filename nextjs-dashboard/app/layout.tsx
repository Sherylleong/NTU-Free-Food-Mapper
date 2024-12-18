import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./styles/globals.css";
import Navbar from "./components/navbar";
const inter = Inter({ subsets: ["latin"] });
import {Providers} from "./providers";
//import Navbar from "./navbar";
import { Analytics } from '@vercel/analytics/next';

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
    <html lang="en" prefix="og: https://ogp.me/ns#">
      <head>
        <title>NTU Free Food Mapper</title>
        <meta property="og:title" content="NTU Free Food Mapper" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ntu-free-food-mapper.vercel.app/" />
        <meta property="og:image" content="https://ntu-free-food-mapper.vercel.app/images/map-preview.jpg" />
      </head>
      <body className={inter.className}>
        <Providers>
            {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
