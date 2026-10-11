# ProFolio · ejecución por etapas (11 oct 2026)

Documento operativo derivado de la hoja de ruta ProFolio 2026. El inventario de la demo es ilustrativo y no representa anuncios inmobiliarios verificados.

## Etapa 0 — preparación de demostración (EN CURSO)
- [x] Auditar la estructura inicial del repositorio y la demo en `profolio-official/`.
- [x] Preparar vista de mapa protagonista en escritorio y fichas inferiores desplazables en móvil (`etapa0-mapa.css`).
- [x] Centrar el mapa y abrir la ficha desde el marcador o la tarjeta (`map-fix-v4.js`).
- [x] Añadir carga diferida/decodificación asíncrona a fotos de tarjetas.
- [x] Corregir colores de panel, popup y control de mapa para respetar vino tinto/amarillo.
- [ ] Probar el diseño en Safari y Chrome, móvil de 320 px, móvil grande, tableta y escritorio.
- [ ] Revisar que controles, etiquetas y pines no se superpongan con datos reales de uso.
- [ ] Comprobar recorridos Open Tour, Turbo, idioma, accesibilidad, filtros, perfil y sonido.
- [ ] Obtener vista previa Vercel y verificar consola/red antes de integrar.
- [ ] Confirmar vía navegador que no aparece texto literal `\\n` (no se reproduce en el HTML examinado).
- [ ] Contacto verificable con agente real: NO disponible en inventario ilustrativo; bloquear la salida comercial hasta conectar canal autorizado.

## Etapa 1 — MVP estable (PENDIENTE)
- [ ] Autenticación real, recuperación de contraseña y gestión segura de roles.
- [ ] Persistencia de perfiles, imágenes e inmuebles en servidor; CRUD completo.
- [ ] Reglas que impidan leer o editar inmuebles privados de otro agente.
- [ ] Datos de anuncios verificables y contacto real por propiedad.
- [ ] Pruebas de rendimiento, imágenes, mapa, errores, respaldo y reversión.

## Etapa 2 — freemium (PENDIENTE)
- [ ] Límite propuesto: 3 propiedades activas gratis por agente.
- [ ] Métricas diferenciadas de visitas a ficha y clics de contacto, con período.
- [ ] Administración de límites y consumo. Validar el límite de tres con pilotos.

## Etapa 3 — monetización (PENDIENTE)
- [ ] Validar precios Pro y Equipo (sin tarifas aprobadas).
- [ ] Definir facturación, cancelaciones, soporte, impuestos y protección de datos.
- [ ] Activar pasarela solo tras pruebas y aprobación.

## Etapa 4 — diferenciación (PENDIENTE)
- [ ] Recorridos 360°, servicios cercanos, analítica avanzada y automatizaciones cuando exista demanda verificada.

## Incidencias
| Nivel | Incidencia | Estado |
| --- | --- | --- |
| P0 | No existe contacto con agente verificado asociado a cada inmueble de ejemplo. | Bloquea comercialización, no la demo |
| P0 | Demo utiliza almacenamiento local para perfil, favoritos, borradores y recorridos. | Requiere backend para clientes |
| P1 | Variaciones de viewport y superposición de tarjetas/controles. | CSS inicial propuesto; validar visualmente |
| P1 | Marcador sin acceso directo a ficha completa. | Código modificado; pendiente prueba navegador |
| P1 | Carga de fotos sin atributos de carga diferida en tarjetas. | Corregido en código |
| P2 | Agrupación/clustering real de marcadores y servicios de búsqueda geográfica. | No implementado |
| P2 | Métricas con eventos de contacto verificables. | No implementado |

## Verificación de este lote
Se comprobó por inspección estática que el JavaScript modificado tiene sintaxis válida, que las llaves CSS están equilibradas y que el HTML importa la nueva hoja de estilos. Esto **no equivale** a pruebas E2E ni una aprobación para producción.

**No fusionar ni desplegar la rama antes de una revisión visual y funcional de la preview.**
