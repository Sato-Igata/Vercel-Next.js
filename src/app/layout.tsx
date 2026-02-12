// src/app/layout.tsx
// import "./globals.css";
import "./css/main.css";
import "./css/pop.css";

// 他のページ用CSSもここでまとめてOK

export const metadata = {
  title: "HUNTER×HUNTER",
  description: "メニュー画面",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=account_circle"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}