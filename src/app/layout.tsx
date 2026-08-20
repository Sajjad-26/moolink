import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: 'MooLink — Your Link in Bio',
    template: '%s | MooLink',
  },
  description: 'Create a beautiful, lightning-fast link-in-bio page. No code needed.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="font-sans h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://kiebtcefayfenqwunxok.supabase.co" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://moolink.xyz" />
        <link rel="dns-prefetch" href="https://api.dodopayments.com" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
