import "./globals.css";
import type { Metadata } from "next";
import { NavLink } from "./nav";

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
        <header className="topbar">
          <div className="brand">
            Fit <span>&amp;</span> Fresh <span>Command Center</span>
          </div>
          <nav>
            <NavLink href="/">Profitability</NavLink>
            <NavLink href="/ingredients">Ingredients</NavLink>
            <NavLink href="/settings">Cost Settings</NavLink>
          </nav>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
