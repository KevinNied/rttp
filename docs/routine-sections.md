# Estructura y presentación de rutinas

## Objetivo

RTTP usa una única estructura capaz de representar rutinas clásicas, circuitos y
combinaciones de ambos estilos. Una rutina completamente secuencial se presenta
como una única lista ordenada de ejercicios. Solo los circuitos y las rutinas
mixtas presentan agrupaciones como bloques.

No existe un modo global de rutina ni un `structureVersion`: la estructura es el
contrato canónico y una misma rutina puede mezclar distintos tipos de sección.
El contrato técnico conserva `sections` y `RoutineSection`. La presentación se
deriva de la estructura, sin agregar un modo global ni fusionar secciones
existentes.

## Experiencia secuencial

Cuando todas las secciones son `sequential`, creación, edición, biblioteca,
vista general, ejecución, plantillas e historial muestran una lista única:

- No hay nombres, contadores, acordeones ni acciones de bloque.
- Los ejercicios se agregan directamente y se ordenan sobre la lista completa,
  también cuando proceden de varias secciones internas.
- El reordenamiento conserva los identificadores y los metadatos de las
  secciones; solo el ejercicio trasladado cambia de sección si cruza un límite.
- El editor conserva una acción secundaria `Agregar circuito`. Al usarla, la
  rutina pasa a una presentación agrupada. Si la rutina nueva tiene una única
  sección vacía, esa sección se reutiliza para el circuito.
- Las aclaraciones nuevas se guardan por serie o ejercicio. Las antiguas por
  sección siguen visibles con una etiqueta general y mantienen su alcance.
- El historial determina la presentación desde el snapshot guardado, nunca
  desde la rutina actual. Las actividades sin snapshot conservan su fallback.

La presentación plana no cambia el orden de ejecución, los registros, el
cronómetro, los descansos, las omisiones, los permisos ni el guardado explícito.
No requiere migrar la base de datos ni reescribir rutinas, plantillas o snapshots.

## Contrato

```ts
type Routine = {
  id: string;
  athleteId: number;
  title: string;
  objective: string;
  durationMinutes: number | null;
  structure: {
    sections: RoutineSection[];
  };
};
```

Cada sección separa tres conceptos:

- `kind`: estrategia de ejecución;
- `role`: propósito dentro de la sesión;
- `presentation`: densidad o variante visual.

Los valores iniciales son:

```ts
type SectionKind = "sequential" | "rounds";
type SectionRole = "warmup" | "activation" | "main" | "cooldown" | "custom";
type SectionPresentation = "standard" | "compact";
```

`RoutineSection.name` es opcional y puede persistirse como `null` o texto vacío.
En presentaciones agrupadas, la posición se comunica como `Bloque N`. El nombre solo aparece cuando
aporta intención, por ejemplo “Fuerza de tren inferior”; valores heredados como
“Bloque 1” o “Sección 1” se tratan como ausentes en la interfaz.

## Semántica de ejecución

### `sequential`

Completa todas las series del primer ejercicio antes de avanzar al siguiente. Es
el comportamiento esperado para una rutina clásica.

Ejemplo con dos ejercicios de tres series:

```text
A1, A2, A3, B1, B2, B3
```

### `rounds`

Alterna los ejercicios que todavía tengan series pendientes en cada ronda. Es el
comportamiento esperado para superseries y circuitos.

Ejemplo con dos ejercicios de tres series:

```text
A1, B1, A2, B2, A3, B3
```

El motor compila ambas estrategias a una secuencia común. Cronómetro, descanso,
posposición, omisión, vista general y finalización operan sobre esa secuencia y
no necesitan conocer detalles del editor.

## Vista general

La vista general previa al entrenamiento es compartida por atletas y coaches.
El panel se centra dentro del área segura del viewport dinámico y reserva un
margen adicional arriba y abajo, también en la PWA instalada. El encabezado y
el cierre permanecen visibles; solo el listado de ejercicios o agrupaciones se desplaza, usando
el espacio restante según la altura real del título y la descripción.

El recorrido termina en el último ejercicio o agrupación, sin una etiqueta decorativa de
“Fin de la rutina” ni un espacio reservado para ella.

## Persistencia

- `routines.structure` y `routine_templates.structure` guardan el contrato
  canónico como `jsonb`.
- `routine_snapshot` conserva la misma estructura dentro de cada actividad
  histórica.
- `workout_activity_sets` identifica `section_id`, `section_name` e
  `iteration_number`.
- Las restricciones de PostgreSQL validan que `structure.sections` sea un array
  y que cada sección use valores soportados.

La migración `20260909000000_extensible_routine_sections.sql` convierte de forma
atómica las rutinas, plantillas, snapshots y series históricas. El formato
anterior no se mantiene como contrato alternativo.

## Extender con una estrategia nueva

Agregar una estrategia —por ejemplo AMRAP, EMOM, intervalos u orden libre—
requiere:

1. ampliar la unión discriminada `RoutineSection`;
2. definir su configuración y validación;
3. agregar su editor;
4. compilarla a pasos en el motor de ejecución;
5. agregar el valor a la restricción de Supabase;
6. cubrir persistencia, reload, historial y responsive UX.

`role` y `presentation` no deben usarse para inferir ejecución. De esta forma una
estrategia puede presentarse de distintas maneras y cumplir diferentes objetivos
sin multiplicar tipos innecesariamente.

## Criterios de aceptación

- Atletas y coaches agregan y editan ejercicios directamente en las rutinas
  secuenciales. Los circuitos y las rutinas mixtas conservan el editor inline de
  agrupaciones, sin abandonar el contexto de la rutina.
- El bloque recién creado queda abierto y listo para sumar su primer ejercicio.
- El nombre del bloque es opcional y nunca se completa con un placeholder
  persistido.
- Una rutina puede mezclar ambas estrategias.
- El descanso opcional de cada ejercicio puede cargarse en segundos o minutos,
  pero se conserva en segundos dentro del modelo canónico.
- El atleta puede eliminar definitivamente las rutinas que creó, incluso si
  están archivadas o son su último plan. Se eliminan sus entrenamientos
  programados o en curso, pero se conservan los snapshots del historial.
- Una sesión en curso se puede cancelar desde el modo entrenamiento. Al
  cancelarla se eliminan el cronómetro, el progreso y la agenda asociada sin
  crear una actividad completada.
- El drag-and-drop funciona sobre toda la lista secuencial y, en presentaciones
  agrupadas, dentro de un bloque y entre bloques.
- Los bloques secuenciales completan todas las series de cada ejercicio juntas.
- Los bloques por rondas conservan la alternancia.
- Plantillas, snapshots e historial usan únicamente el contrato nuevo.
- No quedan escrituras ni colas pendientes con el formato anterior.
