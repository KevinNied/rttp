# Arquitectura por capas

## Objetivo

RTTP separa las reglas de negocio de los detalles del navegador y de la interfaz
para que agregar formatos de entrenamiento, orígenes de datos o superficies
visuales no obligue a tocar un único archivo gigante.

`src/app/page.tsx` es la raíz de composición: resuelve la sesión local, expone
los comandos de la aplicación y elige qué superficie renderizar. No contiene
reglas de rutina, acceso a `localStorage` ni JSX de funcionalidades.

## Capas

| Capa | Carpeta | Responsabilidad | Puede importar |
| --- | --- | --- | --- |
| Dominio | `src/domain` | Reglas puras de rutinas, entrenamientos y usuarios | `src/lib` (tipos y datos semilla) |
| Infraestructura | `src/infrastructure` | Persistencia del navegador y sincronización con Supabase | `src/domain`, `src/lib` |
| Aplicación | `src/application` | Orquestación: navegación, hidratación, cola de persistencia | `src/domain`, `src/infrastructure`, `src/lib` |
| Presentación | `src/features` | Componentes y hooks de interfaz por funcionalidad | `src/application`, `src/domain`, `src/components`, `src/lib` |
| Rutas | `src/app` | Composición y enrutado de Next.js | todas las anteriores |

La dirección de dependencia es siempre hacia adentro. El dominio no conoce
React, `window` ni Supabase; la infraestructura no conoce React; la aplicación no
contiene JSX; la presentación no habla directamente con `localStorage` ni con
Supabase.

### Dominio

- `routine/routine-metrics.ts`: conteo de ejercicios, objetivo de repeticiones,
  iteraciones de una sección y etiqueta de su estrategia.
- `routine/routine-steps.ts`: compilador de pasos (`pasosDeRutina`) que traduce
  `structure.sections` a la secuencia ejecutable, respetando `sequential` y
  `rounds`.
- `routine/routine-factory.ts`: plantillas, copias independientes desde una
  plantilla, snapshot histórico y rutina base para un atleta nuevo.
- `routine/routine-access.ts`: autoría, permisos de edición y visibilidad de
  rutinas personales o creadas por un coach.
- `workout/workout-session.ts`: tipos y cálculos de la sesión de entrenamiento
  (cronómetro, descanso, registros por sesión).
- `workout/workout-activity.ts`: series completadas u omitidas que se guardan en
  el historial.
- `user/user-normalization.ts`: normalización de los usuarios de prueba.

### Infraestructura

- `storage/storage-keys.ts`: única fuente de verdad de las claves persistidas.
- `storage/web-storage.ts`: acceso a `sessionStorage` y `localStorage` seguro en
  SSR.
- `storage/legacy-storage.ts`: limpieza de claves obsoletas.
- `workout/workout-timer-repository.ts` y
  `workout/workout-session-repository.ts`: lectura, escritura y poda del
  cronómetro y de la sesión activa por entrenamiento.
- `sync/outbox-repository.ts`: cola de mutaciones pendientes y su ejecución bajo
  Web Locks.
- `sync/supabase-migration.ts`: migración inicial, remapeo de identificadores y
  actualización de la sesión local.

### Aplicación

- `navigation/routes.ts`: funciones puras que derivan la vista de entrenador o de
  atleta, el atleta de la ruta y la redirección por rol.
- `navigation/use-app-navigation.ts`: estado de `pathname`, `pushState`,
  `replaceState` y redirección por rol.
- `data/load-app-data.ts`: servicio de carga inicial que compone limpieza,
  migración, outbox y lectura remota, y devuelve datos, si se aplicó el remoto y
  el error de sincronización.
- `data/use-app-data.ts`: contenedor de estado de la aplicación (usuarios,
  rutinas, plantillas, agenda, actividades, registros y sesión local) más la cola
  de persistencia.
- `preferences/ui-preferences.ts`: casos de uso para preferencias visuales y de
  navegación sin exponer claves ni almacenamiento del navegador a la
  presentación.
- `session/user-session.ts`: selección y limpieza de la sesión local de
  conveniencia sin filtrar claves de almacenamiento a la raíz de composición.
- `workout/workout-persistence.ts`: fachada de aplicación para restaurar,
  pausar, reiniciar y limpiar sesiones y cronómetros de entrenamiento.
- `sync/sync-error.ts`: mensaje visible de un error de sincronización.

### Presentación

- `features/shared`: `TextWithLinks`, `Logo`, `VersionLabel`, `ThemeToggle` y las
  clases compartidas de página.
- `features/shell`: `AppShell` y la definición de navegación por rol.
- `features/landing`: pantalla de acceso.
- `features/routine-editor`: selector, fila de ejercicio, editor de sección,
  diálogos y `useRoutineEditor`, que concentra el borrador de la rutina, la
  sección abierta y el arrastre entre secciones.
- `features/coach`: `HomeEntrenador` y sus vistas de resumen, atletas,
  plantillas y detalle del atleta.
- `features/athlete`: inicio del día, rutinas asignadas, vista general, perfil y
  `ExperienciaAtleta`, que coordina biblioteca personal, edición, inicio,
  ejecución y cierre de la rutina.
- `features/workout`: modo de ejecución, campos de prescripción, hoja de vista
  general, hoja de omisión, vista rápida por rondas y cierre de rutina.

## Reglas al extender

- Una regla nueva de rutina o de entrenamiento vive en `src/domain` y se prueba
  sin navegador.
- Un dato nuevo que deba sobrevivir a una recarga se agrega en
  `src/infrastructure`, con su clave en `storage-keys.ts`.
- Un componente que crece se divide dentro de su carpeta de funcionalidad, no en
  `src/app/page.tsx`.
- Si una funcionalidad necesita estado compartido entre varias vistas, se extrae
  un hook en `src/application` o en su carpeta de `features`, según dependa de
  infraestructura o solo de la interfaz.
- La presentación consume casos de uso o fachadas de `src/application`; no
  importa repositorios de `src/infrastructure` ni usa `localStorage`, Supabase o
  Web Locks de forma directa.
- Evitá importaciones circulares: `features` puede importar `application` y
  `domain`, nunca al revés.
