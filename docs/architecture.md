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
- `routine/routine-structure.ts`: presentación secuencial derivada, lista canónica
  de ejercicios y reordenamiento plano sin fusionar secciones ni cambiar IDs.
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
  `workout-elapsed-time.tsx` concentra el estado del reloj visible: sus ticks
  actualizan solo el indicador, no los campos, el progreso ni las hojas del
  ejercicio. Conserva el mismo cronómetro de sesión y la recuperación al volver
  a la pestaña.

## Rendimiento y recuperación

### Superficies bajo demanda

La raíz conserva la composición y carga las superficies de atleta, coach,
agenda, historial y perfil con `next/dynamic` cuando se necesitan. La navegación
y los guardas de cambios pendientes siguen en sus propietarios originales.
La espera usa un estado accesible dentro del shell, sin duplicar la navegación.
Los errores de carga llegan al límite de errores de la ruta: se registran y
muestran una acción explícita para recargar, también útil tras un despliegue
que cambie los chunks disponibles.

### Carga remota y recuperación

La primera hidratación puede reutilizar el snapshot leído para decidir la
migración, únicamente si no había datos que migrar y no se ejecutó ninguna
mutación del outbox. No se invoca la migración remota con un conjunto vacío.
Si hubo escrituras, se vuelve a leer después de vaciar la cola bajo Web Locks.
Un error conserva el estado pendiente y se comunica por el flujo de
sincronización existente.

Esta reutilización vive dentro de una sola llamada a `loadAppData`: no agrega
TTL, caché persistida ni datos compartidos entre usuarios. Las recargas y los
reintentos posteriores consultan nuevamente Supabase.

El historial descarga sus series por lotes, no mediante una consulta por
actividad. `infrastructure/activity/activity-set-mapping.ts` las transforma y
agrupa una sola vez por actividad, preservando el orden y los valores guardados.
El armado local pasa de recorrer todas las series por cada actividad a
`O(actividades + series)`. Esto optimiza CPU del cliente, no el tiempo SQL.

`npm test` ejecuta las pruebas nativas de Node, incluidas las regresiones de
hidratación y recuperación del outbox. Se usa Node 25 para estas pruebas y sus
mocks de módulos.

### Recursos visuales

Manrope es la única fuente web: se hospeda con `next/font` y se usa para texto
y títulos. No se precargan familias sin consumidores. El script inicial del
tema se conserva para evitar destellos antes de hidratar la interfaz.
El logo usa la optimización y la caché estándar de `next/image`, con tamaños
responsivos y sin descargar el PNG original completo para cada miniatura.
Solo la imagen principal del acceso conserva su precarga explícita.

### Margen superior y áreas seguras

En anchos menores a `64rem`, toda la app agrega 16 px de separación superior,
tanto en el navegador como en la PWA. Desde `64rem` no se agrega ese margen:
el escritorio conserva su distribución.

`--app-top-inset` suma esa separación al área segura superior del dispositivo.
El shell, los estados de carga y error, el acceso, la ejecución y los resultados
usan el mismo token, sin sumar el inset dos veces. El padding propio de cada
pantalla se agrega a ese valor; no se reemplaza con `max()`.

`--app-available-height` descuenta los insets superior e inferior del viewport
para limitar y ubicar los diálogos y las hojas sin tapar sus acciones.
La ejecución sigue ocupando `100dvh`: el margen se incorpora dentro de esa
altura para preservar el scroll y la navegación inferior.

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
