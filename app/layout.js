import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LuxuryFooter } from "./components/structure/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Danloski: Real Time Reservations",
  description: "Real Time Reservations Made Simple",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <LuxuryFooter />
      </body>
    </html>
  );
}
