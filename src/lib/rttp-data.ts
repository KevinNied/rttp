export type Rol = "entrenador" | "atleta";

export type Usuario = {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  atletaIds?: number[];
};

export type Ejercicio = {
  id: string;
  nombre: string;
  aclaraciones: string;
  series: number;
  repeticionesMin: number;
  repeticionesMax: number;
  peso: number;
  descanso: number | null;
};

export type Bloque = {
  id: string;
  nombre: string;
  tipo: string;
  ejercicios: Ejercicio[];
};

export type Rutina = {
  id: string;
  atletaId: number;
  dia: string;
  titulo: string;
  objetivo: string;
  duracion: number;
  bloques: Bloque[];
};

type DatosEjercicio = {
  id: string;
  nombre: string;
  series: number;
  repeticiones: number | [number, number];
  peso?: number;
  aclaraciones?: string;
  descanso?: number | null;
};

function ejercicio({
  id,
  nombre,
  series,
  repeticiones,
  peso = 0,
  aclaraciones = "",
  descanso = null,
}: DatosEjercicio): Ejercicio {
  const [repeticionesMin, repeticionesMax] = Array.isArray(repeticiones)
    ? repeticiones
    : [repeticiones, repeticiones];

  return {
    id,
    nombre,
    series,
    repeticionesMin,
    repeticionesMax,
    peso,
    aclaraciones,
    descanso,
  };
}

function bloqueIndividual(
  id: string,
  nombre: string,
  item: Ejercicio,
): Bloque {
  return { id, nombre, tipo: "Series consecutivas", ejercicios: [item] };
}

export const usuariosIniciales: Usuario[] = [
  {
    id: 1,
    nombre: "Kevin",
    email: "lakeja1105@gmail.com",
    rol: "atleta",
  },
  {
    id: 2,
    nombre: "Milton",
    email: "milton.niedfeld@gmail.com",
    rol: "entrenador",
    atletaIds: [1, 3],
  },
  {
    id: 3,
    nombre: "Nacho",
    email: "nacho@gmail.com",
    rol: "atleta",
  },
];

const rutinasKevin: Rutina[] = [
  {
    id: "kevin-dia-1",
    atletaId: 1,
    dia: "Día 1",
    titulo: "Fuerza de tren inferior",
    objetivo: "Glúteos, cuádriceps e isquiotibiales",
    duracion: 65,
    bloques: [
      {
        id: "k-d1-entrada",
        nombre: "Entrada en calor",
        tipo: "Preparación",
        ejercicios: [
          ejercicio({
            id: "k-d1-bici",
            nombre: "Bici",
            series: 1,
            repeticiones: 10,
            aclaraciones: "Minutos",
          }),
          ejercicio({
            id: "k-d1-plancha",
            nombre: "Plancha baja, lateral y lateral",
            series: 1,
            repeticiones: 20,
            aclaraciones: "Segundos · Con disco",
          }),
          ejercicio({
            id: "k-d1-puente",
            nombre: "Puente de glúteo isométrico",
            series: 1,
            repeticiones: 30,
            peso: 20,
          }),
          ejercicio({
            id: "k-d1-banda",
            nombre: "Caminata lateral con banda",
            series: 1,
            repeticiones: 4,
            aclaraciones: "Cada lado · Con banda",
          }),
        ],
      },
      {
        id: "k-d1-activacion",
        nombre: "Activación",
        tipo: "Preparación específica",
        ejercicios: [
          ejercicio({
            id: "k-d1-polea",
            nombre: "Polea para cuádriceps e isquios",
            series: 3,
            repeticiones: 10,
            aclaraciones: "Combinado",
          }),
        ],
      },
      {
        id: "k-d1-bloque-1",
        nombre: "Bloque 1",
        tipo: "Alternado",
        ejercicios: [
          ejercicio({
            id: "k-d1-hip",
            nombre: "Hip thrust",
            series: 3,
            repeticiones: 10,
            aclaraciones: "Con barra",
          }),
          ejercicio({
            id: "k-d1-estocadas",
            nombre: "Estocadas",
            series: 3,
            repeticiones: 10,
            aclaraciones: "Con disco",
          }),
        ],
      },
      {
        id: "k-d1-bloque-2",
        nombre: "Bloque 2",
        tipo: "Alternado",
        ejercicios: [
          ejercicio({
            id: "k-d1-prensa",
            nombre: "Prensa",
            series: 3,
            repeticiones: 10,
            aclaraciones: "A dos piernas · Peso a elección",
          }),
          ejercicio({
            id: "k-d1-sillon",
            nombre: "Sillón de cuádriceps",
            series: 3,
            repeticiones: 10,
            aclaraciones: "A una pierna · Peso a elección",
          }),
        ],
      },
      {
        id: "k-d1-bloque-3",
        nombre: "Bloque 3",
        tipo: "Alternado",
        ejercicios: [
          ejercicio({
            id: "k-d1-sentadilla",
            nombre: "Sentadilla 3 tiempos",
            series: 3,
            repeticiones: 20,
            peso: 20,
            aclaraciones: "Segundos",
          }),
          ejercicio({
            id: "k-d1-gluteos-polea",
            nombre: "Glúteos en polea",
            series: 3,
            repeticiones: 10,
            peso: 40,
          }),
        ],
      },
      {
        id: "k-d1-final",
        nombre: "Finalizador",
        tipo: "Cierre",
        ejercicios: [
          ejercicio({
            id: "k-d1-caminata-isquios",
            nombre: "Caminata de isquiotibiales y sóleos de búlgara",
            series: 3,
            repeticiones: 8,
            aclaraciones: "Sin peso",
          }),
        ],
      },
    ],
  },
  {
    id: "kevin-dia-2",
    atletaId: 1,
    dia: "Día 2",
    titulo: "Fuerza unilateral",
    objetivo: "Control, estabilidad y fuerza de piernas",
    duracion: 68,
    bloques: [
      {
        id: "k-d2-entrada",
        nombre: "Entrada en calor",
        tipo: "Preparación",
        ejercicios: [
          ejercicio({
            id: "k-d2-bici",
            nombre: "Bici",
            series: 1,
            repeticiones: 10,
            aclaraciones: "Minutos",
          }),
          ejercicio({
            id: "k-d2-abdominales",
            nombre: "Abdominales bicicleta",
            series: 3,
            repeticiones: 50,
            aclaraciones: "Sin peso",
          }),
          ejercicio({
            id: "k-d2-isometrica",
            nombre: "Sentadilla isométrica",
            series: 3,
            repeticiones: 30,
            peso: 20,
            aclaraciones: "Segundos",
          }),
          ejercicio({
            id: "k-d2-granjero",
            nombre: "Caminata de granjero",
            series: 3,
            repeticiones: 4,
            aclaraciones:
              "Cada lado · Ir aumentando el peso · Atento a la técnica de caminata",
          }),
        ],
      },
      {
        id: "k-d2-activacion",
        nombre: "Activación",
        tipo: "Preparación específica",
        ejercicios: [
          ejercicio({
            id: "k-d2-polea",
            nombre: "Polea para cuádriceps e isquios",
            series: 3,
            repeticiones: 10,
            aclaraciones: "Combinado",
          }),
        ],
      },
      {
        id: "k-d2-bloque-1",
        nombre: "Bloque 1",
        tipo: "Alternado",
        ejercicios: [
          ejercicio({
            id: "k-d2-sentadilla-tope",
            nombre: "Sentadillas",
            series: 3,
            repeticiones: 10,
            aclaraciones: "Con tope · Barra",
          }),
          ejercicio({
            id: "k-d2-gemelos",
            nombre: "Gemelos",
            series: 3,
            repeticiones: 10,
            aclaraciones: "A una pierna · Barra",
          }),
        ],
      },
      {
        id: "k-d2-bloque-2",
        nombre: "Bloque 2",
        tipo: "Alternado",
        ejercicios: [
          ejercicio({
            id: "k-d2-prensa",
            nombre: "Prensa",
            series: 3,
            repeticiones: 10,
            peso: 15,
            aclaraciones: "A una pierna",
          }),
          ejercicio({
            id: "k-d2-gluteo-cajon",
            nombre: "Glúteos",
            series: 3,
            repeticiones: 10,
            peso: 10,
            aclaraciones: "A una pierna · Con cajón",
          }),
        ],
      },
      {
        id: "k-d2-bloque-3",
        nombre: "Bloque 3",
        tipo: "Alternado",
        ejercicios: [
          ejercicio({
            id: "k-d2-bulgaras",
            nombre: "Sentadillas búlgaras",
            series: 3,
            repeticiones: 10,
            aclaraciones: "Con disco",
          }),
          ejercicio({
            id: "k-d2-sillon",
            nombre: "Sillón de cuádriceps",
            series: 3,
            repeticiones: 10,
            aclaraciones: "A dos piernas · Peso a elección",
          }),
        ],
      },
      {
        id: "k-d2-final",
        nombre: "Finalizador",
        tipo: "Cierre",
        ejercicios: [
          ejercicio({
            id: "k-d2-curl",
            nombre: "Curl nórdico invertido + glúteo medio",
            series: 3,
            repeticiones: 10,
            aclaraciones: "Sin disco",
          }),
        ],
      },
    ],
  },
];

const circuitosNacho: Record<string, Ejercicio[]> = {
  pierna: [
    ejercicio({ id: "n-d1-mov-tobillo", nombre: "Movilidad de tobillo", series: 2, repeticiones: 15, aclaraciones: "Cada lado" }),
    ejercicio({ id: "n-d1-mov-cadera", nombre: "Movilidad de cadera", series: 2, repeticiones: 15, aclaraciones: "Cada lado" }),
    ejercicio({ id: "n-d1-plancha", nombre: "Plancha baja", series: 2, repeticiones: 30, aclaraciones: "Segundos" }),
    ejercicio({ id: "n-d1-bicho", nombre: "Bicho muerto", series: 2, repeticiones: 20 }),
    ejercicio({ id: "n-d1-estocada-iso", nombre: "Estocada isométrica", series: 2, repeticiones: 20, aclaraciones: "Segundos · Cada lado" }),
    ejercicio({ id: "n-d1-copa", nombre: "Sentadilla copa", series: 2, repeticiones: 15 }),
  ],
  torso: [
    ejercicio({ id: "n-d2-mov-torax", nombre: "Movilidad de tórax", series: 2, repeticiones: 15, aclaraciones: "Cada lado" }),
    ejercicio({ id: "n-d2-mov-hombros", nombre: "Movilidad de hombros", series: 2, repeticiones: 15, aclaraciones: "Cada lado" }),
    ejercicio({ id: "n-d2-plancha", nombre: "Plancha lateral", series: 2, repeticiones: 30, aclaraciones: "Segundos · Cada lado" }),
    ejercicio({ id: "n-d2-abs", nombre: "Abdominales bicicleta", series: 2, repeticiones: 40 }),
    ejercicio({ id: "n-d2-flexiones", nombre: "Flexiones de brazos", series: 2, repeticiones: 15 }),
    ejercicio({ id: "n-d2-pull-face", nombre: "Pull face en polea", series: 2, repeticiones: 10 }),
  ],
  posterior: [
    ejercicio({ id: "n-d3-mov-tobillo", nombre: "Movilidad de tobillo", series: 2, repeticiones: 15, aclaraciones: "Cada lado" }),
    ejercicio({ id: "n-d3-mov-cadera", nombre: "Movilidad de cadera", series: 2, repeticiones: 15, aclaraciones: "Cada lado" }),
    ejercicio({ id: "n-d3-plancha", nombre: "Plancha baja", series: 2, repeticiones: 30, aclaraciones: "Segundos" }),
    ejercicio({ id: "n-d3-bicho", nombre: "Bicho muerto", series: 2, repeticiones: 20 }),
    ejercicio({ id: "n-d3-buen-dia", nombre: "Buen día", series: 2, repeticiones: 10 }),
    ejercicio({ id: "n-d3-cadera-iso", nombre: "Elevación de cadera isométrica", series: 2, repeticiones: 30, aclaraciones: "Segundos" }),
  ],
  fullBody: [
    ejercicio({ id: "n-d5-mov-tobillo-cadera", nombre: "Movilidad de tobillo + cadera", series: 2, repeticiones: 15, aclaraciones: "Cada lado" }),
    ejercicio({ id: "n-d5-mov-hombros", nombre: "Movilidad de hombros", series: 2, repeticiones: 15, aclaraciones: "Cada lado" }),
    ejercicio({ id: "n-d5-plancha", nombre: "Plancha con toque de hombro", series: 2, repeticiones: 20 }),
    ejercicio({ id: "n-d5-pallof", nombre: "Press Pallof", series: 2, repeticiones: 10 }),
    ejercicio({ id: "n-d5-sentadilla-iso", nombre: "Sentadilla isométrica", series: 2, repeticiones: 30, aclaraciones: "Segundos" }),
    ejercicio({ id: "n-d5-pull-face", nombre: "Pull face en polea", series: 2, repeticiones: 10 }),
  ],
};

const rutinasNacho: Rutina[] = [
  {
    id: "nacho-dia-1",
    atletaId: 3,
    dia: "Día 1",
    titulo: "Pierna",
    objetivo: "Enfoque en cuádriceps y estabilidad",
    duracion: 60,
    bloques: [
      { id: "n-d1-activacion", nombre: "Movilidad + activación", tipo: "Circuito · 2 vueltas", ejercicios: circuitosNacho.pierna },
      bloqueIndividual("n-d1-prensa", "Prensa 45", ejercicio({ id: "n-d1-prensa-e", nombre: "Prensa 45", series: 5, repeticiones: [8, 12], descanso: 90, aclaraciones: "No llegar a la extensión completa" })),
      bloqueIndividual("n-d1-bulgaras", "Sentadillas búlgaras", ejercicio({ id: "n-d1-bulgaras-e", nombre: "Sentadillas búlgaras", series: 3, repeticiones: 10, descanso: 60, aclaraciones: "Con mancuernas · Movimiento controlado" })),
      bloqueIndividual("n-d1-cuadriceps", "Extensión de cuádriceps", ejercicio({ id: "n-d1-cuadriceps-e", nombre: "Extensión de cuádriceps en máquina", series: 5, repeticiones: [12, 15], descanso: 90, aclaraciones: "Sillón de cuádriceps · Bajar controlado" })),
      bloqueIndividual("n-d1-gemelos", "Gemelos", ejercicio({ id: "n-d1-gemelos-e", nombre: "Gemelos parado", series: 3, repeticiones: 15, descanso: 60, aclaraciones: "A una pierna · Pesado" })),
    ],
  },
  {
    id: "nacho-dia-2",
    atletaId: 3,
    dia: "Día 2",
    titulo: "Torso",
    objetivo: "Fuerza y volumen",
    duracion: 65,
    bloques: [
      { id: "n-d2-activacion", nombre: "Movilidad + activación", tipo: "Circuito · 2 vueltas", ejercicios: circuitosNacho.torso },
      bloqueIndividual("n-d2-press", "Press plano", ejercicio({ id: "n-d2-press-e", nombre: "Press plano", series: 5, repeticiones: 8, descanso: 120, aclaraciones: "Con barra · Puede hacerse en Smith o máquina guiada" })),
      bloqueIndividual("n-d2-jalon", "Jalón al pecho", ejercicio({ id: "n-d2-jalon-e", nombre: "Jalón al pecho", series: 4, repeticiones: 12, descanso: 90, aclaraciones: "Dorsalera · Agarre medio" })),
      bloqueIndividual("n-d2-hombro", "Press de hombro", ejercicio({ id: "n-d2-hombro-e", nombre: "Press de hombro", series: 4, repeticiones: 8, descanso: 90, aclaraciones: "En máquina; si no hay, con mancuernas" })),
      bloqueIndividual("n-d2-remo", "Remo Hammer", ejercicio({ id: "n-d2-remo-e", nombre: "Remo Hammer", series: 4, repeticiones: 12, descanso: 90 })),
      bloqueIndividual("n-d2-vuelos", "Vuelos laterales", ejercicio({ id: "n-d2-vuelos-e", nombre: "Vuelos laterales", series: 3, repeticiones: 12, descanso: 60 })),
    ],
  },
  {
    id: "nacho-dia-3",
    atletaId: 3,
    dia: "Día 3",
    titulo: "Pierna",
    objetivo: "Enfoque en cadena posterior",
    duracion: 65,
    bloques: [
      { id: "n-d3-activacion", nombre: "Movilidad + activación", tipo: "Circuito · 2 vueltas", ejercicios: circuitosNacho.posterior },
      bloqueIndividual("n-d3-peso-muerto", "Peso muerto rumano", ejercicio({ id: "n-d3-peso-muerto-e", nombre: "Peso muerto rumano", series: 5, repeticiones: [6, 8], descanso: 120, aclaraciones: "Con barra · Semiflexión de rodillas" })),
      bloqueIndividual("n-d3-hip", "Hip thrust", ejercicio({ id: "n-d3-hip-e", nombre: "Hip thrust", series: 4, repeticiones: 8, descanso: 90, aclaraciones: "Con barra o máquina guiada · Pesado" })),
      bloqueIndividual("n-d3-isquios", "Sillón de isquios", ejercicio({ id: "n-d3-isquios-e", nombre: "Sillón de isquios", series: 4, repeticiones: 12, descanso: 90, aclaraciones: "Si no hay, hacerlo en camilla" })),
      bloqueIndividual("n-d3-estocadas", "Estocadas caminando", ejercicio({ id: "n-d3-estocadas-e", nombre: "Estocadas caminando", series: 3, repeticiones: 12, descanso: 60, aclaraciones: "Pasos · Torso levemente inclinado · Con mancuerna" })),
      bloqueIndividual("n-d3-soleo", "Sóleo", ejercicio({ id: "n-d3-soleo-e", nombre: "Sóleo", series: 3, repeticiones: 15, descanso: 60, aclaraciones: "Gemelos sentado" })),
    ],
  },
  {
    id: "nacho-dia-4",
    atletaId: 3,
    dia: "Día 4",
    titulo: "Torso",
    objetivo: "Fuerza de tren superior",
    duracion: 60,
    bloques: [
      { id: "n-d4-activacion", nombre: "Movilidad + activación", tipo: "Circuito · 2 vueltas", ejercicios: circuitosNacho.torso.map((item) => ({ ...item, id: item.id.replace("n-d2", "n-d4") })) },
      bloqueIndividual("n-d4-press", "Press inclinado", ejercicio({ id: "n-d4-press-e", nombre: "Press inclinado", series: 4, repeticiones: 12, descanso: 90, aclaraciones: "Con mancuernas" })),
      bloqueIndividual("n-d4-apertura", "Apertura", ejercicio({ id: "n-d4-apertura-e", nombre: "Apertura en banco plano", series: 3, repeticiones: 12, descanso: 60 })),
      bloqueIndividual("n-d4-remo", "Remo T", ejercicio({ id: "n-d4-remo-e", nombre: "Remo T", series: 4, repeticiones: 12, descanso: 90 })),
      bloqueIndividual("n-d4-biceps", "Curl de bíceps", ejercicio({ id: "n-d4-biceps-e", nombre: "Curl de bíceps en banco Scott", series: 4, repeticiones: 12, descanso: 90, aclaraciones: "Barra W o EZ" })),
      bloqueIndividual("n-d4-triceps", "Extensión de tríceps", ejercicio({ id: "n-d4-triceps-e", nombre: "Extensión de tríceps en polea alta", series: 3, repeticiones: 12, descanso: 60 })),
    ],
  },
  {
    id: "nacho-dia-5",
    atletaId: 3,
    dia: "Día 5",
    titulo: "Full body",
    objetivo: "Trabajo completo de fuerza y estabilidad",
    duracion: 60,
    bloques: [
      { id: "n-d5-activacion", nombre: "Movilidad + activación", tipo: "Circuito · 2 vueltas", ejercicios: circuitosNacho.fullBody },
      bloqueIndividual("n-d5-hack", "Hack 45", ejercicio({ id: "n-d5-hack-e", nombre: "Hack 45", series: 5, repeticiones: 8, descanso: 90 })),
      bloqueIndividual("n-d5-remo", "Remo bajo", ejercicio({ id: "n-d5-remo-e", nombre: "Remo bajo", series: 4, repeticiones: 12, descanso: 90 })),
      bloqueIndividual("n-d5-vuelos", "Vuelos frontales", ejercicio({ id: "n-d5-vuelos-e", nombre: "Vuelos frontales", series: 3, repeticiones: 15, descanso: 60 })),
      bloqueIndividual("n-d5-aductores", "Aductores", ejercicio({ id: "n-d5-aductores-e", nombre: "Aductores en máquina", series: 4, repeticiones: 12, descanso: 90 })),
      bloqueIndividual("n-d5-estocadas", "Estocadas fijas", ejercicio({ id: "n-d5-estocadas-e", nombre: "Estocadas fijas", series: 4, repeticiones: 15, descanso: 90, aclaraciones: "Con banda en la rodilla · Liviano" })),
    ],
  },
];

export const rutinasIniciales = [...rutinasKevin, ...rutinasNacho];
