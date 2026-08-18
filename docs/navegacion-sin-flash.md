# Problema de pantalla negra al navegar entre secciones

## ¿Qué pasaba?

Al pasar de una sección a otra en RTTP (por ejemplo, de **Inicio** a **Agenda**, o de **Rutinas** a **Progreso**), la pantalla se ponía negra por un momento antes de mostrar el nuevo contenido. Esto ocurría tanto en mobile como en desktop.

---

## Por qué pasaba (la causa raíz)

RTTP está construida con **Next.js App Router**, un framework de React que organiza la app en "páginas" según rutas de URL. Antes del fix, la arquitectura era así:

```
/                  → src/app/page.tsx          (página principal)
/schedule          → src/app/schedule/page.tsx  (re-exporta page.tsx)
/routines          → src/app/routines/page.tsx  (re-exporta page.tsx)
/activities        → src/app/activities/page.tsx (re-exporta page.tsx)
/coach             → src/app/coach/page.tsx     (re-exporta page.tsx)
/coach/athletes    → src/app/coach/athletes/page.tsx (re-exporta page.tsx)
...
```

Aunque todas las rutas apuntaban al mismo archivo (`page.tsx`), Next.js **no sabe eso**. Para Next.js, `/` y `/schedule` son dos páginas completamente distintas. Cada vez que el usuario clickeaba un link de navegación, Next.js:

1. **Destruía** el componente de la página actual (desmount)
2. Mostraba una pantalla vacía/negra mientras cargaba el nuevo módulo
3. **Creaba** una instancia nueva del mismo componente (mount)
4. El componente nuevo tenía que volver a cargar todo desde Supabase (fetch de 6 tablas)
5. Recién ahí aparecía el contenido

Esto es lo que en React se llama **unmount → remount**: el componente muere y nace de nuevo, con todo su estado reseteado y todos sus efectos re-ejecutados.

El diagrama del flujo anterior:

```
Usuario clickea "Agenda"
       ↓
Next.js detecta cambio de ruta (/ → /schedule)
       ↓
Desmonta el componente Home completo
       ↓
Pantalla negra ← acá estaba el flash visible
       ↓
Monta una instancia nueva de Home
       ↓
useEffect dispara hydrate() → fetch a Supabase (6 tablas en paralelo)
       ↓
~500ms a 1000ms después → aparece el contenido
```

---

## Cómo se arregló

La solución fue **eliminar la navegación de Next.js** para el routing interno de secciones, y reemplazarla por **routing manual del browser** sin involucrar al framework.

### En concreto

En vez de usar `<Link href="/schedule">` (componente de Next.js que dispara una navegación de ruta), ahora se usa una función `navigate()` local:

```js
function navigate(path) {
  window.history.pushState(null, "", path);
  setPathname(path);
}
```

- **`window.history.pushState`**: es una API nativa del browser que actualiza la URL en la barra de direcciones *sin recargar la página*. Es exactamente lo que los frameworks SPA (Single Page Application) usan internamente.
- **`setPathname(path)`**: actualiza un estado interno de React con la nueva URL, lo que hace que el componente re-renderice mostrando el contenido correcto para esa sección.

El componente `Home` (que contiene toda la lógica de RTTP) **nunca se destruye**. Solo cambia qué vista muestra según el valor de `pathname`.

Además, se agregó un listener para el botón "Atrás/Adelante" del browser:

```js
window.addEventListener("popstate", () => {
  setPathname(window.location.pathname);
});
```

### Todos los `<Link>` de navegación se reemplazaron por `<button>` con `onClick`

```jsx
// Antes (causaba remount)
<Link href="/schedule">Agenda</Link>

// Después (solo actualiza el estado, sin remount)
<button onClick={() => navigate("/schedule")}>Agenda</button>
```

Esto aplica a:
- Los botones del sidebar (desktop)
- Los botones del menú inferior (mobile)
- Los links internos dentro de las vistas ("Ver agenda", "Ir a mis rutinas", "Ver planificación", "Todos los atletas")

---

## El resultado

El flujo ahora es:

```
Usuario clickea "Agenda"
       ↓
navigate("/schedule") ejecuta pushState + setPathname
       ↓
React re-renderiza el mismo componente mostrando la vista de Agenda
       ↓
Contenido aparece INSTANTÁNEAMENTE (0ms)
```

Sin pantalla negra. Sin re-fetch a Supabase. Sin pérdida de estado.

---

## ¿Por qué las sub-rutas siguen existiendo?

Las páginas en `/schedule/page.tsx`, `/routines/page.tsx`, etc. siguen en el proyecto. Sirven para un caso específico: si alguien guarda un acceso directo a `https://rttp.vercel.app/schedule` o si llega a esa URL por primera vez (deep linking desde un link compartido, acceso directo en el celular). En ese caso Next.js sí carga la página completa, que es el comportamiento correcto para una carga inicial.

La diferencia es que ahora eso solo pasa en la **primera carga**, no en cada navegación interna.

---

## Analogía para entenderlo sin React

Imaginá una app de escritorio donde cada sección es un "panel" diferente. La arquitectura anterior era como **cerrar y abrir el programa completo** cada vez que cambias de panel. La nueva arquitectura es como simplemente **mostrar el panel que corresponde** dentro del mismo programa que ya está abierto.
