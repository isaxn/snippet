import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShareCode",
  description: "Tempat menyimpan dan berbagi snippet kode",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
