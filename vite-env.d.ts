/// <reference types="vite/client" />

// Permite importar archivos CSS en TypeScript
declare module '*.css' {
  const content: string;
  export default content;
}

// Opcional: para imágenes y otros archivos
declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}
