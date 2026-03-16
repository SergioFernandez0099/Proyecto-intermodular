## Para hacer funcionar el servidor:

1. Ejecutar `composer install` desde la carpeta server. Esto instalará las dependencias.
2. Asegurarse de que la configurción de la base de datos en `.env` es correcta. Si no lo es, los siguientes pasos fallarán.
3. Ejecutar `php artisan migrate:fresh --seed`. Esto inicializará la base de datos, incluyendo datos generados.
4. Ejecutar `composer run dev`. Esto iniciará la API. Podrá comprobrse en http://localhost:8000/api/books