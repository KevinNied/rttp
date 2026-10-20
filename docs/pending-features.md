# Funcionalidades pendientes

Este documento funciona como backlog de ideas para futuras versiones de RTTP.
No representa trabajo comprometido ni un orden definitivo de implementación.

## Cómo mantener este backlog

- Agregar cada nueva idea como una sección independiente.
- Describir el problema antes que la solución.
- Registrar las decisiones de producto que todavía estén abiertas.
- Definir una primera versión acotada antes de comenzar el desarrollo.
- Mover la funcionalidad a su documentación específica cuando se implemente.

## Progreso por ejercicio

El alcance de la primera versión y su arquitectura base están aprobados.
La revisión del 30 de septiembre de 2026 identificó precisiones pendientes al
contrastarlos con el codebase: significado de cargas, validez histórica,
confirmación de resultados, creación compartida desde borradores, alias,
métricas, consultas y sincronización.

El contrato, la evidencia técnica, las decisiones pendientes, el plan de
entregas para agentes y la matriz de validación viven en
[exercise-progress.md](./exercise-progress.md). Ese documento es el punto de
entrada para retomar; las recomendaciones nuevas no implican aprobación.

Antes de implementar hay que cerrar esas precisiones y actualizar y aprobar
[exercise-catalog-classification.csv](./exercise-catalog-classification.csv):
sus 89 filas guardadas siguen pendientes y no representan un inventario nuevo
de producción. No se implementó código ni se aplicó una migración de esta
feature.

### Evoluciones posteriores

- Seguimiento por tiempo y distancia.
- Objetivos, hitos y alertas por ejercicio.
- Recomendaciones automáticas de carga.
- Administración global para archivar, corregir, fusionar o separar
  definiciones.
- Edición manual de marcas con auditoría.
- Insights avanzados para coaches.
- Comparación entre atletas.

## Perfilado de PostgreSQL

La optimización de carga inicial, recursos y armado del historial no reemplaza
el análisis de consultas dentro de la base. El usuario aprobó publicar esas
mejoras medidas y retomar el perfilado SQL por separado.

- Hace falta acceso de solo lectura a planes y estadísticas: el acceso actual
  por PostgREST rechaza `EXPLAIN` con `PGRST107`.
- Medir consultas representativas y volumen de filas antes de proponer índices
  o cambios de consulta. La latencia HTTP no equivale al tiempo de ejecución SQL.
- La hidratación actual lee tablas por lotes; no hace una consulta por actividad
  para obtener sus series. No se confirmó un N+1 SQL en ese flujo.
- No se modificaron índices ni esquema como parte de la optimización.
