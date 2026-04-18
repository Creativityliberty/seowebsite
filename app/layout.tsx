import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'GenSEO Pro | Générateur de Blueprint SEO & Templates 2026',
  description: 'Générez des packs SEO complets (JSON-LD, Sitemaps, Robots) conformes aux standards experts 2026 avec l\'IA.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body suppressHydrationWarning className="bg-[#f8fafc]">{children}</body>
    </html>
  );
}
