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
- Las rutinas personales son privadas para el coach por defecto.
- El atleta puede compartir explícitamente una rutina personal con su coach en
  modo de solo lectura.
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
  sharedWithCoachId: number | null;
  archivedAt: string | null;
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
- El coach no puede descubrir una rutina personal del atleta mientras este no la
  haya compartido explícitamente.
- Compartir una rutina personal no transfiere su autoría ni concede permisos de
  edición al coach.

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

La biblioteca usa una única lista con tres filtros:

- **Todas**;
- **Mías**;
- **Coach**.

**Todas** es la vista inicial. Los filtros no reemplazan la indicación de autor
en cada rutina.

Cada tarjeta debe mostrar el origen de forma legible:

- **Creada por vos**;
- **Creada por {coach}**.

La vista de detalle o revisión también debe mostrar quién creó la rutina. La
autoría no puede depender únicamente de una tarjeta previa, un filtro o el
contexto de navegación.

La acción principal depende del permiso:

- rutina personal: ver, editar, programar, entrenar y eliminar;
- rutina del coach: ver, programar, entrenar y duplicar;
- duplicar crea una rutina personal independiente, con el atleta como autor y sin
  sincronización posterior con la original del coach;
- el atleta puede archivar una rutina del coach en su propia biblioteca y
  restaurarla después, sin borrar la rutina ni modificar la asignación del coach.

### Editor

El atleta reutiliza el editor de rutinas existente con la misma estructura de
secciones y ejercicios.

El editor debe:

- ser mobile-first;
- mantener guardado explícito y protección de cambios sin guardar;
- usar las mismas reglas de validación que el editor del coach;
- quedar disponible únicamente para rutinas creadas por el atleta actual;
- mantener las rutinas del coach en una vista de solo lectura.

### Compartir con el coach

- Una rutina personal comienza privada.
- El atleta puede compartirla explícitamente con su coach asignado.
- La rutina compartida aparece al coach en modo de solo lectura.
- El atleta puede identificar claramente si la rutina está privada o compartida.
- El atleta puede revocar el acceso en cualquier momento.
- El permiso de compartir solo está disponible cuando existe un coach asignado.
- Cambiar o perder el coach asignado revoca el acceso anterior; compartir con un
  futuro coach siempre requiere una nueva acción explícita.

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

Mientras no exista Supabase Auth, el acceso conserva el flujo local por email. Se
agregan perfiles `athlete` que no estén incluidos en `athleteIds` de ningún coach;
no se crea un registro público provisional que luego deba reemplazarse.

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
- Eliminar una rutina personal borra su definición y sus entrenamientos
  asociados, pero no elimina sus actividades históricas ni rompe sus snapshots.

### Fin de la relación con el coach

- Las rutinas creadas por el coach permanecen en la biblioteca del atleta en modo
  de solo lectura.
- El atleta puede seguir programándolas, entrenarlas, duplicarlas o archivarlas.
- El ex-coach pierde inmediatamente el acceso al atleta y a sus rutinas.
- Las rutinas personales compartidas dejan de estar disponibles para el ex-coach.
- La autoría visible continúa identificando al coach original.

## Persistencia y migración

La implementación incorpora:

1. `created_by_id`, `shared_with_coach_id` y `archived_at` en `routines`;
2. los campos equivalentes en el contrato TypeScript, mappers y payloads;
3. la autoría en snapshots de actividad;
4. el RPC de creación de atletas y la outbox actualizados;
5. la atribución de cada rutina existente al único coach actualmente relacionado
   con su atleta;
6. `profiles.role` y `profiles.athlete_ids` sin alterar el modelo de roles;
7. perfiles `athlete` que no aparecen en `athlete_ids` de ningún coach;
8. permisos de edición aplicados en dominio, aplicación y UI;
9. una compatibilidad transitoria que guarda estos metadatos dentro de `structure`
   hasta aplicar la migración relacional en Supabase.

Si una rutina existente no tiene un único coach inferible, la migración debe
detenerse para resolver ese registro explícitamente. No se atribuye la rutina al
atleta ni a un coach arbitrario como fallback.

Antes de modificar Supabase se debe crear y verificar un backup.

## Primera versión implementada

- Botón para crear rutina dentro de la biblioteca del atleta.
- Creación desde una rutina en blanco y mediante duplicación de una rutina
  existente.
- Editor completo para rutinas personales.
- Autor visible en tarjetas y vistas de detalle o revisión.
- Rutinas personales privadas por defecto y compartibles explícitamente con el
  coach en modo de solo lectura.
- Rutinas del coach en modo de solo lectura.
- Edición y eliminación de rutinas personales.
- Eliminación definitiva de rutinas personales con confirmación.
- Archivado restaurable de rutinas creadas por el coach dentro de la biblioteca
  del atleta.
- Atleta funcional sin coach.
- Migración de datos existentes.
- Validación con atleta sin coach, atleta con coach y coach asignado.

## Decisiones confirmadas

- las rutinas personales son privadas por defecto y el atleta puede compartirlas
  explícitamente con su coach en modo de solo lectura;
- las tarjetas y vistas de detalle o revisión muestran quién creó la rutina.
- el atleta puede duplicar una rutina del coach como copia personal independiente
  y editable; la copia no modifica ni se sincroniza con la original;
- el atleta puede archivar y restaurar una rutina asignada en su propia biblioteca,
  sin eliminarla ni modificar el trabajo del coach;
- al terminar la relación, las rutinas del coach permanecen disponibles para el
  atleta en modo de solo lectura y el ex-coach pierde todo acceso;
- la biblioteca usa una sola lista con filtros **Todas**, **Mías** y **Coach**, y
  mantiene el autor visible en cada resultado;
- las rutinas existentes se atribuyen al único coach relacionado con su atleta y
  cualquier caso ambiguo se resuelve explícitamente antes de migrar;
- la primera versión ofrece creación en blanco y duplicación, sin catálogo de
  plantillas;
- mientras no exista Supabase Auth, los atletas independientes se representan
  mediante perfiles accesibles por el flujo local de email y sin coach asignado;
- eliminar una rutina personal borra su definición, conserva sus actividades
  históricas y limpia entrenamientos, sesiones y registros temporales asociados.

## Criterios de aceptación

- Un atleta sin coach puede crear, editar, programar y completar una rutina.
- Un atleta con coach puede combinar rutinas propias y rutinas asignadas.
- El atleta no puede editar directamente una rutina creada por su coach.
- El coach conserva el flujo actual para crear y editar rutinas de sus atletas.
- Cada rutina muestra quién la creó.
- El coach solo puede ver una rutina personal cuando el atleta la comparte y nunca
  puede editarla.
- El atleta puede revocar el acceso compartido y ningún permiso se transfiere
  automáticamente a un coach futuro.
- Eliminar una rutina personal o archivar una rutina del coach no elimina ni
  modifica las actividades históricas.
- Los permisos se calculan desde datos persistidos y no solo desde la ruta visible.
- Agenda, workout, reload, historial y responsive continúan funcionando.
- La migración conserva usuarios, rutinas, entrenamientos y actividades actuales.
