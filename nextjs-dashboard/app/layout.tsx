import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./styles/globals.css";
import Navbar from "./components/navbar";
const inter = Inter({ subsets: ["latin"] });
import {Providers} from "./providers";
//import Navbar from "./navbar";
import { Analytics } from '@vercel/analytics/next';
import image from '/public/images/map-preview.png';
export const metadata: Metadata = {
  title: "NTU Free Food Mapper",
  description: "Visualising NTU's free food distributions in maps and timings, using data from the NTUFreeFood Telegram channel",
  metadataBase: new URL("https://ntu-free-food-mapper.vercel.app/"),
  openGraph: {
    title: 'NTU Free Food Mapper',
    description: "Visualising NTU's free food distributions in maps and timings, using data from the NTUFreeFood Telegram channel",
    url: 'https://ntu-free-food-mapper.vercel.app/',
    images: [
      {
        url: image.src, // Must be an absolute URL
        width: 800,
        height: 600,
      },
      {
        url: image.src, // Must be an absolute URL
        width: 1800,
        height: 1600,
        alt: 'My custom alt',
      },
    ],
    videos: [
      {
        url: image.src, // Must be an absolute URL
        width: 800,
        height: 600,
      },
    ],
    audio: [
      {
        url: image.src, // Must be an absolute URL
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
    <html lang="en">
      <body className={inter.className}>
        <Providers>
            {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
