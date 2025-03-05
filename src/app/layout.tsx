import ApolloClientProvider from "@/lib/ApolloProvider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppProvider } from "../context/AppContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Free Time Classes",
  description: "Free Time Classes Storefront",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ApolloClientProvider>
          <AppProvider>{children}</AppProvider>
        </ApolloClientProvider>
      </body>
    </html>
  );
}
