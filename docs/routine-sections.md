# Bloques extensibles de rutina

## Objetivo

RTTP usa una única estructura capaz de representar rutinas clásicas, circuitos y
combinaciones de ambos estilos. En la experiencia de producto, una rutina
contiene bloques ordenados y cada bloque define su propia estrategia de
ejecución.

No existe un modo global de rutina ni un `structureVersion`: la estructura es el
contrato canónico y una misma rutina puede mezclar distintos tipos de sección.
El contrato técnico conserva `sections` y `RoutineSection`; “bloque” es el
vocabulario visible para atletas y coaches.

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
La posición se comunica siempre como `Bloque N`. El nombre solo aparece cuando
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

- Atletas y coaches pueden crear bloques secuenciales y por rondas mediante un
  editor inline, sin abandonar el contexto de la rutina.
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
- El drag-and-drop funciona dentro de un bloque y entre bloques.
- Los bloques secuenciales completan todas las series de cada ejercicio juntas.
- Los bloques por rondas conservan la alternancia.
- Plantillas, snapshots e historial usan únicamente el contrato nuevo.
- No quedan escrituras ni colas pendientes con el formato anterior.
