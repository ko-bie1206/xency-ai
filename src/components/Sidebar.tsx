"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/lib/ThemeContext";
import { ClientSwitcher } from "@/components/ClientSwitcher";
import { BrandLogo } from "@/components/BrandLogo";
import { signOutAction } from "@/lib/authActions";
import {
  PencilIcon,
  ThreadIcon,
  HookIcon,
  LightbulbIcon,
  CalendarIcon,
  ChartIcon,
  GearIcon,
  HearingIcon,
  SunIcon,
  MoonIcon,
  CheckIcon,
} from "@/components/icons";

const NAV_ITEMS = [
  { path: "/post", label: "投稿作成", icon: PencilIcon },
  { path: "/thread", label: "スレッド作成", icon: ThreadIcon },
  { path: "/hook", label: "フック作成", icon: HookIcon },
  { path: "/theme", label: "テーマ作成", icon: LightbulbIcon },
  { path: "/schedule", label: "投稿予定", icon: CalendarIcon },
  { path: "/context", label: "コンテキストまとめ", icon: ChartIcon },
] as const;

export function Sidebar({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <BrandLogo />
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link key={item.path} href={item.path} className={`sidebar-nav-item${active ? " active" : ""}`}>
              <Icon />
              <span>{item.label}</span>
              {active && (
                <span className="row-check">
                  <CheckIcon />
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-divider" />

      <nav className="sidebar-nav">
        <Link href="/hearing" className={`sidebar-nav-item${isActive("/hearing") ? " active" : ""}`}>
          <HearingIcon />
          <span>ヒアリングAI</span>
        </Link>
        <Link href="/settings" className={`sidebar-nav-item${isActive("/settings") ? " active" : ""}`}>
          <GearIcon />
          <span>設定</span>
        </Link>
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-nav-item sidebar-theme-btn" onClick={toggleTheme}>
          {theme === "light" ? <MoonIcon /> : <SunIcon />}
          <span>{theme === "light" ? "ダークモード" : "ライトモード"}</span>
        </button>
        <ClientSwitcher panelPosition="up" />
        {userEmail && (
          <form action={signOutAction}>
            <div className="sidebar-user-email">{userEmail}</div>
            <button className="sidebar-nav-item" type="submit">
              ログアウト
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}
