import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finance Advisory",
  description: "Đăng ký tư vấn tài chính",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
