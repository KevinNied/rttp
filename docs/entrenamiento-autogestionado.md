# Entrenamiento autogestionado y coaching opcional

## Objetivo

RTTP deja de asumir que toda experiencia de entrenamiento nace de una relación
entre coach y atleta. Cualquier persona puede crear rutinas, programarlas,
entrenarlas y seguir su progreso sin depender de un coach.

El coaching pasa a ser una capacidad adicional y una relación opcional. Una misma
cuenta puede entrenar por su cuenta, recibir planificación externa y gestionar a
otras personas sin perder su espacio personal.

## Principios de producto

- Toda cuenta tiene una experiencia personal de entrenamiento.
- Tener coach es opcional.
- Ser coach es una capacidad adicional, no una identidad excluyente.
- La agenda, el historial y el progreso pertenecen siempre a quien entrena.
- La procedencia y los permisos de cada rutina deben ser visibles y predecibles.
- Una rutina asignada por un coach no se modifica accidentalmente desde el espacio
  personal.
- El atleta puede independizarse de una planificación mediante una copia propia.
- Terminar una relación no elimina rutinas utilizadas ni actividades históricas.

## Identidad y capacidades

El perfil deja de usar un rol exclusivo `coach | athlete`. Toda persona puede
entrenar y algunas cuentas habilitan además la capacidad de coaching.

```ts
type Profile = {
  id: number;
  name: string;
  email: string;
  capabilities: {
    coaching: boolean;
  };
};
```

La capacidad de coaching habilita un workspace adicional. No reemplaza la Home
personal ni modifica la propiedad del historial de la cuenta.

En una primera versión cualquier usuario puede activar esta capacidad desde su
perfil. La verificación profesional, los planes pagos y los límites comerciales
quedan fuera de alcance.

## Relación de coaching

La relación deja de almacenarse como una lista dentro del coach y pasa a ser una
entidad independiente.

```ts
type CoachingRelationship = {
  id: string;
  coachId: number;
  athleteId: number;
  status: "pending" | "active" | "ended";
  permissions: {
    viewPersonalRoutines: boolean;
    viewFullHistory: boolean;
  };
  createdAt: string;
  endedAt: string | null;
};
```

El modelo soporta más de un coach por persona. La primera interfaz puede destacar
uno principal, pero no debe introducir una restricción que obligue a migrar el
dominio para sumar especialistas después.

### Visibilidad predeterminada

- El coach ve y administra las rutinas que creó para esa persona.
- El coach ve las actividades realizadas sobre sus rutinas asignadas.
- Las rutinas personales y el resto del historial permanecen privados.
- El atleta puede conceder acceso adicional mediante los permisos de la relación.
- Finalizar la relación revoca el acceso futuro del coach.

## Propiedad de rutinas

Una rutina necesita identificar quién la ejecuta, quién la creó, quién la
administra y de dónde proviene.

```ts
type RoutineOrigin = "personal" | "coach" | "copied";

type Routine = {
  id: string;
  athleteId: number;
  createdById: number;
  managedById: number;
  origin: RoutineOrigin;
  sourceRoutineId: string | null;
  title: string;
  objective: string;
  durationMinutes: number | null;
  structure: RoutineStructure;
};
```

`athleteId` sigue representando a la persona que ejecuta la rutina. No implica que
esa persona tenga un rol exclusivo de atleta.

### Rutina personal

- `athleteId`, `createdById` y `managedById` pertenecen al mismo usuario.
- El usuario puede editar, programar, duplicar y eliminar la rutina.

### Rutina asignada

- `athleteId` pertenece a quien entrena.
- `createdById` y `managedById` pertenecen al coach.
- El atleta puede ejecutarla y programarla, pero no modificar el contenido.
- El coach puede actualizarla mientras la relación esté activa.

### Copia personal

- El atleta puede duplicar una rutina asignada.
- La copia no recibe futuras modificaciones del coach.
- El atleta pasa a crear y administrar la nueva rutina.
- `sourceRoutineId` conserva la trazabilidad sin crear dependencia funcional.

## Matriz inicial de permisos

| Acción | Personal | Asignada por coach | Copia personal |
| --- | --- | --- | --- |
| Ver y entrenar | Atleta | Atleta | Atleta |
| Programar | Atleta | Atleta o coach | Atleta |
| Editar contenido | Atleta | Coach | Atleta |
| Duplicar | Atleta | Atleta o coach | Atleta |
| Eliminar del espacio personal | Atleta | Coach mientras la relación esté activa | Atleta |
| Consultar actividad | Atleta | Atleta y coach relacionado | Atleta |

Las acciones del coach están condicionadas por una relación activa.

## Experiencia personal

La navegación principal de toda cuenta conserva:

- Inicio;
- Rutinas;
- Agenda;
- Progreso;
- Perfil.

La pantalla de rutinas deja de asumir que todos los planes fueron asignados.
Presenta una biblioteca única con filtros:

- **Todas**;
- **Mis rutinas**;
- **Asignadas**.

Cada rutina muestra su procedencia:

- Personal;
- Asignada por `{coach}`;
- Copiada de `{rutina}`.

El editor existente se reutiliza para rutinas personales. La disponibilidad de
acciones depende de permisos, no de montar un editor diferente para cada tipo de
usuario.

## Workspace de coach

Una cuenta con capacidad de coaching puede alternar explícitamente entre:

- **Mi entrenamiento**;
- **Workspace de coach**.

El espacio personal es la entrada predeterminada. El workspace profesional
mantiene la gestión de personas, plantillas, rutinas, agenda e historial
permitido.

Activar la capacidad de coaching no crea atletas automáticamente ni cambia la
experiencia personal.

## Agenda, ejecución e historial

- Las rutinas personales y asignadas se programan con el mismo flujo.
- Cada entrenamiento pertenece a la persona que lo ejecuta.
- El motor de workout no cambia según el origen de la rutina.
- El snapshot histórico conserva origen, creador y administrador al comenzar o
  completar la sesión.
- Editar, copiar o perder acceso a la rutina original no modifica actividades
  históricas.
- El progreso personal agrega todas las actividades del usuario.
- El coach solo consulta el alcance concedido por la relación.

## Ciclo de vida de la relación

### Inicio

1. Un coach invita a una persona existente o crea una invitación por email.
2. La persona acepta la relación.
3. El coach puede asignar rutinas y consultar el alcance autorizado.

La creación automática de cuentas sin aceptación se mantiene únicamente como
compatibilidad temporal mientras no exista Supabase Auth.

### Finalización

- La relación pasa a `ended`; no se elimina.
- El coach pierde permisos de lectura y escritura.
- Las actividades históricas permanecen intactas.
- Las rutinas asignadas quedan disponibles como referencia entrenable de solo
  lectura.
- El atleta puede convertir una rutina asignada en copia personal editable.
- No se reciben futuras actualizaciones del coach.

## Onboarding

Una persona sin coach puede:

- crear una rutina desde cero;
- comenzar desde una plantilla inicial;
- programar una rutina;
- entrenar inmediatamente;
- conectar un coach más adelante.

El acceso inicial no pregunta de forma excluyente “atleta o coach”. La capacidad
de coaching se activa después desde el perfil.

## Cambios de persistencia

La implementación requerirá:

1. reemplazar `profiles.role` y `profiles.athlete_ids` por capacidades y relaciones;
2. crear `coaching_relationships`;
3. agregar a `routines`:
   - `created_by_id`;
   - `managed_by_id`;
   - `origin`;
   - `source_routine_id`;
4. migrar las relaciones actuales sin perder usuarios;
5. inferir el creador y administrador de las rutinas existentes;
6. incorporar los metadatos de origen a snapshots y plantillas;
7. actualizar RPC, mappers, outbox y futura RLS;
8. mantener identificadores y actividades históricas existentes.

La migración debe ejecutarse después de crear y verificar un backup completo.

## Primera versión funcional

La primera entrega incluye:

- espacio personal para todas las cuentas;
- creación, edición, duplicación y eliminación de rutinas personales;
- biblioteca con filtros y procedencia;
- asignaciones del coach en modo lectura para el atleta;
- duplicación de una asignación como rutina personal;
- alternancia entre espacio personal y workspace de coach;
- relación de coaching independiente;
- migración de usuarios y rutinas actuales;
- permisos aplicados en UI y persistencia.

Quedan fuera de esta primera versión:

- marketplace o biblioteca pública;
- colaboración simultánea sobre una rutina;
- monetización y límites de planes;
- verificación profesional;
- comentarios en tiempo real entre coach y atleta;
- sincronización automática entre una asignación y una copia personal;
- invitaciones reales hasta incorporar Supabase Auth.

## Criterios de aceptación

- Una persona sin coach puede completar el flujo crear → programar → entrenar →
  consultar historial.
- Una cuenta con capacidad de coaching conserva su espacio personal.
- Un coach puede asignar una rutina sin apropiarse del historial completo del
  atleta.
- El atleta no puede editar directamente una rutina administrada por el coach.
- El atleta puede crear una copia personal independiente.
- Las vistas muestran claramente procedencia y permisos.
- Finalizar una relación no elimina rutinas utilizadas ni actividades.
- Las cuentas y rutinas actuales se migran sin perder datos.
- Los flujos funcionan con reload, outbox, mobile y desktop.
