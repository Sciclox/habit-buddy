# 🌿 HabitBuddy

> **Construye hábitos de forma interactiva, fácil y con una interfaz hermosa.**

HabitBuddy es una aplicación móvil y web minimalista, diseñada bajo el principio de "menos es más". Te ayuda a organizar tus rutinas diarias y semanales sin abrumarte con menús complejos, ofreciendo una experiencia altamente interactiva, visualmente premium y con animaciones gratificantes para incentivar tu constancia.

---

## ✨ Características Principales

*   **🎨 Diseño Premium & Glassmorphism:** Interfaz moderna con tarjetas semi-transparentes, desenfoques sutiles, degradados de color dinámicos y soporte completo para **Modo Claro** y **Modo Oscuro** (que persiste según tus gustos).
*   **🎉 Celebraciones Interactivas:** Cada vez que completas un hábito hoy, la pantalla estalla en una colorida lluvia de **confeti** acompañada de un agradable **efecto de sonido retro-synth** (burbuja pop) autogenerado sin internet.
*   **📸 Fotos de Referencia:** ¿No encuentras el emoji adecuado? Sube una foto directamente desde la galería o cámara de tu celular. Las imágenes se procesan en Base64 y se guardan localmente.
*   **🗄️ Persistencia con SQLite:** En dispositivos móviles, la app utiliza una base de datos física SQLite real para asegurar que tus datos estén 100% protegidos contra limpiezas de caché accidentales.
*   **📱 Diseño Adaptativo Avanzado:**
    *   **Área Segura (Safe Areas):** Adaptado para pantallas con *notches* (cámara en pantalla) y barras de estado.
    *   **Teclado Amigable:** Ajuste inteligente de altura y carruseles horizontales que evitan que el teclado nativo tape los campos al escribir.
    *   **Barra del Teléfono Aislada:** Espaciado inferior calculado para no interferir con los botones virtuales de Android.

---

## 🛠️ Stack Tecnológico

*   **Frontend:** [React](https://react.dev/) + [Vite](https://vite.dev/) (para un arranque instantáneo).
*   **Estilos:** CSS Vanilla estructurado con variables personalizadas (sin librerías pesadas).
*   **Contenedor Nativo:** [Capacitor](https://capacitorjs.com/) (puente nativo moderno para Android).
*   **Base de datos:** `@capacitor-community/sqlite` (SQLite nativo en dispositivos y simulación de LocalStorage en navegador).
*   **Efectos:** `canvas-confetti` + Web Audio API.

---

## 📂 Estructura del Proyecto

```bash
habit-buddy/
├── .github/workflows/    # Automatización de compilaciones
│   └── build-apk.yml     # Compilación automática del APK en la nube
├── android/              # Proyecto nativo generado por Capacitor
├── public/               # Recursos estáticos (favicon, iconos)
├── src/
│   ├── assets/           # Imágenes y logos de la aplicación
│   ├── services/
│   │   └── db.js         # Servicio híbrido SQLite / LocalStorage
│   ├── App.jsx           # Componente principal con toda la lógica y UX
│   ├── index.css         # Sistema de diseño, temas y animaciones
│   └── main.jsx          # Punto de entrada de React
├── capacitor.config.json # Configuración de empaquetado nativo
├── package.json          # Gestión de dependencias
└── README.md             # Esta bonita documentación
```

---

## 🚀 Guía de Inicio Rápido

### 1. Ejecución Local (Desarrollo)

Para correr la aplicación en tu computadora y ver los cambios visuales al instante en el navegador:

1.  Asegúrate de estar en la carpeta del proyecto:
    ```powershell
    cd C:\Users\Lenovo\OneDrive\Documentos\Proyecto\habit-buddy
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    ```
3.  Arranca el servidor local:
    ```bash
    npm run dev
    ```
4.  Abre la dirección que te proporcione la terminal (ej: `http://localhost:5173`) en tu navegador web.

---

### 📦 ¿Cómo compilar y descargar el APK en 5 minutos?

No necesitas instalar pesadas herramientas de desarrollo en tu PC como Android Studio o Gradle. Configuré **GitHub Actions** para compilar la aplicación en la nube de manera gratuita:

1.  Crea un nuevo repositorio en tu cuenta de GitHub (ej: `habit-buddy`).
2.  Sube la carpeta a tu repositorio:
    ```powershell
    git init
    git add .
    git commit -m "feat: initial commit"
    git branch -M main
    git remote add origin https://github.com/TU-USUARIO/TU-REPOSITORIO.git
    git push -u origin main
    ```
3.  Ve a la pestaña **Actions** en tu repositorio de GitHub.
4.  Haz clic en el workflow en ejecución llamado **"Build Android APK"**.
5.  Una vez completado (tarda unos 2 minutos), desplázate hasta la sección **Artifacts** (al final de la página) y haz clic en **`habit-buddy-apk`** para descargar el archivo zip que contiene el `.apk` instalable en tu celular Android.

---

### 📲 Instalación Rápida como PWA (Web App Progresiva)

Si prefieres no instalar archivos APK:
1.  Despliega el código en un hosting gratuito (Vercel, Netlify o GitHub Pages).
2.  Abre el enlace en el navegador Google Chrome o Safari de tu celular.
3.  Toca el botón de opciones del navegador y selecciona **"Añadir a la pantalla de inicio"**.
4.  ¡Listo! La aplicación se instalará como un acceso directo inteligente en tu teléfono, abriéndose a pantalla completa de manera idéntica a una app nativa.
