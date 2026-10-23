import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import StoreFrontShell from "@/components/StoreFrontShell";

export const metadata: Metadata = {
  title: "Kaavu Styles | For Every Version Of You",
  description:
    "Kaavu Styles luxury fashion apparel, kurtis, lehengas, and artisanal ensembles.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Jost:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-ivory text-ink min-h-screen flex flex-col font-sans selection:bg-crimson selection:text-ivory">
        <StoreProvider>
          <StoreFrontShell>{children}</StoreFrontShell>
        </StoreProvider>
      </body>
    </html>
  );
}
