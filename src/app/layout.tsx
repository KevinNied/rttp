import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RTTP - Return To The Prime",
  description: "La plataforma de entrenamiento para atletas y entrenadores.",
  applicationName: "RTTP",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.png", sizes: "768x768", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "768x768", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "RTTP",
    statusBarStyle: "black-translucent",
  },
};

const themeScript = `
try {
  var theme = localStorage.getItem("rttp-theme-v1");
  var light = theme === "light";
  document.documentElement.classList.toggle("dark", !light);
  document.documentElement.classList.toggle("light", light);
  document.documentElement.style.colorScheme = light ? "light" : "dark";
} catch (_) {
  document.documentElement.classList.add("dark");
  document.documentElement.style.colorScheme = "dark";
}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-AR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} dark h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
