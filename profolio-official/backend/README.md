# ProFolio — Etapa 1: base de datos y seguridad (preparación)

**Estado:** diseño de esquema en rama de trabajo. No aplicado a ningún servidor. ProFolio público continúa como demo con inmuebles ilustrativos.

## Separación de entornos
Los proyectos Supabase existentes se denominan Central GO y GTstudio. No contienen un proyecto identificado como ProFolio. **No reutilizar esos proyectos ni ejecutar migraciones sobre ellos.** Crear primero un proyecto de ProFolio independiente, revisar las condiciones de facturación y guardar sus credenciales usando secretos de Vercel, nunca en GitHub.

## Modelo previsto
- `profolio_profiles`: perfil del agente, canal de contacto optativo, rol agente/admin sin autoascenso.
- `profolio_listings`: estado de publicación, moderación, ubicación, precio, operación y atributos.
- `profolio_listing_photos`: referencias a archivos privados con orden de portada.
- `profolio_leads`: solicitudes privadas, consentimiento obligatorio; **sin acceso de inserción anónimo**.
- `profolio_listing_events`: vistas y eventos capturados por un servidor, no datos locales de demostración.

El archivo [001_mvp_schema.sql](./001_mvp_schema.sql) define RLS y privilegios por columna. Un agente puede administrar solo sus inmuebles. El administrador puede aprobar y rechazar mediante `profolio_moderate_listing`. Cambios materiales a un inmueble invalidan aprobaciones previas.

## Lo que falta para conectar
1. Confirmar el costo del nuevo proyecto y crear Supabase aislado para ProFolio.
2. Probar la migración en una base de datos vacía antes de aplicarla a un ambiente real.
3. Configurar autenticación de correo con recuperación de cuenta, redirecciones y límites.
4. Crear un bucket de fotos **privado** con política de subida/borrado por propietario, límites y generación segura de URLs firmadas.
5. Implementar endpoints/Edge Functions con validación, rate limit/captcha, consentimiento y antispam para enviar contactos.
6. Construir formularios de alta, edición, pausa y borrado, con validaciones de imágenes y direcciones.
7. Incorporar al frontend una capa de datos real: anuncios publicados/moderados desde Supabase. Mantener los ejemplos solamente en modo demo.
8. Capturar métricas de forma confiable y deduplicada, con retención y privacidad.
9. Probar políticas con cuentas diferentes: visitante, agente A, agente B, administrador.
10. Validar el límite comercial propuesto de 3 publicaciones gratuitas con el equipo antes de activarlo; precios Pro/Equipo sin aprobar.

## Pruebas obligatorias (deberán automatizarse)
- Anónimo no puede crear perfiles, editar publicaciones, acceder a leads ni consultar inmuebles privados.
- Agente A no puede leer perfiles privados, leads ni borradores del agente B.
- Un agente no puede cambiar su rol o aprobar su propio anuncio.
- Una ficha aprobada deja de estar publicada públicamente al modificarse sus atributos y requiere nueva moderación.
- Solo datos publicados y aprobados aparecen en la búsqueda.
- Rechazos, pausas, subidas fallidas y recuperación de contraseña muestran mensajes comprensibles.
- API no expone claves secretas; Storage privado no expone fotos no autorizadas.
- No hay pagos ni límites aplicados hasta aprobar el modelo comercial.

## Límite importante
La migración no habilita por sí misma cuentas, contactos ni persistencia. No debe describirse la plataforma como un portal en producción de clientes hasta completar el frontend, el backend y las pruebas de seguridad.
