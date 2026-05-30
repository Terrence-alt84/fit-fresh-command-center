import "./globals.css";
import type { Metadata } from "next";
import { TopBar } from "./nav";

export const metadata: Metadata = {
  title: "Fit & Fresh Command Center",
  description: "Recipe costing & meal profitability for Fit & Fresh Meals",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <TopBar />
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
