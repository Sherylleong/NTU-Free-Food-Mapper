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
  description: "Visualising NTU's free food distributions in maps and timings, using data from the NTUFreeFood Telegram channel",
  openGraph: {
    title: 'NTU Free Food Mapper',
    description: "Visualising NTU's free food distributions in maps and timings, using data from the NTUFreeFood Telegram channel",
    url: 'https://ntu-free-food-mapper.vercel.app/',
    images: [
      {
        url: process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}/images/map-preview.png`  // Replace this with the actual image URL path
          : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdzXI1_xj7yhQo4nvtQNuPDUq7smmybBIijQ&s', // Fallback for local development, // Image path in the public folder
        width: 1800,
        height: 1600,
        alt: 'Free Food Map',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" prefix="og: https://ogp.me/ns#">
      <body className={inter.className}>
        <Providers>
            {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
