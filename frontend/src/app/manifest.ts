import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RUMI - Student Accommodation Made Easy',
    short_name: 'RUMI',
    description: 'Find and book verified student hostels near your university. Seamless offline booking and management.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#2d7a4f',
    categories: ["productivity", "travel", "utilities"],
    id: "/",
    dir: "ltr",
    lang: "en",
    prefer_related_applications: false,
    shortcuts: [
      {
        name: "Hostels",
        short_name: "Hostels",
        description: "Browse available student hostels",
        url: "/hostels",
        icons: [{ src: "/favicon-v2.png", sizes: "any" }]
      },
      {
        name: "Dashboard",
        short_name: "Dashboard",
        description: "View your bookings and messages",
        url: "/dashboard",
        icons: [{ src: "/favicon-v2.png", sizes: "any" }]
      }
    ],
    icons: [
      {
        src: '/images/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable'
      },
      {
        src: '/favicon-v2.png',
        sizes: 'any',
        type: 'image/png'
      }
    ],
    screenshots: [
      {
        src: '/screenshot-mobile.png',
        sizes: '1170x2532',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Home Screen'
      },
      {
        src: '/screenshot-desktop.png',
        sizes: '1920x1080',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Dashboard'
      }
    ]
  }
}
