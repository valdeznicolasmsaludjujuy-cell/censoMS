# Datos en Control

necesito una aplicacion que me permita realizar el completado de informacion de acuerdo a lo que tenga almacenada en mi base de datos, donde en primer lugar se muestre una planilla con 20 registros que sea paginada de nodo que luego muestre otros 20 y asi sucesivamente, al final de cada registro necesito un icono de lapiza de modo que abra otra ventana con los datos de la persona y permita editar algunos campos y una vez que los datos esten correctos necesito un boton de guardar y se separe de los datos de la primera ventana y se alojen en otra ventana que sea de datos controlados

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b19ba299-6561-439d-982e-621cc22068d3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Administración de usuarios

Solo los usuarios con rol `admin` pueden crear cuentas, asignar roles o modificar catálogos.
`carga` puede agregar y completar registros de toda la planilla; `consulta` tiene acceso de solo
lectura. Las cuentas creadas reciben una contraseña temporal y deben cambiarla en su primer ingreso.

Aplicá `drizzle/migrations/0007_gestion_de_usuarios.sql` en Supabase SQL Editor después de contar
con las tablas y funciones de roles existentes. No vuelvas a ejecutar la migración inicial sobre
una base ya configurada.

El servidor de la aplicación necesita `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` y
`SUPABASE_SERVICE_ROLE_KEY` en su entorno privado para crear cuentas y restablecer contraseñas.
Nunca expongas la clave `SERVICE_ROLE` en variables `VITE_` ni en código de navegador. Desactivá
también el registro público desde la configuración de autenticación de Supabase; las cuentas sin
rol no pueden consultar datos incluso antes de desactivar esa opción.

## Importar personal desde CSV

En **Datos maestros → Importar personal**, descargá la plantilla CSV o guardá la hoja de Excel como
CSV UTF-8. El importador admite hasta 1.000 filas, valida DNI/CUIL y los catálogos, omite
duplicados y permite descargar un reporte con las filas que requieren corrección. La importación
está disponible solo para administradores.

Antes de usarla, aplicá `drizzle/migrations/0012_importar_personal_csv.sql` en Supabase SQL Editor.
Como `legajo` no tiene un campo UDO directo y el archivo no incluye sector, la UDO se valida pero
no se guarda; los nuevos registros aparecerán sin UDO hasta asignarles un sector desde la
estructura organizativa.
