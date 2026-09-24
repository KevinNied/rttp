# Auditoría integral UX/UI de RTTP

> **Estado:** Fases 0–6 completadas.
>
> **Versiones auditadas:** 0.13.7 durante las Fases 0–5 y 0.13.8 durante la Fase 6.
>
> **Fecha de corte:** 24 de septiembre de 2026.
>
> **Alcance:** diagnóstico y recomendaciones; no constituye aprobación para implementar cambios.

Este documento es la fuente canónica de la auditoría UX/UI solicitada para RTTP. Conserva los entregables completos de cada fase para que los hallazgos, evidencia, decisiones abiertas y propuestas no dependan del historial de una sesión de trabajo.

El [PRD](./prd-init.md) continúa siendo la fuente de verdad del producto. Este documento describe el estado observado de la experiencia y las recomendaciones de diseño sobre esa base. El [tablero de alternativas para la Home del atleta](./ux-audit-assets/athlete-home-concepts.html) conserva el artefacto visual citado en la Fase 2.

Cada sección reproduce el entregable de esa fase. Las referencias a estado del
servidor, sesión, worktree o “siguiente fase” describen el cierre de esa
instancia de auditoría y se conservan como evidencia histórica.

## Estado de la auditoría

| Fase | Alcance | Estado | Hallazgos formalizados |
| --- | --- | --- | ---: |
| 0 | Reconocimiento, inventario y mapa de flujos | Completa | Inventario y preguntas abiertas |
| 1 | Sistema visual | Completa | 17 |
| 2 | Arquitectura de información y jerarquía | Completa | 14 |
| 3 | Walkthrough de flujos críticos | Completa | 17 |
| 4 | UI fina y detalle | Completa | 23 |
| 5 | Responsive y multiplataforma | Completa | 12 |
| 6 | Accesibilidad | Completa | 15 |

La auditoría completa documenta **98 hallazgos con identificador**, además del inventario integral, mapa de flujos y preguntas abiertas de la Fase 0.

## Resumen ejecutivo definitivo

Los diez problemas transversales que más daño producen hoy son:

1. **La persistencia no comunica su estado real.** La interfaz puede mostrar “Guardado” antes de conocer el resultado remoto y algunas mutaciones pueden perderse si falla la hidratación inicial.
2. **Un coach sin atletas queda fuera de su workspace.** El primer uso impide completar la tarea que debería desbloquear el producto: agregar al primer atleta.
3. **Light mode falla contraste en acciones críticas.** “Completar serie” llega a aproximadamente `1.17:1`, por lo que el CTA principal puede resultar ilegible.
4. **Hay controles editables sin foco visible.** Los campos centrales del workout y del editor eliminan el ring y el borde de foco; un usuario de teclado puede perder su posición.
5. **Viewports bajos y landscape bloquean tareas.** Acceso, workout, omisión y creación de rutinas pueden ocultar contenido o acciones sin una vía clara para alcanzarlos.
6. **Crear y duplicar rutinas tiene desvíos de flujo.** Se persisten drafts vacíos y “Duplicar y editar” no conserva abierto el editor esperado.
7. **Estados y progreso no siempre se exponen a tecnologías asistivas.** Filtros, tabs, selección de rutina, Agenda, esfuerzo final y la barra de progreso dependen de apariencia o reciben nombres incorrectos.
8. **La Home prioriza inventario o ausencia antes que continuidad.** Tanto atleta como coach tardan en encontrar la próxima acción relevante.
9. **La edición mobile pierde capacidades y precisión.** No permite eliminar ejercicios y concentra controles táctiles pequeños en tareas frecuentes y destructivas.
10. **El feedback transversal es incompleto.** Faltan contratos consistentes para carga, éxito, error, sincronización, anuncios accesibles y reducción de movimiento.

## Índice

- [Fase 0 — Reconocimiento](#fase-0--reconocimiento)
- [Fase 1 — Auditoría del sistema visual](#fase-1--auditoría-del-sistema-visual)
- [Fase 2 — Arquitectura de información y jerarquía](#fase-2--arquitectura-de-información-y-jerarquía)
- [Fase 3 — Walkthrough de flujos críticos](#fase-3--walkthrough-de-flujos-críticos)
- [Fase 4 — UI fina y detalle](#fase-4--ui-fina-y-detalle)
- [Fase 5 — Responsive y multiplataforma](#fase-5--responsive-y-multiplataforma)
- [Fase 6 — Accesibilidad](#fase-6--accesibilidad)

---

## Fase 0 — Reconocimiento

**Estado:** completada, sin modificar código ni contratos de datos.

Revisé la documentación canónica, la composición de rutas, los componentes y la aplicación ejecutándose con `athlete@test.com` y `coach@test.com`. Recorrí estados vacíos, creación sin guardar, entrenamiento activo, finalización, historial, agenda, estados omitidos/completados, edición, vista previa y confirmaciones.

La app quedó:

- sin datos temporales de auditoría;
- en tema oscuro;
- con sesión cerrada;
- con el servidor local detenido;
- con el repositorio limpio.

---

### 1. Modelo general encontrado

RTTP funciona como una aplicación con una única raíz de composición en [page.tsx](../src/app/page.tsx#L65). Las demás rutas vuelven a renderizar esa raíz y seleccionan una superficie según:

1. usuario local;
2. rol;
3. URL;
4. atleta seleccionado;
5. existencia de un entrenamiento activo;
6. modo de vista previa.

Las reglas de navegación están centralizadas en [routes.ts](../src/application/navigation/routes.ts#L1).

#### Consecuencia estructural importante

Un entrenamiento activo tiene prioridad sobre la ruta. Aunque la URL sea `/`, `/routines` o `/schedule`, la composición puede mostrar:

- ejecución inmersiva;
- cierre de rutina;
- recuperación de una sesión pausada.

Esto convierte al workout en un estado global, no en una ruta independiente.

---

### 2. Inventario de rutas y pantallas

#### Acceso público

| Ruta | Superficie | Estados relevados |
|---|---|---|
| `/` sin usuario | Landing de acceso | Reposo, diálogo de ingreso, email inválido, envío deshabilitado |
| Cualquier ruta sin usuario | Redirección a `/` | La ruta solicitada no se conserva después del acceso |

Implementación principal: [LandingAcceso](../src/features/landing/access-landing.tsx#L21).

El acceso actual es un selector local de perfil por email, no autenticación.

---

#### Atleta

| Ruta | Pantalla principal | Estados internos |
|---|---|---|
| `/` | Home “Tu entrenamiento de hoy” | Día libre, rutina agendada, rutina en curso, rutina completada, actividad externa, rutina no disponible, próxima actividad, ritmo semanal |
| `/routines` | Biblioteca de rutinas | Todas, propias, coach, archivadas, filtro vacío, rutina incompleta, seleccionada, progreso activo |
| `/routines` | Editor personal interno | Rutina nueva, duplicada, privada, compartida, guardada, modificada, ejercicio inválido, cambios sin guardar |
| `/schedule` | Agenda deportiva | Semana vacía, día seleccionado, rutina programada, actividad externa, en curso, omitida, completada |
| `/activities` | Progreso / historial | Historial vacío, filtros, rutina expandida, actividad externa expandida, detalle por bloque |
| `/profile` | Perfil | Atleta con coach y atleta independiente |
| Cualquier ruta con workout activo | Ejecución de rutina | Serie actual, rondas, bloque compacto, descanso, omisión, postergación, anotaciones, resumen |
| Cualquier ruta con workout finalizado | Cierre de rutina | Esfuerzo, duración, feedback y envío |

Componentes principales:

- [HomeHoy](../src/features/athlete/today-home.tsx#L42)
- [HomeAtleta](../src/features/athlete/athlete-home.tsx#L56)
- [ExperienciaAtleta](../src/features/athlete/athlete-experience.tsx#L29)
- [AthleteRoutineEditor](../src/features/athlete/athlete-routine-editor.tsx#L21)
- [SportsSchedule](../src/features/schedule/sports-schedule.tsx#L628)
- [ActivityHistory](../src/components/activity-history.tsx#L455)
- [PerfilUsuario](../src/features/athlete/user-profile.tsx#L15)

---

#### Coach

| Ruta | Pantalla principal | Estados internos |
|---|---|---|
| `/coach` | Resumen | Métricas de atletas, planes, plantillas y rutinas incompletas |
| `/coach/athletes` | Lista de atletas | Cards con planes, ejercicios y rutinas incompletas |
| `/coach/athletes/:id` | Detalle del atleta | Rutinas, agenda y actividades |
| `/coach/athletes/:id` | Editor de rutina | Lectura, edición, rutina compartida, rutina vacía, cambios guardados o pendientes |
| `/coach/athletes/:id` | Vista atleta | Home del atleta inmovilizada en solo lectura |
| `/coach/routines` | Biblioteca de plantillas | Vacía, guardar plantilla, asignar, eliminar |
| `/coach/profile` | Perfil | Información de cuenta y versión |

Componentes principales:

- [HomeEntrenador](../src/features/coach/coach-home.tsx#L34)
- [CoachOverviewView](../src/features/coach/coach-overview-view.tsx#L15)
- [CoachAthletesView](../src/features/coach/coach-athletes-view.tsx#L16)
- [CoachAthleteDetailView](../src/features/coach/coach-athlete-detail-view.tsx#L57)
- [CoachTemplatesView](../src/features/coach/coach-templates-view.tsx#L30)

---

#### Rutas heredadas

[next.config.ts](../next.config.ts#L1) conserva redirecciones desde:

- `/agenda`
- `/rutinas`
- `/actividades`
- `/entrenador`
- `/entrenador/atletas`
- `/entrenador/atletas/:athleteId`
- `/entrenador/rutinas`

---

### 3. Inventario de navegación

La navegación está definida en [navigation-items.ts](../src/features/shell/navigation-items.ts#L1).

#### Atleta

- Inicio
- Rutinas
- Agenda
- Progreso
- Perfil

#### Coach

- Resumen
- Atletas
- Rutinas
- Perfil

#### Variantes del shell

[AppShell](../src/features/shell/app-shell.tsx#L32) tiene cuatro configuraciones:

1. **Desktop expandido:** sidebar con título y descripción.
2. **Desktop compacto:** sidebar de íconos.
3. **Mobile:** header y dock inferior; Perfil vive en el header.
4. **Vista atleta:** sin navegación, con “Volver a editar” y estado de solo lectura.
5. **Workout inmersivo:** shell y navegación ocultos durante la ejecución.

##### Diferencias nominales observadas

- La navegación dice **“Progreso”**, pero la pantalla se titula **“Actividades realizadas”**.
- La navegación del coach dice **“Rutinas”**, pero esa ruta contiene la biblioteca de plantillas. Las rutinas asignadas se editan desde el detalle de cada atleta.
- La vista previa del atleta muestra actualmente Home, pero no permite navegar por Rutinas, Agenda, Progreso o Perfil.

Todavía no evalúo si esas decisiones son correctas; quedan registradas para la Fase 2.

---

### 4. Inventario de overlays y estados transitorios

#### Diálogos

Se encontraron trece implementaciones que contienen diálogo, además de múltiples reutilizaciones del diálogo compartido:

- acceso;
- nueva rutina;
- agregar atleta;
- guardar plantilla;
- asignar plantilla;
- eliminar plantilla;
- vista general de rutina;
- eliminar rutina;
- reiniciar progreso;
- programar entrenamiento;
- eliminar entrenamiento;
- cambios de coach sin guardar;
- abrir enlace externo;
- cerrar sesión con cambios pendientes;
- eliminar actividad;
- cancelar entrenamiento;
- abandonar el editor personal con cambios pendientes.

El diálogo reutilizable es [ConfirmationDialog](../src/features/shared/confirmation-dialog.tsx#L15).

#### Bottom sheets del workout

- Vista general.
- Aclaraciones.
- Saltar o postergar.

Implementaciones:

- [WorkoutOverviewSheet](../src/features/workout/workout-overview-sheet.tsx#L22)
- [WorkoutAnnotationSheet](../src/features/workout/workout-annotation-sheet.tsx#L46)
- [WorkoutSkipSheet](../src/features/workout/workout-skip-sheet.tsx#L21)

#### Popovers de agenda

- Selector de fecha.
- Selector de hora.
- Configuración de recurrencia.

Están agrupados en [schedule-controls.tsx](../src/features/schedule/schedule-controls.tsx#L119).

#### Estados inline

- Edición de entrenamiento dentro de la agenda.
- Creación de bloque.
- Edición de bloques y ejercicios.
- Confirmaciones breves de guardado.
- Errores de sincronización.
- Validaciones que bloquean el guardado.
- Descanso activo, pausado o terminado.

---

### 5. Inventario de componentes

El producto contiene:

- 39 módulos dentro de [src/features/](../src/features);
- 16 primitives en [src/components/ui/](../src/components/ui);
- 2 componentes transversales fuera de las primitives:
  - [ActivityHistory](../src/components/activity-history.tsx#L455);
  - [BlobatarAvatar](../src/components/blobatar-avatar.tsx#L1).

#### Reutilización efectiva

| Familia | Componentes compartidos |
|---|---|
| Shell | AppShell, Logo, ThemeToggle, VersionLabel |
| Página | Clases de page shell, eyebrow, título y descripción |
| Diálogos | Dialog primitive y ConfirmationDialog |
| Rutinas | SelectorRutina, OverviewRutina, RoutineDetailsFields |
| Editor | SeccionEditor, FilaEjercicio, InlineSectionCreator, useRoutineEditor |
| Agenda | Formulario común y controles de fecha, hora y recurrencia |
| Historial | ActivityHistory reutilizado por atleta y coach |
| Workout | CampoPrescripcion, OverviewSheet, SkipSheet, AnnotationSheet |

#### Implementaciones paralelas que hacen cosas equivalentes

Esto es inventario, no priorización:

1. **Confirmaciones destructivas**
   - Algunas usan `ConfirmationDialog`.
   - Otras construyen directamente `Dialog`, footer y botones.

2. **Tabs y filtros segmentados**
   - Biblioteca del atleta.
   - Detalle del atleta.
   - Filtros de historial.
   - Selector de tipo de actividad.
   - Selector secuencial/rondas.
   - Existe una primitive `Tabs`, pero no se utiliza en las features.

3. **Botones**
   - Conviven `Button` y botones HTML con estilos completos locales.
   - Los mismos roles visuales tienen combinaciones cyan, blanco, gradiente, outline y ghost específicas por pantalla.

4. **Cards**
   - Conviven `Card` y superficies construidas con `div`.
   - Home, agenda, historial y workspace tienen variantes locales.

5. **Campos**
   - Conviven `Input`/`Textarea` con `select` nativo y controles numéricos compuestos.

6. **Encabezados**
   - Varias pantallas usan las clases compartidas.
   - Agenda, historial y algunas experiencias inmersivas reconstruyen la misma jerarquía localmente.

7. **Agenda responsive**
   - Reutiliza `TarjetaEntrenamiento`, pero mantiene simultáneamente estructuras mobile y desktop en el DOM, ocultando una por breakpoint.

---

### 6. Mapa de flujos críticos

#### Acceso y rol

```text
Landing
  └─ Ingresar email
      ├─ Email inexistente → error inline
      ├─ Atleta → Home
      └─ Coach → Resumen
```

Los intentos de entrar en rutas del otro rol se redirigen mediante [useRoleRedirect](../src/application/navigation/use-app-navigation.ts#L1).

---

#### Atleta — entrenamiento programado

```text
Home o Agenda
  → Revisar rutina
  → Comenzar / Continuar
  → Registrar serie
      ├─ Cambiar repeticiones o peso
      ├─ Agregar aclaración
      ├─ Postergar
      ├─ Omitir serie
      ├─ Omitir ejercicio
      └─ Omitir bloque
  → Descanso, cuando corresponde
  → Siguiente paso
  → Finalizar
  → Esfuerzo + feedback
  → Enviar y cerrar
  → Actividad histórica
```

##### Recuperación

```text
Workout
  → Salir
  → Cronómetro pausado + sesión persistida
  → Home
  → Continuar rutina
  → Mismo paso, registros, descanso y anotaciones
```

##### Cancelación

```text
Workout
  → Cancelar
  → Confirmación destructiva
  → Elimina sesión activa y ocurrencia
  → No crea actividad
```

---

#### Atleta — entrenamiento no planificado

```text
Home
  → Ir a mis rutinas
  → Seleccionar rutina
  → Comenzar rutina
  → Crear ocurrencia para hoy
  → Flujo normal de workout
```

---

#### Atleta — rutina personal

```text
Biblioteca
  ├─ Nueva rutina
  └─ Duplicar rutina del coach
      → Editor personal
      → Datos generales
      → Bloques
      → Ejercicios
      → Ordenamiento
      → Compartir o mantener privada
      → Guardado explícito
```

Flujos posteriores:

```text
Rutina personal
  ├─ Editar
  ├─ Archivar
  ├─ Restaurar
  └─ Eliminar
```

---

#### Agenda

```text
Agenda semanal
  → Elegir día
  → Programar
      ├─ Rutina RTTP
      └─ Actividad externa
  → Fecha / hora / duración / notas
  → Recurrencia opcional
  → Crear ocurrencias
```

Después de crear:

```text
Programada
  ├─ Editar inline
  ├─ Mover de día
  ├─ Omitir
  │   └─ Restaurar
  ├─ Eliminar
  ├─ Comenzar rutina
  └─ Marcar actividad externa como realizada
      → Crear actividad histórica
```

---

#### Historial

```text
Progreso
  → Filtrar
  → Expandir actividad
      ├─ Rutina → métricas, bloques, ejercicios, series y aclaraciones
      └─ Externa → categoría, duración y notas
  → Eliminar, solo atleta
      → Eliminar también la ocurrencia de agenda
```

El coach reutiliza el mismo historial en modo embebido y sin capacidad de borrado.

---

#### Coach — planificación individual

```text
Resumen
  → Atletas
  → Seleccionar atleta
  → Detalle
      ├─ Rutinas
      │   ├─ Crear
      │   ├─ Editar
      │   ├─ Reordenar
      │   ├─ Guardar
      │   ├─ Eliminar
      │   └─ Revisar rutina compartida, solo lectura
      ├─ Agenda
      ├─ Actividades
      └─ Vista atleta
```

La navegación con cambios pendientes abre una decisión entre seguir editando, descartar o guardar y continuar.

---

#### Coach — plantillas

```text
Rutina actualmente seleccionada
  → Guardar como plantilla
  → Biblioteca de plantillas
      ├─ Asignar a atleta
      └─ Eliminar plantilla
```

Cada asignación crea una copia independiente.

---

### 7. Caminos confirmados

Los siguientes recorridos están conectados de punta a punta:

- acceso local y redirección por rol;
- entrenamiento desde biblioteca;
- finalización y creación de actividad;
- cancelación sin actividad histórica;
- creación, omisión, restauración y finalización de actividad externa;
- eliminación de actividad y ocurrencia;
- edición explícita de rutina por coach;
- protección ante cambios sin guardar;
- agenda y actividades embebidas en el detalle del atleta;
- vista previa de atleta en modo no editable;
- limpieza de datos temporales.

---

### 8. Caminos interrumpidos, ambiguos o deliberadamente incompletos

#### 8.1 “Duplicar y editar” no entra al editor

Durante el recorrido real:

1. se creó correctamente una copia personal;
2. la copia quedó seleccionada;
3. la pantalla volvió a la biblioteca;
4. el editor no se abrió;
5. fue necesario pulsar “Editar” manualmente.

El callback sí intenta abrir el editor en [athlete-experience.tsx](../src/features/athlete/athlete-experience.tsx#L374), pero cambiar la rutina seleccionada altera la `key` de `ExperienciaAtleta` en [page.tsx](../src/app/page.tsx#L741) y reinicia ese estado local.

No lo modifiqué.

#### 8.2 Coach sin atletas

La lista tiene un diálogo para agregar atletas, pero la raíz exige que exista un atleta seleccionado antes de renderizar el workspace. Un coach sin atletas terminaría nuevamente en la landing en lugar de alcanzar el estado vacío del workspace.

No pude recorrerlo sin introducir un perfil adicional, pero el camino está presente en la composición.

#### 8.3 Alcance de “Vista atleta”

Actualmente muestra exclusivamente la Home del atleta, sin navegación interna. El nombre puede interpretarse como:

- preview de Home;
- preview de toda la experiencia del atleta.

El alcance de producto no está explicitado.

#### 8.4 Promesa de edición de actividades del coach

El encabezado de Actividades del coach dice que puede “corregir registros externos incluso después de realizarlos”. Dentro del historial no existe una acción de edición. La actividad externa completada sí puede editarse desde Agenda.

El copy y el punto de interacción no describen exactamente el mismo camino.

#### 8.5 Eliminación seguida de recarga inmediata

Al eliminar la actividad externa temporal y recargar inmediatamente, la actividad desapareció del historial, pero su ocurrencia completada reapareció momentáneamente en Agenda. Se eliminó manualmente y una nueva carga confirmó que no quedó ningún dato.

Puede ser una condición temporal de la outbox y requiere una reproducción específica antes de clasificarla como defecto.

#### 8.6 Iniciativas intencionalmente diferidas

No son caminos rotos del producto actual:

- Supabase Auth y RLS;
- progreso por ejercicio;
- notificaciones;
- integraciones;
- links públicos;
- comunicación coach-atleta.

Están documentadas en el [PRD](../docs/prd-init.md#L1).

---

### 9. Definiciones abiertas antes de la Fase 1

No hace falta resolverlas todas juntas; conviene tratarlas de a una.

1. **Baseline de Home:** auditar estrictamente la Home implementada o considerar también los tres conceptos anteriores como dirección de producto.
2. **Vista atleta:** definir si debe representar solo Home o toda la experiencia navegable.
3. **Coach sin atletas:** confirmar si es un estado soportado desde el primer ingreso o si los coaches siempre serán preaprovisionados.
4. **Defectos funcionales detectados:** decidir si “Duplicar y editar” se corrige antes de la auditoría visual o se incorpora a una ola posterior.
5. **Datos representativos:** autorizar o no una matriz temporal de fixtures con múltiples rutinas, actividades, nombres largos, recurrencias y estados incompletos.
6. **Analítica existente:** confirmar si hay datos reales de frecuencia de uso, abandono o dispositivos; si no existen, la priorización se apoyará en criticidad del flujo y heurísticas.
7. **Plataformas objetivo:** definir navegadores, sistema operativo móvil prioritario y relevancia del modo PWA instalado.
8. **Restricciones de marca:** confirmar qué elementos actuales son intocables —logo, paleta, gradientes, tipografía o referencia Eight Sleep— y cuáles pueden reinterpretarse.

**No avancé a la Fase 1 ni propuse cambios visuales. Quedo detenido en este punto hasta tu confirmación.**

---

## FASE 1 — Auditoría del sistema visual

### Resumen ejecutivo

RTTP **ya tiene una dirección estética reconocible**: superficies oscuras, acentos cyan/violeta, cards amplias, tipografía liviana y una experiencia de workout diferenciada. El problema no es la falta de diseño, sino la falta de un sistema que gobierne ese diseño.

Hoy la apariencia depende demasiado de combinaciones locales de Tailwind:

- 269 combinaciones de color, con 1.394 usos.
- 44 combinaciones tipográficas, con 643 usos.
- 118 usos de texto entre 8 y 11 px en mobile.
- 18 variantes de radio.
- 21 sombras.
- 161 valores arbitrarios, con 457 usos.
- 44 botones HTML directos frente a 66 usos del primitive `Button`.

La consecuencia principal es que **dark mode se ve razonablemente coherente, pero light mode funciona como una reinterpretación automática de clases escritas para dark**. Eso ya produce una regresión crítica: el CTA “Completar serie” tiene aproximadamente **1.17:1 de contraste** en light mode.

La conclusión central es:

> RTTP debe conservar su identidad visual actual, pero reemplazar la lógica de “colores físicos + opacidades” por roles semánticos estables.

No hace falta rediseñar la aplicación desde cero. Hace falta consolidar las bases antes de pulir pantallas.

---

### 1. Inventario del sistema actual

| Área | Estado actual | Diagnóstico |
|---|---|---|
| Color | Tokens shadcn más una segunda capa `app-*`, combinados con clases como `text-white/35`, `bg-black/30`, `text-indigo-100/45` | Existen tokens, pero las features no dependen realmente de ellos |
| Light mode | Redefine `white`, cyan, indigo, violet y otros colores físicos desde [globals.css](../src/app/globals.css#L138) | Una clase deja de representar el mismo color según el tema |
| Tipografía | Manrope como fuente principal; Geist Mono disponible; 44 combinaciones | La familia es coherente, pero la escala no está gobernada |
| Espaciado | Escala Tailwind implícita, basada mayormente en múltiplos de 4 px | La base es razonable, pero no hay reglas por componente o jerarquía |
| Radios | 18 variantes y varios valores arbitrarios | Cards, dock, workout y diálogos parecen pertenecer a sub-sistemas distintos |
| Elevación | 21 sombras, al menos 13 construidas manualmente | La sombra representa estética local, no nivel de elevación |
| Iconografía | Lucide en 32 archivos, sin sets competidores | Es la parte más consistente del sistema |
| Movimiento | 15 patrones, 94 usos, duraciones entre 100 y 300 ms | No hay criterios compartidos ni soporte para reduced motion |
| Buttons | Primitive completo, pero 44 botones directos en features | El primitive no gobierna foco, tamaño ni estados de todas las acciones |
| Cards | Primitive utilizado solo cinco veces | La mayoría de las superficies se construye manualmente |
| Tabs | Primitive disponible pero sin adopción en features | Filtros y navegación interna se recrean con botones |
| Badges | Nueve usos, todos con colores locales | Las variantes del primitive no definen la semántica real |
| Select | Tres selects nativos con estilos propios | No comparte contrato visual con `Input` y `Textarea` |
| Tooltip | Disponible, pero no utilizado por features | Los controles iconográficos dependen de `title` o contexto |
| Toast | No existe | El feedback queda repartido entre banners, mensajes inline y estados locales |
| Loading | No hay skeleton ni patrón común | Cada flujo deberá inventarlo cuando aparezca la necesidad |

#### Fortalezas que conviene preservar

- La estética dark tiene personalidad y coherencia general.
- Lucide constituye un set iconográfico único.
- Dialog, Sheet y Popover utilizan Base UI, aportando buena infraestructura de foco y semántica.
- Existe una base reutilizable de encabezados en [page-shell.ts](../src/features/shared/page-shell.ts#L1).
- La experiencia de workout posee una jerarquía propia y clara.
- La paleta cyan/violeta diferencia a RTTP de un dashboard administrativo genérico.

---

### 2. Validación de contraste en ejecución

Se validaron estilos computados en:

- 390 px mobile.
- 1440 px desktop.
- Atleta y coach.
- Home, biblioteca y workout.
- Light y dark mode.

Los siguientes valores corresponden a texto visible, no a colores teóricos del CSS:

| Tema | Elemento | Contraste aproximado | Resultado |
|---|---|---:|---|
| Light | “Completar serie” en workout | **1.17:1** | Falla crítica |
| Light | Descripción de “Inicio rápido” | **2.38:1** | Falla |
| Light | Eyebrow “Inicio rápido” | **2.41:1** | Falla |
| Light | Navegación inactiva del coach | **2.47:1** | Falla |
| Light | Rol “Entrenador” en sidebar | **1.94:1** | Falla |
| Light | Labels “Repeticiones” y “Peso” | **3.88:1** | Falla |
| Dark | Descripción de “Inicio rápido” | **3.55:1** | Falla |
| Dark | Acción “Ver progreso” | **3.83:1** | Falla |
| Dark | Navegación inactiva del coach | **3.88:1** | Falla |
| Dark | Labels del dock mobile | 4.54:1 | Pasa apenas, pero se renderizan a 10 px |

Para texto normal, el objetivo debe ser al menos **4.5:1**. Para límites, controles y foco visible, **3:1**.

El caso crítico del workout nace de combinar:

- La redefinición de `--color-indigo-50` en light mode desde [globals.css](../src/app/globals.css#L139).
- `bg-indigo-50 text-indigo-950` en [workout-mode.tsx](../src/features/workout/workout-mode.tsx#L899).

Ambos terminan siendo oscuros en light mode.

---

### 3. Sistema de diseño propuesto

#### 3.1 Color

##### Principio

Los componentes solo deben utilizar **roles semánticos**. Los colores físicos como `white`, `black`, `cyan-200` o `indigo-50` no deberían definir texto, fondos o controles dentro de una feature.

La capa shadcn existente debe ser la base canónica. Los tokens `app-*` pueden mantenerse temporalmente como aliases durante la migración, pero no como un segundo sistema independiente.

##### Paleta semántica inicial

| Token | Light | Dark | Uso |
|---|---|---|---|
| `background` | `#F3F5FB` | `#07080B` | Canvas de aplicación |
| `card` | `#FFFFFF` | `#0D0E13` | Superficie principal |
| `surface-raised` | `#F8FAFC` | `#111217` | Contenido agrupado |
| `surface-elevated` | `#E9EDF6` | `#181C27` | Navegación, popovers y overlays |
| `foreground` | `#171A29` | `#F7F8FC` | Texto principal |
| `foreground-secondary` | `#3D4354` | `#C4C9D4` | Texto secundario |
| `muted-foreground` | `#5F6677` | `#9AA2B1` | Metadata y ayuda |
| `border-subtle` | `#DCE1EC` | `#2A2D36` | Separación decorativa |
| `border-control` | `#8792A8` | `#536079` | Inputs y controles identificables |
| `primary` | `#67E8F9` | `#67E8F9` | Acción principal |
| `primary-foreground` | `#082F49` | `#082F49` | Contenido sobre acción primaria |
| `brand-secondary` | `#6D4CD3` | `#A78BFA` | Acento violeta |
| `ring` | `#0E7490` | `#67E8F9` | Foco visible |
| `success` | `#15803D` | `#4ADE80` | Confirmación |
| `warning` | `#92400E` | `#FBBF24` | Advertencia |
| `destructive` | `#BE123C` | `#FB7185` | Error o destrucción |
| `info` | `#0369A1` | `#38BDF8` | Información contextual |

Los pares principales propuestos superan AA:

- Texto primario: 15.8–18.8:1.
- Texto secundario: 9–12:1.
- Texto muted: 5.2–7.8:1.
- Texto sobre CTA cyan: 9.5:1.

##### Reglas

1. Las opacidades pueden utilizarse en decoración, nunca para resolver la jerarquía de texto.
2. `text-white/*`, `bg-black/*` y las escalas físicas cyan/indigo no deben aparecer en componentes de producto.
3. Cada rol debe conservar su significado en ambos temas.
4. El tema cambia valores de tokens, no el significado de una clase.
5. Estados de éxito, alerta y error deben usar color más icono o texto.
6. Los bordes de controles deben alcanzar 3:1 o apoyarse en una diferencia de superficie igualmente perceptible.

---

#### 3.2 Tipografía

##### Familia

- **Manrope:** UI, navegación, cuerpo y títulos.
- **Geist Mono:** temporizadores, cargas, repeticiones y valores tabulares.
- Geist Sans cargada pero no utilizada debería eliminarse o asignarse deliberadamente.

##### Escala canónica

| Token | Tamaño / línea | Peso | Uso |
|---|---|---:|---|
| `caption` | 12 / 16 | 500 | Metadata secundaria |
| `label` | 12 / 16 | 600 | Eyebrows y labels de campos |
| `body-sm` | 14 / 20 | 400–500 | Cards y ayudas |
| `body` | 16 / 24 | 400 | Texto principal |
| `title-sm` | 18 / 24 | 600 | Títulos de cards |
| `title-md` | 24 / 30 | 500 | Secciones |
| `heading` | 32 / 38 | 400 | Título de página |
| `display` | 40 / 46 | 400 | Landing y momentos hero |

##### Reglas

- 12 px debe ser el mínimo para información persistente.
- 10–11 px queda reservado para información ornamental o excepcional.
- No usar texto de 8 o 9 px.
- Uppercase: tracking máximo recomendado de `0.12em`.
- Headings: tracking mínimo de `-0.03em`; evitar la proliferación entre `-0.025em` y `-0.045em`.
- El tamaño raíz no debe cambiar por breakpoint. La escala responsive debe estar declarada en cada rol tipográfico.
- Los números operativos del workout deben usar `font-mono` y `tabular-nums`.

Actualmente [globals.css](../src/app/globals.css#L170) escala toda la aplicación a 17 y 18 px, y luego [globals.css](../src/app/globals.css#L196) corrige algunos textos pequeños. Esto hace que la misma utility tenga resultados distintos sin expresar intención semántica.

---

#### 3.3 Espaciado

La escala implícita de Tailwind es correcta; debe transformarse en una escala explícita:

| Token | Valor |
|---|---:|
| `space-0` | 0 |
| `space-0.5` | 2 px |
| `space-1` | 4 px |
| `space-1.5` | 6 px |
| `space-2` | 8 px |
| `space-3` | 12 px |
| `space-4` | 16 px |
| `space-5` | 20 px |
| `space-6` | 24 px |
| `space-8` | 32 px |
| `space-10` | 40 px |
| `space-12` | 48 px |
| `space-16` | 64 px |

Reglas de composición:

- Controles relacionados: 8 px.
- Campos dentro de un formulario: 16 px.
- Contenido interno de card: 16 px mobile, 20–24 px desktop.
- Secciones internas: 24–32 px.
- Separación entre bloques de página: 32–48 px.
- Padding de página: 20 px mobile, 32 px tablet, 40–48 px desktop.
- Valores arbitrarios solo para safe areas o geometría técnicamente inevitable.

---

#### 3.4 Radios, bordes y elevación

##### Radios

| Token | Valor | Uso |
|---|---:|---|
| `radius-sm` | 8 px | Tags pequeños |
| `radius-md` | 12 px | Inputs y botones |
| `radius-lg` | 16 px | Cards estándar |
| `radius-xl` | 24 px | Cards hero y modales |
| `radius-2xl` | 32 px | Workout y bottom sheets |
| `radius-pill` | 9999 px | Pills, badges y avatares |

##### Elevación

| Nivel | Uso |
|---|---|
| `elevation-0` | Superficie plana; borde sutil |
| `elevation-1` | Card interactiva |
| `elevation-2` | Navegación flotante y popover |
| `elevation-3` | Dialog, sheet y hero crítico |
| `focus-ring` | Anillo de 3 px independiente de la sombra |

Los glows cyan/violeta deben ser un token decorativo explícito y limitarse a selección, progreso o branding. No deben reemplazar una elevación funcional.

---

#### 3.5 Iconografía

La base actual es correcta:

- Mantener Lucide como set único.
- 16 px para iconos inline.
- 20 px para controles.
- 24 px para acciones principales.
- 32 px para estados vacíos o hero.
- Stroke consistente entre 1.75 y 2.
- Target mínimo del botón: 44×44 aunque el icono mida 16–20 px.
- Blobatar queda como excepción intencional para identidad personal.
- Controles iconográficos no universales requieren tooltip en desktop y nombre accesible siempre.

---

#### 3.6 Movimiento

| Token | Duración | Uso |
|---|---:|---|
| `motion-fast` | 120 ms | Hover, color y press |
| `motion-normal` | 180 ms | Tabs, expansión y feedback |
| `motion-slow` | 240 ms | Dialog y Sheet |
| `ease-standard` | `cubic-bezier(.2,0,0,1)` | Entrada y transformación |
| `ease-exit` | `cubic-bezier(.4,0,1,1)` | Salida |

Reglas:

- Evitar `transition-all`; declarar propiedades.
- Ninguna animación decorativa debe bloquear interacción.
- El progreso puede interpolarse; los cambios de datos no deben parecer demorados.
- Con `prefers-reduced-motion: reduce`, eliminar desplazamiento, escala y spring; conservar solo feedback instantáneo o fades breves.
- Actualmente no existe ninguna regla `motion-reduce` o `prefers-reduced-motion`.

---

### 4. Contrato canónico de componentes

| Componente | Variantes canónicas | Estados obligatorios | Regla principal |
|---|---|---|---|
| Button | Primary, secondary, outline, ghost, destructive, link | Default, hover, focus-visible, active, disabled, loading | Un único CTA primario por superficie; 44 px mínimo |
| IconButton | Neutral, accent, destructive | Default, hover, focus-visible, active, disabled, loading | Target 44×44; icono 20 px; `aria-label` obligatorio |
| Input | Default, filled, invalid, readonly | Default, hover, focus-visible, disabled, loading, error, readonly | Siempre dentro de un `Field` con label y mensaje |
| Textarea | Igual que Input | Igual que Input | Altura estable y contador solo cuando sea necesario |
| Select | Native estilizado o Base UI, una sola estrategia | Default, hover, focus-visible, disabled, loading, error, readonly | Mismo contrato visual que Input |
| Card | Flat, raised, interactive, hero | Default, hover, focus-visible, selected, disabled, loading, error | Las variantes definen superficie, borde y elevación |
| Table | Standard y compact desktop | Default, hover row, selected, loading, empty, error, readonly | En mobile se transforma en lista; no scroll horizontal accidental |
| Tabs | Default y line | Default, hover, focus-visible, active, disabled | Para cambiar paneles; teclado y roles del primitive |
| Segmented control | Dos a cuatro opciones | Default, hover, focus-visible, selected, disabled | Para filtros o modos, no para navegación de páginas |
| Badge | Neutral, brand, info, success, warning, danger | Default; hover/focus solo si es interactivo | No aceptar colores físicos desde la feature |
| Toast | Info, success, warning, error | Entering, visible, dismissing, paused | Para resultados globales; errores de campo permanecen inline |
| Dialog | Standard, confirmación y destructive | Opening, open, busy, error, closing | Acción primaria y secundaria estables; foco atrapado |
| Sheet | Mobile action, editor y detail | Igual que Dialog | Acción principal accesible aun con teclado virtual |
| Tooltip | Short label/help | Delayed-open, open, closing | Solo ayuda secundaria; nunca información indispensable |

#### Estado actual de los primitives

- [Button](../src/components/ui/button.tsx#L7) tiene hover, focus, active, disabled e invalid; le falta loading y sus tamaños base son demasiado pequeños.
- [Input](../src/components/ui/input.tsx#L8) y [Textarea](../src/components/ui/textarea.tsx#L8) cubren focus, disabled e invalid, pero no readonly, loading ni un wrapper común de error.
- [Card](../src/components/ui/card.tsx#L7) no representa las variantes reales utilizadas por el producto.
- [Tabs](../src/components/ui/tabs.tsx#L26) tiene una base accesible suficiente, pero no está adoptado.
- [Badge](../src/components/ui/badge.tsx#L7) tiene variantes, pero los consumidores reemplazan su color.
- [Dialog](../src/components/ui/dialog.tsx#L34) y [Sheet](../src/components/ui/sheet.tsx#L31) tienen la mejor base actual.
- [Tooltip](../src/components/ui/tooltip.tsx#L53) está disponible pero no forma parte de los flujos reales.
- No existe un componente canónico de Toast, Skeleton, Field o Select.

---

### 5. Violaciones detectadas

| ID | Ubicación | Categoría | Qué pasa | Por qué importa | Propuesta | Severidad | Esfuerzo |
|---|---|---|---|---|---|---|---|
| UX-001 | [globals.css](../src/app/globals.css#L138), [workout-mode.tsx](../src/features/workout/workout-mode.tsx#L899) | Sistema visual / A11y | Light mode redefine colores físicos y genera texto oscuro sobre fondo oscuro en “Completar serie” | El CTA principal del flujo crítico queda casi ilegible, con 1.17:1 | Eliminar la inversión de paleta física y utilizar `primary`/`primary-foreground` | **Crítico** | M |
| UX-002 | [today-home.tsx](../src/features/athlete/today-home.tsx#L294), [app-shell.tsx](../src/features/shell/app-shell.tsx#L139), [logo.tsx](../src/features/shared/logo.tsx#L18) | Color / A11y | Texto secundario usa colores físicos con opacidades entre 25% y 55% | Se midieron contrastes entre 1.94 y 3.88:1 | Crear `foreground-secondary` y `muted-foreground` sin opacidades locales | **Alto** | M |
| UX-003 | [workout-mode.tsx](../src/features/workout/workout-mode.tsx#L548), [activity-history.tsx](../src/components/activity-history.tsx#L165), [sports-schedule.tsx](../src/features/schedule/sports-schedule.tsx#L950) | Tipografía / A11y | Hay 118 textos de 8–11 px en mobile | Labels y metadata requieren esfuerzo innecesario y pierden legibilidad | Establecer 12 px como mínimo persistente | **Alto** | M |
| UX-004 | [globals.css](../src/app/globals.css#L170) | Tipografía / Responsive | El tamaño raíz cambia a 17 y 18 px y luego se corrigen clases pequeñas globalmente | Espaciado, iconos y tipografía cambian implícitamente por breakpoint | Mantener raíz en 16 px y aplicar escalas responsive por rol | Medio | M |
| UX-005 | [globals.css](../src/app/globals.css#L56), [today-home.tsx](../src/features/athlete/today-home.tsx#L288) | Sistema visual | Conviven tokens shadcn, tokens `app-*` y 269 combinaciones de colores físicos | Cada pantalla debe resolver dark/light y jerarquía por separado | Consolidar una única capa semántica y prohibir colores físicos en features | **Alto** | L |
| UX-006 | [button.tsx](../src/components/ui/button.tsx#L20), [app-shell.tsx](../src/features/shell/app-shell.tsx#L238), [workout-mode.tsx](../src/features/workout/workout-mode.tsx#L535) | A11y / Responsive | El primitive ofrece alturas de 24–36 px; se midieron controles de 28, 32 y 36 px | En mobile son difíciles de tocar y aumentan errores durante el entrenamiento | Elevar targets primarios e iconográficos a 44×44 | **Alto** | M |
| UX-007 | [prescription-field.tsx](../src/features/workout/prescription-field.tsx#L86), [exercise-row.tsx](../src/features/routine-editor/exercise-row.tsx#L87) | A11y | Algunos inputs eliminan el ring sin agregar una alternativa; los botones directos dependen del outline del navegador | El foco cambia según el tipo de componente y puede desaparecer | Exigir un único `focus-ring` y usar `focus-within` en campos compuestos | **Alto** | M |
| UX-008 | [button.tsx](../src/components/ui/button.tsx#L7), [athlete-home.tsx](../src/features/athlete/athlete-home.tsx#L284) | Componentes | Las features reemplazan fondo, color, altura y radio del Button; existen 44 botones HTML adicionales | Elegir una variante no garantiza una apariencia o comportamiento | Hacer que variantes y tamaños sean suficientes y migrar botones directos | **Alto** | L |
| UX-009 | [tabs.tsx](../src/components/ui/tabs.tsx#L26), [athlete-home.tsx](../src/features/athlete/athlete-home.tsx#L177), [activity-history.tsx](../src/components/activity-history.tsx#L559), [coach-athlete-detail-view.tsx](../src/features/coach/coach-athlete-detail-view.tsx#L170) | Componentes / A11y | Tabs y filtros se recrean con botones; varios no exponen selección con `aria-pressed` ni semántica de tabs | Teclado y lectores de pantalla reciben comportamientos diferentes | Adoptar Tabs para paneles y SegmentedControl para filtros | Medio | M |
| UX-010 | [input.tsx](../src/components/ui/input.tsx#L8), [sports-schedule.tsx](../src/features/schedule/sports-schedule.tsx#L232), [assign-template-dialog.tsx](../src/features/routine-editor/assign-template-dialog.tsx#L68) | Componentes | Inputs y textareas tienen primitive; los selects usan estilos locales y no existe Field común | Label, ayuda, error y readonly no forman un contrato consistente | Crear `Field` y `Select` canónicos | **Alto** | M |
| UX-011 | [card.tsx](../src/components/ui/card.tsx#L7), [athlete-home.tsx](../src/features/athlete/athlete-home.tsx#L234), [badge.tsx](../src/components/ui/badge.tsx#L7) | Componentes | Cards y badges poseen primitives, pero los usos redefinen superficie, borde, sombra y color | Los primitives no reducen variabilidad ni mantenimiento | Incorporar variantes semánticas reales: flat, raised, hero y status | Medio | M |
| UX-012 | [workout-mode.tsx](../src/features/workout/workout-mode.tsx#L712), [app-shell.tsx](../src/features/shell/app-shell.tsx#L319), [access-landing.tsx](../src/features/landing/access-landing.tsx#L43) | Sistema visual | Hay 18 radios y 21 sombras, con múltiples valores arbitrarios | La elevación y el agrupamiento no comunican una jerarquía predecible | Reducir a seis radios y cuatro niveles de elevación | Medio | M |
| UX-013 | [button.tsx](../src/components/ui/button.tsx#L7), [progress.tsx](../src/components/ui/progress.tsx#L48), [dialog.tsx](../src/components/ui/dialog.tsx#L34) | Movimiento / A11y | Hay `transition-all`, duraciones distintas y ninguna regla reduced-motion | Usuarios sensibles al movimiento no pueden reducirlo y las interacciones no comparten ritmo | Crear tokens de duración/easing y fallback `prefers-reduced-motion` | **Alto** | S |
| UX-014 | [components/ui/](../src/components/ui), [app-shell.tsx](../src/features/shell/app-shell.tsx#L282) | Feedback | No existen Toast ni Skeleton; los mensajes de guardado, error y sincronización son locales | La confirmación de acciones asíncronas depende de cada pantalla | Definir Toast global, feedback inline y Skeleton | Medio | M |
| UX-015 | [page-shell.ts](../src/features/shared/page-shell.ts#L1), [sports-schedule.tsx](../src/features/schedule/sports-schedule.tsx#L727), [activity-history.tsx](../src/components/activity-history.tsx#L485) | Componentes | Agenda e Historial reconstruyen encabezados que ya tienen un patrón compartido | Tracking, tamaños, contraste y espaciado divergen con cada ajuste | Crear un componente `PageHeader` en lugar de compartir strings de clases | Medio | S |
| UX-016 | [tooltip.tsx](../src/components/ui/tooltip.tsx#L53), [app-shell.tsx](../src/features/shell/app-shell.tsx#L238), [workout-mode.tsx](../src/features/workout/workout-mode.tsx#L559) | Componentes / A11y | Los controles iconográficos tienen nombre accesible, pero no ayuda visual consistente | Algunas acciones —anotar, omitir, resumen— requieren aprendizaje por prueba | Usar Tooltip para acciones no universales y conservar `aria-label` | Medio | S |
| UX-017 | Todas las superficies; mayor concentración en [sports-schedule.tsx](../src/features/schedule/sports-schedule.tsx#L180), [today-home.tsx](../src/features/athlete/today-home.tsx#L123) y [workout-mode.tsx](../src/features/workout/workout-mode.tsx#L535) | Espaciado | Se detectaron 187 combinaciones de utilities de espaciado en 1.026 usos | La escala base es buena, pero no existen contratos de layout por componente | Mantener escala de 4 px y definir paddings/gaps por patrón | Bajo | M |

---

#### Conclusión

La identidad visual no necesita reemplazarse. Necesita ser **formalizada y protegida**.

La primera ola futura debería comenzar por:

1. Corregir la semántica de color y el CTA crítico del workout en light mode.
2. Consolidar contraste, tipografía mínima y foco.
3. Llevar Button, Field, Card, Tabs, Badge y feedback a contratos canónicos.
4. Migrar las features por flujo, sin un refactor masivo.
5. Incorporar reduced motion y targets táctiles de 44 px.

No se modificó código durante esta fase. El servidor local fue detenido, la sesión de prueba se cerró, el tema oscuro fue restaurado y el worktree permanece limpio.

La siguiente etapa prevista es la **FASE 2 — Arquitectura de información y jerarquía**, con foco especial en Home, navegación, nombres de secciones y adaptación para usuario nuevo, recurrente y avanzado.

---

## FASE 2 — Arquitectura de información y jerarquía

### Resumen ejecutivo

La arquitectura del atleta está bastante cerca del modelo mental correcto. La del coach todavía mezcla tres conceptos diferentes:

1. **Gestión global del workspace.**
2. **Biblioteca reutilizable del coach.**
3. **Trabajo contextual sobre un atleta.**

Los principales problemas son:

- Home del atleta responde correctamente “¿qué tengo hoy?”, pero cuando no hay entrenamiento desperdicia casi toda la primera pantalla mostrando ausencia.
- En mobile, “Esta semana” recién comienza aproximadamente a los **804 px** de una pantalla de 844 px.
- “Progreso” lleva a un historial, no a progreso real.
- Home del coach prioriza cuatro conteos antes de cualquier tarea accionable.
- “Rutinas” del coach en realidad contiene plantillas.
- “Plan”, “rutina”, “plantilla”, “entrenamiento” y “actividad” se usan con límites poco claros.
- Las subsecciones de un atleta no viven en la URL: entrar en Agenda y recargar vuelve a Rutinas.
- Un coach sin atletas no recibe onboarding: vuelve a la landing.
- “Vista atleta” promete una experiencia completa, pero actualmente solo previsualiza Inicio.

La recomendación para Home es adoptar la dirección ya explorada como **“Hoy en foco”**, combinada con una prioridad determinística de estados. Es más clara y de menor riesgo que convertir Home en una agenda o en un sistema adaptativo opaco.

---

### 1. Modelo mental de navegación

#### Atleta

##### Arquitectura actual

| Destino | Pregunta que debería responder | Evaluación |
|---|---|---|
| Inicio | ¿Qué tengo que hacer ahora? | Correcto |
| Rutinas | ¿Qué rutina quiero entrenar o gestionar? | Correcto |
| Agenda | ¿Qué tengo programado esta semana? | Correcto |
| Progreso | ¿Cómo estoy evolucionando? | No coincide con el contenido actual |
| Perfil | ¿Qué cuenta y preferencias estoy usando? | Correcto como destino secundario |

La navegación definida en [navigation-items.ts](../src/features/shell/navigation-items.ts#L40) refleja tareas, no tablas de base de datos. Eso está bien.

La excepción es **Progreso**. La pantalla actual muestra actividades completadas, snapshots, sets, esfuerzo y notas. No muestra todavía evolución longitudinal ni progreso por ejercicio.

##### Navegación recomendada ahora

```text
Inicio
Rutinas
Agenda
Historial
```

Perfil permanece en el avatar/header mobile y en la navegación desktop.

###### Motivo del cambio

- **Historial** describe exactamente la capacidad disponible.
- **Progreso** debe reservarse para cuando exista comparación, evolución o tendencias.
- Cuando se implemente progreso por ejercicio, “Progreso” puede convertirse en un hub con:
  - Resumen.
  - Ejercicios.
  - Historial.

La ruta `/activities` puede mantenerse inicialmente para evitar una migración innecesaria. El cambio prioritario es de lenguaje visible.

---

#### Coach

##### Arquitectura actual

| Destino | Contenido real | Problema |
|---|---|---|
| Resumen | Conteos y dos accesos generales | Se comporta como dashboard pasivo |
| Atletas | Directorio de atletas | Correcto |
| Rutinas | Plantillas reutilizables | El nombre no coincide |
| Perfil | Cuenta y apariencia | Correcto |

La navegación está definida en [navigation-items.ts](../src/features/shell/navigation-items.ts#L17).

##### Navegación recomendada

```text
Inicio
Atletas
Plantillas
Perfil
```

- **Resumen → Inicio:** debe ser un punto de continuidad, no un reporte.
- **Rutinas → Plantillas:** las rutinas concretas pertenecen al contexto de un atleta.
- Dentro de un atleta:

```text
Atletas / Nombre del atleta

Rutinas
Agenda
Historial
```

Esto separa claramente:

- **Plantilla:** recurso reutilizable del coach.
- **Rutina:** prescripción concreta de un atleta.
- **Entrenamiento:** ocurrencia agendada o en ejecución.
- **Actividad:** entrenamiento ya realizado.
- **Historial:** colección de actividades completadas.

---

### 2. Vocabulario canónico

| Concepto | Definición visible | Dónde vive |
|---|---|---|
| Rutina | Conjunto entrenable de bloques y ejercicios | Biblioteca del atleta o espacio de un atleta |
| Plantilla | Estructura reutilizable propiedad del coach | Biblioteca global del coach |
| Entrenamiento | Instancia agendada o en curso de una rutina | Agenda y Home |
| Actividad | Registro histórico de algo realizado | Historial |
| Bloque | Agrupación interna de ejercicios | Editor, overview y workout |
| Historial | Actividades ya realizadas | Navegación |
| Progreso | Evolución longitudinal y comparación | Futuro módulo de progreso |

#### Término a retirar: “plan”

“Plan” aparece como sinónimo de rutina:

- “Todos tus planes” en [navigation-items.ts](../src/features/shell/navigation-items.ts#L65).
- “Planes asignados” en [coach-overview-view.tsx](../src/features/coach/coach-overview-view.tsx#L57).
- “Planes” en [coach-athletes-view.tsx](../src/features/coach/coach-athletes-view.tsx#L89).
- “Plan de entrenamiento” en [coach-athlete-detail-view.tsx](../src/features/coach/coach-athlete-detail-view.tsx#L140).

Actualmente no existe una entidad de programa o plan de largo plazo. Usar “plan” introduce una jerarquía que el producto todavía no tiene.

Recomendación:

- Reemplazar “plan” por “rutina”.
- Reservar “plan” para una futura agrupación temporal de varias rutinas, si alguna vez se incorpora.

---

### 3. Profundidad, ubicación y retorno

#### Flujos del atleta

| Flujo | Pasos actuales | Evaluación |
|---|---:|---|
| Continuar workout pausado | Inicio → Continuar | Óptimo |
| Comenzar entrenamiento programado | Inicio → Comenzar | Óptimo |
| Entrenamiento improvisado | Inicio → Rutinas → Comenzar | Correcto e intencional |
| Revisar agenda | Agenda | Óptimo |
| Revisar actividad | Historial → Expandir actividad | Correcto |
| Crear rutina | Rutinas → Nueva rutina | Correcto |
| Editar rutina propia | Rutinas → Editar | Correcto |

No hacen falta breadcrumbs en las superficies planas del atleta.

El workout puede mantenerse como estado inmersivo sin navegación global. El botón de salida funciona como retorno explícito y conserva la sesión. No recomiendo introducir una nueva ruta de workout durante esta etapa.

#### Flujos del coach

| Flujo | Pasos actuales | Evaluación |
|---|---:|---|
| Abrir un atleta | Atletas → Ver planificación | Correcto |
| Editar rutina | Atletas → Atleta → Rutina | Esperable |
| Programar entrenamiento | Atletas → Atleta → Agenda | Profundidad aceptable |
| Consultar historial | Atletas → Atleta → Actividades | Profundidad aceptable |
| Asignar plantilla | Rutinas → Asignar → Atleta | Correcto, pero mal nombrado |
| Retomar atleta seleccionado | Resumen → Atletas → Atleta | Un paso innecesario |

##### Problema de rutas internas

Las subsecciones `Rutinas`, `Agenda` y `Actividades` del atleta seleccionado son estado local en [coach-home.tsx](../src/features/coach/coach-home.tsx#L107).

En ejecución se verificó:

```text
/coach/athletes/5 → Rutinas
/coach/athletes/5 → click Agenda
/coach/athletes/5 → continúa siendo la misma URL
Recargar → vuelve a Rutinas
```

Esto produce tres problemas:

- No se puede compartir o recuperar el contexto exacto.
- Recargar cambia silenciosamente de sección.
- Atrás/adelante del navegador no representa la navegación realizada.

##### Estructura recomendada

```text
/coach
/coach/athletes
/coach/athletes/:athleteId/routines
/coach/athletes/:athleteId/schedule
/coach/athletes/:athleteId/history
/coach/templates
/coach/profile
```

Las rutas existentes podrían mantenerse como aliases o redirects durante una migración.

##### Breadcrumb recomendado

Solo para el nivel contextual del coach:

```text
Atletas / User Test
```

Debajo:

```text
Rutinas | Agenda | Historial
```

El enlace actual “Todos los atletas” en [coach-athlete-detail-view.tsx](../src/features/coach/coach-athlete-detail-view.tsx#L126) ya resuelve parcialmente el retorno, pero no comunica toda la ubicación.

---

### 4. Home del atleta

#### Pregunta principal

> **¿Qué entrenamiento tengo que hacer ahora y cómo lo empiezo o continúo?**

Todo elemento anterior al primer scroll debería colaborar con esa respuesta.

#### Acciones principales

Según el estado, Home debería mostrar entre una y tres acciones:

1. **Continuar o comenzar el entrenamiento prioritario.**
2. **Ver el resumen de esa rutina.**
3. **Elegir una rutina no planificada**, siempre como acción secundaria.

Agenda e Historial ya están disponibles en la navegación y no necesitan competir permanentemente con la acción principal.

---

#### Problema de jerarquía actual

En el estado sin entrenamiento para hoy, [today-home.tsx](../src/features/athlete/today-home.tsx#L305) muestra:

1. Un empty state de gran altura.
2. Un bloque completo de inicio rápido.
3. Después, la semana y la racha.

En 390×844:

- “No tenés entrenamientos para hoy” comienza cerca de 331 px.
- “¿Estás por entrenar?” cerca de 587 px.
- “Esta semana” recién cerca de 804 px.

La pantalla responde “no hay nada” con demasiado espacio antes de ofrecer contexto útil.

---

#### Jerarquía recomendada: “Hoy en foco”

Es la primera dirección del tablero previo [athlete-home-concepts.html](./ux-audit-assets/athlete-home-concepts.html#L676).

##### Prioridad determinística

```text
1. Workout en curso
2. Próximo entrenamiento de hoy
3. Actividad externa pendiente de hoy
4. Próximo entrenamiento futuro
5. Entrenar sin planificación
6. Crear primera rutina
```

No es una Home “inteligente” opaca. Son reglas visibles y previsibles.

##### Mobile

```text
Fecha o contexto breve
Tu entrenamiento

┌──────────────────────────┐
│ Estado: En curso         │
│ Nombre de rutina         │
│ Bloque / ejercicio       │
│ Progreso                 │
│                          │
│ [Continuar rutina]       │
│ [Vista general]          │
└──────────────────────────┘

Esta semana
[L][M][M][J][V][S][D]

Próximo
Viernes · 18:30

Entrenar sin planificación →
```

##### Desktop

```text
┌─────────────────────────────────────┬──────────────────┐
│ Entrenamiento prioritario           │ Próximo          │
│                                     │                  │
│ Contexto mínimo                     │ Fecha y hora     │
│ Progreso                            │                  │
│ [Comenzar / continuar] [Resumen]    │ Ver agenda       │
└─────────────────────────────────────┴──────────────────┘

┌────────────────────────────────────────────────────────┐
│ Esta semana: L M M J V S D                              │
└────────────────────────────────────────────────────────┘

Entrenar sin planificación →
```

La composición usa ancho disponible, pero mantiene título, contexto y acciones como grupos relacionados.

---

#### Decisión sobre cada dato actual

| Dato o bloque | Decisión | Qué decisión habilita |
|---|---|---|
| Rutina de hoy | **Se queda y domina** | Empezar o continuar |
| Estado programado/en curso | **Se queda** | Saber qué acción corresponde |
| Hora | **Se queda cuando existe** | Saber si corresponde entrenar ahora |
| Duración estimada | **Se queda** | Decidir si dispone del tiempo |
| Cantidad de ejercicios | **Se mueve al overview** | No cambia normalmente la decisión de empezar |
| Objetivo o nota de la rutina | **Se queda resumido** | Prepararse y entender intención |
| Categoría de actividad externa | **Se queda** | Entender qué tipo de sesión debe realizar |
| Vista general de rutina | **Se queda como secundaria** | Revisar antes de empezar |
| Próximo entrenamiento | **Se queda** | Entender qué viene después |
| Timeline semanal | **Se queda, secundario y compacto** | Detectar huecos o acceder a agenda/historial |
| Leyenda permanente del timeline | **Se elimina como bloque independiente** | No habilita una decisión; el estado debe entenderse en cada día |
| Racha semanal | **Se mueve a Historial/Progreso** | Motiva, pero no ayuda a ejecutar el entrenamiento actual |
| Comparación con semana anterior | **Se mueve a Historial/Progreso** | Es interpretación de progreso, no acción inmediata |
| “Inicio rápido” como card grande | **Se reduce a acción secundaria** | Permite entrenamiento improvisado sin competir |
| Entrenamientos ya completados hoy | **Se compactan** | Confirmar finalización sin competir con lo pendiente |
| Varios entrenamientos para hoy | **Uno domina; el resto pasa a “Más tarde hoy”** | Evita múltiples CTAs primarios |

---

#### Estados del atleta

| Estado | Qué debería ver |
|---|---|
| Nuevo, sin rutinas ni agenda | Mensaje de bienvenida, explicación mínima y CTA **“Crear mi primera rutina”** |
| Con rutinas, sin planificación | CTA **“Elegir una rutina”**, con Agenda como opción secundaria |
| Sin entrenamiento hoy, con próximo | Próximo entrenamiento como contenido principal; no un empty state gigante |
| Entrenamiento programado hoy | Hero con **“Comenzar rutina”** |
| Entrenamiento en curso | Hero con **“Continuar rutina”** y progreso visible |
| Actividad externa pendiente | Nombre, hora y **“Marcar como realizada”** |
| Día completado | Confirmación compacta y próximo entrenamiento |
| Usuario avanzado con varias sesiones | Una sesión prioritaria y una lista compacta “Más tarde hoy” |
| Sin actividad histórica | No mostrar `0 semanas activas`; reservar ese espacio para la próxima acción |

##### Estado nuevo actual

La Home actual dirige primero a “Ver agenda” incluso cuando el atleta podría no tener ninguna rutina. El CTA más útil sería crear o elegir una rutina existente. La agenda debe ser secundaria hasta que haya algo para programar.

---

### 5. Home del coach

#### Pregunta principal

> **¿Qué atleta necesita mi atención y dónde continúo trabajando?**

La implementación actual en [coach-overview-view.tsx](../src/features/coach/coach-overview-view.tsx#L49) responde primero:

- cuántos atletas existen;
- cuántas plantillas existen;
- cuántas rutinas fueron asignadas;
- cuántas rutinas están vacías.

Tres de esos cuatro números no habilitan una decisión inmediata.

#### Acciones principales

1. **Continuar con el atleta seleccionado.**
2. **Resolver rutinas incompletas**, cuando existan.
3. **Agregar atleta** o abrir el directorio.

Plantillas debe ser un acceso secundario del workspace.

---

#### Jerarquía recomendada

##### Coach con trabajo pendiente

```text
Inicio

┌────────────────────────────────────────────┐
│ Requiere atención                         │
│ User Test · 1 rutina sin ejercicios       │
│ [Abrir rutina]                            │
└────────────────────────────────────────────┘

Continuar con User Test →
Rutinas · Agenda · Historial

Accesos
[Todos los atletas] [Plantillas]
```

##### Coach sin pendientes

```text
Inicio

Todo al día
No hay rutinas incompletas.

Continuar con User Test →
[Todos los atletas] [Plantillas]
```

No hace falta convertir “0 pendientes” en una tarjeta de estadística.

---

#### Decisión sobre cada métrica del coach

| Métrica actual | Decisión | Justificación |
|---|---|---|
| Cantidad de atletas | **Se mueve a Atletas** | No cambia qué debe hacer ahora |
| Plantillas propias | **Se mueve a Plantillas** | Es inventario de una sección específica |
| Rutinas asignadas | **Se elimina de Home** | El total agregado no señala prioridad |
| Rutinas a revisar | **Se queda solo cuando es mayor a cero** | Identifica trabajo pendiente |
| “Todo el contenido está cargado” | **Se transforma en estado tranquilo, no métrica** | Confirma que no hay pendientes |
| “Seguí con tus atletas” | **Se vuelve específico** | “Continuar con User Test” reduce un paso |
| Acceso a plantillas | **Se queda como secundario** | Permite una tarea frecuente sin competir |

---

#### Estados del coach

| Estado | Qué debería ver |
|---|---|
| Nuevo, sin atletas | Onboarding del workspace y CTA **“Agregar primer atleta”** |
| Con un atleta | Acceso directo a ese atleta y sus tres áreas |
| Con varios atletas, sin pendientes | Continuar con el atleta seleccionado + directorio |
| Con rutinas incompletas | Cola de atención agrupada por atleta |
| Con plantillas pero sin atletas | Plantillas disponibles + CTA para agregar atleta |
| Usuario avanzado | Atención prioritaria y continuidad; el directorio conserva el inventario completo |

Actualmente un coach sin atletas no puede llegar a este estado: [page.tsx](../src/app/page.tsx#L649) devuelve la landing cuando no puede resolver un atleta. Esto debe corregirse antes de considerar válido el onboarding del coach.

---

### 6. Plantillas y rutinas del coach

La sección global actual se llama “Rutinas”, pero renderiza [CoachTemplatesView](../src/features/coach/coach-templates-view.tsx#L26).

Además, la pantalla puede recibir como fuente la rutina seleccionada de un atleta y mostrar “Rutina fuente” en [coach-templates-view.tsx](../src/features/coach/coach-templates-view.tsx#L63).

Esto crea una dependencia invisible:

> Una biblioteca global cambia según la última rutina seleccionada en otro contexto.

#### Recomendación

- Renombrar la sección global a **Plantillas**.
- Gestionar y asignar plantillas desde esa sección.
- Mantener “Guardar como plantilla” como acción contextual dentro de una rutina del atleta.
- No transportar silenciosamente una “rutina fuente” al cambiar de sección.

No cambia el modelo de datos ni agrega una capacidad: organiza acciones que ya existen.

---

### 7. Vista previa del atleta

“Vista atleta” aparece en [coach-athlete-detail-view.tsx](../src/features/coach/coach-athlete-detail-view.tsx#L165).

Pero la ruta del coach no coincide con ninguna ruta del atleta, por lo que [athleteViewForPath](../src/application/navigation/routes.ts#L28) cae en `inicio`. La preview muestra únicamente Home.

#### Recomendación inmediata

Renombrar la acción:

> **Previsualizar inicio**

Esto hace coincidir la promesa con el comportamiento sin agregar funcionalidad.

Una preview navegable de toda la experiencia del atleta queda como oportunidad separada, no como parte de esta auditoría.

---

### 8. Comparación de las tres direcciones de Home

| Dirección | Beneficio | Riesgo | Decisión |
|---|---|---|---|
| Hoy en foco | Máxima claridad y acceso directo al workout | La agenda queda secundaria | **Recomendada** |
| La semana como mapa | Excelente contexto multideporte | Duplica Agenda y reduce protagonismo del workout | No usar como Home principal |
| Próxima mejor acción | Se adapta con mucha precisión | Requiere reglas más complejas y puede cambiar de forma inesperada | Tomar solo su priorización determinística |

La solución recomendada es:

> **Hoy en foco + reglas explícitas de prioridad de estado.**

No hace falta un motor de recomendaciones ni lógica nueva.

---

### 9. Hallazgos de Fase 2

| ID | Ubicación | Categoría | Qué pasa | Por qué importa | Propuesta | Severidad | Esfuerzo |
|---|---|---|---|---|---|---|---|
| IA-001 | [today-home.tsx](../src/features/athlete/today-home.tsx#L305) | IA / Responsive | El empty state sin entrenamiento consume gran parte del primer viewport | La ausencia recibe más jerarquía que la próxima acción | Compactar el estado y promover próximo entrenamiento o elección de rutina | Alto | M |
| IA-002 | [today-home.tsx](../src/features/athlete/today-home.tsx#L319) | Flujo | “Ver agenda” es la primera acción incluso para alguien sin rutinas | Puede enviar al usuario nuevo a otra pantalla vacía | Priorizar crear/elegir rutina según datos disponibles | Alto | S |
| IA-003 | [today-home.tsx](../src/features/athlete/today-home.tsx#L139) | Jerarquía | Todos los entrenamientos del día se renderizan como cards de igual peso | Con varias sesiones aparecen múltiples acciones primarias | Priorizar una sesión y agrupar el resto en “Más tarde hoy” | Alto | M |
| IA-004 | [today-home.tsx](../src/features/athlete/today-home.tsx#L389) | IA / Home | Timeline, leyenda, racha y comparación ocupan un bloque completo | Parte del contenido no ayuda a decidir qué hacer ahora | Mantener timeline compacto y mover racha/comparación a Historial | Medio | M |
| IA-005 | [navigation-items.ts](../src/features/shell/navigation-items.ts#L57), [activity-history.tsx](../src/components/activity-history.tsx#L499) | IA / Copy | “Progreso” abre “Actividades realizadas” | La etiqueta promete análisis que todavía no existe | Renombrar temporalmente a “Historial” | Alto | S |
| IA-006 | [coach-overview-view.tsx](../src/features/coach/coach-overview-view.tsx#L49) | IA / Home | El coach ve cuatro métricas antes de las acciones | Home prioriza inventario sobre trabajo pendiente | Mostrar continuidad y pendientes primero; mover conteos a sus secciones | Alto | M |
| IA-007 | [page.tsx](../src/app/page.tsx#L649) | Flujo / Estado vacío | Un coach sin atletas vuelve a la landing | No puede completar su primera tarea dentro del workspace | Renderizar Home vacía con “Agregar primer atleta” | **Crítico** | M |
| IA-008 | [navigation-items.ts](../src/features/shell/navigation-items.ts#L29), [coach-templates-view.tsx](../src/features/coach/coach-templates-view.tsx#L49) | IA / Copy | “Rutinas” contiene solo plantillas reutilizables | Mezcla biblioteca global con rutinas concretas de atletas | Renombrar a “Plantillas” | Alto | S |
| IA-009 | [coach-home.tsx](../src/features/coach/coach-home.tsx#L107), [coach-athlete-detail-view.tsx](../src/features/coach/coach-athlete-detail-view.tsx#L169) | Navegación | Las subsecciones del atleta son estado local | Reload y enlaces no preservan Agenda o Historial | Llevar la subsección a la ruta | Alto | M |
| IA-010 | [coach-overview-view.tsx](../src/features/coach/coach-overview-view.tsx#L57), [coach-athletes-view.tsx](../src/features/coach/coach-athletes-view.tsx#L89) | Copy / Modelo mental | “Plan” se usa como sinónimo de rutina | Sugiere una entidad de programación que no existe | Usar “rutina”; reservar “plan” para un concepto futuro | Medio | S |
| IA-011 | [coach-templates-view.tsx](../src/features/coach/coach-templates-view.tsx#L63) | IA | La biblioteca global depende silenciosamente de la rutina seleccionada | El contexto cambia al navegar entre secciones sin explicación | Guardar como plantilla desde la rutina; gestionar plantillas globalmente | Alto | M |
| IA-012 | [coach-athlete-detail-view.tsx](../src/features/coach/coach-athlete-detail-view.tsx#L165), [routes.ts](../src/application/navigation/routes.ts#L28) | Copy / Flujo | “Vista atleta” muestra solamente Inicio | La promesa de navegación es más amplia que el comportamiento | Renombrar a “Previsualizar inicio” | Medio | S |
| IA-013 | [coach-athlete-detail-view.tsx](../src/features/coach/coach-athlete-detail-view.tsx#L150) | Copy / IA | Historial promete corregir registros externos, pero la edición vive en Agenda | El usuario busca una acción en el lugar equivocado | Describir Historial como consulta y dejar corrección explícitamente en Agenda | Medio | S |
| IA-014 | [coach-athlete-detail-view.tsx](../src/features/coach/coach-athlete-detail-view.tsx#L126) | Navegación | Existe retorno a atletas, pero no breadcrumb ni sección en URL | La profundidad se entiende visualmente, pero no persiste técnicamente | Añadir breadcrumb y rutas por subsección | Medio | M |

---

### 10. Oportunidades no comprometidas

Estas no deberían implementarse todavía sin datos de uso:

- Búsqueda y filtros para coaches con muchos atletas.
- Orden por atención pendiente o actividad reciente.
- Preview navegable de toda la experiencia del atleta.
- Home adaptativa basada en progreso por ejercicio.
- Hub “Progreso” con tendencias, ejercicios e historial.

---

#### Cierre

La decisión principal de esta fase es:

> **Atleta: Home orientada a ejecutar ahora.**
>
> **Coach: Home orientada a saber quién requiere atención.**

No se modificó código. La sesión de prueba quedó cerrada, el tema oscuro restaurado, el servidor detenido y el repositorio continúa limpio.

La siguiente etapa es la **FASE 3 — Walkthrough detallado de flujos**, incluyendo pasos, fricción, abandono, feedback, reversibilidad y estados faltantes.

---

## FASE 3 — Walkthrough de flujos críticos

### Resumen ejecutivo

Los flujos centrales existen y, en general, permiten completar las tareas principales. Las fortalezas más importantes son:

- Inicio y continuación directa de workouts.
- Persistencia de posición, timer, descanso, registros y anotaciones.
- Confirmación antes de cancelar workouts o eliminar contenido.
- Protección de cambios sin guardar en editores.
- Agenda unificada para rutinas RTTP y actividades externas.
- Historial basado en snapshots inmutables.
- Separación clara entre edición del coach y preview de atleta.

Los principales riesgos detectados son:

1. Un coach sin atletas no puede entrar a su workspace.
2. Crear una rutina persiste inmediatamente una rutina vacía antes del guardado explícito.
3. “Duplicar y editar” no abre el editor de la copia.
4. Si Supabase no estuvo disponible durante la carga inicial, la UI permite mutaciones que no entran al outbox y pueden perderse al recargar.
5. “Guardado” representa actualización local, no necesariamente sincronización remota.
6. La pantalla final del workout no permite volver a revisar registros antes de confirmar.
7. Una actividad externa puede marcarse como realizada, pero no volver a pendiente.
8. Asignar una plantilla termina sin confirmación clara ni acceso directo a la rutina creada.
9. Las subsecciones del atleta en coach no persisten en URL.
10. La carga inicial muestra una pantalla vacía sin comunicar qué está ocurriendo.

---

### 1. Acceso y recuperación de sesión

#### Objetivo

Entrar rápidamente al perfil local correspondiente y continuar donde el usuario estaba.

#### Recorrido actual

```text
Landing
→ Acceder
→ Ingresar email
→ Entrar
→ Home de atleta o coach
```

**Interacciones:** 3 más escritura del email.

#### Lo que funciona

- El flujo es corto.
- El input utiliza tipo email y submit de formulario.
- Un email desconocido presenta un error inline con `role="alert"` en [access-landing.tsx](../src/features/landing/access-landing.tsx#L103).
- La sesión local persiste hasta logout.
- La navegación se reemplaza al entrar, evitando volver accidentalmente al formulario con Back.
- El producto no presenta este mecanismo como autenticación segura.

#### Fricciones y estados faltantes

- Durante la hidratación se muestra únicamente un fondo vacío desde [page.tsx](../src/app/page.tsx#L641). No hay skeleton, mensaje ni estado de recuperación.
- Si falla la carga remota, [load-app-data.ts](../src/application/data/load-app-data.ts#L23) continúa con datos seed y muestra un banner. El usuario puede no distinguir datos reales de datos locales de demostración.
- Los errores globales utilizan directamente `error.message` desde [sync-error.ts](../src/application/sync/sync-error.ts#L1), por lo que podrían mostrar detalles técnicos.
- Un coach válido pero sin atletas termina nuevamente en la landing por [page.tsx](../src/app/page.tsx#L649).

#### Evaluación

- **Atleta existente:** correcto.
- **Coach con atletas:** correcto.
- **Coach nuevo:** flujo bloqueado.
- **Error de red inicial:** comprensible solo parcialmente.

---

### 2. Home → comenzar o continuar entrenamiento

#### Objetivo

Saber qué toca hacer y entrar al workout con la menor cantidad posible de decisiones.

#### Recorridos actuales

##### Entrenamiento programado

```text
Inicio
→ Card del entrenamiento
→ Comenzar rutina
→ Workout
```

**Interacciones:** 1.

##### Entrenamiento pausado

```text
Inicio
→ Continuar rutina
→ Workout en el punto guardado
```

**Interacciones:** 1.

##### Entrenamiento improvisado

```text
Inicio
→ Ir a mis rutinas
→ Elegir rutina
→ Comenzar rutina
```

**Interacciones:** 2 o 3, según si la rutina ya está seleccionada.

#### Lo que funciona

- El acceso directo desde Home ya evita el paso intermedio previamente detectado.
- “Comenzar” y “Continuar” se determinan por estado.
- Una rutina vacía no puede iniciarse.
- Existe un overview previo sin abandonar el contexto.
- La sesión pausada conserva progreso y tiempo.

#### Fricciones

- Si hay varios entrenamientos para hoy, todos reciben cards y acciones equivalentes.
- Los entrenamientos completados permanecen junto a los pendientes y pueden competir visualmente.
- El camino improvisado es correcto, pero el bloque de “Inicio rápido” ocupa demasiado espacio para una acción secundaria.
- En light mode el CTA principal del workout presenta el problema crítico de contraste detectado en Fase 1.

#### Reversibilidad

- Salir del workout pausa y preserva el estado.
- Cancelar es una acción separada y confirmada.
- Volver a entrar recupera la sesión.

#### Evaluación

Es uno de los mejores flujos actuales. La mejora principal es de **priorización**, no de cantidad de pasos.

---

### 3. Ejecución y finalización del workout

#### Objetivo

Completar series con la menor interrupción posible, poder corregir errores y guardar un registro confiable.

#### Recorrido actual

```text
Workout
→ Ajustar repeticiones y peso
→ Completar serie
→ Descanso opcional
→ Siguiente
→ Repetir
→ Finalizar
→ Elegir esfuerzo
→ Escribir feedback opcional
→ Enviar y cerrar
→ Home
```

#### Lo que funciona

- Cada pantalla mantiene visible ejercicio, serie y contexto.
- El peso de una serie se propaga a la siguiente cuando fue editado.
- El descanso es opcional y controlable.
- Se puede volver a una serie anterior.
- Un ejercicio puede posponerse.
- Las anotaciones pueden agregarse por set, ejercicio o bloque.
- Estado, timer, descanso, anotaciones y registros sobreviven a una recarga.
- Cancelar abre una confirmación específica.
- El cierre crea una actividad histórica con snapshot.

#### Fricciones

##### 1. Finalización sin revisión

Al llegar a [completed-routine.tsx](../src/features/workout/completed-routine.tsx#L17), el usuario puede enviar, pero no volver al workout para revisar un peso, una repetición o una anotación.

Todavía no se guardó la actividad definitiva, por lo que este es el momento correcto para permitir:

```text
Revisar entrenamiento
Guardar actividad
```

##### 2. Esfuerzo preseleccionado

El esfuerzo comienza automáticamente en 4/5 desde [completed-routine.tsx](../src/features/workout/completed-routine.tsx#L23).

Esto reduce fricción, pero sesga el dato. Si el usuario no presta atención, se registra un esfuerzo que nunca eligió explícitamente.

Opciones razonables:

- Sin selección inicial y selección obligatoria.
- Mantener 4/5, pero expresar claramente “Esfuerzo seleccionado: 4 de 5”.

Recomiendo la primera para preservar calidad del dato.

##### 3. Copy que supone un coach

El placeholder “¿Querés contarle algo a tu entrenador?” aparece incluso para atletas sin coach.

Debe variar:

- Con coach: “¿Querés dejarle una nota a tu entrenador?”
- Sin coach: “¿Querés guardar una nota sobre esta sesión?”

“El botón Enviar y cerrar” también sugiere mensajería. “Guardar actividad” describe mejor la acción real.

##### 4. Feedback transitorio

Mensajes como “Primero completá la serie” se eliminan después de 1,6 segundos desde [workout-mode.tsx](../src/features/workout/workout-mode.tsx#L519). Son fáciles de perder y no comparten el tratamiento persistente de otros errores.

#### Reversibilidad

| Acción | Estado |
|---|---|
| Editar repeticiones/peso | Reversible |
| Marcar serie completa | Reversible |
| Omitir/postergar | Reversible durante la sesión |
| Salir | Seguro; pausa |
| Cancelar workout | Confirmado y destructivo |
| Llegar al resumen final | No permite volver a revisar |
| Guardar actividad | Definitivo, pero luego puede eliminarse desde Historial |

---

### 4. Biblioteca y edición de rutinas del atleta

#### Objetivo

Elegir una rutina para entrenar o crear y mantener una rutina personal.

#### Crear rutina

```text
Rutinas
→ Nueva rutina
→ Nombre
→ Objetivo opcional
→ Duración opcional
→ Crear y editar
→ Agregar bloques y ejercicios
→ Guardar cambios
```

#### Lo que funciona

- Solo el nombre es obligatorio al comenzar.
- La edición compleja queda después del primer diálogo.
- Bloques y ejercicios se crean inline.
- El guardado es explícito.
- Los ejercicios sin nombre y el título vacío bloquean el guardado con explicación visible.
- Salir con cambios abre una confirmación.
- Reload y cierre de pestaña tienen protección.
- Compartir con el coach se aplica junto con el guardado.
- Archivar es reversible.
- Eliminar es confirmado.

#### Problema estructural: la rutina vacía ya fue guardada

[DialogoNuevaRutina](../src/features/routine-editor/new-routine-dialog.tsx#L29) crea una rutina con un bloque vacío. Luego [crearRutina](../src/app/page.tsx#L237) la agrega y persiste inmediatamente.

Consecuencia:

1. El usuario pulsa “Crear y editar”.
2. La rutina vacía ya existe.
3. Si abandona sin modificar nada, `hasChanges` puede ser falso.
4. No aparece la advertencia de cambios sin guardar.
5. La rutina incompleta queda disponible y genera estados de “rutina a revisar”.

Esto contradice la expectativa de guardado explícito.

##### Recomendación

Mantener la nueva rutina como draft local hasta el primer guardado válido. No requiere una nueva feature ni necesariamente una migración.

#### Flujo roto: duplicar y editar

```text
Rutina del coach
→ Duplicar y editar
→ Se crea la copia
→ La copia queda seleccionada
→ El editor no se abre
```

La intención de abrir el editor existe en [athlete-experience.tsx](../src/features/athlete/athlete-experience.tsx#L374), pero el cambio de rutina altera la `key` en [page.tsx](../src/app/page.tsx#L741), remonta el componente y pierde `routineBeingEdited`.

El usuario obtiene “duplicar”, pero no “editar”.

---

### 5. Agenda deportiva

#### Objetivo

Programar una rutina o actividad externa, entender la semana y corregir eventos.

#### Alta actual

```text
Agenda
→ Programar entrenamiento
→ Elegir Rutina RTTP o Actividad externa
→ Elegir rutina o completar nombre/categoría
→ Fecha
→ Hora opcional
→ Recurrencia
→ Duración
→ Notas
→ Programar
```

Entre cinco y siete campos según el tipo de actividad.

#### Lo que funciona

- Rutina y actividad externa comparten el mismo flujo.
- Fecha y hora usan controles coherentes con RTTP.
- La duración se precarga desde la rutina.
- La recurrencia muestra la cantidad de sesiones que se crearán.
- El submit se deshabilita ante combinaciones inválidas.
- La creación se refleja inmediatamente en Agenda.
- Desktop permite drag-and-drop.
- Mobile ofrece creación contextual por día.
- Omitir es reversible.
- Eliminar requiere confirmación.

#### Fricciones

##### 1. Edición con título de creación

El diálogo siempre muestra “Programar entrenamiento” y “Sumá una rutina…” desde [sports-schedule.tsx](../src/features/schedule/sports-schedule.tsx#L333), incluso cuando se está editando una sesión existente.

Debe decir:

- “Editar entrenamiento”.
- “Los cambios se aplicarán solo a esta sesión”.

La segunda frase también aclara el alcance cuando la sesión proviene de una recurrencia.

##### 2. Sin rutinas activas

Si el usuario selecciona “Rutina RTTP” y no existen rutinas activas:

- El select queda vacío.
- El botón queda deshabilitado.
- No se explica cómo resolverlo.

Debe mostrarse un estado inline:

> “No tenés rutinas disponibles. Creá una rutina o programá una actividad externa.”

##### 3. Actividad externa completada sin Undo

“Realizada” actualiza inmediatamente el estado desde [sports-schedule.tsx](../src/features/schedule/sports-schedule.tsx#L528).

Después puede editarse el contenido, pero no volver a `scheduled`. La única salida es eliminar y recrear.

Una acción frecuente y potencialmente accidental debería ofrecer:

- Undo temporal, o
- Acción “Volver a pendiente”.

##### 4. Recurrencia

La cantidad de ocurrencias se comunica antes de confirmar. Es correcto. Sin embargo, al editar una ocurrencia no se explica que solo se modifica esa sesión.

---

### 6. Historial de actividades

#### Objetivo

Encontrar una actividad completada, entender qué ocurrió y, si corresponde, eliminarla.

#### Recorrido actual

```text
Historial
→ Filtrar opcionalmente
→ Abrir actividad
→ Revisar resumen, sets, anotaciones y feedback
→ Eliminar opcionalmente
→ Confirmar
```

- **Interacciones habituales:** 2.
- **Para eliminar:** 4.

#### Lo que funciona

- Las actividades más recientes aparecen primero.
- Los filtros son simples.
- El detalle usa progressive disclosure.
- Los entrenamientos RTTP conservan su snapshot histórico.
- Las anotaciones mantienen contexto de bloque, ejercicio o serie.
- El atleta puede eliminar.
- El coach tiene modo consulta.
- Eliminar requiere confirmación y explica qué ocurrirá con la agenda.
- Las listas manejan nombres largos mediante truncado y expansión.

#### Fricciones

- Los tres contadores iniciales retrasan la lista sin facilitar una acción.
- “Minutos” mezcla duraciones de rutinas y actividades externas, pero no aporta contexto comparativo.
- No existe búsqueda, agrupación por fecha ni paginación. No es un problema con pocos datos, pero el render completo crecerá indefinidamente.
- En el coach, el copy promete corregir registros desde Historial aunque la corrección vive en Agenda.

#### Reversibilidad

Eliminar una actividad es irreversible, pero:

- está confirmado;
- explica que una rutina original no se elimina;
- elimina también la ocurrencia asociada para evitar estados huérfanos.

El contrato es correcto.

---

### 7. Alta y selección de atletas

#### Objetivo

Agregar un atleta y entrar en su espacio de planificación.

#### Recorrido esperado

```text
Inicio del coach
→ Agregar atleta
→ Nombre y email
→ Guardar
→ Abrir atleta
```

#### Estado actual

El diálogo en [new-athlete-dialog.tsx](../src/features/routine-editor/new-athlete-dialog.tsx#L21):

- tiene estado loading;
- impide cerrarse mientras guarda;
- detecta email duplicado;
- muestra errores remotos;
- deshabilita la acción si nombre o email están vacíos.

#### Problemas

##### Coach sin atletas

El coach no puede llegar al diálogo porque la composición exige tener un atleta seleccionado. Es el bloqueo más grave de esta fase.

##### Validación de email

El botón es `type="button"`, por lo que el `type="email"` del input no activa validación nativa de formulario. Un texto no vacío pero con formato inválido puede intentar persistirse.

##### Terminología

El producto habla de “atletas”, pero el diálogo utiliza “Agregar alumno”. Debe mantenerse “atleta” en toda la experiencia.

##### Rutina automática

[crearAtleta](../src/app/page.tsx#L462) crea también una rutina inicial vacía.

Esto requiere una decisión previa a implementación:

- **Recomendado:** crear solamente el atleta y ofrecer “Crear primera rutina”.
- Alternativa: mantener una rutina draft explícitamente marcada como incompleta y no entrenable.

No debería persistirse una rutina vacía presentándola como una rutina normal.

---

### 8. Edición de rutinas del coach

#### Objetivo

Entrar al atleta, seleccionar una rutina, editarla y guardar cambios confiablemente.

#### Recorrido actual

```text
Atletas
→ Ver planificación
→ Seleccionar rutina
→ Editar datos/bloques/ejercicios
→ Guardar cambios
```

#### Lo que funciona

- Edición inline.
- Bloques colapsables.
- Drag-and-drop.
- Validación de nombres.
- Acción de guardado visible solo cuando hay cambios.
- Guard de navegación interno.
- Protección ante reload/cierre.
- Confirmación antes de eliminar.
- Rutinas personales compartidas permanecen read-only.

#### Fricciones

- “Plan de entrenamiento” y “Rutinas” se usan para el mismo nivel.
- La pantalla contiene simultáneamente selector, editor, tabs de atleta, creación, preview y acciones destructivas.
- El estado “Guardado” aparece inmediatamente después de enviar la mutación local.
- No existe estado “Sincronizando…”.
- Si falla persistencia, el usuario puede ver “Cambios guardados” y después un error global.

#### Recomendación de feedback

```text
Cambios sin guardar
→ Guardando…
→ Guardado
```

Si la mutación queda en outbox:

```text
Guardado en este dispositivo · Pendiente de sincronización
```

Si falla definitivamente:

```text
No pudimos sincronizar estos cambios
[Reintentar]
```

---

### 9. Plantillas

#### Crear plantilla

```text
Abrir rutina de un atleta
→ Navegar a Rutinas/Plantillas
→ Guardar como plantilla
→ Elegir nombre
→ Crear
```

El problema es que la sección global depende de la última rutina seleccionada, sin hacer explícito ese vínculo.

El flujo recomendado es:

```text
Rutina del atleta
→ Guardar como plantilla
→ Nombre
→ Crear
```

#### Asignar plantilla

```text
Plantillas
→ Asignar
→ Elegir atleta
→ Asignar rutina
→ El diálogo se cierra
```

[asignarPlantilla](../src/app/page.tsx#L435) crea la rutina y cambia internamente atleta y rutina seleccionados, pero no navega al resultado.

Falta una confirmación clara:

```text
Rutina asignada a User Test
[Abrir rutina]
```

Sin ella, el usuario no sabe si:

- se creó correctamente;
- se abrió;
- debe ir a Atletas;
- debe continuar en Plantillas.

#### Eliminar plantilla

Está correctamente confirmado y aclara que las rutinas ya asignadas no se modifican.

---

### 10. Agenda, historial y preview desde el coach

#### Navegación contextual

```text
Atletas
→ Atleta
→ Rutinas | Agenda | Actividades
```

La estructura conceptual es buena. El problema es que la subsección no se guarda en la URL y se pierde al recargar.

#### Historial

- Correctamente read-only.
- Mantiene acceso a notas y anotaciones.
- El coach no puede eliminar actividades.
- El copy debe dejar de prometer correcciones desde esa pantalla.

#### Preview

```text
Atleta
→ Vista atleta
→ Home del atleta en modo inert
→ Volver a editar
```

Funciona como preview segura y no permite mutaciones.

La fricción es semántica: “Vista atleta” parece una entrada a toda la aplicación del atleta, pero solo presenta Inicio. Hasta ampliar el alcance, debe decir **“Previsualizar inicio”**.

---

### 11. Estados transversales

| Estado | Cobertura actual | Diagnóstico |
|---|---|---|
| Carga inicial | Fondo vacío | Falta skeleton o mensaje |
| Carga parcial | No existe; bootstrap monolítico | Aceptable por ahora, poco escalable |
| Error de acceso | Inline y anunciado | Correcto |
| Error de alta de atleta | Inline y anunciado | Correcto |
| Error de validación de rutina | Inline y bloquea guardado | Correcto |
| Error de recurrencia | Inline | Correcto |
| Error de sincronización | Banner global | Visible, pero poco accionable |
| Reintento manual | No existe | Falta |
| Offline después de una carga exitosa | Outbox en `sessionStorage` | Buena base |
| Sin conexión durante carga inicial | Cambios solo en memoria | Riesgo de pérdida |
| Sin permisos | Controles ocultos y errores defensivos | Correcto |
| Empty de actividades | Existe | Correcto, aunque sin CTA |
| Empty de rutinas | Existe | Parcialmente accionable |
| Empty de agenda | Existe | Correcto |
| Coach sin atletas | No existe | Bloqueante |
| Datos largos | Truncate, line-clamp y detalle expandible | Generalmente correcto |
| Listas grandes | Sin búsqueda, paginación o virtualización | Riesgo futuro |
| Guardando | Solo alta de atleta | Falta en el resto de las mutaciones |
| Éxito | Mensajes temporales locales | Inconsistente |
| Undo | Solo omitir/restaurar | Falta para completar actividad externa |
| Destrucción | Confirmada | Correcto |

---

### 12. Riesgo de sincronización y confianza

La persistencia funciona bien cuando la aplicación ya cargó datos remotos:

1. La mutación se agrega al outbox.
2. Se intenta sincronizar.
3. Si falla, queda pendiente.
4. El evento `online` vuelve a ejecutar hidratación y sincronización.

Pero cuando la carga inicial remota falla, [use-app-data.ts](../src/application/data/use-app-data.ts#L129) hace lo siguiente:

1. La UI modifica el estado local.
2. `persist` detecta que nunca hubo datos remotos.
3. Muestra un error.
4. No agrega la mutación al outbox.
5. Una recarga puede perder el cambio.

El mensaje advierte sobre la situación, pero los controles siguen produciendo una apariencia de éxito.

#### Contrato recomendado

- Si la aplicación nunca logró una carga remota:
  - mostrar modo “Solo lectura” para datos persistidos, o
  - garantizar almacenamiento local recuperable antes de permitir cambios.
- Si ya hubo una carga remota:
  - permitir optimismo;
  - mostrar “Pendiente de sincronización” cuando haya outbox.
- Nunca mostrar “Guardado” antes de distinguir guardado local de remoto.

---

### 13. Hallazgos

| ID | Ubicación | Categoría | Qué pasa | Por qué importa | Propuesta | Severidad | Esfuerzo |
|---|---|---|---|---|---|---|---|
| FLOW-001 | [page.tsx](../src/app/page.tsx#L649) | Flujo / Vacío | Un coach sin atletas vuelve a la landing | Bloquea la primera tarea del rol | Mostrar workspace vacío con “Agregar primer atleta” | **Crítico** | M |
| FLOW-002 | [new-routine-dialog.tsx](../src/features/routine-editor/new-routine-dialog.tsx#L29), [page.tsx](../src/app/page.tsx#L237) | Flujo / Persistencia | Una rutina vacía se persiste antes del primer guardado explícito | Abandonar el editor deja datos incompletos válidos | Mantener draft local hasta el primer guardado válido | Alto | M |
| FLOW-003 | [athlete-experience.tsx](../src/features/athlete/athlete-experience.tsx#L374), [page.tsx](../src/app/page.tsx#L741) | Flujo | “Duplicar y editar” crea la copia pero el remount cierra el editor | La acción no cumple su promesa | Evitar el remount o elevar el estado de edición | Alto | S |
| FLOW-004 | [use-app-data.ts](../src/application/data/use-app-data.ts#L129), [load-app-data.ts](../src/application/data/load-app-data.ts#L23) | Offline / Error | Tras fallar la carga inicial, las mutaciones cambian la UI pero no se encolan | El usuario puede perder trabajo al recargar | Bloquear edición o persistir una cola local recuperable | Alto | L |
| FLOW-005 | [athlete-routine-editor.tsx](../src/features/athlete/athlete-routine-editor.tsx#L65), [coach-home.tsx](../src/features/coach/coach-home.tsx#L124) | Feedback | “Guardado” se activa antes de confirmar persistencia remota | Puede comunicar éxito antes de un error de sincronización | Separar guardado local, sincronizando y sincronizado | Alto | M |
| FLOW-006 | [completed-routine.tsx](../src/features/workout/completed-routine.tsx#L17) | Reversibilidad | El resumen final no permite volver al workout | Un error detectado al final no puede corregirse | Agregar “Revisar entrenamiento” antes del guardado | Alto | M |
| FLOW-007 | [completed-routine.tsx](../src/features/workout/completed-routine.tsx#L23) | Datos / Copy | Esfuerzo comienza en 4/5 y el copy siempre supone un coach | Puede guardar datos no elegidos y confundir al atleta independiente | Requerir esfuerzo explícito y adaptar el copy | Medio | S |
| FLOW-008 | [sports-schedule.tsx](../src/features/schedule/sports-schedule.tsx#L528) | Reversibilidad | “Realizada” no puede volver a pendiente | Un toque accidental exige eliminar y recrear | Agregar Undo o “Volver a pendiente” | Alto | S |
| FLOW-009 | [sports-schedule.tsx](../src/features/schedule/sports-schedule.tsx#L333) | Copy / Flujo | Editar reutiliza el título y descripción de creación | No queda claro si se crea, edita o modifica una recurrencia | Usar título contextual y aclarar “solo esta sesión” | Medio | S |
| FLOW-010 | [sports-schedule.tsx](../src/features/schedule/sports-schedule.tsx#L121) | Vacío / Validación | Sin rutinas activas, el selector queda vacío y Programar deshabilitado | No explica cómo continuar | Mostrar CTA hacia Rutinas o sugerir actividad externa | Medio | S |
| FLOW-011 | [assign-template-dialog.tsx](../src/features/routine-editor/assign-template-dialog.tsx#L30), [page.tsx](../src/app/page.tsx#L435) | Feedback / Flujo | Asignar plantilla cierra el diálogo sin confirmación ni destino visible | El usuario no sabe dónde quedó la copia | Confirmar y ofrecer “Abrir rutina” | Alto | M |
| FLOW-012 | [coach-home.tsx](../src/features/coach/coach-home.tsx#L107) | Navegación | Agenda e Historial del atleta son estado local | Reload y Back no conservan el punto del flujo | Persistir subsección en ruta | Alto | M |
| FLOW-013 | [new-athlete-dialog.tsx](../src/features/routine-editor/new-athlete-dialog.tsx#L41) | Validación | Se valida presencia y duplicado, pero no formato de email mediante submit | Puede llegar un email inválido al backend | Usar formulario y validación explícita | Medio | S |
| FLOW-014 | [page.tsx](../src/app/page.tsx#L641) | Carga | La hidratación muestra una pantalla completamente vacía | Puede parecer una aplicación bloqueada | Mostrar shell/skeleton y texto de carga solo cuando se prolongue | Medio | S |
| FLOW-015 | [sync-error.ts](../src/application/sync/sync-error.ts#L1), [app-shell.tsx](../src/features/shell/app-shell.tsx#L282) | Error / Copy | El banner puede mostrar directamente mensajes técnicos y no ofrece retry | El usuario conoce el problema pero no cómo resolverlo | Normalizar mensajes y agregar “Reintentar” | Alto | M |
| FLOW-016 | [workout-mode.tsx](../src/features/workout/workout-mode.tsx#L519) | Feedback | El bloqueo de swipe aparece por 1,6 s y desaparece | Puede no ser percibido ni explicar el control requerido | Mantener feedback hasta corregir o anunciarlo como estado | Medio | S |
| FLOW-017 | [activity-history.tsx](../src/components/activity-history.tsx#L477), [coach-athletes-view.tsx](../src/features/coach/coach-athletes-view.tsx#L42) | Escalabilidad | Historial y atletas renderizan listas completas sin herramientas de localización | El flujo degradará cuando crezca el volumen | Medir escala real antes de agregar búsqueda o paginación | Bajo | L |

---

#### Prioridad recomendada antes del pulido visual

1. Desbloquear coach sin atletas.
2. Corregir “Duplicar y editar”.
3. Evitar persistir rutinas incompletas.
4. Definir contrato de guardado local, sincronización y offline.
5. Permitir revisión antes de guardar la actividad final.
6. Hacer reversible “Marcar realizada”.
7. Corregir feedback de asignación de plantillas.
8. Persistir subsecciones del atleta en la URL.
9. Completar estados de carga, error y validación.

No se modificó código. El servidor fue detenido y el repositorio permanece limpio.

La siguiente etapa es la **FASE 4 — UI fina y detalle**, centrada en prioridad de acciones, copy, densidad, áreas táctiles, alineación, feedback y percepción de velocidad.

---

## FASE 4 — UI fina y detalle

### Resumen ejecutivo

La aplicación ya tiene una dirección visual reconocible y varios flujos muy bien resueltos. El problema no es “falta de diseño”, sino que la escala y la jerarquía no siempre acompañan la importancia real de cada acción.

Los diez problemas que más afectan esta fase son:

1. El CTA principal del workout continúa siendo casi invisible en light mode.
2. Muchas áreas táctiles miden entre **28 y 40 px**, por debajo de los 44 px esperados.
3. “Agregar atleta”, una acción primaria del coach, se presenta como un `+` sin label visible.
4. “Vista atleta” compite visualmente con “Guardar cambios”.
5. El guardado desaparece del viewport al editar rutinas largas.
6. “Guardado” comunica éxito antes de confirmar sincronización.
7. Agenda muestra hasta tres acciones equivalentes para programar.
8. Los empty states consumen demasiado espacio y algunos no ofrecen siguiente acción.
9. El editor del coach prioriza densidad por sobre precisión.
10. No existe adaptación para `prefers-reduced-motion`.

---

### 1. Qué ya funciona bien

#### Workout

Es la superficie más lograda:

- “Completar serie” es claramente dominante.
- Al completar, el CTA cambia a “Serie completada” y muestra reversibilidad.
- “Siguiente” se activa después de completar.
- La serie actual, el progreso y la siguiente serie permanecen visibles.
- Repeticiones y peso están agrupados correctamente.
- Cancelar está diferenciado de salir.
- La confirmación destructiva explica qué se perderá.
- Las sheets de omisión y aclaración mantienen el contexto detrás.

#### Rutinas del atleta

- “Comenzar rutina” domina correctamente sobre duplicar y archivar.
- “Nueva rutina” queda como acción secundaria.
- Los filtros tienen un comportamiento predecible.
- La vista general aparece como detalle bajo demanda.
- Las acciones destructivas no compiten con el inicio del entrenamiento.

#### Formularios y diálogos

- Los campos tienen labels visibles.
- El primer campo suele recibir foco.
- Los footers mantienen una jerarquía consistente.
- En mobile, la acción primaria aparece antes que Cancelar.
- Los diálogos largos de Agenda tienen scroll propio en [sports-schedule.tsx](../src/features/schedule/sports-schedule.tsx#L391).
- El alta de atleta comunica “Guardando…” y bloquea un segundo submit.

#### Movimiento

- Las transiciones son contenidas.
- No hay animaciones decorativas que bloqueen el uso.
- Las sheets usan desplazamientos que explican de dónde aparece el contenido.
- El swipe del workout utiliza una transición de 200 ms.
- Las cards no realizan movimientos innecesarios.

---

### 2. Jerarquía de acciones por pantalla

| Pantalla | Primaria actual | Diagnóstico |
|---|---|---|
| Home atleta sin entrenamiento | Ver agenda | Correcta, aunque la card es demasiado grande |
| Rutinas atleta | Comenzar rutina | Correcta |
| Workout | Completar serie / Siguiente | Muy clara en dark; crítica en light |
| Agenda | Programar entrenamiento | Se repite en header, día vacío y rutina disponible |
| Historial vacío | Ninguna | Falta una salida accionable |
| Perfil | Ninguna | Correcto |
| Home coach | Ninguna claramente dominante | Las cards tienen affordances distintos |
| Directorio de atletas | `+` sin texto | Acción primaria poco descubrible |
| Detalle del atleta | Vista atleta | Preview está sobrejerarquizada |
| Editor con cambios | Guardar cambios + Vista atleta | Dos acciones primarias simultáneas |
| Plantillas | Guardar como plantilla | Visualmente parece secundaria |
| Confirmación destructiva | Acción destructiva | Correcta y diferenciada |

---

### 3. Escala interactiva

La medición real en viewport mobile encontró:

| Acción | Tamaño aproximado |
|---|---:|
| Header: tema, perfil y logout | 28×28 px |
| Salir/cancelar/resumen del workout | 36×36 px |
| Aclaración y omisión | 32×32 px |
| `−` y `+` de repeticiones/peso | 36×36 px |
| Cerrar dialogs/sheets | 28–30 px |
| Navegación de semana | 28×28 px |
| Acciones de Agenda | 28–32 px de alto |
| Drag handle del editor | 26×26 px |
| Series y descanso del editor | 28–30 px |
| Eliminar ejercicio | 30×30 px |
| Ver planificación | 36–38 px de alto |

La raíz está en [button.tsx](../src/components/ui/button.tsx#L8):

- Default: 32 px.
- `icon-sm`: 28 px.
- `icon`: 32 px.
- `icon-lg`: 36 px.

Esto puede ser aceptable con mouse, pero las mismas variantes se usan en superficies mobile.

#### Recomendación

No agrandar indiscriminadamente toda la UI desktop. Definir dos escalas:

##### Touch

- Acción primaria: 48 px.
- Botón común: 44 px.
- Icon-only: hit area mínima de 44×44 px.
- Control repetitivo `−/+`: 44×44 px.

##### Pointer denso

- Acción primaria: 40 px.
- Botón común: 36 px.
- Icon-only: 32–36 px.
- Drag handle: área efectiva de al menos 36 px.

El icono puede seguir midiendo 16 px; lo que debe crecer es el área interactiva.

---

### 4. Copy recomendado

| Actual | Propuesta | Razón |
|---|---|---|
| `Gestioná tus alumnos` | `Gestioná tus atletas` | Mantener una sola entidad |
| `Agregar alumno` | `Agregar atleta` | Consistencia con todo el producto |
| `Podrá ingresar a RTTP usando este email` | `Este email identifica su perfil en RTTP` | No prometer autenticación real |
| `Rutinas · Todos tus planes` | `Rutinas · Elegí qué entrenar` | Evitar “plan” como sinónimo |
| `Progreso · Tu historial deportivo` | `Historial · Tus actividades` | Reflejar el contenido real |
| `Plan de entrenamiento` | `Rutinas de User Test` | Describe mejor la superficie |
| `Vista atleta` | `Previsualizar inicio` | La preview solo cubre Home |
| `Enviar y cerrar` | `Guardar actividad` | Describe la operación real |
| `¿Querés contarle algo a tu entrenador?` | Condicional según exista coach | No suponer una relación inexistente |
| `Abrí solo la actividad que quieras revisar…` | `Revisá el detalle de cada sesión cuando lo necesites` | Hablar del beneficio, no de la implementación |
| `Objetivo(opcional)` | `Objetivo (opcional)` | Corrección tipográfica |
| `Duración(min)` | `Duración (min)` | Corrección tipográfica |
| `Programar entrenamiento` al editar | `Editar entrenamiento` | Reflejar el estado del diálogo |
| `Rutina fuente: X` | `Guardando como plantilla: X` | Explicar relación y acción |
| `Constructor flexible` | Eliminar | Es información prematura y no accionable |

La terminología inconsistente aparece principalmente en [navigation-items.ts](../src/features/shell/navigation-items.ts), [new-athlete-dialog.tsx](../src/features/routine-editor/new-athlete-dialog.tsx#L63), [athlete-home.tsx](../src/features/athlete/athlete-home.tsx#L159) y [coach-athlete-detail-view.tsx](../src/features/coach/coach-athlete-detail-view.tsx#L135).

---

### 5. Movimiento y percepción de velocidad

#### Política actual

| Elemento | Duración | Evaluación |
|---|---:|---|
| Dialog | 100 ms | Algo abrupto |
| Sheet | 150–200 ms | Correcto |
| Swipe workout | 200 ms | Correcto |
| Navegación mobile | 300 ms | Ligeramente lenta |
| Hover de controles | Valor default de Tailwind | Generalmente correcto |
| Mensaje de guardado | 1.800 ms | Demasiado temporal para un estado importante |
| Plantilla creada | 2.400 ms | Aceptable como confirmación secundaria |

Los valores viven en [dialog.tsx](../src/components/ui/dialog.tsx#L24), [sheet.tsx](../src/components/ui/sheet.tsx#L25), [workout-mode.tsx](../src/features/workout/workout-mode.tsx#L718) y [app-shell.tsx](../src/features/shell/app-shell.tsx#L334).

#### Sistema recomendado

- Microinteracción: **160 ms**.
- Hover/focus: **160 ms**.
- Dialog: **180 ms**.
- Sheet: **220 ms**.
- Reordenamiento: **200 ms**.
- Navegación: **200 ms**.
- Evitar animaciones mayores a 250 ms salvo transición espacial compleja.
- No animar cambios de texto críticos como único feedback.

#### Reduced motion

No se encontraron:

- `prefers-reduced-motion`;
- `motion-reduce`;
- `motion-safe`.

Debe existir una política global que:

- elimine zoom y desplazamiento de dialogs/sheets;
- elimine transformaciones de botones;
- reduzca drag y navegación a cambios instantáneos o fades breves;
- conserve feedback visual sin movimiento.

#### Percepción de velocidad

##### Positivo

- Las mutaciones optimistas hacen que Agenda, rutinas y actividades respondan inmediatamente.
- No hay spinners globales bloqueantes.
- El alta de atleta sí comunica progreso.

##### Pendiente

- La carga inicial muestra una superficie vacía desde [page.tsx](../src/app/page.tsx#L641).
- Los guardados de rutina no tienen “Guardando…”.
- No se diferencia guardado local de sincronización.
- No existe acción manual “Reintentar”.
- Algunos mensajes de éxito desaparecen aunque el usuario no los haya percibido.
- El error global de [app-shell.tsx](../src/features/shell/app-shell.tsx#L282) informa, pero no ofrece resolución.

---

### 6. Hallazgos

| ID | Ubicación | Categoría | Qué pasa | Por qué importa | Propuesta | Severidad | Esfuerzo |
|---|---|---|---|---|---|---|---|
| UI-001 | [workout-mode.tsx](../src/features/workout/workout-mode.tsx#L899), [globals.css](../src/app/globals.css#L118) | Sistema visual / Acción | El CTA principal del workout alcanza aproximadamente 1.17:1 en light mode | La acción más importante parece deshabilitada o invisible | Usar tokens semánticos de acción y verificar estados default/hover/disabled | **Crítico** | M |
| UI-002 | [button.tsx](../src/components/ui/button.tsx#L8) | Interacción | Las variantes base producen targets de 28–36 px | Aumenta toques erróneos, especialmente durante el entrenamiento | Crear escala touch de 44–48 px y conservar compacta para pointer | Alto | M |
| UI-003 | [new-athlete-dialog.tsx](../src/features/routine-editor/new-athlete-dialog.tsx#L55) | Acción / Copy | “Agregar atleta” se presenta como un `+` sin label visible | La acción principal del directorio parece decorativa | Mostrar botón `Agregar atleta` con icono y texto | Alto | S |
| UI-004 | [coach-athlete-detail-view.tsx](../src/features/coach/coach-athlete-detail-view.tsx#L159) | Jerarquía | “Vista atleta” usa el color primario aun cuando la tarea es editar | Preview compite con creación y guardado | Renombrar y convertir en acción secundaria | Alto | S |
| UI-005 | [coach-athlete-detail-view.tsx](../src/features/coach/coach-athlete-detail-view.tsx#L280) | Acción / Responsive | “Guardar cambios” vive en el header de la card y sale del viewport en rutinas largas | El usuario puede editar muchos campos sin ver cómo guardar | Barra sticky de cambios sobre la navegación mobile | Alto | M |
| UI-006 | [coach-athlete-detail-view.tsx](../src/features/coach/coach-athlete-detail-view.tsx#L280) | Jerarquía | Al editar aparecen dos CTAs brillantes: Vista atleta y Guardar cambios | No hay una acción primaria inequívoca | Dejar Guardar como única primaria cuando hay cambios | Alto | S |
| UI-007 | [athlete-routine-editor.tsx](../src/features/athlete/athlete-routine-editor.tsx#L64), [coach-home.tsx](../src/features/coach/coach-home.tsx#L117) | Feedback | “Guardado” se muestra antes de conocer el resultado remoto | Puede existir éxito visual seguido de error | Usar Sin guardar → Guardando → Sincronizado/Pendiente/Error | Alto | M |
| UI-008 | [page.tsx](../src/app/page.tsx#L641) | Velocidad percibida | La hidratación inicial muestra solo el fondo | Puede parecer una pantalla bloqueada | Shell estable y skeleton mínimo después de un umbral breve | Alto | M |
| UI-009 | [exercise-row.tsx](../src/features/routine-editor/exercise-row.tsx#L43) | Densidad | El editor usa handles de 26 px, botones de 30 px y campos de 32 px | Optimiza cantidad visible pero aumenta errores de precisión | Elevar controles y separar grupos de series, reps, peso y descanso | Alto | M |
| UI-010 | [coach-athlete-detail-view.tsx](../src/features/coach/coach-athlete-detail-view.tsx#L300), [exercise-row.tsx](../src/features/routine-editor/exercise-row.tsx#L321) | Seguridad de interacción | Eliminar rutina y ejercicio son iconos pequeños | Una acción destructiva requiere demasiada precisión | Target mayor y separación; label visible o menú contextual | Alto | S |
| UI-011 | [sports-schedule.tsx](../src/features/schedule/sports-schedule.tsx#L722) | Jerarquía | Mobile puede mostrar Programar arriba, Programar en este día y Programar una rutina | Tres acciones equivalentes compiten en el mismo recorrido | Mantener una primaria contextual y convertir el resto en accesos secundarios | Medio | M |
| UI-012 | [coach-overview-view.tsx](../src/features/coach/coach-overview-view.tsx#L83) | Consistencia | Una card completa es clickeable y la otra contiene un link interno | Dos componentes iguales tienen contratos diferentes | Definir una única action-card canónica | Medio | S |
| UI-013 | [coach-templates-view.tsx](../src/features/coach/coach-templates-view.tsx#L46) | Jerarquía / Vacío | Guardar plantilla parece secundario y el empty state es una línea de texto tenue | La tarea principal no guía al usuario | Card vacía accionable y source selector explícito | Medio | M |
| UI-014 | [activity-history.tsx](../src/components/activity-history.tsx#L503) | Vacío / Copy | El historial vacío no ofrece acción y mantiene copy sobre abrir actividades | No ayuda al primer uso | Ocultar la instrucción y ofrecer Ir a rutinas o Ver agenda | Medio | S |
| UI-015 | [today-home.tsx](../src/features/athlete/today-home.tsx#L305), [activity-history.tsx](../src/components/activity-history.tsx#L503) | Espaciado | Empty states simples ocupan entre 288 y casi 500 px | El vacío recibe más peso que la siguiente acción útil | Usar empty states compactos de contenido intrínseco | Medio | S |
| UI-016 | [athlete-home.tsx](../src/features/athlete/athlete-home.tsx#L205) | Densidad | En mobile se repite rutina, cantidad y autor en selector y detalle | Duplica lectura antes de llegar a la acción | Compactar selector seleccionado o convertirlo en dropdown en mobile | Medio | M |
| UI-017 | [new-routine-dialog.tsx](../src/features/routine-editor/new-routine-dialog.tsx#L128) | Copy / Densidad | “Constructor flexible” ocupa espacio antes de crear y usa lenguaje de implementación | No ayuda a decidir ni completar el formulario | Eliminarlo o reemplazarlo por una frase corta orientada al resultado | Medio | S |
| UI-018 | [user-profile.tsx](../src/features/athlete/user-profile.tsx#L35) | Copy / Espaciado | Perfil promete preferencias, repite identidad y usa una card extensa para pocos datos | Genera una pantalla visualmente inflada | Simplificar encabezado y agrupar cuenta/vínculo sin duplicar explicación | Medio | S |
| UI-019 | [completed-routine.tsx](../src/features/workout/completed-routine.tsx#L72) | Copy / Acción | Feedback y CTA implican un envío al coach | No describe el guardado real y falla para atletas independientes | Copy condicional y CTA `Guardar actividad` | Medio | S |
| UI-020 | [dialog.tsx](../src/components/ui/dialog.tsx#L24), [sheet.tsx](../src/components/ui/sheet.tsx#L25) | Movimiento | No existe política de reduced motion | Usuarios sensibles al movimiento reciben zoom y desplazamiento forzados | Agregar variantes `motion-reduce` globales | Medio | S |
| UI-021 | [dialog.tsx](../src/components/ui/dialog.tsx#L24), [app-shell.tsx](../src/features/shell/app-shell.tsx#L334) | Movimiento | Dialog dura 100 ms y navegación 300 ms | El primero se siente abrupto y la segunda más lenta que el resto | Normalizar a 180–220 ms | Bajo | S |
| UI-022 | [workout-mode.tsx](../src/features/workout/workout-mode.tsx#L931), [coach-home.tsx](../src/features/coach/coach-home.tsx#L121) | Feedback | Mensajes importantes desaparecen por timeout fijo | Pueden desaparecer antes de ser leídos | Mantener estados mientras sean relevantes o usar feedback persistente | Medio | S |
| UI-023 | [workout-mode.tsx](../src/features/workout/workout-mode.tsx#L587) | Espaciado | En mobile queda un vacío amplio entre la card y navegación contextual | La instrucción de swipe parece desconectada del contenido | Reducir espacio adaptable sin perder zona del pulgar | Bajo | S |

---

### 7. Orden recomendado para implementar esta fase

#### Primero

1. Tokens semánticos del CTA y corrección de light mode.
2. Escala de targets touch.
3. Jerarquía de Preview versus Guardar.
4. Barra de guardado sticky.
5. Estados reales de guardado y sincronización.
6. Skeleton inicial.

#### Después

7. CTA visible para agregar atleta.
8. Simplificación de Agenda.
9. Normalización del editor del coach.
10. Empty states compactos y accionables.
11. Corrección integral de copy.
12. Reduced motion y normalización de duraciones.

---

#### Validación realizada

Se inspeccionaron:

- Atleta en 390, 958 y 1440 px.
- Coach en 390 y 1440 px.
- Home, rutinas, overview, workout, aclaraciones, cancelación, Agenda, Historial, Perfil, directorio de atletas, editor y Plantillas.
- Estados default, completado, disabled, dialogs y sheets.
- Targets mediante dimensiones computadas del navegador.
- Movimiento y feedback mediante inspección de primitives y timeouts.

El overlay circular de Next.js visible en algunas capturas es exclusivo del entorno de desarrollo y fue excluido del diagnóstico.

No se modificó código, no se persistieron datos de prueba, se cerró la sesión local, se detuvo el servidor y el repositorio quedó limpio. La siguiente etapa es la **FASE 5 — Responsive y multiplataforma**.

---

## FASE 5 — Responsive y multiplataforma

### Resumen ejecutivo

La aplicación **no presenta overflow horizontal accidental** en las rutas principales probadas a `390px`, `958px`, `1024px` y `1440px`. La mayoría de las pantallas reordenan correctamente su contenido y Agenda tiene una adaptación especialmente sólida.

Los problemas más importantes aparecen con **poca altura disponible**, no con poco ancho:

1. El acceso queda bloqueado en landscape por la etiqueta de versión.
2. La sheet para saltar ejercicios excede el viewport y no permite scroll.
3. El workout oculta su CTA principal en landscape.
4. El diálogo para crear rutinas se recorta al abrir el teclado.
5. En mobile no existe forma de eliminar un ejercicio.
6. La Home del coach coloca cuatro métricas antes de su primera acción.
7. Guardar una rutina queda muy lejos al editar contenido largo.

---

### Cobertura realizada

#### Viewports

- Mobile portrait: `390×844` y `390×667`.
- Viewport corto / teclado simulado: `390×500` y `390×400`.
- Landscape: `844×390`.
- Intermedio: `958×844`.
- Breakpoint exacto desktop: `1024×844`.
- Desktop: `1440×900`.

#### Superficies

**Atleta**

- Inicio.
- Biblioteca de rutinas.
- Agenda.
- Historial.
- Perfil.
- Workout.
- Vista general, aclaraciones y omisión durante workout.

**Coach**

- Resumen.
- Directorio de atletas.
- Detalle y editor.
- Agenda e historial del atleta.
- Plantillas.
- Perfil.
- Vista previa del atleta.
- Alta de atleta y creación de rutina.

También verifiqué una ruta representativa en light mode: la geometría responsive se conserva, aunque los problemas de contraste ya registrados en Fase 1 siguen vigentes.

---

### Hallazgos

#### UX-501 — El acceso queda bloqueado en landscape

| Campo | Contenido |
|---|---|
| ID | UX-501 |
| Ubicación | Landing · [LandingAcceso](../src/features/landing/access-landing.tsx#L31) |
| Categoría | Responsive |
| Qué pasa | En `844×390`, el botón **Acceder** queda entre `y=345–393`, mientras la etiqueta de versión ocupa `y=360–373`. La etiqueta se superpone e intercepta el click. Playwright no pudo activar el botón mediante interacción normal. |
| Por qué importa | Es el único punto de entrada. En un teléfono en landscape o con una ventana muy baja, el usuario directamente no puede ingresar. |
| Propuesta | Adaptar verticalmente la landing según altura, reducir separaciones/logo en `short landscape`, mantener el CTA completamente dentro del viewport y sacar la versión del área interactiva o aplicarle `pointer-events-none`. |
| Severidad | **Crítico** |
| Esfuerzo | S |

La causa combina el contenido centrado con la versión posicionada de forma absoluta al final de la pantalla en [LandingAcceso](../src/features/landing/access-landing.tsx#L127).

---

#### UX-502 — La Home mobile del coach prioriza métricas sobre acciones

| Campo | Contenido |
|---|---|
| ID | UX-502 |
| Ubicación | Home del coach · [CoachOverviewView](../src/features/coach/coach-overview-view.tsx#L42) |
| Categoría | Responsive / Jerarquía |
| Qué pasa | En `390×844`, las cuatro métricas se apilan en una sola columna. La primera acción, “Seguí con tus atletas”, comienza en `y=738`; el dock comienza en `y=762`. Casi toda la acción queda inicialmente detrás de la navegación. |
| Por qué importa | La pantalla responde primero con inventario y obliga a scrollear para encontrar qué hacer. Es un dashboard desktop apilado, no una Home mobile orientada a acción. |
| Propuesta | Aplicar la jerarquía definida en Fase 2: acción y pendientes primero. Si se conservan métricas, usar una síntesis compacta o una grilla `2×2` desde mobile. |
| Severidad | **Alto** |
| Esfuerzo | M |

---

#### UX-503 — El CTA del workout desaparece inicialmente en landscape

| Campo | Contenido |
|---|---|
| ID | UX-503 |
| Ubicación | Workout · [WorkoutMode](../src/features/workout/workout-mode.tsx#L535) |
| Categoría | Responsive |
| Qué pasa | En `844×390`, la región interna ofrece aproximadamente `286px` de altura para `547px` de contenido. “Completar serie” queda parcialmente cortado y Anterior/Siguiente quedan completamente fuera del viewport inicial. El scrollbar está oculto. |
| Por qué importa | La acción principal del entrenamiento deja de estar visible y tampoco hay una señal clara de que la región central puede scrollear. Nombres o indicaciones largas agravan el problema. |
| Propuesta | Crear una composición compacta para poca altura: reducir espacios verticales y mantener “Completar serie” sticky. La navegación secundaria puede permanecer en el contenido scrolleable. |
| Severidad | **Alto** |
| Esfuerzo | M |

---

#### UX-504 — La sheet para saltar contenido excede el viewport

| Campo | Contenido |
|---|---|
| ID | UX-504 |
| Ubicación | Workout · [WorkoutSkipSheet](../src/features/workout/workout-skip-sheet.tsx#L38) |
| Categoría | Responsive / Overlay |
| Qué pasa | En `390×400`, la sheet mide `510px`, termina en el borde inferior y comienza en `y=-110`. No tiene altura máxima ni scroll interno. |
| Por qué importa | Se pierden el encabezado, el cierre y parte de las primeras alternativas. Es una decisión importante que ocurre durante una sesión activa. |
| Propuesta | Aplicar el contrato ya usado por las otras sheets: `max-height` basada en `dvh`, `overflow-y-auto` y padding inferior con safe area. |
| Severidad | **Alto** |
| Esfuerzo | S |

[WorkoutAnnotationSheet](../src/features/workout/workout-annotation-sheet.tsx#L118) y [WorkoutOverviewSheet](../src/features/workout/workout-overview-sheet.tsx#L51) ya contienen el patrón correcto.

---

#### UX-505 — Crear rutina no resiste la apertura del teclado

| Campo | Contenido |
|---|---|
| ID | UX-505 |
| Ubicación | Crear rutina · [DialogoNuevaRutina](../src/features/routine-editor/new-routine-dialog.tsx#L61) |
| Categoría | Responsive / Teclado virtual |
| Qué pasa | El diálogo mide aproximadamente `508px`. En `390×400` ocupa desde `y=-54` hasta `454`, sin scroll. Además, el primer campo usa `autoFocus`, por lo que el teclado puede producir esta situación inmediatamente al abrirlo. |
| Por qué importa | El encabezado, algunos campos y las acciones pueden quedar inaccesibles justo en el flujo de creación. |
| Propuesta | Incorporar `max-h-[calc(100dvh-2rem)]`, `overflow-y-auto`, safe areas y mantener las acciones visibles. Evaluar si el autofocus sigue siendo conveniente en mobile. |
| Severidad | **Alto** |
| Esfuerzo | S |

El diálogo de Agenda en [SportsSchedule](../src/features/schedule/sports-schedule.tsx#L391) ya demuestra el comportamiento esperado.

---

#### UX-506 — Los selectores de fecha y hora salen del viewport corto

| Campo | Contenido |
|---|---|
| ID | UX-506 |
| Ubicación | Agenda · [ScheduleDatePicker](../src/features/schedule/schedule-controls.tsx#L128) y [ScheduleTimePicker](../src/features/schedule/schedule-controls.tsx#L212) |
| Categoría | Responsive / Overlay |
| Qué pasa | En `390×400`, el calendario termina en `y=435`; el selector de hora termina en `y=531`. Los popovers no limitan su altura respecto del viewport. |
| Por qué importa | Parte de las fechas u horas queda fuera de la pantalla en landscape o ventanas reducidas. El scroll del diálogo padre no resuelve correctamente un popover renderizado por encima. |
| Propuesta | Limitar cada popover a la altura disponible, habilitar scroll interno y permitir que el sistema cambie su posición arriba/abajo según el espacio real. |
| Severidad | **Medio** |
| Esfuerzo | M |

---

#### UX-507 — No se pueden eliminar ejercicios desde mobile

| Campo | Contenido |
|---|---|
| ID | UX-507 |
| Ubicación | Editor de rutina · [ExerciseRow](../src/features/routine-editor/exercise-row.tsx#L317) |
| Categoría | Responsive / Flujo |
| Qué pasa | La acción “Eliminar ejercicio” utiliza `hidden md:inline-flex`. Debajo de `768px` desaparece y no existe una alternativa mobile. |
| Por qué importa | El editor ofrece capacidades distintas según el dispositivo. Un coach o atleta puede crear y modificar un ejercicio en mobile, pero no corregir su creación eliminándolo. |
| Propuesta | Mostrar una acción mobile explícita o incorporarla en un menú contextual accesible. Mantener protección contra activaciones accidentales. |
| Severidad | **Alto** |
| Esfuerzo | S |

---

#### UX-508 — Muchas rutinas empujan el editor demasiado abajo

| Campo | Contenido |
|---|---|
| ID | UX-508 |
| Ubicación | Selector de rutinas · [SelectorRutina](../src/features/routine-editor/routine-selector.tsx#L24) |
| Categoría | Responsive / Escalabilidad |
| Qué pasa | Antes de `xl`, todas las rutinas se muestran en una grilla de dos columnas sin límite de altura, colapso ni scroll propio. El editor aparece después de la colección completa. |
| Por qué importa | Con diez o veinte rutinas, el usuario debe atravesar varias filas antes de llegar al contenido que seleccionó. El problema afecta especialmente a mobile y al viewport intermedio. |
| Propuesta | Usar un selector horizontal, un control desplegable o una lista colapsable antes del editor. Mantener el selector vertical completo en desktop ancho. |
| Severidad | **Medio** |
| Esfuerzo | M |

Los títulos extensos no generan overflow porque se truncan, pero el nombre completo no queda disponible directamente en touch dentro del selector.

---

#### UX-509 — El tramo intermedio conserva una composición mobile demasiado extendida

| Campo | Contenido |
|---|---|
| ID | UX-509 |
| Ubicación | Shell y superficies compartidas · [AppShell](../src/features/shell/app-shell.tsx#L212) |
| Categoría | Responsive |
| Qué pasa | Hasta `1024px`, RTTP mantiene header mobile y dock inferior. En `958px`, cards y recorridos de una columna se estiran casi a todo el ancho. Al llegar a `1024px`, aparecen simultáneamente sidebar y composiciones desktop. |
| Por qué importa | Tablet y ventanas intermedias no reciben una composición realmente adaptada: pasan de “mobile muy ancho” a “desktop comprimido”. En Agenda, el salto es de una vista diaria de aproximadamente `900px` a siete columnas dentro de `674px`. |
| Propuesta | Separar el breakpoint de navegación del breakpoint de contenido. La sidebar puede aparecer más tarde o compactada, mientras Agenda y los editores deciden su layout según ancho útil, no solo ancho total del viewport. |
| Severidad | **Medio** |
| Esfuerzo | M |

No hay overflow en este cambio; el problema es de aprovechamiento y densidad.

---

#### UX-510 — Agenda mantiene gestos y ayudas dependientes del dispositivo

| Campo | Contenido |
|---|---|
| ID | UX-510 |
| Ubicación | Agenda · [SportsSchedule](../src/features/schedule/sports-schedule.tsx#L921) |
| Categoría | Responsive / Interacción |
| Qué pasa | Los días vacíos permiten crear mediante doble click, pero la indicación permanece transparente hasta hover. En mobile también existe `onDoubleClick`, mientras que la acción “Hoy” se oculta por debajo de `sm`. |
| Por qué importa | Hover y doble click no son interacciones predecibles en touch. Hay acciones alternativas, pero la capacidad no se comunica de forma consistente entre dispositivos. |
| Propuesta | Tratar el doble click como atajo opcional. Mantener una affordance visible y accionable para programar sobre un día y conservar “Hoy” mediante una variante compacta en mobile. |
| Severidad | **Medio** |
| Esfuerzo | S |

---

#### UX-511 — Las safe areas laterales no están cubiertas de forma uniforme

| Campo | Contenido |
|---|---|
| ID | UX-511 |
| Ubicación | Layout general · [desktopPageShellClassName](../src/features/shared/page-shell.ts#L1), workout y overlays |
| Categoría | Responsive / Safe areas |
| Qué pasa | El proyecto usa `viewportFit: "cover"` y contempla safe areas en landing, header, dock y varias sheets. Sin embargo, las páginas comunes, el workout y algunos dialogs conservan padding lateral fijo. |
| Por qué importa | En dispositivos con notch o bordes curvos, especialmente en landscape, contenido y controles pueden quedar demasiado próximos o debajo del área física no disponible. |
| Propuesta | Centralizar un padding horizontal `max(espaciado, env(safe-area-inset-left/right))` y aplicarlo al shell, workout y overlays de borde a borde. |
| Severidad | **Medio** |
| Esfuerzo | S |

---

#### UX-512 — Guardar cambios no permanece disponible en ediciones largas

| Campo | Contenido |
|---|---|
| ID | UX-512 |
| Ubicación | Editor del coach · [CoachAthleteDetailView](../src/features/coach/coach-athlete-detail-view.tsx#L239) |
| Categoría | Responsive / Flujo |
| Qué pasa | Con un solo ejercicio expandido, el editor mobile alcanza aproximadamente `1.653px` de alto. “Guardar cambios” vive en el header de la card y desaparece durante casi toda la edición. |
| Por qué importa | El usuario puede terminar de editar sin encontrar inmediatamente cómo confirmar. Cuantas más rutinas, bloques o ejercicios existan, mayor es la distancia. |
| Propuesta | Incorporar una barra de guardado sticky dentro del editor cuando haya cambios pendientes, respetando el dock y el teclado virtual. |
| Severidad | **Alto** |
| Esfuerzo | M |

---

### Comportamientos que ya funcionan bien

- **Sin overflow horizontal:** las rutas principales de atleta, coach y preview mantienen `scrollWidth === clientWidth`.
- **Agenda adaptativa:** pasa de detalle diario en mobile a calendario semanal y sidebar en desktop.
- **Editor mobile:** campos de series, repeticiones, peso y descanso reordenan correctamente sin desbordarse.
- **Drag-and-drop multiplataforma:** [useRoutineEditor](../src/features/routine-editor/use-routine-editor.ts#L22) configura sensores de pointer, touch con demora y teclado.
- **Navegación inferior:** reserva espacio al final de las páginas y contempla safe area inferior.
- **Contenido largo:** nombres y emails extensos no generan overflow; se truncan de forma controlada en listados.
- **Sheets de aclaraciones y overview:** limitan altura, permiten scroll y contemplan safe area inferior.
- **Diálogo de Agenda:** maneja correctamente alturas pequeñas mediante `dvh` y scroll interno.
- **Vista previa del atleta:** no produce overflow en `390`, `958` ni `1440px`.
- **Light mode:** no modifica negativamente el reflow ni introduce overflow adicional.

#### Priorización sugerida

##### Bloqueante

1. UX-501 — Acceso en landscape.
2. UX-504 — Sheet de omisión.
3. UX-507 — Eliminación de ejercicios en mobile.

##### Alta prioridad

4. UX-503 — Workout landscape.
5. UX-505 — Crear rutina con teclado.
6. UX-502 — Jerarquía mobile de Home coach.
7. UX-512 — Guardado persistente del editor.

##### Ajuste responsive posterior

8. UX-506 — Popovers de Agenda.
9. UX-508 — Selector con muchas rutinas.
10. UX-509 — Breakpoints intermedios.
11. UX-510 — Gestos de Agenda.
12. UX-511 — Safe areas laterales.

**Estado:** Fase 5 completada sin modificar código. El worktree permanece limpio, la sesión de prueba quedó cerrada y el servidor local fue detenido. La siguiente etapa es la **FASE 6 — Accesibilidad**.

---

## Fase 6 — Accesibilidad

**Estado:** completada, sin modificar código ni contratos de datos.

### Resumen ejecutivo

RTTP tiene una base de accesibilidad mejor que la que su heterogeneidad visual
sugiere. La aplicación declara `lang="es-AR"`, mantiene un `main` único por
superficie, conserva jerarquías de encabezado razonables, nombra los controles
iconográficos principales y utiliza primitives de Base UI para dialogs, sheets,
popovers y calendario. Los overlays probados atrapan el foco y lo restauran al
trigger; el editor incorpora un sensor de teclado para drag-and-drop; las
acciones por gesto tienen alternativas visibles; y las rutas principales
refluyen sin scroll horizontal incluso a 320 px.

La deuda crítica está en la capa que conecta ese HTML con el estado visual. La
interfaz comunica selección, progreso, foco y confirmación de forma clara para
quien ve la pantalla, pero no siempre lo hace de forma programática. A eso se
suman el contraste crítico de light mode, inputs sin indicador de foco, un
countdown anunciado cada segundo y ausencia total de reduced motion.

La Fase 6 formaliza **15 hallazgos**:

- 1 crítico;
- 6 altos;
- 8 medios;
- ningún bajo.

No constituye una certificación WCAG ni reemplaza pruebas con personas usuarias.
Es una auditoría heurística y técnica orientada a WCAG 2.2 AA sobre la versión
actual del producto.

---

### 1. Método y cobertura

Se combinaron cuatro fuentes de evidencia:

1. **Revisión estática:** landmarks, encabezados, nombres, labels, estados ARIA,
   regiones vivas, foco, drag-and-drop y movimiento en `src/`.
2. **Navegación real por teclado:** tabulación, activación, Escape, focus trap,
   restauración del foco y DnD con `Space`/`Escape`.
3. **Inspección del árbol accesible:** rutas de atleta y coach, workout,
   dialogs, sheets, editor, Agenda y preview.
4. **Validación visual y computada:** temas dark/light, `320`, `390`, `958` y
   `1440px`, más viewports bajos y landscape ya cubiertos en las Fases 1 y 5.

Flujos recorridos:

- acceso correcto e inválido;
- Home, Rutinas, Agenda, Historial y Perfil del atleta;
- inicio y cancelación de workout;
- diálogo y sheet con foco atrapado;
- Home, directorio, detalle, editor, Agenda, Plantillas y preview del coach;
- error por atleta duplicado;
- navegación con cambios sin guardar;
- reordenamiento de ejercicios con teclado.

---

### 2. Qué ya funciona bien

- [RootLayout](../src/app/layout.tsx#L49) declara `lang="es-AR"` y viewport
  compatible con safe areas.
- Las rutas principales inspeccionadas tienen un único `main`, un `h1` visible
  y no presentan IDs duplicados ni `tabindex` positivos.
- No se encontraron controles visibles sin nombre accesible en las rutas
  principales de atleta o coach.
- Los iconos decorativos de Lucide no reemplazan el nombre de las acciones:
  salir, cancelar, editar, eliminar, ajustar repeticiones y peso, abrir
  overview y cambiar tema tienen nombre.
- [Dialog](../src/components/ui/dialog.tsx#L26) y
  [Sheet](../src/components/ui/sheet.tsx#L37) exponen `role="dialog"`, título y
  descripción; en las pruebas mantuvieron el foco dentro del overlay y lo
  devolvieron al trigger.
- Las confirmaciones destructivas enfocan primero la acción segura. Al cancelar
  un workout, por ejemplo, el foco inicial quedó en “Seguir entrenando”.
- El calendario basado en React DayPicker expone grid, días seleccionados y
  navegación de mes.
- La navegación mobile sí marca la ruta activa con `aria-current="page"` en
  [AppShell](../src/features/shell/app-shell.tsx#L331).
- Los acordeones del historial comunican su expansión con `aria-expanded`.
- El editor expone grupos y nombres específicos para tipo de repeticiones,
  unidad de descanso y acciones por ejercicio.
- [useRoutineEditor](../src/features/routine-editor/use-routine-editor.ts#L22)
  incorpora `KeyboardSensor`; un ejercicio pudo levantarse y cancelarse sin
  mouse, manteniendo el foco en el handle.
- Agenda ofrece botones de programación y edición como alternativa al drag,
  drop y doble click.
- Las rutas principales de ambos roles no generaron overflow horizontal a
  `320px`.
- Los errores globales y de formularios usan `role="alert"`.
- La creación de plantillas usa `role="status"` para anunciar el éxito.

---

### 3. Hallazgos

#### A11Y-001 — El CTA principal del workout es ilegible en light mode

| Campo | Contenido |
|---|---|
| ID | A11Y-001 |
| Ubicación | Workout · [WorkoutMode](../src/features/workout/workout-mode.tsx#L899), tokens de [globals.css](../src/app/globals.css#L138) |
| Categoría | A11y / Contraste |
| Qué pasa | “Completar serie” combina `bg-indigo-50` y `text-indigo-950`, pero light mode redefine ambos colores hacia tonos oscuros. La medición inicial fue aproximadamente `1.17:1`; la verificación final, con composición del fondo en producción, dio `1.41:1`. |
| Por qué importa | Es la acción primaria del flujo principal y queda muy por debajo de `4.5:1` para texto normal. Usuarios con baja visión o bajo contraste ambiental pueden no leerla. Incumple WCAG 1.4.3. |
| Propuesta | Reemplazar colores físicos por `primary`/`primary-foreground`, fijar pares validados por tema y agregar pruebas automáticas de contraste para CTAs críticos. |
| Severidad | **Crítico** |
| Esfuerzo | S |

---

#### A11Y-002 — Texto secundario y navegación fallan contraste en ambos temas

| Campo | Contenido |
|---|---|
| ID | A11Y-002 |
| Ubicación | Sistema visual transversal · [globals.css](../src/app/globals.css#L55), [AppShell](../src/features/shell/app-shell.tsx#L124), Home y workout |
| Categoría | A11y / Contraste |
| Qué pasa | La auditoría computada encontró ratios de `1.94:1` a `3.88:1` en rol del sidebar, navegación inactiva, descripciones, labels y acciones secundarias. También existen textos de 8–11 px con opacidades bajas. |
| Por qué importa | La jerarquía se construye reduciendo opacidad hasta volver ilegible información necesaria. La falla afecta light y dark mode y no se limita a contenido decorativo. Incumple WCAG 1.4.3. |
| Propuesta | Consolidar `foreground`, `foreground-secondary` y `muted-foreground` con mínimos de `4.5:1`; reservar opacidades bajas para decoración y validar ambas paletas en CI visual. |
| Severidad | **Alto** |
| Esfuerzo | M |

---

#### A11Y-003 — Campos críticos eliminan todo indicador de foco visible

| Campo | Contenido |
|---|---|
| ID | A11Y-003 |
| Ubicación | Workout · [CampoPrescripcion](../src/features/workout/prescription-field.tsx#L83); editor · [ExerciseRow](../src/features/routine-editor/exercise-row.tsx#L78) |
| Categoría | A11y / Teclado / Foco |
| Qué pasa | Los inputs de repeticiones, peso, nombre, aclaraciones y descanso usan `focus-visible:ring-0`; varios también tienen borde de `0px` y fondo transparente. En ejecución, `:focus-visible` fue verdadero pero outline, ring y borde efectivo permanecieron invisibles. |
| Por qué importa | El usuario puede tabular y editar, pero no sabe qué campo tiene el foco. En workout puede modificar una carga equivocada; en el editor puede escribir sobre otro dato. Incumple WCAG 2.4.7 y 2.4.11. |
| Propuesta | Aplicar un `focus-within` visible al contenedor o restaurar ring/borde de al menos 2 px y contraste 3:1 sin alterar la densidad del layout. |
| Severidad | **Alto** |
| Esfuerzo | S |

---

#### A11Y-004 — La barra de progreso se anuncia con el nombre “x”

| Campo | Contenido |
|---|---|
| ID | A11Y-004 |
| Ubicación | Workout · [Progress](../src/features/workout/workout-mode.tsx#L581), primitive [progress.tsx](../src/components/ui/progress.tsx#L7) |
| Categoría | A11y / Semántica |
| Qué pasa | El DOM expone `role="progressbar"`, valor y porcentaje, pero no recibe label ni `aria-labelledby`. Base UI termina aportando el nombre accesible “x”, sin significado para el usuario. |
| Por qué importa | Quien usa lector de pantalla escucha un progreso correctamente tipado pero no sabe qué está progresando. Incumple WCAG 4.1.2. |
| Propuesta | Nombrar el control como “Progreso de la rutina” y conservar `aria-valuenow`/`aria-valuetext`; no mostrar un label visual adicional si no aporta a la jerarquía. |
| Severidad | **Alto** |
| Esfuerzo | S |

---

#### A11Y-005 — Los selectores propios no comunican qué opción está activa

| Campo | Contenido |
|---|---|
| ID | A11Y-005 |
| Ubicación | Filtros de [AthleteHome](../src/features/athlete/athlete-home.tsx#L175) y [ActivityHistory](../src/components/activity-history.tsx#L563); tabs de [CoachAthleteDetailView](../src/features/coach/coach-athlete-detail-view.tsx#L162); [SelectorRutina](../src/features/routine-editor/routine-selector.tsx#L22); tipo y finalización de [Agenda](../src/features/schedule/sports-schedule.tsx#L208) |
| Categoría | A11y / Semántica |
| Qué pasa | “Todas/Mías/Coach”, “Rutinas/Agenda/Actividades”, rutina activa, “Rutina RTTP/Actividad externa” y otros grupos se renderizan como botones comunes. La selección existe solo en clases de color; no hay `aria-pressed`, `aria-selected`, `aria-current` ni patrón `tablist`. |
| Por qué importa | Un lector de pantalla puede activar las opciones, pero no identificar cuál está seleccionada ni comprender el contrato del grupo. También se pierde la navegación con flechas esperada en tabs. Incumple WCAG 1.3.1 y 4.1.2. |
| Propuesta | Usar el primitive `Tabs` cuando cambia un panel; usar grupos de botones con `aria-pressed` para filtros y toggles; asociar nombre de grupo e implementar foco por flechas donde corresponda. |
| Severidad | **Alto** |
| Esfuerzo | M |

---

#### A11Y-006 — La navegación desktop no expone la ruta actual

| Campo | Contenido |
|---|---|
| ID | A11Y-006 |
| Ubicación | Navegación desktop · [AppShell](../src/features/shell/app-shell.tsx#L124) |
| Categoría | A11y / Navegación |
| Qué pasa | La opción activa cambia de fondo y color, pero los botones desktop no reciben `aria-current`. La navegación mobile sí lo implementa. |
| Por qué importa | Un usuario de lector de pantalla no obtiene el mismo contexto de ubicación que un usuario visual. Incumple WCAG 1.3.1 y debilita 2.4.8. |
| Propuesta | Reutilizar en desktop la misma asignación `aria-current="page"` de mobile; si la navegación continúa usando botones, conservar nombre y destino coherentes. |
| Severidad | **Medio** |
| Esfuerzo | S |

---

#### A11Y-007 — El descanso puede anunciarse una vez por segundo

| Campo | Contenido |
|---|---|
| ID | A11Y-007 |
| Ubicación | Workout · [contador de descanso](../src/features/workout/workout-mode.tsx#L823) |
| Categoría | A11y / Contenido dinámico |
| Qué pasa | Todo el countdown tiene `role="timer"` y `aria-live="polite"`. Como el contenido cambia cada segundo, un lector puede encolar anuncios continuos mientras el usuario intenta operar Pausar, Reanudar o Terminar descanso. |
| Por qué importa | El feedback útil se convierte en interrupción sostenida durante la tarea principal y puede ocultar otros anuncios. |
| Propuesta | Mantener el valor consultable sin live region; anunciar solo hitos relevantes y “Descanso terminado” en una región `status` separada. |
| Severidad | **Alto** |
| Esfuerzo | S |

---

#### A11Y-008 — Las confirmaciones de guardado no se anuncian

| Campo | Contenido |
|---|---|
| ID | A11Y-008 |
| Ubicación | Editor del atleta · [AthleteRoutineEditor](../src/features/athlete/athlete-routine-editor.tsx#L101); editor del coach · [CoachAthleteDetailView](../src/features/coach/coach-athlete-detail-view.tsx#L269) |
| Categoría | A11y / Feedback |
| Qué pasa | “Cambios guardados” aparece visualmente durante un intervalo corto, pero es un `div` sin `role="status"` ni `aria-live`. La creación de plantillas sí usa el patrón correcto. |
| Por qué importa | Un usuario que no ve la actualización no recibe confirmación de que terminó la acción. Incumple WCAG 4.1.3. |
| Propuesta | Reutilizar una región de estado persistente y anunciar transiciones reales: Sin guardar, Guardando, Sincronizado, Pendiente o Error. |
| Severidad | **Medio** |
| Esfuerzo | S |

---

#### A11Y-009 — Los errores no están asociados al campo que los originó

| Campo | Contenido |
|---|---|
| ID | A11Y-009 |
| Ubicación | Acceso · [LandingAcceso](../src/features/landing/access-landing.tsx#L90); alta de atleta · [DialogoNuevoAtleta](../src/features/routine-editor/new-athlete-dialog.tsx#L86) |
| Categoría | A11y / Formularios |
| Qué pasa | Los errores usan `role="alert"` y el email recibe `aria-invalid`, pero el mensaje no tiene ID ni se enlaza con `aria-describedby` o `aria-errormessage`. El foco permanece en el submit. |
| Por qué importa | El error se anuncia al aparecer, pero al volver al campo no puede consultarse su explicación ni su relación programática. Incumple WCAG 3.3.1 y debilita 1.3.1. |
| Propuesta | Dar un ID estable al mensaje, enlazarlo desde el input y llevar el foco al primer campo inválido cuando corresponda. |
| Severidad | **Medio** |
| Esfuerzo | S |

---

#### A11Y-010 — El drag-and-drop habla en inglés y expone IDs internos

| Campo | Contenido |
|---|---|
| ID | A11Y-010 |
| Ubicación | Editor de rutinas · [useRoutineEditor](../src/features/routine-editor/use-routine-editor.ts#L22), [ExerciseRow](../src/features/routine-editor/exercise-row.tsx#L48) |
| Categoría | A11y / Teclado / Copy |
| Qué pasa | El sensor de teclado funciona, pero las instrucciones dicen “To pick up a draggable item…” y los anuncios incluyen IDs como `papapapa-1788920698728`. |
| Por qué importa | La única guía auditiva para reordenar cambia de idioma y describe implementación en lugar de posición o destino. La operación existe, pero no resulta comprensible ni verificable. |
| Propuesta | Configurar instrucciones y announcements de DndKit en español, usando nombre del ejercicio, bloque y posición humana. |
| Severidad | **Medio** |
| Esfuerzo | M |

---

#### A11Y-011 — No existe un mecanismo para saltar la navegación repetida

| Campo | Contenido |
|---|---|
| ID | A11Y-011 |
| Ubicación | Shell desktop · [AppShell](../src/features/shell/app-shell.tsx#L124) |
| Categoría | A11y / Navegación / Foco |
| Qué pasa | En desktop hay ocho controles de shell antes de la primera acción del contenido y no existe “Saltar al contenido”. El `main` tampoco tiene un destino enfocable. |
| Por qué importa | Cada cambio de pantalla obliga a recorrer navegación, tema y sesión antes de operar la vista. Incumple WCAG 2.4.1. |
| Propuesta | Agregar un skip link visible al foco y un `id`/`tabIndex={-1}` estable en `main`; conservar el foco de página al navegar. |
| Severidad | **Medio** |
| Esfuerzo | S |

---

#### A11Y-012 — El esfuerzo final depende del color y no expone selección

| Campo | Contenido |
|---|---|
| ID | A11Y-012 |
| Ubicación | Cierre del workout · [RutinaCompletada](../src/features/workout/completed-routine.tsx#L50) |
| Categoría | A11y / Semántica / Color |
| Qué pasa | Los cinco botones tienen nombres como “Esfuerzo 4 de 5”, pero no existe `radiogroup`, `radio`, `aria-checked` ni `aria-pressed`. El valor inicial `4` y el seleccionado se distinguen solo mediante color y relleno de llamas. |
| Por qué importa | El lector puede encontrar cinco acciones, pero no saber cuál representa la respuesta actual. Una persona con dificultad para distinguir color tampoco obtiene una señal textual. Incumple WCAG 1.4.1 y 4.1.2. |
| Propuesta | Implementar un radiogroup con label persistente “Esfuerzo percibido”, `aria-checked` y una confirmación textual del valor; revisar además si preseleccionar 4 es una decisión de producto deseada. |
| Severidad | **Alto** |
| Esfuerzo | S |

---

#### A11Y-013 — El feedback final depende de un placeholder

| Campo | Contenido |
|---|---|
| ID | A11Y-013 |
| Ubicación | Cierre del workout · [RutinaCompletada](../src/features/workout/completed-routine.tsx#L72) |
| Categoría | A11y / Formularios |
| Qué pasa | El textarea usa “¿Querés contarle algo a tu entrenador?” como placeholder, sin label visible ni nombre programático explícito. El texto desaparece al escribir. |
| Por qué importa | Después de ingresar contenido ya no queda una instrucción persistente que explique el propósito del campo. Debilita WCAG 3.3.2 y la comprensión para usuarios con dificultades cognitivas. |
| Propuesta | Agregar un label breve y persistente, por ejemplo “Comentario para tu entrenador”, manteniendo el placeholder solo como ejemplo. |
| Severidad | **Medio** |
| Esfuerzo | S |

---

#### A11Y-014 — Algunos disclosures no exponen su estado

| Campo | Contenido |
|---|---|
| ID | A11Y-014 |
| Ubicación | Bloques del editor · [SectionEditor](../src/features/routine-editor/section-editor.tsx#L57) |
| Categoría | A11y / Semántica |
| Qué pasa | El encabezado de bloque abre y cierra su contenido, y rota un chevron, pero no declara `aria-expanded` ni enlaza el panel con `aria-controls`. |
| Por qué importa | El control se anuncia como botón sin indicar si el bloque está abierto ni qué región controla. Incumple WCAG 4.1.2. |
| Propuesta | Añadir `aria-expanded`, `aria-controls` e ID estable del panel; mantener el mismo patrón que los acordeones del historial. |
| Severidad | **Medio** |
| Esfuerzo | S |

---

#### A11Y-015 — El producto ignora la preferencia de movimiento reducido

| Campo | Contenido |
|---|---|
| ID | A11Y-015 |
| Ubicación | Sistema transversal · [globals.css](../src/app/globals.css#L1), [Dialog](../src/components/ui/dialog.tsx#L26), [Sheet](../src/components/ui/sheet.tsx#L37), [Popover](../src/components/ui/popover.tsx#L21) |
| Categoría | A11y / Movimiento |
| Qué pasa | No existe `prefers-reduced-motion`, `motion-reduce` ni configuración equivalente. Con la preferencia `reduce`, el CTA del workout conservó `0.15s` y la sheet `0.2s`, además de animaciones de entrada, salida, escala y slide. |
| Por qué importa | El sistema operativo expresa una necesidad que el producto ignora. Transiciones de escala y desplazamiento pueden generar malestar y no son necesarias para entender el estado. Incumple WCAG 2.3.3 como criterio AAA y, sobre todo, la regla de accesibilidad por defecto definida para RTTP. |
| Propuesta | Crear una política global que reduzca o elimine transformaciones y desplazamientos, conserve cambios de opacidad breves y desactive animaciones decorativas. |
| Severidad | **Medio** |
| Esfuerzo | M |

---

### 4. Reflow, zoom y viewports bajos

La validación a `320px` no encontró overflow horizontal en Home, Rutinas,
Agenda, Historial o Perfil del atleta, ni en Resumen, Atletas, Plantillas o
detalle del coach. Esto constituye una base positiva para WCAG 1.4.10.

Sin embargo, reflow no significa que todo el contenido sea alcanzable. Los
hallazgos UX-501, UX-503, UX-504 y UX-505 de la Fase 5 siguen siendo riesgos de
accesibilidad altos: en viewports bajos o landscape, `overflow-hidden`,
centrado vertical y overlays sin scroll pueden ocultar inputs o acciones. Deben
corregirse en la misma ola que contraste y foco, aunque no se dupliquen como
nuevos IDs A11Y.

---

### 5. Priorización de accesibilidad

#### Bloqueante

1. A11Y-001 — Contraste del CTA principal en light mode.

#### Alta prioridad

2. A11Y-003 — Foco invisible en campos críticos.
3. A11Y-004 — Nombre incorrecto de la barra de progreso.
4. A11Y-005 — Selectores sin estado programático.
5. A11Y-007 — Countdown anunciado cada segundo.
6. A11Y-012 — Esfuerzo final sin selección accesible.
7. A11Y-002 — Contraste transversal de texto secundario.

#### Corrección posterior

8. A11Y-006 — Ruta desktop sin `aria-current`.
9. A11Y-008 — Guardado sin región de estado.
10. A11Y-009 — Errores no asociados a inputs.
11. A11Y-010 — DnD sin localización ni anuncios humanos.
12. A11Y-011 — Ausencia de skip link.
13. A11Y-013 — Feedback final sin label persistente.
14. A11Y-014 — Bloques sin estado expandido.
15. A11Y-015 — Sin reduced motion.

---

## Plan de implementación por olas

La auditoría no aprueba todavía la implementación. Si se autoriza, el orden
recomendado es el siguiente.

### Ola 1 — Tokens y unificación visual

**Objetivo:** corregir la base transversal con alto impacto y bajo riesgo de
lógica.

- Reemplazar colores físicos por roles semánticos.
- Corregir contraste AA en ambos temas, empezando por workout, navegación,
  labels y acciones.
- Unificar estados de foco en buttons, inputs, selects y controles compuestos.
- Adoptar primitives canónicos para tabs, toggles, cards, badges y feedback.
- Añadir `prefers-reduced-motion`.
- Elevar targets táctiles sin cambiar comportamiento.

**Gate de salida:** contraste AA medido, foco visible por teclado en todas las
superficies críticas, light/dark sin regresiones y tests visuales en `390`,
`958` y `1440px`.

#### Resultado de implementación de la Ola 1

La Ola 1 se implementó sobre la base visual y accesible sin modificar lógica de
negocio, navegación conceptual ni contratos de datos.

Cambios sistémicos aplicados:

- se incorporaron roles de color para contenido primario, secundario, atenuado,
  éxito, advertencia e información en ambos temas;
- el CTA principal del workout ahora usa el par validado
  `primary`/`primary-foreground`;
- los textos de 8–11 px se normalizan a un mínimo efectivo de 12 px y se eliminó
  el escalado implícito del tamaño raíz por breakpoint;
- se reemplazaron textos activos con opacidades de 20–45% por
  `content-muted`;
- botones, inputs, selects y campos compuestos comparten foco visible;
- los targets interactivos alcanzan 44×44 px cuando el dispositivo informa un
  puntero táctil;
- se agregaron tokens de duración y easing, se eliminaron los
  `transition-all` y se incorporó una política global de movimiento reducido;
- `Card`, `Badge` y `Select` disponen de variantes o contratos canónicos para
  las nuevas migraciones.

| Hallazgo | Resultado | Evidencia y alcance |
|---|---|---|
| UX-001 / A11Y-001 | Resuelto | “Completar serie” usa tokens de acción y supera AA en light y dark. |
| UX-002 / A11Y-002 | Resuelto en superficies auditadas | Home, navegación, editor, Agenda y workout usan roles semánticos; el barrido computado no encontró texto activo bajo AA en las vistas verificadas. |
| UX-003 | Resuelto | El mínimo computado es 12 px en `390`, `958` y `1440px`. |
| UX-004 | Resuelto | El root permanece en 16 px; la escala ya no altera todos los componentes por breakpoint. |
| UX-005 | Parcial | La jerarquía de contenido y estados ya es semántica. Se conservan colores físicos en gradientes, decoración y tratamientos de marca para no aplanar la identidad visual. |
| UX-006 | Resuelto | Controles nativos y compuestos reciben un mínimo de 44 px en punteros táctiles. |
| UX-007 / A11Y-003 | Resuelto | Los campos críticos de workout y editor muestran un ring visible y consistente. |
| UX-008 | Parcial | El primitive `Button` concentra foco, movimiento y estados; permanecen botones HTML de composición que no requieren una variante visual nueva. |
| UX-009 / A11Y-005 | Resuelto | Filtros y selectores exponen grupo y `aria-pressed`; los cambios de panel del coach comunican selección. |
| UX-010 | Parcial | Se creó y adoptó `Select`; la extracción de un wrapper `Field` único queda como refactor sin beneficio observable inmediato. |
| UX-011 | Resuelto en la base | `Card` ofrece `default`, `flat`, `raised` y `hero`; `Badge` ofrece estados `brand`, `success`, `warning` e `info`. La migración completa de superficies puede hacerse incrementalmente. |
| UX-012 | Diferido | La reducción total de radios y sombras requiere una pasada visual más amplia; no bloquea contraste, foco ni consistencia funcional de esta ola. |
| UX-013 / A11Y-015 | Resuelto | Todos los componentes respetan `prefers-reduced-motion`; la verificación computada devolvió `0.01ms`. |
| A11Y-004 | Resuelto | La barra expone “Progreso de la rutina”, valor actual y porcentaje. |
| A11Y-006 | Resuelto | Navegación desktop y mobile exponen `aria-current="page"`. |
| A11Y-007 | Resuelto | El contador dejó de ser live region; solo el final del descanso se anuncia como estado. |
| A11Y-008 | Resuelto para el feedback existente | “Guardado” y “Cambios guardados” se anuncian con `role="status"`. El contrato completo de sincronización continúa en Ola 3. |
| A11Y-009 | Resuelto | Los errores de email se asocian mediante `aria-describedby` y devuelven el foco al campo. |
| A11Y-010 | Resuelto | DnD anuncia en español el ejercicio y su posición humana, sin exponer IDs. |
| A11Y-011 | Resuelto | El shell incluye skip link y un destino enfocable en `main`. |
| A11Y-012 | Resuelto | El esfuerzo es un grupo de radios con selección textual y navegación por flechas. Se conserva el valor inicial existente para no cambiar producto. |
| A11Y-013 | Resuelto | El comentario final tiene label visible y persistente. |
| A11Y-014 | Resuelto | Los bloques exponen `aria-expanded`, `aria-controls` e ID estable del panel. |

Validación realizada:

- atleta: Home, Rutinas, ejecución y cierre de workout;
- coach: Resumen, Atletas, editor y Agenda;
- temas dark y light;
- anchos `390`, `958` y `1440px`, sin overflow horizontal;
- contraste computado de texto activo en las superficies críticas;
- foco visible en campos de prescripción y editor;
- semántica de filtros, tabs, selectores, progreso, estados y DnD;
- `prefers-reduced-motion: reduce`;
- lint, build de producción y `git diff --check`.

La validación automatizada no sustituye la prueba manual con VoiceOver y
NVDA. Esa verificación asistiva continúa siendo el gate final de la Ola 4.

### Ola 2 — Jerarquía de Home y navegación

**Objetivo:** hacer evidente dónde está el usuario y cuál es su siguiente
acción.

- Aplicar “Hoy en foco” a la Home del atleta.
- Reordenar Home del coach hacia continuidad y pendientes.
- Corregir nomenclatura: Historial, Plantillas y Previsualizar inicio.
- Dar rutas reales a Rutinas, Agenda y Actividades del atleta seleccionado.
- Exponer estado activo en navegación desktop y agregar skip link.
- Resolver el ingreso del coach sin atletas sin cambiar permisos ni modelo.

**Gate de salida:** primer uso y retorno resuelven su acción principal sin
desvíos; ubicación y navegación son comprensibles visualmente y con lector.

#### Resultado de implementación de la Ola 2

La Ola 2 se implementó sin modificar permisos, contratos de datos ni reglas de
negocio. La navegación conserva las rutas anteriores como alias y suma URLs
canónicas para cada contexto del atleta.

| Hallazgo | Estado | Evidencia |
|---|---|---|
| IA-001 | Resuelto | Home compacta el estado sin sesión y prioriza la próxima acción o entrenamiento futuro. |
| IA-002 | Resuelto | Sin rutinas, la acción primaria crea la primera; con rutinas, permite elegir una antes de ofrecer Agenda. |
| IA-003 | Resuelto | Una única sesión ocupa el hero; las demás se agrupan en “Más tarde hoy”. |
| IA-004 | Resuelto | Home conserva una semana compacta y elimina racha, comparación y leyenda permanente. |
| IA-005 | Resuelto | Navegación y título de la vista usan “Historial”. |
| IA-006 | Resuelto | Home del coach prioriza atención y continuidad; los conteos dejaron de encabezar la pantalla. |
| IA-007 | Resuelto | Un coach sin atletas permanece en el workspace y recibe el CTA “Agregar primer atleta”. |
| IA-008 | Resuelto | La biblioteca global se llama “Plantillas” y usa `/coach/templates`. |
| IA-009 | Resuelto | Rutinas, Agenda e Historial usan rutas propias y sobreviven reload, back y forward. |
| IA-010 | Resuelto | El directorio usa “Rutinas” para la entidad existente; “planificación” queda como nombre del trabajo del coach. |
| IA-011 | Resuelto | “Guardar como plantilla” vive en la rutina del atleta; la biblioteca ya no recibe una rutina fuente implícita. |
| IA-012 | Resuelto | La acción se llama “Previsualizar inicio” y la preview mantiene todas las acciones mutables inertes. |
| IA-013 | Resuelto | Historial se presenta como consulta y deriva explícitamente los cambios hacia Agenda. |
| IA-014 | Resuelto | El retorno a Atletas se combina con URL contextual y tabs que exponen su estado activo. |

Además, un workout en curso muestra `N de M series` y permite continuar
directamente desde Home, sin pasar por Rutinas.

Validación realizada:

- atleta: Home con workout en curso, continuidad directa e Historial;
- coach: Inicio, Plantillas, Rutinas, Agenda, Historial y preview de solo lectura;
- reload y navegación back/forward sobre las rutas contextuales;
- rutas canónicas `/coach/templates` y
  `/coach/athletes/:id/{routines,schedule,history}`;
- temas dark y light;
- anchos `390`, `958` y `1440px`, sin overflow horizontal;
- lint, build de producción y `git diff --check`.

Los estados determinísticos adicionales de Home —sin rutinas, actividad externa,
próximo entrenamiento y día completado— quedaron cubiertos por la misma regla
de prioridad documentada. No se agregó un motor de recomendaciones.

### Ola 3 — Flujos, estados faltantes y copy

**Objetivo:** eliminar pérdidas de trabajo, callejones sin salida y feedback
ambiguo.

- Corregir duplicación/creación de rutinas y persistencia prematura de drafts.
- Diseñar el contrato Sin guardar → Guardando → Sincronizado/Pendiente/Error.
- Evitar pérdida de mutaciones ante fallas de hidratación.
- Hacer persistente y alcanzable el guardado del editor.
- Corregir progressbar, timers, esfuerzo final, errors y regiones de estado.
- Resolver viewports bajos, sheets y dialogs recortados.
- Agregar Undo donde la acción sea reversible y confirmar solo destrucción.
- Completar loading, vacío, parcial, error, offline y datos extensos.

**Gate de salida:** los flujos críticos se completan, recuperan y reanudan sin
pérdida; cada resultado se comunica por más de un canal perceptivo.

### Ola 4 — Movimiento, pulido y accesibilidad fina

**Objetivo:** completar consistencia, percepción de velocidad y validación
asistiva.

- Localizar instrucciones y anuncios de DnD.
- Afinar motion con propósito y reduced motion.
- Sustituir spinners y saltos por skeletons cuando corresponda.
- Completar labels, descriptions, `aria-expanded`, `aria-controls` y estados
  de selección restantes.
- Validar VoiceOver/Safari, NVDA/Chrome y teclado sin lector.
- Realizar pruebas con usuarios con baja visión y usuarios de lector de
  pantalla.

**Gate de salida:** checklist WCAG 2.2 AA sin bloqueantes conocidos, recorridos
por rol documentados y regresión responsive completa.

---

### Cierre

Las seis fases solicitadas están completas y documentadas. La auditoría deja
una dirección clara: **primero estabilizar el lenguaje visual y los contratos
de estado; después simplificar jerarquía y navegación; luego corregir flujos;
y recién al final pulir movimiento y accesibilidad fina**.

No se implementó ningún cambio de producto durante esta fase. La sesión de
prueba quedó en `athlete@test.com`, tema oscuro, sin workout activo ni datos
temporales creados.
