# RTTP - Return To The Prime

RTTP existe para transformar rutinas estáticas de Excel o Google Sheets en una experiencia de entrenamiento simple e interactiva.

La prioridad es que el atleta siempre sepa qué hacer a continuación, pueda registrar su progreso con mínima fricción y se concentre en entrenar.

## Ejecutar localmente

### Requisitos

- Node.js 20.9 o superior
- npm

### Desarrollo

Levantá el servidor local:

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

Para detenerla, presioná `Ctrl + C` en la terminal donde se está ejecutando.

### Validaciones

```bash
npm run lint
npm run build
```

La versión actual usa datos locales y `localStorage`, por lo que no necesita variables de entorno ni una base de datos para ejecutarse. Cada entrenador mantiene su propia biblioteca de plantillas: al asignar una, RTTP crea una copia independiente para el atleta para que los pesos y detalles puedan personalizarse sin afectar la plantilla.

La Agenda deportiva organiza rutinas y actividades externas por fecha. Su modelo
está separado de las rutinas para preparar el futuro historial de sesiones y la
migración a Supabase. La evolución funcional está documentada en
[`docs/agenda-deportiva.md`](docs/agenda-deportiva.md).

Las rutinas completadas y las actividades externas realizadas se guardan como
registros históricos independientes. El modelo y su futura persistencia están
documentados en
[`docs/registro-actividades.md`](docs/registro-actividades.md).

### Rutas del atleta

- `/`: rutinas programadas para el día actual.
- `/agenda`: planificación deportiva semanal.
- `/rutinas`: todas las rutinas asignadas y ejecución libre.
- `/actividades`: historial y detalle de actividades realizadas.

### Rutas del entrenador

- `/entrenador`: resumen de atletas, plantillas y planes asignados.
- `/entrenador/atletas`: listado y métricas de cada atleta.
- `/entrenador/atletas/{id}`: planificación individual del atleta.
- `/entrenador/rutinas`: biblioteca de plantillas.

## Deploy

El repositorio está conectado a Vercel. Cada push genera automáticamente un nuevo deploy.

La versión publicada está disponible en:

**[https://rttp-two.vercel.app/](https://rttp-two.vercel.app/)**

## Stack

- Next.js, React, TypeScript y Tailwind CSS
- shadcn/ui
- Datos locales y `localStorage`
- Supabase (PostgreSQL) planificado
- Vercel
