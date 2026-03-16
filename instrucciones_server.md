## Para hacer funcionar el servidor:

1. Ejecutar `composer install` desde la carpeta server. Esto instalará las dependencias.
2. Asegurarse de que la configurción de la base de datos en `.env` es correcta.
    * En caso de que no haya archivo `.env`, se puede hacer copiando `.env.example`, y ejecutando el comando `php artisan key:generate`.
    * Si fuera necesario, crear una base de datos antes
3. Ejecutar `php artisan migrate:fresh`. Esto inicializará la base de datos.
    * El comando `php artisan migrate:fresh --seed` incluye datos generados.
4. Ejecutar `composer run dev`. Esto iniciará la API. Podrá comprobrse en http://localhost:8000/api/books