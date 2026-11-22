import type { Metadata } from "next";
import { Bebas_Neue, Outfit } from "next/font/google";
import { SiteProvider } from "@/components/SiteProvider";
import { WaitlistDialog } from "@/components/WaitlistDialog";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

export const metadata: Metadata = {
  title: "MCC Turn It Up | Chicago",
  description:
    "MCC Turn It Up is a one-day community music festival at Columbus Park, Chicago. Join the waitlist for ticket updates.",
  openGraph: {
    title: "MCC Turn It Up | Chicago",
    description: "Your next favorite night starts here. EDM, music, and community in Chicago.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${bebas.variable}`}>
      <body>
        <SiteProvider>
          {children}
          <WaitlistDialog />
        </SiteProvider>
      </body>
    </html>
  );
}
