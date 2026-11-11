import './globals.css';
import { Lato, Poppins } from 'next/font/google';

// Configure the font
const poppins = Poppins({
  subsets: ['latin'], // required subset
  weight: ['300', '400', '500', '600', '700'], // weights you need
  display: 'swap', // ensures non-blocking text rendering
  variable: '--font-poppins', // optional CSS variable for easier usage
});

const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-lato-next',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${lato.variable}`}>
      <head>
        <link rel="preconnect" href="https://edge-platform.sitecorecloud.io" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
