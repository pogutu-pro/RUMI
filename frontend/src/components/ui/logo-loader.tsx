"use client"

import { motion } from "framer-motion"
import Image from "next/image"

interface LogoLoaderProps {
  className?: string
  width?: number
  height?: number
}

export function LogoLoader({ className, width = 60, height = 60 }: LogoLoaderProps) {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative"
      >
        <Image
          src="/images/logo/logo-icon.svg"
          alt="Loading..."
          width={width}
          height={height}
          className="priority"
        />
      </motion.div>
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <LogoLoader width={80} height={80} />
    </div>
  )
}
