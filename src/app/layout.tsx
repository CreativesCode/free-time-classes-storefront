import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Time Classes",
  description: "Find and book classes for your free time",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
