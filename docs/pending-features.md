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

Convertir RTTP en una plataforma de entrenamiento personal donde toda cuenta
pueda crear, programar y ejecutar sus propias rutinas. Tener coach pasa a ser una
relación opcional y ser coach, una capacidad adicional.

La definición completa del nuevo modelo de identidad, relaciones, propiedad,
permisos, navegación, migración y primera versión está documentada en
[`entrenamiento-autogestionado.md`](entrenamiento-autogestionado.md).

### Decisiones base

- Toda cuenta tiene un espacio personal de entrenamiento.
- La capacidad de coaching no reemplaza la experiencia personal.
- Las rutinas personales son administradas por su creador.
- Las rutinas asignadas son administradas por el coach y de solo lectura para el
  atleta.
- Una asignación puede duplicarse como copia personal independiente.
- La relación de coaching es una entidad opcional, revocable y preparada para
  múltiples coaches.
- Agenda, historial y progreso pertenecen a quien realiza el entrenamiento.

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
