import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects() {
    return [
      { source: "/agenda", destination: "/schedule", permanent: true },
      { source: "/rutinas", destination: "/routines", permanent: true },
      { source: "/actividades", destination: "/activities", permanent: true },
      { source: "/entrenador", destination: "/coach", permanent: true },
      {
        source: "/entrenador/atletas",
        destination: "/coach/athletes",
        permanent: true,
      },
      {
        source: "/entrenador/atletas/:athleteId",
        destination: "/coach/athletes/:athleteId",
        permanent: true,
      },
      {
        source: "/entrenador/rutinas",
        destination: "/coach/routines",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
