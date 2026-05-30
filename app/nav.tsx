"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link href={href} className={active ? "active" : ""}>
      {children}
    </Link>
  );
}

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();

  // No chrome on the login screen.
  if (pathname === "/login") return null;

  async function signOut() {
    const supabase = getBrowserSupabase();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="topbar">
      <div className="brand">
        Fit <span>&amp;</span> Fresh <span>Command Center</span>
      </div>
      <nav>
        <NavLink href="/">Profitability</NavLink>
        <NavLink href="/ingredients">Ingredients</NavLink>
        <NavLink href="/settings">Cost Settings</NavLink>
        <button type="button" className="signout" onClick={signOut}>
          Sign out
        </button>
      </nav>
    </header>
  );
}
