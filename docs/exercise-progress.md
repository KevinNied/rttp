# Progreso por ejercicio

| Estado del contrato | Condiciones previas a implementación |
| --- | --- |
| Alcance V1 y arquitectura base aprobados; precisiones de integración pendientes | Actualizar y aprobar el catálogo, cerrar semántica de registros y definir compatibilidad de persistencia |

## Estado al pausar

Última revisión: **30 de septiembre de 2026**, contra el codebase de
**v0.16.3**, commit `3e6faa6`.

La definición original de producto se conserva. La revisión posterior contrastó
ese contrato con el editor, la ejecución, el historial, la recuperación local,
las consultas y las migraciones SQL actuales. No propone empezar de cero, pero
identifica precisiones necesarias antes de delegar la implementación.

Todavía no se implementó:

- código de aplicación;
- migración o función SQL;
- cambio de esquema en Supabase;
- modificación de datos existentes;
- interfaz de progreso.

Las 89 filas del inventario guardado en
[exercise-catalog-classification.csv](./exercise-catalog-classification.csv)
mantienen `review_status = pending`. Además de aprobarlas, hay que actualizar el
inventario y resolver las
[decisiones de integración pendientes](#decisiones-de-integración-pendientes).
La clasificación no fue aprobada ni modificada durante esta revisión.

Esta actualización documenta el análisis; **no autoriza implementación,
migración, cambios de datos ni ampliación de alcance**. Las recomendaciones
posteriores no reemplazan decisiones aprobadas sin confirmación explícita.

### Para retomar

1. leer este estado, las decisiones pendientes y el mapa del codebase;
2. resolver primero qué significa la carga y qué registros son comparables;
3. relevar nuevamente rutinas, plantillas, snapshots y series de Supabase;
4. revisar `canonical_name`, `proposed_tracking_type` y `notes`, incluyendo
   nombres nuevos o modificados desde el inventario anterior;
5. registrar la aprobación explícita de cada fila antes de cambiar su
   `review_status` a `approved`; validar pendientes y colisiones;
6. cerrar los contratos de creación, confirmación, consultas y sincronización;
7. seguir el [plan de entregas](#plan-de-entregas-y-puntos-de-control), con
   dominio y persistencia validados antes de construir los gráficos;
8. ensayar la migración sobre una copia y verificar el backup antes de tocar
   producción.

No se debe inferir una aprobación por silencio ni ejecutar una migración usando
las propuestas pendientes.

### Guía de lectura

- [Alcance aprobado](#alcance-de-la-primera-versión).
- [Experiencia de progreso](#experiencia-de-progreso).
- [Modelo de persistencia](#modelo-de-persistencia-propuesto).
- [Revisión de producto y técnica](#revisión-de-producto-y-técnica).
- [Decisiones pendientes](#decisiones-de-integración-pendientes).
- [Migración y compatibilidad](#seguridad-operativa-de-la-migración).
- [Plan para agentes](#plan-de-entregas-y-puntos-de-control).
- [Validación integral](#matriz-de-validación).
- [Fuera de alcance](#fuera-de-alcance).

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

El orden se desarrolla en el
[plan de entregas y puntos de control](#plan-de-entregas-y-puntos-de-control).
La dependencia principal se mantiene: catálogo, dominio y persistencia antes de
editor/ejecución y superficies de progreso. Diseñar una migración no autoriza
aplicarla en producción antes de validar compatibilidad.

## Migración de datos existentes

El inventario inicial guardado contiene 89 nombres normalizados. No representa
un conteo actualizado de producción; debe regenerarse o reconciliarse antes de
diseñar el backfill definitivo.

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
aprobadas y estén resueltas las condiciones de
[compatibilidad y validación](#seguridad-operativa-de-la-migración).

## Revisión de producto y técnica

### Conclusión

Es una evolución valiosa y transversal, no una pantalla de gráficos aislada.
Cambia cómo se identifica un ejercicio, cómo se capturan sus resultados y cómo
se interpretan a través de distintas rutinas.

La arquitectura actual ofrece una base aprovechable: compilación centralizada
de pasos, snapshots históricos, factorías de copias y persistencia de series.
No se justifica reescribir la aplicación. El riesgo principal es mostrar
progreso aparentemente preciso sobre registros cuyo significado no sea
comparable.

La primera entrega visual debe apoyarse en identidades y resultados que ya
lleguen correctamente al historial. El gráfico viene después de esa prueba.

### Valor y criterios de producto

- Para el atleta: entender qué registró la última vez, su mejor resultado y
  cómo cambió, sin recorrer actividades una por una.
- Para el coach: consultar la evolución de sus atletas y llegar a las series
  fuente, sin incorporar edición de marcas ni nuevos permisos.
- Mantener una métrica principal y revelar las alternativas progresivamente,
  en lugar de llenar la pantalla de indicadores.
- Conservar el historial y los accesos contextuales desde rutinas y actividades.
- No convertir el catálogo en una nueva tarea principal para quien entrena.
- Preservar el objetivo del PRD de registrar una serie en menos de tres segundos
  en condiciones normales. Ese objetivo todavía debe medirse en el flujo nuevo.

El lenguaje debe describir **cambios en lo registrado**, no conclusiones
automáticas sobre calidad del entrenamiento:

- más volumen puede significar más series, no necesariamente más fuerza;
- más carga con menos repeticiones no describe toda la evolución;
- un resultado menor puede responder a una intención de entrenamiento distinta;
- el 1RM estimado no es una capacidad comprobada.

No se agrega aprobación para recomendaciones de carga, precarga automática
desde sesiones anteriores, alertas o evaluaciones del rendimiento.

### Evidencia del inventario guardado

La revisión del CSV confirmó:

| Dato | Resultado |
| --- | --- |
| Nombres normalizados | 89 |
| `load_reps` propuestos | 48 |
| `reps_only` propuestos | 22 |
| `untracked` propuestos | 19 |
| Filas pendientes de aprobación | 89 |
| Filas con observaciones | 25 |
| Nombres normalizados duplicados | 0 |
| Series históricas incluidas en ese inventario | 98 |
| Nombres con series históricas | 31 |
| Nombres con series históricas con carga | 14 |

Son cifras del archivo versionado, no una consulta nueva a Supabase.

Ejemplos que requieren revisión semántica:

- `Prensa` y `Prensa 45`: no fusionar por parecido sin confirmar la variante.
- `Pecho Plano` y `Press plano`: no inferir automáticamente que son sinónimos.
- `Puente de glúteo isométrico` y `Sentadilla isométrica`: tienen carga
  histórica, pero están propuestos como `untracked` porque falta una métrica
  temporal adecuada. Conservar esos datos no habilita volumen o 1RM ficticios.
- `E` y `papapapa`: nombres incompletos o de prueba; una observación en el CSV
  no autoriza corregirlos, archivarlos ni eliminarlos en producción.

### Mapa de impacto en el codebase

Estas referencias describen v0.16.3 y deben verificarse nuevamente al retomar.

| Superficie | Evidencia actual | Trabajo necesario |
| --- | --- | --- |
| Modelo | [rttp-data.ts](../src/lib/rttp-data.ts), [rttp-activity.ts](../src/lib/rttp-activity.ts) y [workout-session.ts](../src/domain/workout/workout-session.ts) usan IDs de ocurrencia y pesos numéricos sin unidad explícita | Incorporar identidad conceptual, tipos de carga y snapshots del significado de los registros |
| Copias y snapshots | [routine-factory.ts](../src/domain/routine/routine-factory.ts) regenera IDs de ocurrencia y copia las propiedades del ejercicio | Conservar la definición al duplicar o asignar plantillas; preservar el snapshot |
| Compilación | [routine-steps.ts](../src/domain/routine/routine-steps.ts) centraliza la secuencia de series | Transportar los nuevos datos sin alterar `sequential`, `rounds` ni IDs de sesión |
| Editor | [use-routine-editor.ts](../src/features/routine-editor/use-routine-editor.ts) crea una fila libre y [exercise-row.tsx](../src/features/routine-editor/exercise-row.tsx) edita nombre y carga en kg | Selección/creación de catálogo, alias, reemplazo explícito y unidad; conservar borradores, guardado y reordenamiento |
| Ejecución | [workout-mode.tsx](../src/features/workout/workout-mode.tsx), [prescription-field.tsx](../src/features/workout/prescription-field.tsx) y [workout-round-summary.tsx](../src/features/workout/workout-round-summary.tsx) usan prescripción, arrastre de carga y completado rápido | Confirmar resultados comprensibles en tarjetas, swipe y vista rápida, sin aumentar fricción |
| Cierre y recuperación | [athlete-experience.tsx](../src/features/athlete/athlete-experience.tsx), [workout-activity.ts](../src/domain/workout/workout-activity.ts) y [workout-session-repository.ts](../src/infrastructure/workout/workout-session-repository.ts) trasladan registros locales al historial | Conservar identidad, tipo y unidad durante reload, reanudación y cambio de versión |
| Adaptador remoto | [rttp-supabase.ts](../src/lib/rttp-supabase.ts) carga tablas completas y guarda JSON de rutinas y plantillas | Mapear nuevos campos, diseñar consultas acotadas y proteger escrituras de clientes anteriores |
| RPC | [Migración de secciones](../supabase/migrations/20260909000000_extensible_routine_sections.sql) contiene las versiones actuales de guardado y migración de actividades | Actualizar ambas funciones, restricciones e idempotencia sin perder compatibilidad |
| Sincronización | [use-app-data.ts](../src/application/data/use-app-data.ts) y [outbox-repository.ts](../src/infrastructure/sync/outbox-repository.ts) coordinan estado local y mutaciones pendientes | Evitar contradicciones entre historial y progreso durante guardados, eliminaciones y reintentos |
| Presentación de cargas | [routine-overview.tsx](../src/features/athlete/routine-overview.tsx), [activity-history.tsx](../src/components/activity-history.tsx) y el editor muestran kg directamente | Aplicar la preferencia del observador de forma coherente, sin modificar el valor original |
| Perfil | [user-profile.tsx](../src/features/athlete/user-profile.tsx) no ofrece preferencia de carga | Incorporar lectura y guardado de kg/lb, también para el coach que prescribe o consulta |
| Navegación | [routes.ts](../src/application/navigation/routes.ts), [use-app-navigation.ts](../src/application/navigation/use-app-navigation.ts) y [navigation-items.ts](../src/features/shell/navigation-items.ts) conocen Historial, no progreso por ejercicio | Integrar hub y detalle con reload, atrás/adelante y contexto del atleta |
| Coach | [coach-athlete-detail-view.tsx](../src/features/coach/coach-athlete-detail-view.tsx) reutiliza el historial del atleta | Reutilizar el modelo de progreso y mantener lectura para atletas asignados |

Los nuevos cálculos pertenecen al dominio; las consultas, a infraestructura;
la coordinación de carga y sincronización, a aplicación; la interfaz, a
features. La raíz [page.tsx](../src/app/page.tsx) debe seguir siendo composición.
No se requiere un refactor general del adaptador remoto para implementar cada
pieza nueva. Aplicar las fronteras de [architecture.md](./architecture.md).

## Decisiones de integración pendientes

Todos los puntos de esta sección están **pendientes de cierre**. Las
recomendaciones no son nuevas aprobaciones. Resolver de a una las decisiones de
producto, datos o mantenimiento con alternativas razonables; los detalles
técnicos rutinarios pueden seguir las convenciones del repositorio.

### EP-01 — Significado de carga y variantes

Kg/lb resuelve la unidad, no qué representa la cantidad:

- carga por mancuerna o suma de ambas;
- peso total de barra o solo discos;
- repeticiones por lado o totales;
- dominadas libres, lastradas o asistidas;
- variantes de máquina o ejecución que no deben compararse.

**Por definir:** convenciones de registro y qué diferencias requieren otra
definición. No es obligatorio agregar campos para todos estos casos en V1,
pero sí impedir comparaciones entre cantidades con significados diferentes.

Mantener la regla aprobada de no fusionar por similitud. Tampoco inferir
equipamiento o ejecución a partir de un nombre ambiguo.

### EP-02 — Validez e interpretación del historial

Hoy el valor inicial puede venir de la prescripción o de series anteriores.
El campo de peso vacío se representa como cero. Los registros históricos no
permiten distinguir siempre cero real, carga no registrada o prescripción
aceptada al completar.

**Por definir:**

- tratamiento de cero y ausencia por cada métrica;
- valores elegibles para carga máxima, volumen y 1RM;
- validación de números finitos y de los campos requeridos;
- comportamiento del editor y ejecución para `reps_only` y `untracked`;
- tratamiento de una futura variante con carga de un ejercicio hoy sin carga.

**Recomendación:** preservar los datos originales, no inventar procedencia ni
completar información histórica ausente. `untracked` no debe borrar registros
ni bloquear un ejercicio existente. La elegibilidad es específica de cada
métrica, no una etiqueta genérica de «serie válida».

### EP-03 — Confirmación con baja fricción

**Recomendación a confirmar:** completar una serie, también por swipe,
confirma los valores mostrados. No exigir editar cada campo para que cuente;
haber seguido la prescripción es un resultado posible.

La vista rápida hoy puede completar varios ejercicios con valores precargados
y no muestra la carga individual en su resumen. Hay que resolver cómo hacer
comprensible lo confirmado sin sumar un diálogo por serie ni eliminar el
completado rápido.

Verificar tarjetas, vista rápida, swipe, series pospuestas y valores trasladados
a la siguiente serie. Un dato precargado sin completar la serie no crea una
marca. No cambiar las reglas de descanso o avance como efecto lateral.

### EP-04 — Creación compartida desde un borrador local

Caso a resolver: crear una definición desde el editor y luego descartar la
rutina. El contrato describe la acción `Crear`, pero no cierra su relación
transaccional con el guardado explícito.

Alternativas pendientes:

- crear la definición como acción independiente, comunicando que persiste
  aunque se descarte la rutina;
- mantener la creación en el borrador y confirmarla junto con el guardado.

También definir:

- qué roles pueden crear definiciones desde sus editores habilitados;
- comportamiento sin conexión y ante errores;
- dos creaciones simultáneas del mismo nombre normalizado;
- coincidencia existente con otro tipo de seguimiento;
- resolución o remapeo de identidades al reintentar.

La restricción de unicidad debe acompañarse de una respuesta de aplicación
explícita. No resolver una colisión cambiando silenciosamente el tipo ni
descartando el borrador. La normalización de búsqueda y la de base deben tener
el mismo comportamiento para mayúsculas, diacríticos y espacios.

### EP-05 — Alias y corrección operativa

Distinguir nombre canónico, alias compartido de búsqueda y nombre local de una
ocurrencia. El renombrado local aprobado no equivale a publicar un alias global.

**Por definir:** qué nombres alimentan la búsqueda compartida y cómo se
presentan coincidencias sin confundir identidad con contexto local.

Como la administración global está fuera de V1, acordar un procedimiento
controlado para corregir clasificaciones erróneas. Esto no aprueba construir un
panel ni habilitar a cualquier usuario a cambiar definiciones utilizadas.
Toda corrección debe preservar el significado de las series históricas y su
snapshot de tipo.

### EP-06 — Bordes de métricas y períodos

Conservar las fórmulas y períodos aprobados. Precisar:

- meses calendario frente a ventanas de días y duración del período anterior;
- fecha de entrenamiento frente a finalización para filtrar;
- zona horaria, límites inclusivos/exclusivos y referencia temporal de consulta;
- desempate entre series con igual carga y entre puntos con igual timestamp;
- comparación porcentual cuando el valor anterior es cero;
- sesión con ejercicio presente pero sin series elegibles para la métrica;
- precisión, redondeo y visualización de conversiones de carga.

La última marca debe ser la última **válida para la métrica elegida**, no
simplemente la última actividad que menciona el ejercicio. Un solo punto no
genera tendencia y un período vacío no se representa como cero.

Varias ocurrencias de una definición dentro de una actividad contribuyen a su
punto por sesión sin perder el detalle de bloque, ocurrencia y serie. Dos
actividades del mismo día siguen siendo puntos distintos.

### EP-07 — Actualización y sincronización

Guardar o eliminar una actividad modifica primero el estado local y después
ejecuta la persistencia remota. Una consulta exclusivamente remota podría no
mostrar una actividad recién guardada o seguir mostrando una marca eliminada.

**Por definir:** política de actualización e invalidación que mantenga
coherencia con el historial y comunique el estado pendiente. Si se combinan
resultados remotos con cambios locales, evitar doble conteo y reaparición de
actividades eliminadas durante reintentos.

Probar errores y recuperación, no solo el guardado exitoso. Incluir cambio de
atleta y unidad del observador para no reutilizar resultados de otro contexto.

### EP-08 — Contrato de consultas y navegación

La carga inicial actual descarga todas las actividades y series de todos los
atletas, recorriendo páginas de 1.000 filas. Agregar consultas filtradas no
elimina por sí solo esa descarga; puede duplicar el trabajo.

**Por diseñar:** convivencia y transición acotada de las lecturas, sin convertir
esta feature en una reescritura general. Separar responsabilidades:

- resumen histórico para última marca, mejor marca y listado;
- ventana seleccionada y período anterior para gráfico y comparación;
- sesiones fuente con sus series.

Una consulta de tres meses no alcanza para calcular la mejor marca histórica.
Las consultas paginadas no pueden truncar resultados usados para métricas.
Conservar fórmulas en dominio y no introducir acumulados como fuente de verdad.
No hace falta agregar una plataforma analítica ni reabrir automáticamente la
virtualización general diferida en FLOW-017.

La auditoría cambió la navegación actual a `Historial`; el hub `Progreso`
corresponde cuando exista esta capacidad. Mantener el alcance de dos vistas
del contrato, sin sumar un nuevo dashboard de resumen por interpretar bocetos
de la auditoría como aprobación.

Definir rutas, compatibilidad de enlaces existentes y conservación del contexto
al abrir un ejercicio desde una rutina o actividad. La implementación actual
de navegación observa el pathname; agregar filtros en query parameters
requeriría integrarlos explícitamente. Probar reload y atrás/adelante, además
de las protecciones de borradores y sesiones activas.

## Seguridad operativa de la migración

Una migración aditiva de columnas no basta. También hay que contemplar clientes
anteriores y datos pendientes:

- una pestaña vieja puede guardar un JSON completo de rutina o plantilla sin
  las referencias nuevas y quitar datos recién migrados;
- una mutación pendiente puede contener series sin identidad, tipo o unidad;
- una sesión local puede reanudarse después del despliegue;
- la lectura del nuevo cliente no debe reinterpretar cargas o tipos antiguos
  usando preferencias actuales;
- la carga inicial y los caminos de migración de datos locales también deben
  respetar el contrato nuevo.

**Antes de aplicar en producción:**

1. relevar el esquema realmente desplegado y reconciliar el inventario;
2. obtener aprobación de clasificación y decisiones pendientes;
3. crear y verificar un backup, y ensayar sobre una copia;
4. validar conteos de perfiles, rutinas, plantillas, actividades y series antes
   y después; ninguna pérdida o creación inesperada;
5. verificar referencias en JSON y series, unicidad de nombres y nombre
   canónico único por definición;
6. comprobar equivalencia de cargas históricas en kg y conservación de nombres,
   anotaciones, snapshots y registros `untracked`;
7. probar guardado, migración y reintentos con payloads viejos y nuevos;
8. definir orden de despliegue y estrategia de recuperación compatible con
   datos nuevos; no asumir que volver al frontend anterior revierte el esquema;
9. activar las lecturas nuevas solo después de validar esos caminos.

No eliminar los campos anteriores en este despliegue. La transición debe tener
salida definida, no mantener contratos paralelos indefinidamente.

Supabase Auth y RLS restrictivas siguen pendientes. Filtrar por atleta no
constituye autorización. Esta feature no aprueba ampliar permisos, exponer
historiales de atletas no asignados ni mutar datos desde la vista previa.

## Plan de entregas y puntos de control

Plan propuesto para ejecutar **después de cerrar los contratos pendientes**:

| Entrega | Alcance | Condición para continuar |
| --- | --- | --- |
| 1. Semántica y catálogo | Resolver EP-01 a EP-08 en lo que corresponda, actualizar inventario y registrar aprobaciones | Convenciones, ejemplos, contratos y clasificación sin ambigüedades bloqueantes |
| 2. Dominio y persistencia | Identidades, cargas tipadas, conversiones, fórmulas puras, consultas, RPC, restricciones y migración compatible | Pruebas de dominio e integración; ensayo de backfill y clientes anteriores sin pérdida ni reinterpretación |
| 3. Editor y captura | Seleccionar/crear, guardar, duplicar, asignar plantillas, configurar unidad, entrenar, reanudar y registrar | Los datos nuevos llegan correctamente al historial sin regresiones de ejecución ni borradores |
| 4. Progreso compartido | Listado, detalle, períodos, gráfico accesible, sesiones fuente, rutas y lectura del coach | Mismo modelo para ambos roles; trazabilidad de cada resultado y coherencia de sincronización |
| 5. Validación y publicación | Flujo integral, ensayo final, release, migración coordinada y verificación productiva | Matriz validada, backup verificado, versión y comportamiento comprobados en producción |

### Coordinación de agentes

- Compartir primero tipos, invariantes, ejemplos de entrada/salida y contratos
  de consulta; no delegar gráficos y base sobre interpretaciones distintas.
- Dividir trabajo por responsabilidad y dependencia, con archivos y criterios
  de aceptación explícitos.
- Paralelizar solo piezas independientes después de estabilizar sus contratos.
- No permitir que un agente cambie fórmulas, convenciones de carga, permisos o
  criterios de migración para resolver una dificultad local.
- Verificar cada entrega antes de retirar compatibilidad o activar la siguiente.
- Registrar decisiones confirmadas en este documento y actualizar
  [activity-log.md](./activity-log.md),
  [architecture.md](./architecture.md) y [prd-init.md](./prd-init.md) cuando
  cambien sus contratos.

No se estimó duración ni se ejecutaron benchmarks durante el análisis.
Los estados de las entregas son futuros, no trabajo implementado.

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

### Matriz de validación

En v0.16.3 no se encontró una suite de tests versionada ni un comando de tests
en [package.json](../package.json). Se recomienda incorporar pruebas
automatizadas de dominio e integración para esta feature. Lint y build no
detectan una marca mal calculada.

| Área | Casos mínimos |
| --- | --- |
| Identidad | Copia, plantilla y renombrado local conservan progreso; reemplazo explícito separa resultados futuros sin cambiar los anteriores |
| Catálogo | Normalización consistente, creación concurrente, colisión con otro tipo, descarte de borrador y errores de guardado |
| Unidades | Coach y atleta con preferencias distintas, conversión ida/vuelta sin deriva, conservación del original y cambio de preferencia sin reescribir historial |
| Fórmulas | Carga máxima y desempates; volumen y repeticiones totales; Epley con 1, 12 y 13 repeticiones; cero, ausencia, no finitos y omitidas |
| Agrupación | Mismo ejercicio en varios bloques u ocurrencias, actividades distintas el mismo día y orden estable de puntos |
| Períodos | Bordes temporales, zona horaria, período anterior vacío, denominador cero, un punto y mejor histórica fuera de la ventana |
| Ejecución | `sequential`, `rounds`, vista rápida, swipe, descanso, pospuestos, valores precargados y edición de resultados |
| Recuperación | Reload durante workout y cierre, sesión anterior al despliegue, unidad e identidad conservadas al reanudar |
| Persistencia | Guardar, reintentar sin duplicados, error visible, payload anterior y nuevo, mutaciones pendientes y cliente viejo con JSON completo |
| Eliminación | Borrar la actividad con la mejor marca recupera la anterior y recalcula listado, detalle y comparación sin esperar una recarga manual |
| Consultas | Más de una página de resultados, listado y detalle coherentes, resumen histórico completo y sin contaminación entre atletas |
| Historial | Guardar, recargar y abrir series fuente; rutina editada o eliminada no altera el pasado; anotaciones y datos `untracked` se conservan |
| Navegación y roles | Entradas contextuales, reload, atrás/adelante, borradores protegidos, coach asignado en lectura y preview sin mutaciones |
| Accesibilidad y responsive | 320/390 px mobile, 958 px intermedio y 1440 px desktop; ambos temas, teclado, nombres accesibles, datos del gráfico disponibles sin depender solo del color o de hover |
| Baja fricción | Medir el registro de una serie frente al objetivo del PRD, incluyendo valores sin cambios; no sustituir esta prueba por validar un componente aislado |

Validar atleta con `athlete@test.com` y coach con `coach@test.com`. Remover datos
QA y restaurar selección de usuario, atleta y sesión persistida al terminar.
Antes de un release ejecutar las pruebas pertinentes, lint, build y
`git diff --check`; después verificar versión y flujo afectado en producción.

La revisión del 30 de septiembre fue de código y documentación: no ejecutó la
feature inexistente, no verificó un inventario actualizado de producción y no
aplicó migraciones. Esta matriz es trabajo futuro, no evidencia de QA realizado.

## Fuera de alcance

- tiempo y distancia por ejercicio;
- objetivos, hitos, alertas o recomendaciones automáticas;
- edición manual de marcas;
- administración global para corregir, archivar, fusionar o separar
  definiciones;
- insights automáticos del coach;
- comparación entre atletas.

Estos puntos permanecen como evolución futura.
