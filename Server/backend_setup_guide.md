# Guía de Arranque en Local — Backend Laravel

## Paso 1 — Clonar e instalar dependencias

```bash
# Clonar el repositorio (o acceder a la carpeta ya clonada)
cd Server/

# Instalar dependencias PHP
composer install

# Instalar dependencias Node (necesario para Vite, aunque el backend no las usa en producción)
npm install
```

---

## Paso 2 — Configurar el archivo `.env`

```bash
# Copiar el archivo de ejemplo
cp .env.example .env
```

---

## Paso 3 — Generar la clave de la aplicación

```bash
php artisan key:generate
```

---

## Paso 4 — Crear la base de datos en MySQL

```bash
# Entra en MySQL
mysql -u root -p

# Crea la base de datos (el nombre debe coincidir con DB_DATABASE en .env)
CREATE DATABASE server CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

EXIT;
```

---

## Paso 5 — Ejecutar las migraciones y poblar la base de datos

```bash
php artisan migrate:fresh --seed
```

> [!NOTE]
> Esto resetea completamente la BD y la vuelve a crear:

---

## Paso 6 — Crear el enlace simbólico de storage

Las portadas de los libros se guardan en `storage/app/public/covers/` pero deben ser accesibles públicamente desde `public/storage/covers/`. Este comando crea el enlace simbólico necesario:

```bash
php artisan storage:link
```

Deberías ver:
```
INFO  The [public/storage] link has been connected to [storage/app/public].
```

> [!IMPORTANT]
> Sin este paso, las URLs de `cover_image` que devuelve la API serán correctas pero los archivos no serán accesibles y el navegador recibirá 404 al intentar cargar las imágenes.

---


### Credenciales del admin (creado por el seeder)

```
Email:    admin@admin.com
Password: password123
Role:     admin
```

---

## Paso 7 — Arrancar el servidor de desarrollo

### Opción A — Script completo (recomendado)

```bash
composer run dev
```

Esto lanza:
- `php artisan serve` → API en `http://localhost:8000`
- `php artisan queue:listen --tries=1` → Worker de colas en BD
- `npm run dev` → Vite (para assets del lado del servidor, si los hay)

### Opción B — Solo el servidor PHP

Si no necesitas las colas ni Vite:

```bash
php artisan serve
```

La API quedará disponible en: **`http://localhost:8000`**

---

## Comandos útiles durante el desarrollo

```bash
# Ver todas las rutas registradas
php artisan route:list

# Limpiar todas las cachés (config, rutas, vistas)
php artisan optimize:clear

# Solo limpiar caché de configuración (tras cambiar .env)
php artisan config:clear

# Rehacer migraciones y re-seedear (borra todos los datos)
php artisan migrate:fresh --seed

# Abrir la consola interactiva de Laravel
php artisan tinker

# Ver los logs en tiempo real
php artisan pail
# o directamente:
tail -f storage/logs/laravel.log

# Ejecutar los tests
php artisan test
# o con composer:
composer run test
```
---