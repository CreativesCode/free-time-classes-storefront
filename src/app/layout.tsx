import NavbarWrapper from "@/components/NavbarWrapper";
import { AppProvider } from "@/context/AppContext";
import { UserProvider } from "@/context/UserContext";
import ApolloClientProvider from "@/lib/ApolloProvider";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
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
          <AppProvider>
            <UserProvider>
              <NavbarWrapper>{children}</NavbarWrapper>
            </UserProvider>
          </AppProvider>
        </ApolloClientProvider>
      </body>
    </html>
  );
}
