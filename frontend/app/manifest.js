export default function manifest() {
  return {
    name: 'MetroLens Metrology',
    short_name: 'MetroLens',
    description: 'Legal Metrology AI Compliance Engine',
    start_url: '/',
    display: 'standalone',
    display_override: ['standalone'],
    background_color: '#ffffff',
    theme_color: '#1E3A8A',
    icons: [
      {
        src: '/icon-with-text.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'maskable any'
      },
    ],
  }
}
