# Agenda deportiva

## Visión

La Agenda deportiva reúne en una misma planificación semanal todas las
actividades que forman parte de la vida deportiva del atleta:

- rutinas estructuradas dentro de RTTP;
- running, natación, ciclismo, movilidad, partidos y otras actividades externas;
- sesiones completadas y, en el futuro, su historial detallado.

El objetivo no es convertir cada actividad externa en una rutina de RTTP, sino
darle un lugar dentro de la carga y organización general del atleta.

## Conceptos del dominio

### Rutina

Define contenido reutilizable: bloques, ejercicios, series, repeticiones y pesos
base. No tiene un día propio ni representa una ejecución.

### Entrenamiento programado

Ubica una rutina o actividad externa en la agenda de un atleta. Tiene fecha,
hora opcional, duración, estado, autor y notas.

### Sesión realizada

Representa una ejecución concreta. Debe conservar lo que realmente ocurrió:
pesos, repeticiones, series omitidas, esfuerzo, feedback, tiempos y una copia
histórica suficiente para no cambiar si la rutina se edita después.

El MVP prepara un identificador independiente por entrenamiento programado. El
registro persistente y consultable de sesiones se incorporará en la siguiente
etapa.

## MVP

### Atleta

- Home enfocada únicamente en las rutinas programadas para el día actual.
- Biblioteca de todas las rutinas asignadas en una sección independiente.
- Sección `Agenda` en la navegación.
- Vista semanal, comenzando el lunes.
- Navegación entre semanas y regreso rápido a la semana actual.
- Programación de rutinas asignadas.
- Creación de actividades externas.
- Fecha obligatoria, hora opcional, duración y notas.
- Categorías externas: running, natación, ciclismo, deporte, movilidad y otra.
- Reprogramación mediante edición en mobile y drag and drop en desktop.
- Posibilidad de omitir y de eliminar con confirmación cualquier entrada,
  independientemente de su estado.
- Las actividades externas pueden marcarse como realizadas.
- Las rutinas programadas pueden iniciarse o continuarse desde la agenda.
- Los entrenamientos vencidos permanecen pendientes hasta una acción explícita.

### Coach

- Agenda dentro del detalle individual de cada atleta.
- Puede programar rutinas asignadas y actividades externas.
- El atleta distingue quién agregó cada entrenamiento.
- No existe una agenda global que mezcle atletas.

### Reglas

- Se permiten actividades superpuestas para no limitar dobles sesiones.
- Una rutina se relaciona por identificador y refleja sus cambios hasta que
  comienza la sesión.
- Cada inicio genera o utiliza una instancia independiente; dos ejecuciones de
  la misma rutina no comparten progreso.
- La fecha se guarda como fecha local (`YYYY-MM-DD`) para evitar movimientos de
  día por zona horaria.
- Supabase es la fuente principal; `localStorage` mantiene una caché para poder
  recuperar la experiencia si falla la sincronización.

## Actividad e historial

Una sesión completada se convierte en una actividad persistente y consultable:

- fecha de finalización;
- duración planificada;
- detalle de cada serie;
- peso y repeticiones ejecutadas;
- series completadas y omitidas;
- esfuerzo percibido;
- feedback del atleta;
- snapshot de la rutina al momento de comenzar;
- vínculo opcional con el entrenamiento programado que le dio origen.

La agenda debe mostrar el estado y un resumen, mientras que el detalle completo
de la actividad debe vivir en una pantalla específica. Una actividad no debe
depender de que la rutina original siga existiendo.

El registro de inicio, duración real y comentarios del coach quedan como
evoluciones posteriores.

## Segunda etapa funcional

- Repetición semanal y edición de “solo este evento” o “toda la serie”.
- Historial de actividades y detalle de sesión.
- Adherencia: programados, completados, omitidos y reprogramados.
- Indicadores simples de volumen y carga semanal.
- Comentarios entre atleta y coach.
- Alertas de superposición sin bloquear la programación.

## Evolución posterior

- Recordatorios y notificaciones.
- Sincronización con Google Calendar y Apple Calendar.
- Integraciones con Strava, Garmin y otros proveedores.
- Tendencias de carga, recuperación y consistencia.

## Persistencia en Supabase

La implementación mantiene entidades normalizadas y evita guardar la agenda
dentro del objeto de usuario o rutina. La base usa tablas independientes:

- `profiles`
- `routines`
- `routine_templates`
- `scheduled_workouts`
- `workout_activities`
- `workout_activity_sets`

Los campos de relación (`athleteId`, `routineId`, `createdById`) se convierten en
foreign keys y las estructuras de bloques se guardan como `jsonb`. Los timestamps
de creación y actualización forman parte del contrato de agenda.

Los estados persistidos son `scheduled`, `in-progress`, `completed` y
`skipped`. Los orígenes son `routine` y `external`; las categorías externas son
`running`, `swimming`, `cycling`, `sport`, `mobility` y `other`. La UI traduce
estos códigos al español.

La primera carga inserta únicamente los identificadores locales que no existen
en Supabase y luego usa la base remota como fuente. Las mutaciones posteriores
se persisten individualmente para evitar que una caché desactualizada sobrescriba
datos de otro navegador.

Queda pendiente al incorporar autenticación:

- reemplazar las políticas anónimas temporales por Row Level Security por atleta
  y relación coach-atleta;
- Zona horaria declarada por usuario para eventos con hora.
- Separar estado de UI, consultas y mutaciones del componente visual.
