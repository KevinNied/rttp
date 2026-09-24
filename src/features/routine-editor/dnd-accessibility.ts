import type {
  Announcements,
  ScreenReaderInstructions,
} from "@dnd-kit/core";

function exerciseLabel(data: Record<string, unknown> | undefined) {
  return typeof data?.label === "string" && data.label.trim()
    ? data.label
    : "el ejercicio";
}

function destinationLabel(data: Record<string, unknown> | undefined) {
  const sortable = data?.sortable;
  if (
    typeof sortable === "object" &&
    sortable !== null &&
    "index" in sortable &&
    typeof sortable.index === "number"
  ) {
    return `la posición ${sortable.index + 1}`;
  }

  return "la nueva posición";
}

export const routineDndAccessibility: {
  announcements: Announcements;
  screenReaderInstructions: ScreenReaderInstructions;
} = {
  screenReaderInstructions: {
    draggable:
      "Para levantar un ejercicio, presioná Espacio. Usá las flechas para moverlo. Presioná Espacio nuevamente para soltarlo o Escape para cancelar.",
  },
  announcements: {
    onDragStart({ active }) {
      return `Levantaste ${exerciseLabel(active.data.current)}.`;
    },
    onDragOver({ active, over }) {
      if (!over) return;
      return `${exerciseLabel(active.data.current)} está sobre ${destinationLabel(over.data.current)}.`;
    },
    onDragEnd({ active, over }) {
      if (!over) {
        return `No se pudo mover ${exerciseLabel(active.data.current)}.`;
      }
      return `Moviste ${exerciseLabel(active.data.current)} a ${destinationLabel(over.data.current)}.`;
    },
    onDragCancel({ active }) {
      return `Cancelaste el movimiento de ${exerciseLabel(active.data.current)}.`;
    },
  },
};
