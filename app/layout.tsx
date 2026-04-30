import type {Metadata} from 'next';
import { Inter, JetBrains_Mono, Merriweather } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'Lumina | Second Brain for Readers',
  description: 'A minimalist research and reading companion.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${merriweather.variable}`}>
      <body suppressHydrationWarning className="font-sans antialiased bg-[#F7F5F2] text-[#33302E] selection:bg-[#E8E4DF]">
        {children}
      </body>
    </html>
  );
}
