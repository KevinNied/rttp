# Registro de actividades

## Objetivo

El registro de actividades conserva el historial deportivo real de cada atleta.
Incluye sesiones ejecutadas con una rutina de RTTP y actividades externas
marcadas como realizadas desde la agenda.

Una actividad es histórica e independiente:

- editar o eliminar la rutina original no modifica el registro;
- eliminar el evento de agenda no elimina la actividad;
- cada ejecución de una misma rutina genera una actividad diferente;
- el coach solo consulta actividades de sus atletas asignados.

## Actividades con rutina

Al finalizar una sesión se registra:

- atleta y entrenamiento programado de origen;
- fecha y duración real exacta de la sesión en segundos;
- título e identificador de la rutina;
- snapshot completo de la rutina;
- series realizadas u omitidas;
- peso y repeticiones registrados;
- esfuerzo percibido;
- feedback del atleta;
- fecha y hora de finalización.

El snapshot permite consultar la sesión aunque la rutina se edite o elimine
después.

En el historial, el detalle se organiza por secciones desplegables. Cada ejercicio
aparece una sola vez y agrupa sus series: los resultados repetidos se condensan
en una única lectura y las cargas variables conservan el detalle de cada serie.
Esto mantiene legibles tanto las sesiones breves como las rutinas extensas.

El cronómetro comienza al iniciar la rutina y usa una marca temporal, por lo que
sigue midiendo correctamente entre secciones y mientras la pantalla está
bloqueada. Al salir de la ejecución se pausa y al retomarla continúa desde el
tiempo acumulado. La posición, las series registradas, el feedback pendiente y
el descanso activo también se conservan en el dispositivo. Una recarga recupera
la pantalla exacta de la sesión, y completar o eliminar el entrenamiento limpia
todo el estado temporal.

Si un ejercicio define descanso, completar la serie inicia una cuenta regresiva
que puede pausarse, reanudarse u omitirse. Los ejercicios sin descanso no
muestran esa interfaz.

Durante la ejecución, la vista general resume el avance por sección y ejercicio
sin interrumpir el cronómetro. Un ejercicio temporalmente no disponible puede
posponerse: sus series pendientes se conservan sin marcarlas como omitidas y
vuelven a incorporarse al final de la rutina. Si el atleta decide omitirlas de
forma definitiva, debe usar una de las acciones de salto explícitas.

## Actividades externas

Al marcar una actividad externa como realizada se registra:

- atleta y evento de agenda de origen;
- título y categoría;
- fecha y duración;
- notas;
- usuario que la marcó como realizada;
- fecha y hora de finalización.

Cuando una actividad no tiene notas ni feedback, el historial muestra un estado
mínimo en línea junto a sus acciones, en lugar de simular que falta contenido o
agregar una tarjeta vacía.

## Persistencia

Supabase es la fuente principal y `rttp-actividades-v1` funciona como caché local
y origen de la migración inicial. La interfaz y la base evitan duplicados usando
el identificador del entrenamiento programado como clave de idempotencia.

## Modelo en Supabase

El contrato se separa en:

- `workout_activities`: cabecera de cada actividad, con `duration_seconds` como
  fuente exacta y `duration_minutes` para compatibilidad;
- `workout_activity_sets`: detalle de series realizadas;
- `routine_snapshot`: snapshot de la rutina en una columna `jsonb`;
- relación opcional con `scheduled_workouts`;
- relación obligatoria con el perfil del atleta.

Las claves del snapshot y del detalle de series usan el mismo contrato inglés
del dominio (`athleteId`, `structure`, `sections`, `sectionId`, `iteration`,
`exercises`, `stepId`, `reps`, `skipped`, entre otras), aunque los nombres y
comentarios escritos por el usuario se conservan en su idioma original.

La función RPC `save_workout_activity` crea la actividad y sus series de forma
atómica. La restricción única sobre `scheduled_workout_id` mantiene la
idempotencia.

Mientras no existe autenticación, las políticas permiten acceso anónimo de forma
temporal. Al incorporar Supabase Auth, Row Level Security deberá:

- al atleta leer y crear sus propias actividades;
- al coach leer actividades de atletas que tenga asignados;
- impedir que un coach consulte atletas fuera de su relación;
- limitar modificaciones históricas según la política que se defina.
