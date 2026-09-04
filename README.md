# RTTP - Return To The Prime

RTTP existe para transformar rutinas estáticas de Excel o Google Sheets en una experiencia de entrenamiento simple e interactiva.

La prioridad es que el atleta siempre sepa qué hacer a continuación, pueda registrar su progreso con mínima fricción y se concentre en entrenar.

Las ideas para futuras versiones se mantienen en
[`docs/pending-features.md`](docs/pending-features.md).

## Ejecutar localmente

### Requisitos

- Node.js 22 o superior
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

La versión actual usa Supabase como fuente principal y conserva `localStorage`
como caché y respaldo cuando la base no está disponible. Copiá `.env.example` a
`.env.local` y configurá la URL y la publishable key del mismo proyecto de
Supabase usado en local y producción. Nunca uses una `service_role` key en estas
variables públicas.

Antes del primer inicio, ejecutá en orden las migraciones de
[`supabase/migrations/`](supabase/migrations/) desde el SQL Editor de Supabase.
La primera carga migra los registros existentes del navegador sin sobrescribir
identificadores que ya existan remotamente. La migración
`20260904000000_activity_duration_seconds.sql` agrega la duración exacta en
segundos; mientras se despliega, RTTP mantiene compatibilidad leyendo ese dato
desde el snapshot histórico de la rutina.

Mientras RTTP funciona sin Supabase Auth, el esquema permite temporalmente
acceso anónimo a estas tablas. No debe considerarse un modelo de seguridad para
una publicación abierta; las políticas deberán limitarse por usuario y relación
coach-atleta al incorporar autenticación.

### Sesión

El usuario activo y, para entrenadores, el último atleta seleccionado se guardan
en `localStorage`. La sesión se mantiene al recargar, cerrar la pestaña o volver
a abrir el navegador en el mismo dispositivo. Se elimina al pulsar **Cerrar
sesión** o al borrar los datos del sitio.

Esta persistencia solo evita volver a ingresar el email: no autentica ni protege
la identidad, porque todavía no existe Supabase Auth. Cuando se incorpore
autenticación real, la sesión local deberá reemplazarse por la sesión de Supabase
y sus tokens renovables.

### Apariencia

RTTP usa el tema oscuro de forma predeterminada. El selector de tema disponible
en la landing y en la navegación permite activar el tema claro; la preferencia se
guarda en `localStorage` y se aplica antes del primer render para evitar cambios
visibles de color al recargar. En iPhone, la interfaz usa un viewport edge-to-edge,
integra las barras de Safari con el tema activo y respeta las áreas seguras de la
Dynamic Island y el indicador inferior.

La Agenda deportiva organiza rutinas y actividades externas por fecha. Su modelo
está separado de las rutinas y persiste en Supabase. La evolución funcional está documentada en
[`docs/agenda-deportiva.md`](docs/agenda-deportiva.md).

Las rutinas completadas y las actividades externas realizadas se guardan como
registros históricos independientes. El modelo y su persistencia están
documentados en
[`docs/registro-actividades.md`](docs/registro-actividades.md).

Durante una rutina, RTTP conserva localmente la posición, las series, el
cronómetro general y cualquier descanso activo. Salir pausa la sesión y una
recarga recupera el punto exacto. Los descansos configurados ofrecen cuenta
regresiva, pausa, reanudación y omisión; cuando el descanso es `null` no se
muestra. Al finalizar, el historial mantiene la duración exacta en formato
`mm:ss` o `hh:mm:ss`.

La **Vista atleta** del entrenador es una previsualización de solo lectura: sirve
para revisar la experiencia sin iniciar rutinas ni modificar datos del atleta.
Las plantillas se crean desde una rutina fuente visible y requieren confirmar el
nombre antes de guardarse.

### Rutas del atleta

- `/`: rutinas programadas para el día actual.
- `/schedule`: planificación deportiva semanal.
- `/routines`: todas las rutinas asignadas y ejecución libre.
- `/activities`: historial y detalle de actividades realizadas.
- `/profile`: datos del usuario, preferencias y versión instalada.

### Rutas del entrenador

- `/coach`: resumen de atletas, plantillas y planes asignados.
- `/coach/athletes`: listado y métricas de cada atleta.
- `/coach/athletes/{id}`: planificación individual del atleta.
- `/coach/routines`: biblioteca de plantillas.

## Deploy

El repositorio está conectado a Vercel. Cada push genera automáticamente un nuevo deploy.

La versión publicada está disponible en:

**[https://rttp-two.vercel.app/](https://rttp-two.vercel.app/)**

### Versionado

RTTP usa [Semantic Versioning](https://semver.org/):

- `MAJOR`: cambios incompatibles o una nueva etapa estable del producto.
- `MINOR`: funcionalidades nuevas compatibles con la versión anterior.
- `PATCH`: correcciones compatibles que no agregan funcionalidad.

La versión de `package.json` es la única fuente de verdad y se muestra
discretamente dentro de la aplicación. Antes de cada push a producción,
incrementá el segmento correspondiente:

```bash
npm version patch --no-git-tag-version
npm version minor --no-git-tag-version
npm version major --no-git-tag-version
```

El comando actualiza `package.json` y `package-lock.json`. Ambos archivos deben
incluirse en el mismo commit que será desplegado.

## Stack

- Next.js, React, TypeScript y Tailwind CSS
- shadcn/ui
- Supabase (PostgreSQL)
- `localStorage` como caché, sesión actual y migración inicial
- Vercel

## Convenciones de dominio

El código, las rutas públicas, las columnas, las claves JSON y los valores de
negocio persistidos usan inglés. La interfaz y el contenido visible para las
personas se mantienen en español.
