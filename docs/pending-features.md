# Funcionalidades pendientes

Este documento funciona como backlog de ideas para futuras versiones de RTTP.
No representa trabajo comprometido ni un orden definitivo de implementación.

## Cómo mantener este backlog

- Agregar cada nueva idea como una sección independiente.
- Describir el problema antes que la solución.
- Registrar las decisiones de producto que todavía estén abiertas.
- Definir una primera versión acotada antes de comenzar el desarrollo.
- Mover la funcionalidad a su documentación específica cuando se implemente.

## Rutinas creadas por atletas

### Objetivo

Permitir que un atleta entrene sin depender obligatoriamente de un coach y pueda
combinar planes recibidos con rutinas propias.

### Alcance posible

- Crear, editar, duplicar y eliminar rutinas personales.
- Mantener separadas las rutinas asignadas por un coach y las creadas por el
  atleta.
- Duplicar una rutina del coach como una copia personal editable.
- Conservar la rutina original del coach sin modificaciones cuando el atleta
  personalice su copia.
- Permitir que un atleta siga usando sus rutinas personales aunque deje de
  tener un coach asignado.
- Identificar claramente el origen de cada rutina: coach, personal o copia.

### Primera versión sugerida

Agregar una sección **Mis rutinas** donde el atleta pueda crear una rutina desde
cero o duplicar una rutina asignada. Las copias deben ser independientes y no
modificar la planificación creada por el coach.

### Decisiones pendientes

- Si un coach puede ver o editar las rutinas personales de sus atletas.
- Si una rutina del coach debe copiarse o mantenerse vinculada a futuras
  actualizaciones.
- Si el atleta puede compartir una rutina personal con su coach.
- Qué sucede con una rutina asignada cuando termina la relación coach-atleta.
- Cómo se representa la propiedad y visibilidad de las rutinas en Supabase.

## Progreso por ejercicio

### Objetivo

Mostrar la evolución de un atleta en un ejercicio a través del tiempo para que
pueda entender su progreso y el coach pueda ajustar cargas.

### Alcance posible

- Gráfico de peso utilizado por fecha.
- Seguimiento de repeticiones y series completadas.
- Volumen total por sesión: peso por repeticiones.
- Mejor marca y evolución de una repetición máxima estimada.
- Filtros por período y comparación entre sesiones.
- Acceso desde el historial, el detalle de una rutina o una futura biblioteca
  de ejercicios.

### Primera versión sugerida

Desde el detalle de un ejercicio, mostrar un gráfico lineal con el mayor peso
registrado por sesión, acompañado por la última marca, la mejor marca y la
variación del período seleccionado.

### Decisiones pendientes

- Cómo identificar el mismo ejercicio entre rutinas distintas sin depender
  únicamente de su nombre.
- Qué métrica debe ser la principal: peso máximo, volumen o repetición máxima
  estimada.
- Cómo representar ejercicios sin peso o con cargas no convencionales.
- Si los registros omitidos o incompletos participan de las métricas.
- Qué períodos y comparaciones deben estar disponibles en la primera versión.
