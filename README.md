# ⛏️ Enchantment Order Optimizer / Optimizador de Encantamientos

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A tool to find the optimal order for combining enchantment books on an anvil in Minecraft, minimizing XP cost.

Una herramienta para encontrar el orden óptimo de combinación de libros de encantamiento en el yunque de Minecraft, minimizando el costo de experiencia.

---

## English

### What does this tool do?

When enchanting items in Minecraft, the order in which you combine books on an anvil matters. Each use increases the **work penalty** for future operations. Once that penalty is too high, the anvil will refuse to add more enchantments and display the "Too Expensive!" message.

This tool calculates the **cheapest combination order** by trying every possible sequence and finding the one with the lowest XP cost. It runs a brute-force algorithm in a background Web Worker to avoid freezing the browser.

### Features

- 🎮 **All items**: Armor, weapons, tools, books, and more
- ⚡ **Fast calculation**: Background Web Worker with memoization
- 🎨 **9 themes**: Light, Dark, Wither, Crimson, Dirt, Enderman, Ocean, Magma, Sunflower
- 🌐 **21 languages**: Spanish, English, French, German, Japanese, Chinese, and more
- 📱 **Responsive**: Works on desktop, tablet, and mobile
- 💾 **Persistent**: Saves your theme and language preference

### How to use

1. Select an item from the dropdown
2. Click on enchantment levels to add them
3. Choose optimization mode (less XP or less work penalty)
4. Click **Calculate**
5. Follow the step-by-step instructions

### Tech stack

- **HTML5** — Semantic markup
- **CSS3** — Grid, Flexbox, CSS Custom Properties, 9 theme definitions
- **JavaScript ES6+** — Vanilla modules (import/export), no frameworks, no jQuery
- **Web Workers** — Background thread for brute-force optimization with memoization
- **i18n** — 21 language files loaded via `fetch()`

### Deploy

This is a **static site** — no build step required. Just serve the files.

#### GitHub Pages (recommended)

1. Go to your repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main`, folder: `/ (root)`
4. Your site will be live at:
   ```
   https://<username>.github.io/<repo>/
   ```

#### Other options

| Service | Notes |
|---------|-------|
| **Netlify** | Drag & drop or auto-deploy on push |
| **Vercel** | Auto-deploy with CI/CD |
| **Cloudflare Pages** | Global CDN |
| **Any web server** | Copy files to `public_html/` |

### Project structure

```
enchant-order/
├── index.html          # Entry point
├── site.webmanifest    # PWA manifest
├── css/
│   ├── main.css        # Layout and component styles
│   └── themes.css      # 9 theme definitions (CSS custom properties)
├── js/
│   ├── app.js          # Main application module
│   ├── data.js         # Enchantment definitions and item mappings
│   ├── i18n.js         # Internationalization module
│   ├── ui.js           # DOM helpers, theme management, grid building
│   └── worker.js       # Web Worker — brute-force optimization algorithm
├── languages/          # 21 language JSON files
├── images/             # Item icons (GIF)
└── icons/              # App icons (PWA)
```

### Contributing

#### Adding a new language

1. Create a new JSON file in `languages/` (use an existing file as reference)
2. Translate all keys
3. Add the language to the selector in `js/app.js` (`buildLanguageSelector` function)
4. Test in the browser

#### Reporting issues

Open an issue on [GitHub](https://github.com/Miguel962jaliscoedu/optimizador-encantamientos/issues) describing the problem.

---

## Español

### ¿Qué hace esta herramienta?

Al encantar objetos en Minecraft, el orden en que combinas libros en un yunque importa. Cada uso aumenta la **penalización de trabajo** para futuras operaciones. Cuando esa penalización es demasiado alta, el yunque se niega a añadir más encantamientos y muestra el mensaje "¡Demasiado caro!".

Esta herramienta calcula el **orden de combinación más barato** probando todas las secuencias posibles y encontrando la de menor costo de experiencia. Utiliza un algoritmo de fuerza bruta en un Web Worker en segundo plano para no bloquear el navegador.

### Características

- 🎮 **Todos los objetos**: Armaduras, armas, herramientas, libros y más
- ⚡ **Cálculo rápido**: Web Worker en segundo plano con memoización
- 🎨 **9 temas**: Claro, Oscuro, Wither, Crimson, Dirt, Enderman, Ocean, Magma, Sunflower
- 🌐 **21 idiomas**: Español, inglés, francés, alemán, japonés, chino y más
- 📱 **Responsive**: Funciona en escritorio, tableta y móvil
- 💾 **Persistencia**: Guarda tu tema e idioma preferidos

### Cómo usar

1. Selecciona un objeto del menú desplegable
2. Haz clic en los niveles de encantamiento para añadirlos
3. Elige el modo de optimización (menos XP o menos penalización de trabajo)
4. Haz clic en **Calcular**
5. Sigue las instrucciones paso a paso

### Tecnologías

- **HTML5** — Marcado semántico
- **CSS3** — Grid, Flexbox, CSS Custom Properties, 9 definiciones de temas
- **JavaScript ES6+** — Módulos vanilla (import/export), sin frameworks, sin jQuery
- **Web Workers** — Hilo en segundo plano para optimización por fuerza bruta con memoización
- **i18n** — 21 archivos de idioma cargados via `fetch()`

### Despliegue

Este es un **sitio estático** — no necesita paso de compilación. Solo sirve los archivos.

#### GitHub Pages (recomendado)

1. Ve a tu repositorio → **Settings** → **Pages**
2. Fuente: **Deploy from a branch**
3. Rama: `main`, carpeta: `/ (root)`
4. Tu sitio estará en:
   ```
   https://<usuario>.github.io/<repo>/
   ```

#### Otras opciones

| Servicio | Notas |
|----------|-------|
| **Netlify** | Arrastrar y soltar o deploy automático al hacer push |
| **Vercel** | Deploy automático con CI/CD |
| **Cloudflare Pages** | CDN global |
| **Cualquier servidor web** | Copiar los archivos a `public_html/` |

### Estructura del proyecto

```
enchant-order/
├── index.html          # Punto de entrada
├── site.webmanifest    # Manifiesto PWA
├── css/
│   ├── main.css        # Estilos de diseño y componentes
│   └── themes.css      # 9 definiciones de temas (CSS custom properties)
├── js/
│   ├── app.js          # Módulo principal de la aplicación
│   ├── data.js         # Definiciones de encantamientos y mapeo de objetos
│   ├── i18n.js         # Módulo de internacionalización
│   ├── ui.js           # Helpers del DOM, gestión de temas, construcción de grid
│   └── worker.js       # Web Worker — algoritmo de optimización por fuerza bruta
├── languages/          # 21 archivos JSON de idiomas
├── images/             # Iconos de objetos (GIF)
└── icons/              # Iconos de aplicación (PWA)
```

### Contribuir

#### Añadir un nuevo idioma

1. Crea un archivo JSON en `languages/` (usa un archivo existente como referencia)
2. Traduce todas las claves
3. Añade el idioma al selector en `js/app.js` (función `buildLanguageSelector`)
4. Prueba en el navegador

#### Reportar problemas

Abre un issue en [GitHub](https://github.com/Miguel962jaliscoedu/optimizador-encantamientos/issues) describiendo el problema.

---

## Credits / Créditos

- Original project by [iamcal](https://github.com/iamcal/enchant-order) — Licensed under MIT
- Minecraft is a trademark of [Mojang Studios](https://www.minecraft.net/)
- Inspired by [Minecraft Search](https://minecraftsearch.com/es-ES) — unofficial wiki

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
