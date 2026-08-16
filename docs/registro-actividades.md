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
- fecha y duración planificada;
- título e identificador de la rutina;
- snapshot completo de la rutina;
- series realizadas u omitidas;
- peso y repeticiones registrados;
- esfuerzo percibido;
- feedback del atleta;
- fecha y hora de finalización.

El snapshot permite consultar la sesión aunque la rutina se edite o elimine
después.

## Actividades externas

Al marcar una actividad externa como realizada se registra:

- atleta y evento de agenda de origen;
- título y categoría;
- fecha y duración;
- notas;
- usuario que la marcó como realizada;
- fecha y hora de finalización.

## Persistencia local

Durante el prototipo las actividades se guardan en `rttp-actividades-v1`.
La interfaz evita duplicados usando el identificador del entrenamiento
programado como clave de idempotencia.

## Migración a Supabase

El contrato actual puede separarse en:

- `workout_activities`: cabecera de cada actividad;
- `workout_activity_sets`: detalle de series realizadas;
- `routine_snapshots`: snapshot JSON de la rutina o columna `jsonb`;
- relación opcional con `scheduled_workouts`;
- relación obligatoria con el perfil del atleta.

La escritura de una sesión con rutina debe ejecutarse en una transacción o
función RPC para crear la actividad y sus series de forma atómica. La
restricción única sobre `scheduled_workout_id` mantendrá la idempotencia.

Row Level Security debe permitir:

- al atleta leer y crear sus propias actividades;
- al coach leer actividades de atletas que tenga asignados;
- impedir que un coach consulte atletas fuera de su relación;
- limitar modificaciones históricas según la política que se defina.
