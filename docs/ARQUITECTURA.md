# Arquitectura de Software - Sistema Patrimonio Marcona

**Municipalidad Distrital de Marcona**  
Control Patrimonial, Inventario Físico y Trazabilidad por Códigos QR / Barras  
Versión de Arquitectura: 1.0.0

---

## 1. Visión General y Principios de Diseño

El sistema "Patrimonio Marcona" adopta una **arquitectura monorepo desacoplada con patrón Cliente-Servidor**. La lógica de negocio, persistencia relacional, integridad referencial y seguridad residen de forma centralizada en el backend Laravel, mientras que las capas de presentación (Panel Web y App Móvil) operan como clientes agnósticos que consumen la API RESTful JSON versionada.

### Principios Fundamentales:
1. **Desacoplamiento Estricto**: Cero dependencias directas de base de datos o lógica de servidor en los frontends. Toda comunicación ocurre sobre HTTP/HTTPS mediante payloads JSON estandarizados.
2. **Seguridad Stateless con Tokens Bearer**: Autenticación centralizada con Laravel Sanctum emitiendo Personal Access Tokens revocables.
3. **Consistencia de Respuestas**: Cada endpoint responde con el mismo sobre JSON `{ success, message, data, errors? }`.
4. **Trazabilidad Inmutable**: Registro histórico de movimientos de asignación de bienes y verificaciones durante campañas de inventario.

---

## 2. Sistema de Ordenamiento Maestro y Convenciones de Nomenclatura

Para mantener una base de código limpia, escalable y predecible, se define el estándar formal de nomenclatura por capa:

### 2.1 Backend Laravel (PHP / PSR-4)
- **Namespaces y Clases**: Estricto `PascalCase` conforme a PSR-4 y PSR-12.
- **Modelos Eloquent**: `PascalCase` en singular (`app/Models/Bien.php`, `app/Models/Trabajador.php`).
- **Controladores API**: `PascalCase` con sufijo `Controller` dentro del namespace versionado `App\Http\Controllers\Api\V1\` (`BienController.php`, `KitController.php`).
- **Form Requests**: `PascalCase` con sufijo `Request` en `App\Http\Requests\Api\V1\` (`StoreBienRequest.php`, `VincularKitRequest.php`).
- **API Resources (Transformers)**: `PascalCase` con sufijo `Resource` o `Collection` en `App\Http\Resources\Api\V1\` (`BienResource.php`, `TrabajadorResource.php`).
- **Servicios de Dominio**: `PascalCase` con sufijo `Service` en `App\Services\` (`BienService.php`, `KitVinculacionService.php`).
- **Migraciones de Base de Datos**: Minúsculas con timestamps y `snake_case` descriptivo (`YYYY_MM_DD_HHMMSS_create_bienes_table.php`).
- **Rutas de API**: `kebab-case` bajo el prefijo unificado `/api/v1/` (`/api/v1/campanas-inventario`, `/api/v1/auth/login`).
- **Tablas y Columnas**: Plural en `snake_case` para tablas (`bienes`, `campanas_inventario`) y singular en `snake_case` para columnas (`codigo_qr`, `estado_conservacion`).

### 2.2 Frontend Web y Móvil (React / React Native + TypeScript)
- **Componentes**: `PascalCase` para componentes y sus archivos (`QrScanner.tsx`, `BienCard.tsx`, `HeaderBar.tsx`).
- **Carpetas**: `kebab-case` para todas las carpetas dentro del árbol de código (`src/components/common/`, `src/services/api/`, `src/hooks/`).
- **Hooks Personalizados**: `camelCase` con prefijo `use` (`useAuth.ts`, `useQrScanner.ts`).
- **Servicios y Clientes HTTP**: `camelCase` (`apiClient.ts`, `bienService.ts`).
- **Tipos e Interfaces TypeScript**: `PascalCase` para interfaces/tipos (`Bien`, `Trabajador`, `ApiResponse<T>`) dentro de `src/types/index.ts`.
- **Archivos de Configuración y Rutas (Expo Router)**: `kebab-case` o corchetes para parámetros dinámicos (`app/bien/[qr].tsx`, `app/(tabs)/_layout.tsx`).

---

## 3. Topología de Carpetas del Monorepo

```
Inventario/
├── docs/
│   ├── ARQUITECTURA.md          # Especificación arquitectónica maestra
│   └── API_CONTRACT.md          # Contratos de entrada y salida JSON
├── backend/                     # API RESTful Laravel
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/V1/   # Controladores versionados
│   │   │   ├── Requests/Api/V1/      # Validaciones de entrada
│   │   │   └── Resources/Api/V1/     # Formateadores JSON
│   │   ├── Models/                   # Modelos Eloquent
│   │   ├── Services/                 # Reglas de negocio complejas
│   │   └── Traits/
│   │       └── ApiResponse.php       # Estandarización de respuestas JSON
│   ├── config/cors.php               # Reglas CORS para Web y Expo
│   ├── database/
│   │   ├── migrations/               # Esquemas relacionales con FKs
│   │   └── seeders/                  # Datos semilla institucionales Marcona
│   └── routes/
│       └── api.php                   # Definición de rutas /api/v1
├── mobile/                      # Aplicación Móvil Expo Router + NativeWind
│   ├── app/                     # File-based routing (Expo Router)
│   │   ├── (auth)/login.tsx
│   │   ├── (tabs)/              # Tabs: Inicio, Bienes, Escanear, Vincular, Perfil
│   │   └── bien/[qr].tsx        # Detalle de bien escaneado
│   ├── src/
│   │   ├── components/          # Componentes reutilizables
│   │   ├── services/
│   │   │   └── apiClient.ts     # Axios configurado con Bearer Token
│   │   ├── store/               # Gestión de sesión y storage
│   │   ├── theme/colors.ts      # Paleta institucional Marcona
│   │   └── types/index.ts       # Contratos tipados de dominio
│   └── tailwind.config.js       # Tokens de NativeWind
└── web/                         # Panel Administrativo React + Vite
    ├── public/
    │   └── .htaccess            # Reescritura SPA Apache
    ├── src/
    │   ├── components/          # Componentes del Dashboard
    │   ├── pages/               # Vistas principales
    │   ├── services/
    │   │   └── apiClient.ts     # Cliente Axios centralizado
    │   └── types/index.ts       # Definiciones de tipos
    └── tailwind.config.js       # Tokens de diseño Web
```

---

## 4. Modelo de Datos Relacional

El esquema soporta la gestión integral de bienes patrimoniales, kits de trabajo asignados y auditorías de inventario:

```
+---------------+        1:N       +-------------------+
|   oficinas    | ---------------- |   trabajadores    |
+---------------+                  +-------------------+
        |                                    |
        | 1:N                                | 1:N
        v                                    v
+---------------+        1:N       +------------------------+
|    bienes     | <--------------- |  historial_movimientos |
+---------------+                  +------------------------+
        |
        | 1:N
        v
+-------------------------------+
|   verificaciones_inventario   | <--- campanas_inventario (1:N)
+-------------------------------+
        ^
        | N:1
+---------------+
|     users     | (ADMIN, INVENTARIADOR, CONSULTA)
+---------------+
```

---

## 5. Estrategia de Autenticación y Autorización

1. **Autenticación (Laravel Sanctum)**:
   - Los usuarios inician sesión con `dni` o `email` y `password` mediante `POST /api/v1/auth/login`.
   - Se genera un token Sanctum único con expiración configurable.
   - El cliente almacena el token de forma segura (`AsyncStorage` en móvil, `localStorage` o memoria en web) y lo adjunta en cada solicitud subsecuente en la cabecera HTTP:
     ```http
     Authorization: Bearer <access_token>
     ```

2. **Roles de Usuario**:
   - `ADMIN`: Control total (gestión de usuarios, campañas, altas/bajas de bienes, configuración).
   - `INVENTARIADOR`: Operación de campo (escaneo QR, verificación física, vinculación de kits).
   - `CONSULTA`: Solo lectura para reportes y auditoría general.
