# Contrato Oficial de API REST JSON - Patrimonio Marcona

**Base URL**: `http://<host>:<port>/api/v1`  
**Formato de Transporte**: `application/json`  
**Autenticación**: `Authorization: Bearer <sanctum_token>`

---

## 1. Estándar de Respuesta Unificada (Sobre JSON)

Todas las respuestas emitidas por la API siguen estrictamente una estructura uniforme.

### 1.1 Respuesta Exitosa (2xx)
```json
{
  "success": true,
  "message": "Operación ejecutada exitosamente.",
  "data": { ... }
}
```

### 1.2 Respuesta de Error / Fallo (4xx / 5xx)
```json
{
  "success": false,
  "message": "Mensaje descriptivo del error.",
  "errors": {
    "campo_afectado": [
      "El campo especificado es inválido o requerido."
    ]
  }
}
```

---

## 2. Endpoints de la API (`/api/v1`)

### 2.1 Salud y Diagnóstico

#### `GET /health`
Verifica el estado del servicio Laravel, versión de runtime PHP y conectividad a base de datos.
- **Acceso**: Público
- **Respuesta 200**:
```json
{
  "success": true,
  "message": "Servicio de API operativo.",
  "data": {
    "status": "UP",
    "timestamp": "2026-11-20T04:00:00Z",
    "laravel_version": "12.x",
    "php_version": "8.5.4",
    "database": {
      "connected": true,
      "driver": "mysql"
    }
  }
}
```

---

### 2.2 Autenticación (Sanctum)

#### `POST /auth/login`
Permite autenticación por `dni` o `email` junto con `password`.
- **Acceso**: Público
- **Body**:
```json
{
  "login": "10000001",
  "password": "password",
  "device_name": "Expo Scanner Mobile"
}
```
*(El campo `login` acepta tanto DNI de 8 dígitos como correo electrónico).*
- **Respuesta 200**:
```json
{
  "success": true,
  "message": "Autenticación exitosa.",
  "data": {
    "token": "1|qXy...sanctum_bearer_token",
    "user": {
      "id": 1,
      "name": "Administrador General",
      "email": "admin@marcona.gob.pe",
      "dni": "10000001",
      "rol": "ADMIN",
      "activo": true
    }
  }
}
```

#### `GET /auth/me`
Obtiene los datos del usuario en sesión.
- **Acceso**: Privado (`auth:sanctum`)
- **Respuesta 200**:
```json
{
  "success": true,
  "message": "Perfil de usuario recuperado.",
  "data": {
    "id": 1,
    "name": "Administrador General",
    "email": "admin@marcona.gob.pe",
    "dni": "10000001",
    "rol": "ADMIN",
    "activo": true
  }
}
```

#### `POST /auth/logout`
Revoca el token de acceso actual.
- **Acceso**: Privado (`auth:sanctum`)
- **Respuesta 200**:
```json
{
  "success": true,
  "message": "Sesión cerrada correctamente.",
  "data": null
}
```

---

### 2.3 Oficinas

#### `GET /oficinas`
Listado de oficinas activas de la municipalidad.
- **Acceso**: Privado (`auth:sanctum`)
- **Respuesta 200**:
```json
{
  "success": true,
  "message": "Listado de oficinas.",
  "data": [
    {
      "id": 1,
      "codigo": "ALC-01",
      "nombre": "Alcaldía",
      "sigla": "ALC",
      "activo": true
    }
  ]
}
```

---

### 2.4 Trabajadores

#### `GET /trabajadores`
Listado de personal municipal con su oficina de adscripción.
- **Acceso**: Privado (`auth:sanctum`)
- **Filtros Query**: `?oficina_id=1&activo=1&q=Mendoza`
- **Respuesta 200**:
```json
{
  "success": true,
  "message": "Listado de trabajadores.",
  "data": [
    {
      "id": 1,
      "dni": "45678901",
      "nombre_completo": "Ing. Carlos Mendoza Sánchez",
      "cargo": "Especialista en Sistemas",
      "oficina_id": 4,
      "oficina": {
        "id": 4,
        "nombre": "Subgerencia de Logística y Control Patrimonial",
        "sigla": "LOG"
      },
      "activo": true
    }
  ]
}
```

---

### 2.5 Bienes y Escaneo QR

#### `GET /bienes/qr/{codigo_qr}`
Búsqueda instantánea de un bien patrimonial mediante la lectura de su código QR.
- **Acceso**: Privado (`auth:sanctum`)
- **Parámetro URL**: `codigo_qr` (ej: `MARCONA-EQ-001`)
- **Respuesta 200**:
```json
{
  "success": true,
  "message": "Bien patrimonial localizado.",
  "data": {
    "id": 1,
    "codigo_qr": "MARCONA-EQ-001",
    "codigo_patrimonial": "740877000001",
    "tipo_gestion": "ACTIVO_UNICO",
    "nombre": "Laptop ThinkPad T14 Gen 3",
    "categoria": "Equipos de Cómputo",
    "marca": "Lenovo",
    "modelo": "21AH00BUUS",
    "numero_serie": "PF-4Y2819",
    "estado_conservacion": "BUENO",
    "oficina": {
      "id": 4,
      "nombre": "Subgerencia de Logística",
      "sigla": "LOG"
    },
    "trabajador": {
      "id": 1,
      "dni": "45678901",
      "nombre_completo": "Ing. Carlos Mendoza Sánchez"
    },
    "foto_url": null,
    "observaciones": "Equipo en custodia principal asignado con kit de trabajo."
  }
}
```

#### `GET /bienes`
Consulta paginada y filtrable de bienes.
- **Filtros**: `?oficina_id=1&trabajador_id=1&categoria=Cómputo&q=ThinkPad`

#### `POST /bienes`
Registro de un nuevo bien patrimonial.
- **Body**:
```json
{
  "codigo_qr": "MARCONA-EQ-005",
  "codigo_patrimonial": "740877000005",
  "tipo_gestion": "ACTIVO_UNICO",
  "nombre": "Tablet Galaxy Tab S9",
  "categoria": "Cómputo",
  "marca": "Samsung",
  "modelo": "SM-X710",
  "numero_serie": "R52X100ABC",
  "estado_conservacion": "BUENO",
  "oficina_id": 4,
  "trabajador_id": 1,
  "observaciones": "Asignado para inventario de campo"
}
```

---

### 2.6 Vinculación de Kits Tecnológicos

#### `POST /kits/vincular`
Permite vincular en lote múltiples bienes (por ejemplo: Laptop + Monitor + Impresora + Mouse) a un trabajador responsable, generando automáticamente registros de trazabilidad en `historial_movimientos`.
- **Acceso**: Privado (`auth:sanctum`)
- **Body**:
```json
{
  "trabajador_id": 1,
  "bienes_ids": [1, 2, 3, 4],
  "motivo": "Asignación de Kit Informático Estándar"
}
```
- **Respuesta 200**:
```json
{
  "success": true,
  "message": "Kit de 4 bienes vinculado exitosamente al trabajador.",
  "data": {
    "trabajador_id": 1,
    "total_vinculados": 4,
    "bienes": [
      { "id": 1, "codigo_qr": "MARCONA-EQ-001", "nombre": "Laptop Lenovo ThinkPad" },
      { "id": 2, "codigo_qr": "MARCONA-EQ-002", "nombre": "Monitor Dell 27\"" },
      { "id": 3, "codigo_qr": "MARCONA-EQ-003", "nombre": "Impresora HP LaserJet" },
      { "id": 4, "codigo_qr": "MARCONA-EQ-004", "nombre": "Mouse Logitech MX Master 3S" }
    ]
  }
}
```

#### `GET /kits/trabajador/{id}`
Obtiene el kit consolidado de bienes bajo custodia de un trabajador.
- **Acceso**: Privado (`auth:sanctum`)
- **Respuesta 200**:
```json
{
  "success": true,
  "message": "Kit patrimonial del trabajador.",
  "data": {
    "trabajador": {
      "id": 1,
      "nombre_completo": "Ing. Carlos Mendoza Sánchez",
      "cargo": "Especialista en Sistemas"
    },
    "bienes": [ ... ]
  }
}
```

---

### 2.7 Campañas de Inventario y Verificaciones

#### `GET /campanas/activa`
Obtiene la campaña de inventario vigente en la Municipalidad de Marcona.
- **Respuesta 200**:
```json
{
  "success": true,
  "message": "Campaña activa obtenida.",
  "data": {
    "id": 1,
    "nombre": "Inventario Físico 2026",
    "anio": 2026,
    "fecha_inicio": "2026-01-15",
    "fecha_fin": "2026-12-31",
    "estado": "ACTIVA"
  }
}
```

#### `POST /verificaciones`
Registra la verificación física en campo de un bien escaneado con la app móvil.
- **Body**:
```json
{
  "campana_id": 1,
  "bien_id": 1,
  "estado_verificado": "CONFORME",
  "observacion": "Bien verificado físicamente en oficina de Logística en perfecto estado operativo."
}
```
- **Respuesta 201**:
```json
{
  "success": true,
  "message": "Verificación de inventario registrada.",
  "data": {
    "id": 1,
    "campana_id": 1,
    "bien_id": 1,
    "user_id": 1,
    "estado_verificado": "CONFORME",
    "fecha_verificacion": "2026-11-20T04:15:00Z"
  }
}
```
