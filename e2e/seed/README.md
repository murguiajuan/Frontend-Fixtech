# Datos semilla para E2E

El script `seed-e2e.mjs` prepara tres cuentas estables para pruebas manuales y
automatizadas:

| Rol           | Correo                   | Contraseña    |
| ------------- | ------------------------ | ------------- |
| Administrador | `admin@fixtech.pe`       | `Admin123!`   |
| Cliente       | `cliente.e2e@fixtech.pe` | `Cliente123!` |
| Técnico       | `tecnico.e2e@fixtech.pe` | `Tecnico123!` |

El técnico queda con estado `APROBADO` y con una especialidad y un distrito
activos. El script es idempotente: reutiliza las cuentas si ya existen y solo
aprueba al técnico cuando hace falta.

## Requisitos

- Backend activo en `http://localhost:8082/api` (o `API_URL`).
- Catálogos de especialidades y distritos con al menos un registro activo.
- Administrador inicial creado por `db/fixtech_db.sql`.

## Ejecución

```bash
API_URL=http://localhost:8082/api node e2e/seed/seed-e2e.mjs
```

O mediante el script de npm:

```bash
npm run e2e:seed
```

## Advertencia

Estas credenciales son públicas y solo sirven para desarrollo o pruebas. No
ejecute el script contra una base de producción. Si una cuenta existe con otra
contraseña, el script falla y no la sobrescribe.
