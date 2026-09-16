import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "IHI",
    description: "Innovative Hack Intelligence",
};
export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
        { media: "(prefers-color-scheme: dark)", color: "#0b0e1a" },
    ],
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
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body
                className="min-h-screen bg-[var(--ihi-surface-50)] text-[var(--ihi-surface-900)] antialiased"
                style={{ fontFamily: "var(--font-body)" }}
            >
                {children}
            </body>
        </html>
    );
}
