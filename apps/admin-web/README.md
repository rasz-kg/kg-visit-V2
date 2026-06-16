# KG-Visit V2 — Panel de administración (web)

Portal de administración/supervisor. **Next.js 15 (App Router) + React 19 + Tailwind CSS v4 +
lucide-react**. Responsivo y alineado a la marca KG-Visit (navy + naranja).

## Correr en local
```bash
cd apps/admin-web
npm install
npm run dev      # http://localhost:3000  (redirige a /dashboard)
```
Build de producción: `npm run build && npm run start`.

## Estructura
```
src/
├── app/
│   ├── layout.tsx            # layout raíz
│   ├── page.tsx              # redirige a /dashboard
│   └── (app)/                # rutas con el shell (sidebar + topbar)
│       ├── layout.tsx
│       ├── dashboard/        ├── visitas/        ├── departamentos/
│       ├── autos/            ├── usuarios/       ├── lista-negra/
│       ├── avisos/           ├── sugerencias/    ├── reportes/
│       ├── sedes/            ├── casetas/        ├── servicios/
│       └── configuracion/
├── components/
│   ├── shell.tsx             # AppShell responsivo (drawer móvil)
│   └── ui.tsx                # Card, Badge, Button, PageHeader…
└── lib/
    ├── types.ts              # modelo de dominio (ver docs/05)
    ├── nav.ts                # navegación / módulos
    ├── mock.ts               # datos demo (se reemplaza por Supabase)
    └── utils.ts
```

## Estado
- ✅ Shell responsivo + 13 módulos con UI (ver `docs/07-cobertura-modulos.md`).
- 🔌 Capa de datos: mock en memoria. **Siguiente:** cliente Supabase (`@supabase/supabase-js`)
  + auth + RLS, sustituyendo `lib/mock.ts`.
- 🎨 Diseño: Tailwind v4, tokens de marca en `globals.css`.

## Notas de diseño / responsividad
- Sidebar fijo en `lg+`, drawer con overlay en móvil (hamburguesa en el topbar).
- Grids fluidos (`grid-cols-2 … xl:grid-cols-6`), toolbars `flex-col sm:flex-row`, tablas con scroll-x.
- UUIDs y multi-tenant del esquema `/supabase` mitigan el IDOR de V1.
