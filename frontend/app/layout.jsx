import { Inter, Source_Serif_4 } from 'next/font/google'
import './globals.css'
import ClientThemeSync from '../components/ClientThemeSync'
import { Toaster } from 'sonner'
import Script from 'next/script'
import { ThemeProvider } from 'next-themes'
import BottomNav from '../components/BottomNav'
import SplashScreen from '../components/SplashScreen'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const sourceSerif = Source_Serif_4({ subsets: ['latin'], weight: ['400'], variable: '--font-display' })

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0B1F3A' },
    { media: '(prefers-color-scheme: dark)', color: '#0A1628' },
  ],
};

export const metadata = {
  title: 'MetroLens',
  description: 'Legal Metrology Compliance Checker',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MetroLens',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head></head>
      <body className={`${inter.variable} ${sourceSerif.variable} font-sans pb-24 md:pb-0 overflow-x-hidden w-full`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light" forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
          storageKey="satya-theme"
        >
          {/* Global Premium Background Effects */}
          <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-background">
             {/* Noise Texture */}
             <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}></div>
             {/* Ambient Lighting Orbs */}
             <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow"></div>
             <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] bg-blue-500/10 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
          </div>
          {children}
          <BottomNav />
          
          <ClientThemeSync />
        </ThemeProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}

