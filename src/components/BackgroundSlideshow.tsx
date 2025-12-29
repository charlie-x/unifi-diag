'use client'

import { useState, useEffect } from 'react'

const backgroundImages = [
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=2340&auto=format&fit=crop',
  'https://plus.unsplash.com/premium_photo-1667128695621-ca19d844a643?q=80&w=2340&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1763760243463-cbfb66c7fcc3?q=80&w=3316&auto=format&fit=crop',
]

export function BackgroundSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % backgroundImages.length)
        setIsTransitioning(false)
      }, 1000) // fade duration
    }, 10000) // rotate every 10 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />

      {/* rotating background images */}
      {backgroundImages.map((url, index) => (
        <div
          key={url}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
            index === currentIndex && !isTransitioning ? 'opacity-30' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url(${url})` }}
        />
      ))}

      {/* overlay for better text contrast */}
      <div className="absolute inset-0 bg-black/40" />
    </div>
  )
}
