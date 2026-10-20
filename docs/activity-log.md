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
- aclaraciones del atleta con alcance de serie, ejercicio o bloque;
- fecha y hora de finalización.

El snapshot permite consultar la sesión aunque la rutina se edite o elimine
después.

En el historial, el detalle se organiza por bloques desplegables. Cada ejercicio
aparece una sola vez y agrupa sus series: los resultados repetidos se condensan
en una única lectura y las cargas variables conservan el detalle de cada serie.
Esto mantiene legibles tanto las sesiones breves como las rutinas extensas.

Las aclaraciones describen cómo se realizó la sesión y no modifican las
indicaciones prescriptas por el coach. Durante el entrenamiento se pueden crear,
editar o eliminar con tres alcances:

- serie: aparece junto al resultado de esa serie;
- ejercicio: aparece una vez dentro del ejercicio;
- bloque: aparece una vez debajo del encabezado del bloque.

Cada aclaración conserva un identificador estable, texto, fecha de creación y un
snapshot legible de su objetivo. No se repite una aclaración de ejercicio o
bloque en cada serie.

La Home del atleta resume la semana calendario con un timeline de sesiones
completadas, en curso, programadas u omitidas. También muestra una racha de
semanas activas calculada desde este historial. La semana actual no interrumpe
la racha mientras todavía esté abierta.

El cronómetro comienza al iniciar la rutina y usa una marca temporal, por lo que
sigue midiendo correctamente entre bloques y mientras la pantalla está
bloqueada. Al salir de la ejecución se pausa y al retomarla continúa desde el
tiempo acumulado. La posición, las series registradas, el feedback pendiente y
las aclaraciones y el descanso activo también se conservan en el dispositivo.
Una recarga recupera la pantalla exacta de la sesión, y completar o eliminar el
entrenamiento limpia todo el estado temporal.

Si un ejercicio define descanso, completar la serie inicia una cuenta regresiva
que puede pausarse, reanudarse u omitirse. Los ejercicios sin descanso no
muestran esa interfaz.

Durante una sesión en curso, cambiar el peso o las repeticiones de una serie
completada la devuelve a pendiente y cancela su descanso activo. Los valores
editados se conservan, pero requieren volver a completar la serie; las demás
series no cambian. Enfocar un campo o confirmar el mismo valor no desmarca la
serie. El nuevo estado y el progreso actualizado sobreviven a una recarga.
Esta regla no modifica actividades ya guardadas en el historial.

Al avanzar desde una serie completada, el peso y las repeticiones se trasladan
a la siguiente serie del mismo ejercicio dentro de esa sesión. Funciona con
Siguiente, swipe y al completar una vuelta en la vista rápida. Cada valor editado
explícitamente en la serie de destino se conserva de forma independiente; las
series completadas u omitidas no se sobrescriben y las pospuestas siguen
pendientes. La vista rápida muestra las repeticiones registradas o heredadas,
y usa la prescripción cuando todavía no hay registro. Los valores trasladados
y las ediciones sobreviven a una recarga, sin cambiar la rutina original ni
otros ejercicios o sesiones.

En la PWA instalada desde la pantalla de inicio, el encabezado del entrenamiento
deja el margen habitual **además** del área segura superior del dispositivo.
No basta con elegir el mayor de ambos: los controles no deben quedar pegados a
la zona de la barra de estado y su efecto visual nativo. Los breakpoints más
anchos también conservan los insets superior e inferior. Sin insets se mantienen
los márgenes del navegador normal. El contenido sigue desplazándose dentro de
la rutina, sin agregar otra capa de blur ni cambiar el modo de instalación.

Durante la ejecución, la vista general resume el avance por bloque y ejercicio
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

El atleta puede eliminar del historial tanto actividades externas como sesiones
de rutinas RTTP. La ocurrencia asociada también se quita de la agenda para que no
siga apareciendo como completada, pero no se elimina la definición reutilizable
de la rutina.

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

Las aclaraciones se conservan dentro de `routine_snapshot` porque describen el
contexto inmutable de una ejecución terminada. Las actividades anteriores que
no contienen ese campo se normalizan como una lista vacía.

Mientras no existe autenticación, las políticas permiten acceso anónimo de forma
temporal. Al incorporar Supabase Auth, Row Level Security deberá:

- al atleta leer y crear sus propias actividades;
- al coach leer actividades de atletas que tenga asignados;
- impedir que un coach consulte atletas fuera de su relación;
- limitar modificaciones históricas según la política que se defina.
