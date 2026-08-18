export type Role = "coach" | "athlete";

export type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
  athleteIds?: number[];
};

export type Exercise = {
  id: string;
  name: string;
  instructions: string;
  sets: number;
  minReps: number;
  maxReps: number;
  weight: number;
  restSeconds: number | null;
};

export type BlockType =
  | "consecutive-sets"
  | "preparation"
  | "specific-preparation"
  | "alternating"
  | "cooldown"
  | "circuit-2-rounds"
  | "custom";

export type Block = {
  id: string;
  name: string;
  type: BlockType;
  exercises: Exercise[];
};

export type Routine = {
  id: string;
  athleteId: number;
  title: string;
  objective: string;
  durationMinutes: number | null;
  blocks: Block[];
};

type ExerciseData = {
  id: string;
  name: string;
  sets: number;
  reps: number | [number, number];
  weight?: number;
  instructions?: string;
  restSeconds?: number | null;
};

function exercise({
  id,
  name,
  sets,
  reps,
  weight = 0,
  instructions = "",
  restSeconds = null,
}: ExerciseData): Exercise {
  const [minReps, maxReps] = Array.isArray(reps)
    ? reps
    : [reps, reps];

  return {
    id,
    name,
    sets,
    minReps,
    maxReps,
    weight,
    instructions,
    restSeconds,
  };
}

function individualBlock(
  id: string,
  name: string,
  item: Exercise,
): Block {
  return { id, name, type: "consecutive-sets", exercises: [item] };
}

export const initialUsers: User[] = [
  {
    id: 1,
    name: "Kevin",
    email: "lakeja1105@gmail.com",
    role: "athlete",
  },
  {
    id: 2,
    name: "Milton",
    email: "milton.niedfeld@gmail.com",
    role: "coach",
    athleteIds: [1, 3],
  },
  {
    id: 3,
    name: "Nacho",
    email: "nacho@gmail.com",
    role: "athlete",
  },
  {
    id: 4,
    name: "Coach Test",
    email: "testcoach@gmail.com",
    role: "coach",
    athleteIds: [5],
  },
  {
    id: 5,
    name: "User Test",
    email: "testuser@gmail.com",
    role: "athlete",
  },
];

const kevinRoutines: Routine[] = [
  {
    id: "kevin-dia-1",
    athleteId: 1,
    title: "Fuerza de tren inferior",
    objective: "Glúteos, cuádriceps e isquiotibiales",
    durationMinutes: 65,
    blocks: [
      {
        id: "k-d1-entrada",
        name: "Entrada en calor",
        type: "preparation",
        exercises: [
          exercise({
            id: "k-d1-bici",
            name: "Bici",
            sets: 1,
            reps: 10,
            instructions: "Minutos",
          }),
          exercise({
            id: "k-d1-plancha",
            name: "Plancha baja, lateral y lateral",
            sets: 1,
            reps: 20,
            instructions: "Segundos · Con disco",
          }),
          exercise({
            id: "k-d1-puente",
            name: "Puente de glúteo isométrico",
            sets: 1,
            reps: 30,
            weight: 20,
          }),
          exercise({
            id: "k-d1-banda",
            name: "Caminata lateral con banda",
            sets: 1,
            reps: 4,
            instructions: "Cada lado · Con banda",
          }),
        ],
      },
      {
        id: "k-d1-activacion",
        name: "Activación",
        type: "specific-preparation",
        exercises: [
          exercise({
            id: "k-d1-polea",
            name: "Polea para cuádriceps e isquios",
            sets: 3,
            reps: 10,
            instructions: "Combinado",
          }),
        ],
      },
      {
        id: "k-d1-bloque-1",
        name: "Bloque 1",
        type: "alternating",
        exercises: [
          exercise({
            id: "k-d1-hip",
            name: "Hip thrust",
            sets: 3,
            reps: 10,
            instructions: "Con barra",
          }),
          exercise({
            id: "k-d1-estocadas",
            name: "Estocadas",
            sets: 3,
            reps: 10,
            instructions: "Con disco",
          }),
        ],
      },
      {
        id: "k-d1-bloque-2",
        name: "Bloque 2",
        type: "alternating",
        exercises: [
          exercise({
            id: "k-d1-prensa",
            name: "Prensa",
            sets: 3,
            reps: 10,
            instructions: "A dos piernas · Peso a elección",
          }),
          exercise({
            id: "k-d1-sillon",
            name: "Sillón de cuádriceps",
            sets: 3,
            reps: 10,
            instructions: "A una pierna · Peso a elección",
          }),
        ],
      },
      {
        id: "k-d1-bloque-3",
        name: "Bloque 3",
        type: "alternating",
        exercises: [
          exercise({
            id: "k-d1-sentadilla",
            name: "Sentadilla 3 tiempos",
            sets: 3,
            reps: 20,
            weight: 20,
            instructions: "Segundos",
          }),
          exercise({
            id: "k-d1-gluteos-polea",
            name: "Glúteos en polea",
            sets: 3,
            reps: 10,
            weight: 40,
          }),
        ],
      },
      {
        id: "k-d1-final",
        name: "Finalizador",
        type: "cooldown",
        exercises: [
          exercise({
            id: "k-d1-caminata-isquios",
            name: "Caminata de isquiotibiales y sóleos de búlgara",
            sets: 3,
            reps: 8,
            instructions: "Sin peso",
          }),
        ],
      },
    ],
  },
  {
    id: "kevin-dia-2",
    athleteId: 1,
    title: "Fuerza unilateral",
    objective: "Control, estabilidad y fuerza de piernas",
    durationMinutes: 68,
    blocks: [
      {
        id: "k-d2-entrada",
        name: "Entrada en calor",
        type: "preparation",
        exercises: [
          exercise({
            id: "k-d2-bici",
            name: "Bici",
            sets: 1,
            reps: 10,
            instructions: "Minutos",
          }),
          exercise({
            id: "k-d2-abdominales",
            name: "Abdominales bicicleta",
            sets: 3,
            reps: 50,
            instructions: "Sin peso",
          }),
          exercise({
            id: "k-d2-isometrica",
            name: "Sentadilla isométrica",
            sets: 3,
            reps: 30,
            weight: 20,
            instructions: "Segundos",
          }),
          exercise({
            id: "k-d2-granjero",
            name: "Caminata de granjero",
            sets: 3,
            reps: 4,
            instructions:
              "Cada lado · Ir aumentando el peso · Atento a la técnica de caminata",
          }),
        ],
      },
      {
        id: "k-d2-activacion",
        name: "Activación",
        type: "specific-preparation",
        exercises: [
          exercise({
            id: "k-d2-polea",
            name: "Polea para cuádriceps e isquios",
            sets: 3,
            reps: 10,
            instructions: "Combinado",
          }),
        ],
      },
      {
        id: "k-d2-bloque-1",
        name: "Bloque 1",
        type: "alternating",
        exercises: [
          exercise({
            id: "k-d2-sentadilla-tope",
            name: "Sentadillas",
            sets: 3,
            reps: 10,
            instructions: "Con tope · Barra",
          }),
          exercise({
            id: "k-d2-gemelos",
            name: "Gemelos",
            sets: 3,
            reps: 10,
            instructions: "A una pierna · Barra",
          }),
        ],
      },
      {
        id: "k-d2-bloque-2",
        name: "Bloque 2",
        type: "alternating",
        exercises: [
          exercise({
            id: "k-d2-prensa",
            name: "Prensa",
            sets: 3,
            reps: 10,
            weight: 15,
            instructions: "A una pierna",
          }),
          exercise({
            id: "k-d2-gluteo-cajon",
            name: "Glúteos",
            sets: 3,
            reps: 10,
            weight: 10,
            instructions: "A una pierna · Con cajón",
          }),
        ],
      },
      {
        id: "k-d2-bloque-3",
        name: "Bloque 3",
        type: "alternating",
        exercises: [
          exercise({
            id: "k-d2-bulgaras",
            name: "Sentadillas búlgaras",
            sets: 3,
            reps: 10,
            instructions: "Con disco",
          }),
          exercise({
            id: "k-d2-sillon",
            name: "Sillón de cuádriceps",
            sets: 3,
            reps: 10,
            instructions: "A dos piernas · Peso a elección",
          }),
        ],
      },
      {
        id: "k-d2-final",
        name: "Finalizador",
        type: "cooldown",
        exercises: [
          exercise({
            id: "k-d2-curl",
            name: "Curl nórdico invertido + glúteo medio",
            sets: 3,
            reps: 10,
            instructions: "Sin disco",
          }),
        ],
      },
    ],
  },
];

const nachoCircuits: Record<string, Exercise[]> = {
  legs: [
    exercise({ id: "n-d1-mov-tobillo", name: "Movilidad de tobillo", sets: 2, reps: 15, instructions: "Cada lado" }),
    exercise({ id: "n-d1-mov-cadera", name: "Movilidad de cadera", sets: 2, reps: 15, instructions: "Cada lado" }),
    exercise({ id: "n-d1-plancha", name: "Plancha baja", sets: 2, reps: 30, instructions: "Segundos" }),
    exercise({ id: "n-d1-bicho", name: "Bicho muerto", sets: 2, reps: 20 }),
    exercise({ id: "n-d1-estocada-iso", name: "Estocada isométrica", sets: 2, reps: 20, instructions: "Segundos · Cada lado" }),
    exercise({ id: "n-d1-copa", name: "Sentadilla copa", sets: 2, reps: 15 }),
  ],
  upperBody: [
    exercise({ id: "n-d2-mov-torax", name: "Movilidad de tórax", sets: 2, reps: 15, instructions: "Cada lado" }),
    exercise({ id: "n-d2-mov-hombros", name: "Movilidad de hombros", sets: 2, reps: 15, instructions: "Cada lado" }),
    exercise({ id: "n-d2-plancha", name: "Plancha lateral", sets: 2, reps: 30, instructions: "Segundos · Cada lado" }),
    exercise({ id: "n-d2-abs", name: "Abdominales bicicleta", sets: 2, reps: 40 }),
    exercise({ id: "n-d2-flexiones", name: "Flexiones de brazos", sets: 2, reps: 15 }),
    exercise({ id: "n-d2-pull-face", name: "Pull face en polea", sets: 2, reps: 10 }),
  ],
  posteriorChain: [
    exercise({ id: "n-d3-mov-tobillo", name: "Movilidad de tobillo", sets: 2, reps: 15, instructions: "Cada lado" }),
    exercise({ id: "n-d3-mov-cadera", name: "Movilidad de cadera", sets: 2, reps: 15, instructions: "Cada lado" }),
    exercise({ id: "n-d3-plancha", name: "Plancha baja", sets: 2, reps: 30, instructions: "Segundos" }),
    exercise({ id: "n-d3-bicho", name: "Bicho muerto", sets: 2, reps: 20 }),
    exercise({ id: "n-d3-buen-dia", name: "Buen día", sets: 2, reps: 10 }),
    exercise({ id: "n-d3-cadera-iso", name: "Elevación de cadera isométrica", sets: 2, reps: 30, instructions: "Segundos" }),
  ],
  fullBody: [
    exercise({ id: "n-d5-mov-tobillo-cadera", name: "Movilidad de tobillo + cadera", sets: 2, reps: 15, instructions: "Cada lado" }),
    exercise({ id: "n-d5-mov-hombros", name: "Movilidad de hombros", sets: 2, reps: 15, instructions: "Cada lado" }),
    exercise({ id: "n-d5-plancha", name: "Plancha con toque de hombro", sets: 2, reps: 20 }),
    exercise({ id: "n-d5-pallof", name: "Press Pallof", sets: 2, reps: 10 }),
    exercise({ id: "n-d5-sentadilla-iso", name: "Sentadilla isométrica", sets: 2, reps: 30, instructions: "Segundos" }),
    exercise({ id: "n-d5-pull-face", name: "Pull face en polea", sets: 2, reps: 10 }),
  ],
};

const nachoRoutines: Routine[] = [
  {
    id: "nacho-dia-1",
    athleteId: 3,
    title: "Pierna",
    objective: "Enfoque en cuádriceps y estabilidad",
    durationMinutes: 60,
    blocks: [
      { id: "n-d1-activacion", name: "Movilidad + activación", type: "circuit-2-rounds", exercises: nachoCircuits.legs },
      individualBlock("n-d1-prensa", "Prensa 45", exercise({ id: "n-d1-prensa-e", name: "Prensa 45", sets: 5, reps: [8, 12], restSeconds: 90, instructions: "No llegar a la extensión completa" })),
      individualBlock("n-d1-bulgaras", "Sentadillas búlgaras", exercise({ id: "n-d1-bulgaras-e", name: "Sentadillas búlgaras", sets: 3, reps: 10, restSeconds: 60, instructions: "Con mancuernas · Movimiento controlado" })),
      individualBlock("n-d1-cuadriceps", "Extensión de cuádriceps", exercise({ id: "n-d1-cuadriceps-e", name: "Extensión de cuádriceps en máquina", sets: 5, reps: [12, 15], restSeconds: 90, instructions: "Sillón de cuádriceps · Bajar controlado" })),
      individualBlock("n-d1-gemelos", "Gemelos", exercise({ id: "n-d1-gemelos-e", name: "Gemelos parado", sets: 3, reps: 15, restSeconds: 60, instructions: "A una pierna · Pesado" })),
    ],
  },
  {
    id: "nacho-dia-2",
    athleteId: 3,
    title: "Torso",
    objective: "Fuerza y volumen",
    durationMinutes: 65,
    blocks: [
      { id: "n-d2-activacion", name: "Movilidad + activación", type: "circuit-2-rounds", exercises: nachoCircuits.upperBody },
      individualBlock("n-d2-press", "Press plano", exercise({ id: "n-d2-press-e", name: "Press plano", sets: 5, reps: 8, restSeconds: 120, instructions: "Con barra · Puede hacerse en Smith o máquina guiada" })),
      individualBlock("n-d2-jalon", "Jalón al pecho", exercise({ id: "n-d2-jalon-e", name: "Jalón al pecho", sets: 4, reps: 12, restSeconds: 90, instructions: "Dorsalera · Agarre medio" })),
      individualBlock("n-d2-hombro", "Press de hombro", exercise({ id: "n-d2-hombro-e", name: "Press de hombro", sets: 4, reps: 8, restSeconds: 90, instructions: "En máquina; si no hay, con mancuernas" })),
      individualBlock("n-d2-remo", "Remo Hammer", exercise({ id: "n-d2-remo-e", name: "Remo Hammer", sets: 4, reps: 12, restSeconds: 90 })),
      individualBlock("n-d2-vuelos", "Vuelos laterales", exercise({ id: "n-d2-vuelos-e", name: "Vuelos laterales", sets: 3, reps: 12, restSeconds: 60 })),
    ],
  },
  {
    id: "nacho-dia-3",
    athleteId: 3,
    title: "Pierna",
    objective: "Enfoque en cadena posterior",
    durationMinutes: 65,
    blocks: [
      { id: "n-d3-activacion", name: "Movilidad + activación", type: "circuit-2-rounds", exercises: nachoCircuits.posteriorChain },
      individualBlock("n-d3-weight-muerto", "Peso muerto rumano", exercise({ id: "n-d3-weight-muerto-e", name: "Peso muerto rumano", sets: 5, reps: [6, 8], restSeconds: 120, instructions: "Con barra · Semiflexión de rodillas" })),
      individualBlock("n-d3-hip", "Hip thrust", exercise({ id: "n-d3-hip-e", name: "Hip thrust", sets: 4, reps: 8, restSeconds: 90, instructions: "Con barra o máquina guiada · Pesado" })),
      individualBlock("n-d3-isquios", "Sillón de isquios", exercise({ id: "n-d3-isquios-e", name: "Sillón de isquios", sets: 4, reps: 12, restSeconds: 90, instructions: "Si no hay, hacerlo en camilla" })),
      individualBlock("n-d3-estocadas", "Estocadas caminando", exercise({ id: "n-d3-estocadas-e", name: "Estocadas caminando", sets: 3, reps: 12, restSeconds: 60, instructions: "Pasos · Torso levemente inclinado · Con mancuerna" })),
      individualBlock("n-d3-soleo", "Sóleo", exercise({ id: "n-d3-soleo-e", name: "Sóleo", sets: 3, reps: 15, restSeconds: 60, instructions: "Gemelos sentado" })),
    ],
  },
  {
    id: "nacho-dia-4",
    athleteId: 3,
    title: "Torso",
    objective: "Fuerza de tren superior",
    durationMinutes: 60,
    blocks: [
      { id: "n-d4-activacion", name: "Movilidad + activación", type: "circuit-2-rounds", exercises: nachoCircuits.upperBody.map((item) => ({ ...item, id: item.id.replace("n-d2", "n-d4") })) },
      individualBlock("n-d4-press", "Press inclinado", exercise({ id: "n-d4-press-e", name: "Press inclinado", sets: 4, reps: 12, restSeconds: 90, instructions: "Con mancuernas" })),
      individualBlock("n-d4-apertura", "Apertura", exercise({ id: "n-d4-apertura-e", name: "Apertura en banco plano", sets: 3, reps: 12, restSeconds: 60 })),
      individualBlock("n-d4-remo", "Remo T", exercise({ id: "n-d4-remo-e", name: "Remo T", sets: 4, reps: 12, restSeconds: 90 })),
      individualBlock("n-d4-biceps", "Curl de bíceps", exercise({ id: "n-d4-biceps-e", name: "Curl de bíceps en banco Scott", sets: 4, reps: 12, restSeconds: 90, instructions: "Barra W o EZ" })),
      individualBlock("n-d4-triceps", "Extensión de tríceps", exercise({ id: "n-d4-triceps-e", name: "Extensión de tríceps en polea alta", sets: 3, reps: 12, restSeconds: 60 })),
    ],
  },
  {
    id: "nacho-dia-5",
    athleteId: 3,
    title: "Full body",
    objective: "Trabajo completo de fuerza y estabilidad",
    durationMinutes: 60,
    blocks: [
      { id: "n-d5-activacion", name: "Movilidad + activación", type: "circuit-2-rounds", exercises: nachoCircuits.fullBody },
      individualBlock("n-d5-hack", "Hack 45", exercise({ id: "n-d5-hack-e", name: "Hack 45", sets: 5, reps: 8, restSeconds: 90 })),
      individualBlock("n-d5-remo", "Remo bajo", exercise({ id: "n-d5-remo-e", name: "Remo bajo", sets: 4, reps: 12, restSeconds: 90 })),
      individualBlock("n-d5-vuelos", "Vuelos frontales", exercise({ id: "n-d5-vuelos-e", name: "Vuelos frontales", sets: 3, reps: 15, restSeconds: 60 })),
      individualBlock("n-d5-aductores", "Aductores", exercise({ id: "n-d5-aductores-e", name: "Aductores en máquina", sets: 4, reps: 12, restSeconds: 90 })),
      individualBlock("n-d5-estocadas", "Estocadas fijas", exercise({ id: "n-d5-estocadas-e", name: "Estocadas fijas", sets: 4, reps: 15, restSeconds: 90, instructions: "Con banda en la rodilla · Liviano" })),
    ],
  },
];

const testRoutines: Routine[] = [
  {
    id: "test-dia-1",
    athleteId: 5,
    title: "Rutina de prueba",
    objective: "Espacio aislado para probar RTTP",
    durationMinutes: 30,
    blocks: [
      individualBlock(
        "test-bloque-1",
        "Bloque de prueba",
        exercise({
          id: "test-sentadilla",
          name: "Sentadilla de prueba",
          sets: 3,
          reps: 10,
          restSeconds: 60,
          instructions: "Podés editar o reemplazar este ejercicio",
        }),
      ),
    ],
  },
];

export const initialRoutines = [
  ...kevinRoutines,
  ...nachoRoutines,
  ...testRoutines,
];
