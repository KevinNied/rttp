# Rutinas personales para atletas

## Objetivo

Permitir que una persona con rol `athlete` cree, edite, programe, entrene y siga
sus propias rutinas sin depender de un coach.

La relación con un coach pasa a ser opcional para el atleta, pero los roles de la
aplicación no cambian:

- un `coach` continúa teniendo únicamente su experiencia y workspace de coach;
- un `athlete` continúa teniendo únicamente su experiencia de atleta;
- un atleta puede tener un coach asignado o entrenar de forma independiente.

El alcance no convierte a los coaches en atletas, no agrega cuentas híbridas y no
replantea la navegación del workspace del coach.

## Principios de producto

- Todo atleta puede entrenar sin coach.
- Tener coach amplía la planificación disponible, pero no habilita la capacidad
  de entrenar.
- El atleta puede crear y administrar sus propias rutinas desde su sección
  **Rutinas**.
- Una rutina creada por un coach es de solo lectura para el atleta.
- Una rutina creada por el atleta es editable por ese atleta.
- Agenda, ejecución, historial y progreso siguen perteneciendo al atleta.
- La interfaz debe comunicar claramente quién creó cada rutina y qué acciones
  están permitidas.

## Roles

El contrato conserva los roles actuales:

```ts
type Role = "coach" | "athlete";
```

### Coach

- Gestiona únicamente a sus atletas asignados.
- Crea y edita rutinas para esos atletas.
- Usa el workspace de coach.
- No recibe una experiencia personal de atleta como parte de este alcance.

### Atleta

- Usa la experiencia de atleta.
- Puede existir sin estar incluido en la lista de ningún coach.
- Puede crear rutinas personales.
- Puede usar rutinas personales y rutinas creadas por su coach.
- Solo puede editar las rutinas que creó.

## Autoría y permisos de rutina

La rutina necesita guardar quién la creó.

```ts
type Routine = {
  id: string;
  athleteId: number;
  createdById: number;
  title: string;
  objective: string;
  durationMinutes: number | null;
  structure: RoutineStructure;
};
```

- `athleteId` identifica a la persona que usa y ejecuta la rutina.
- `createdById` identifica al usuario que creó la rutina.
- Si `createdById === athleteId`, la rutina es personal y el atleta puede editarla.
- Si `createdById` pertenece a un coach, el atleta puede verla, programarla y
  entrenarla, pero no editar su contenido.
- El coach solo puede editar una rutina que haya creado para uno de sus atletas
  asignados.

En la primera versión no se agregan `origin`, `managedById`, capacidades de
cuenta ni relaciones nuevas si `createdById` y la asignación actual alcanzan para
expresar el comportamiento aprobado.

## Experiencia del atleta

La navegación principal no cambia:

- Inicio;
- Rutinas;
- Agenda;
- Progreso;
- Perfil.

La creación y edición se agregan dentro de **Rutinas**.

### Biblioteca

Cada tarjeta debe mostrar el origen de forma legible:

- **Creada por vos**;
- **Creada por {coach}**.

La acción principal depende del permiso:

- rutina personal: ver, editar, programar, entrenar y eliminar;
- rutina del coach: ver, programar y entrenar;
- las acciones todavía no aprobadas, como duplicar o desvincular, no se incorporan
  por inferencia.

### Editor

El atleta reutiliza el editor de rutinas existente con la misma estructura de
secciones y ejercicios.

El editor debe:

- ser mobile-first;
- mantener guardado explícito y protección de cambios sin guardar;
- usar las mismas reglas de validación que el editor del coach;
- quedar disponible únicamente para rutinas creadas por el atleta actual;
- mantener las rutinas del coach en una vista de solo lectura.

## Atleta sin coach

Un atleta sin coach conserva acceso completo a:

- Home;
- creación y biblioteca de rutinas;
- agenda;
- ejecución;
- historial y progreso;
- perfil.

La ausencia de coach debe mostrarse como un estado normal, no como una cuenta
incompleta o bloqueada.

Los mensajes actuales que presuponen un entrenador deben adaptarse. Por ejemplo,
una rutina vacía creada por el atleta no debe decir “Tu entrenador todavía no
cargó ejercicios”.

## Agenda, ejecución e historial

- Las rutinas propias y las creadas por un coach se programan con el mismo flujo.
- El motor de workout no cambia según el creador.
- Cada actividad histórica sigue perteneciendo al atleta que entrenó.
- El snapshot histórico debe conservar `createdById` para explicar el origen de la
  rutina aunque luego cambie la relación con el coach.
- Editar una rutina personal o una rutina del coach no modifica actividades
  históricas anteriores.

## Persistencia y migración

La implementación requiere:

1. agregar `created_by_id` a `routines`;
2. agregar `createdById` al contrato TypeScript, mappers y payloads;
3. incluir la autoría en snapshots de actividad cuando corresponda;
4. actualizar RPC, migraciones y outbox;
5. inferir el creador de las rutinas existentes sin perder datos;
6. mantener `profiles.role` y `profiles.athlete_ids`;
7. permitir perfiles `athlete` que no aparezcan en `athlete_ids` de ningún coach;
8. aplicar permisos de edición tanto en la UI como en la futura RLS.

Antes de modificar Supabase se debe crear y verificar un backup.

## Primera versión propuesta

- Botón para crear rutina dentro de la biblioteca del atleta.
- Editor completo para rutinas personales.
- Autor visible en todas las rutinas.
- Rutinas del coach en modo de solo lectura.
- Edición y eliminación de rutinas personales.
- Atleta funcional sin coach.
- Migración de datos existentes.
- Validación con atleta sin coach, atleta con coach y coach asignado.

## Decisiones pendientes antes de implementar

Todavía requieren confirmación explícita:

- visibilidad del coach sobre las rutinas creadas por el atleta;
- posibilidad de duplicar una rutina del coach como rutina personal;
- capacidad del atleta para ocultar o quitar una rutina asignada;
- comportamiento de rutinas del coach cuando termina la relación;
- organización visual de rutinas propias y asignadas;
- asignación de `createdById` a las rutinas existentes durante la migración;
- disponibilidad de plantillas para atletas;
- creación inicial de atletas independientes mientras no existe Supabase Auth.

## Criterios de aceptación

- Un atleta sin coach puede crear, editar, programar y completar una rutina.
- Un atleta con coach puede combinar rutinas propias y rutinas asignadas.
- El atleta no puede editar directamente una rutina creada por su coach.
- El coach conserva el flujo actual para crear y editar rutinas de sus atletas.
- Cada rutina muestra quién la creó.
- Los permisos se calculan desde datos persistidos y no solo desde la ruta visible.
- Agenda, workout, reload, historial y responsive continúan funcionando.
- La migración conserva usuarios, rutinas, entrenamientos y actividades actuales.
