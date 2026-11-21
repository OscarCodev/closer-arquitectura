# Imagen de producción del frontend (Next.js standalone).
# Se construye desde la RAÍZ del monorepo:
#   docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_API_URL=/api/v1 -t closer-web .
# Las variables NEXT_PUBLIC_* se incrustan en el build, por eso son argumentos de construcción.

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
RUN npm ci -w apps/web --ignore-scripts
COPY apps/web apps/web

ARG NEXT_PUBLIC_API_URL=/api/v1
ARG NEXT_PUBLIC_AUTH_MODE=dev
ARG NEXT_PUBLIC_VOICE_MODE=mock
ARG NEXT_PUBLIC_SUPABASE_URL=
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_AUTH_MODE=$NEXT_PUBLIC_AUTH_MODE \
    NEXT_PUBLIC_VOICE_MODE=$NEXT_PUBLIC_VOICE_MODE \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_OUTPUT=standalone \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build -w apps/web

FROM node:22-bookworm-slim AS runtime
# KEEP_ALIVE_TIMEOUT mayor que el de nginx (30 s) evita 502 por conexiones que el servidor cierra mientras nginx las reutiliza.
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1 KEEP_ALIVE_TIMEOUT=65000
WORKDIR /app
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/web/server.js"]
