import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Noto_Sans_Thai } from "next/font/google";
import { BottomNav } from "@/components/bottom-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toaster } from "@/components/toaster";
import "./globals.css";

const notoThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "600", "800"],
});

export const metadata: Metadata = {
  title: "เดี๋ยวโอน — หารบิลแบบไม่อึดอัด",
  description: "หารบิลกับเพื่อน สร้าง QR PromptPay รายคน แล้วให้ระบบเตือนแทนเรา",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef3f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1420" },
  ],
};

// ตั้งธีมก่อนหน้าเว็บวาดภาพ กันจอสว่างวาบตอนเปิดในโหมดมืด
const themeScript = `(function(){try{var t=localStorage.getItem('diawon:theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={notoThai.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh font-sans antialiased">
        <header className="mx-auto flex max-w-md items-center justify-between px-5 pt-6">
          <Link href="/" className="text-xl font-extrabold tracking-tight">
            เดี๋ยวโอน<span className="text-brand">.</span>
          </Link>
          <ThemeToggle />
        </header>
        {children}
        <BottomNav />
        <Toaster />
      </body>
    </html>
  );
}
