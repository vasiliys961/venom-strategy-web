import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VENOM Strategy — личная стратегия",
  description: "веб-ассистент по личной стратегии на основе метода VENOM",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
