# Progreso por ejercicio

| Estado del contrato | Bloqueo previo a implementación |
| --- | --- |
| Producto y arquitectura aprobados | Aprobar la clasificación inicial del catálogo |

## Estado al pausar

El análisis de producto y técnico está completo. Todavía no se implementó:

- código de aplicación;
- migración o función SQL;
- cambio de esquema en Supabase;
- modificación de datos existentes;
- interfaz de progreso.

El único bloqueo abierto es revisar las 89 filas de
[exercise-catalog-classification.csv](./exercise-catalog-classification.csv).
Cada fila contiene una clasificación propuesta, pero mantiene
`review_status = pending`.

Para retomar:

1. revisar `canonical_name`, `proposed_tracking_type` y `notes`;
2. corregir las excepciones necesarias;
3. cambiar cada `review_status` a `approved`;
4. validar que no queden filas pendientes ni nombres normalizados duplicados;
5. diseñar la migración SQL aditiva a partir del catálogo aprobado;
6. implementar persistencia y dominio antes de construir la interfaz;
7. verificar la migración en Supabase;
8. implementar y validar las superficies de atleta y coach.

No se debe inferir una aprobación por silencio ni ejecutar una migración usando
las propuestas pendientes.

## Objetivo

Permitir que atleta y coach entiendan la evolución de un ejercicio a través de
rutinas y actividades diferentes sin depender del nombre visible ni del ID local
de una rutina.

La primera versión debe responder:

- cuál fue la última marca;
- cuál es la mejor marca histórica;
- cómo evolucionó la métrica elegida;
- qué sesiones y series originaron cada dato.

## Alcance de la primera versión

### Identidad canónica

RTTP tendrá un catálogo compartido de definiciones de ejercicio.

- Una `ExerciseDefinition` representa el ejercicio conceptual.
- `Exercise.id` continúa identificando una ocurrencia editable dentro de una
  rutina.
- Cada ocurrencia incorpora `exerciseDefinitionId`.
- Duplicar una rutina o crearla desde una plantilla genera nuevos IDs de
  ocurrencia, pero conserva `exerciseDefinitionId`.
- Una definición puede utilizarse entre coaches, atletas, rutinas y plantillas.
- Una definición utilizada se archiva en lugar de eliminarse.
- Renombrar una ocurrencia crea o modifica un alias local; no cambia el nombre
  canónico.
- `Cambiar ejercicio` es una acción explícita que reasigna la identidad
  conceptual.
- Una rutina no permite editar globalmente, fusionar ni separar definiciones.

### Creación desde el editor

Agregar un ejercicio abre un buscador del catálogo.

- Las coincidencias se buscan por nombre normalizado y alias.
- Elegir una coincidencia reutiliza su identidad.
- Si no existe, `Crear "<nombre>"` crea una definición y permite elegir su tipo
  de seguimiento.
- Luego continúa la edición habitual de series, repeticiones, carga, descanso e
  instrucciones.

### Tipos de seguimiento

La primera versión admite:

| Tipo | Métricas |
| --- | --- |
| `load_reps` | Carga máxima, 1RM estimado y volumen |
| `reps_only` | Máximo de repeticiones por serie y repeticiones totales |
| `untracked` | Sin progreso hasta incorporar una métrica adecuada |

`untracked` conserva ejercicios de movilidad, isométricos, distancia u otros
casos que no deben representarse con una unidad falsa.

Tiempo y distancia quedan fuera de esta versión. El modelo debe permitir
incorporarlos luego mediante tipos y campos nuevos, sin reinterpretar ni
destruir el historial existente.

## Experiencia de progreso

### Navegación

La superficie `Progreso` se divide en:

- `Ejercicios`, abierta por defecto;
- `Actividades`, con el historial actual.

`Ejercicios` muestra únicamente definiciones con historial rastreable del
atleta, ordenadas por la práctica más reciente. Incluye buscador y tarjetas con:

- nombre canónico;
- última marca;
- mejor marca;
- tendencia del período por defecto.

El mismo detalle puede abrirse contextualmente desde:

- un ejercicio dentro de una actividad histórica;
- un ejercicio dentro del detalle de una rutina.

Los ejercicios `untracked` no aparecen en la lista hasta que exista una métrica
compatible y tengan registros válidos.

### Detalle

El detalle muestra:

- nombre canónico y alias contextual cuando corresponda;
- última marca válida;
- mejor marca histórica;
- comparación del período;
- gráfico por sesión;
- lista de sesiones fuente con sus series.

Cada punto representa una actividad finalizada. Dos actividades del mismo día
son puntos distintos y se ordenan por `completedAt`.

Con un solo punto se muestra el dato sin inventar una línea de tendencia. Sin
datos en el período se presenta un estado vacío explícito.

### Métricas con carga

La vista inicial es `Carga máxima`.

- **Carga máxima:** mayor carga válida de la sesión y repeticiones de esa serie.
- **1RM estimado:** mayor resultado válido de la fórmula de Epley,
  `cargaKg * (1 + repeticiones / 30)`.
- **Volumen:** suma de `cargaKg * repeticiones` de las series válidas.

El 1RM se calcula únicamente para series de 1 a 12 repeticiones y siempre se
rotula como estimación.

### Métricas sin carga

La vista inicial es `Máximo de repeticiones`.

- **Máximo de repeticiones:** mayor cantidad en una serie válida de la sesión.
- **Repeticiones totales:** suma de repeticiones válidas de la sesión.

### Períodos y comparación

Los filtros son:

- 1 mes;
- 3 meses, seleccionado por defecto;
- 1 año;
- todo.

La comparación usa la mejor marca del período contra la mejor marca del período
inmediatamente anterior de igual duración. `Todo` no muestra comparación. Si el
período anterior no contiene una marca comparable, se muestra `Sin dato previo`.

La última marca y la mejor marca histórica permanecen visibles aunque cambie el
período; el gráfico y la comparación respetan el filtro.

### Registros válidos

Participan únicamente series:

- pertenecientes a una actividad de rutina finalizada;
- no omitidas;
- con repeticiones mayores a cero;
- con los valores requeridos por la métrica;
- vinculadas a una definición canónica.

Las sesiones canceladas no crean actividad y no participan. Una actividad
finalizada puede aportar aunque contenga otras series omitidas.

Las métricas se derivan de las series persistidas; no se guardan acumulados como
fuente de verdad. Eliminar una actividad elimina inmediatamente su contribución,
sus mejores marcas y sus comparaciones.

## Unidades de carga

Cada perfil incorpora una preferencia `kg` o `lb`. Los perfiles existentes usan
`kg` por defecto.

Cada carga persiste:

- valor original;
- unidad original;
- valor canónico en kilogramos.

Los cálculos usan el valor canónico. La interfaz convierte a la preferencia de
quien observa el dato sin modificar el registro original. Todo el historial
existente se migra como kilogramos.

## Experiencia del coach

El coach accede al mismo detalle de lectura para sus atletas asignados:

- listado y búsqueda;
- métricas y períodos;
- gráficos;
- series y actividades fuente.

No puede editar marcas, reclasificar ejercicios ni modificar el historial desde
esta superficie.

## Modelo de persistencia propuesto

### Catálogo

`exercise_tracking_types`

- `code` como clave estable;
- filas iniciales `load_reps`, `reps_only` y `untracked`;
- permite incorporar tipos futuros sin reemplazar identidades existentes.

`exercise_definitions`

- UUID estable;
- tipo de seguimiento;
- estado `active` o `archived`;
- indicador `needs_review`;
- creador y timestamps.

`exercise_definition_names`

- nombre visible;
- nombre normalizado único;
- referencia a la definición;
- indicador de nombre canónico o alias;
- exactamente un nombre canónico por definición.

La normalización elimina diferencias de mayúsculas, diacríticos y espacios
repetidos. No infiere sinónimos ni variantes.

### Rutinas y snapshots

Cada ejercicio dentro de `routines.structure`,
`routine_templates.structure` y `workout_activities.routine_snapshot` conserva:

- su `id` de ocurrencia;
- su `exerciseDefinitionId`;
- su `name` como alias o snapshot visible.

El catálogo aporta identidad; el JSON conserva la intención y presentación de
cada rutina histórica.

### Series históricas

`workout_activity_sets` incorpora:

- `exercise_definition_id`;
- `tracking_type_code` como snapshot del tipo utilizado;
- `load_value` nullable;
- `load_unit` nullable;
- `load_kg` nullable;
- `repetitions` nullable para permitir tipos futuros.

Las restricciones garantizan que valor, unidad y valor canónico de carga sean
coherentes. La referencia a la definición y el nombre histórico conviven: la
primera permite agrupar y el segundo preserva qué vio el atleta.

Índices mínimos:

- series por `exercise_definition_id` y `activity_id`;
- actividades por atleta, fecha y `completed_at`;
- nombres normalizados del catálogo.

La consulta de detalle filtra en Supabase por atleta, definición y ventana
temporal. Las fórmulas viven en funciones de dominio puras y no requieren cargar
todo el historial de todos los atletas.

### Guardado

Las funciones `save_workout_activity` y `migrate_workout_activity` deben guardar
la identidad, el tipo de seguimiento y las unidades junto con cada serie.

La migración se diseña de forma aditiva para que el despliegue pueda:

1. crear catálogo, referencias y campos nuevos;
2. importar la clasificación aprobada;
3. vincular rutinas, plantillas, snapshots y series históricas;
4. validar que no queden series de rutina sin identidad;
5. actualizar las funciones de guardado;
6. activar la lectura nueva en la aplicación.

Los campos anteriores no se eliminan en el mismo despliegue. Su limpieza queda
para una migración posterior, después de verificar producción.

### Secuencia de implementación

1. **Catálogo y migración:** crear tablas, restricciones, índices, preferencias
   de unidad y backfill transaccional.
2. **Dominio:** agregar identidades y unidades tipadas, conversiones y fórmulas
   puras con pruebas.
3. **Persistencia:** actualizar carga inicial, guardado de rutinas, plantillas,
   snapshots y series, además de consultas filtradas de progreso.
4. **Editor y ejecución:** incorporar el buscador con creación inline, alias
   locales y captura de unidad.
5. **Progreso del atleta:** agregar pestañas, listado, detalle, períodos,
   gráficos y sesiones fuente.
6. **Lectura del coach:** reutilizar el mismo modelo para atletas asignados.
7. **Validación integral:** probar duplicación, renombrado, borrado de actividad,
   conversión de unidades, datos vacíos y responsive.

## Migración de datos existentes

El inventario inicial contiene 89 nombres normalizados.

- Coincidencias exactas después de normalizar se unifican automáticamente.
- No se unifican sinónimos, nombres parecidos ni variantes.
- Cada nombre original se conserva como alias.
- Las series históricas conservan también `exercise_name`.
- Todos los pesos históricos se interpretan como kg.
- Rutinas, plantillas, snapshots y series reciben la misma identidad.
- Las definiciones migradas nacen con `needs_review = true`.

La clasificación se revisa en
[exercise-catalog-classification.csv](./exercise-catalog-classification.csv).
Ninguna migración de catálogo se ejecuta hasta que todas sus filas estén
aprobadas.

## Criterios de aceptación

- Copiar una rutina no fragmenta el progreso del ejercicio.
- Cambiar un alias local no fragmenta ni renombra el historial.
- Cambiar explícitamente la definición separa el progreso futuro.
- Borrar una actividad recalcula todos los resultados afectados.
- Un coach y su atleta ven los mismos datos convertidos a su preferencia de
  unidad.
- Una serie omitida nunca crea una marca.
- El 1RM nunca usa series de más de 12 repeticiones.
- Los ejercicios `untracked` no producen métricas ficticias.
- Las vistas de 320 px no tienen desborde horizontal.
- Gráficos, tarjetas y estados vacíos mantienen jerarquía equivalente en mobile,
  desktop, modo claro y modo oscuro.

## Fuera de alcance

- tiempo y distancia por ejercicio;
- objetivos, hitos, alertas o recomendaciones automáticas;
- edición manual de marcas;
- administración global para corregir, archivar, fusionar o separar
  definiciones;
- insights automáticos del coach;
- comparación entre atletas.

Estos puntos permanecen como evolución futura.
