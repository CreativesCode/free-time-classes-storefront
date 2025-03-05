import ApolloClientProvider from "@/lib/ApolloProvider";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { AppProvider } from "../context/AppContext";
import "./globals.css";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

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
      <body className={poppins.className}>
        <ApolloClientProvider>
          <AppProvider>{children}</AppProvider>
        </ApolloClientProvider>
      </body>
    </html>
  );
}
