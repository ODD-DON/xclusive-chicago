import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Without this, Turbopack walks upward looking for lockfiles and can
  // latch onto an unrelated one elsewhere on disk, breaking module
  // resolution for anything outside this project's own node_modules.
  turbopack: {
    root: __dirname,
  },
}

export default nextConfig
