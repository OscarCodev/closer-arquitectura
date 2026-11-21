import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Imagen Docker: salida "standalone" (servidor Node mínimo con solo los archivos necesarios).
  // En Vercel no hace falta; se activa con NEXT_OUTPUT=standalone al construir la imagen.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  // Monorepo: el rastreo de dependencias parte de la raíz (las dependencias están en ../../node_modules).
  // (`next build` siempre corre con apps/web como directorio actual: npm -w, Docker y Vercel).
  outputFileTracingRoot: path.join(process.cwd(), '../../'),
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self)' },
        ],
      },
      {
        // Archivos con hash en el nombre: inmutables, el CDN y el navegador los guardan un año.
        source: '/_next/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },
}

export default nextConfig
