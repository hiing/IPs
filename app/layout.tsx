import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "IP Insight — IP Geolocation & Security Analysis",
    description:
        "Premium IP address lookup tool with geolocation mapping, ISP data, timezone, currency info, and real-time security threat detection.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link
                    rel="preconnect"
                    href="https://fonts.googleapis.com"
                />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin=""
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
                    rel="stylesheet"
                />
                <link
                    rel="stylesheet"
                    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                    crossOrigin=""
                />
                <link rel="icon" href="/favicon.ico" type="image/svg+xml" />
            </head>
            <body>{children}</body>
        </html>
    );
}
