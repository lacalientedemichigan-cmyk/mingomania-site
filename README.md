# Mingomania Site

Proyecto nuevo y separado del sitio anterior.

## Archivos

- `index.html`: landing page principal
- `styles.css`: estilos del sitio

## Host recomendado

`Vercel`

## Nombre sugerido del repo

`mingomania-site`

Si quieres que la URL quede mas limpia, tambien puede ser `mingomania`.

## Integracion pro de YouTube

Esta version ya esta preparada para traer automaticamente los videos del canal usando:

- `YouTube Data API v3`
- `@Mingomania_Music`
- un endpoint seguro en `api/youtube-videos.js`
- variables de entorno para no exponer la API key en el frontend

La pagina consume:

- `YOUTUBE_API_KEY`
- `YOUTUBE_HANDLE`
- `YOUTUBE_MAX_RESULTS`
- `YOUTUBE_RELEASES_PLAYLIST_ID`

## Publicacion recomendada en Vercel

1. Crea un repositorio nuevo en GitHub solo para este proyecto.
2. Sube el contenido de esta carpeta:
   `C:\Users\lacal\OneDrive\Documents\Playground\mingomania-site`
3. Entra a [Vercel](https://vercel.com/) e importa ese repo.
4. En `Environment Variables` agrega:
   - `YOUTUBE_API_KEY`
   - `YOUTUBE_HANDLE` = `@Mingomania_Music`
   - `YOUTUBE_MAX_RESULTS` = `12`
   - `YOUTUBE_RELEASES_PLAYLIST_ID` = `PL5RtHtE2nWBVvzVa_D8cm77Zz1FIDK58-`
5. Haz deploy.

## Nota sobre la API key

- No pegues la API key dentro de `index.html`
- No la subas al repo
- Guardala solo en Vercel como variable secreta

## URL esperada

Vercel te dara una URL publica tipo:

`https://mingomania-site.vercel.app`

## Comandos utiles

Si luego quieres inicializar esta carpeta como repo aparte:

```powershell
cd C:\Users\lacal\OneDrive\Documents\Playground\mingomania-site
git init
git add .
git commit -m "Initial Mingomania website"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/mingomania-site.git
git push -u origin main
```

## Siguiente personalizacion

- Reemplazar textos temporales con bio oficial
- Agregar logo, fotos y portada real
- Agregar redes y contacto reales
- Conectar dominio propio si lo compras despues

