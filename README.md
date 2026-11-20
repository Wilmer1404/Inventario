# Patrimonio Marcona - Sistema de Control Patrimonial e Inventario

Sistema integral de gestión de bienes patrimoniales, trazabilidad de inventario físico y vinculación de kits tecnológicos con lectura de códigos QR y códigos de barras para la **Municipalidad Distrital de Marcona**.

---

## 🏛️ Estructura del Monorepo

El proyecto está diseñado como un monorepo desacoplado con arquitectura cliente-servidor, donde cada aplicación tiene responsabilidades bien delimitadas:

```
├── backend/          # API RESTful en Laravel 12 + Sanctum + MySQL / SQLite
├── mobile/           # Aplicación móvil en React Native + Expo Router + NativeWind
├── web/              # Panel administrativo en React + Vite + TypeScript + Tailwind CSS
├── docs/             # Especificaciones técnicas, arquitectura y contratos de API
│   ├── ARQUITECTURA.md
│   └── API_CONTRACT.md
├── .gitignore        # Configuración global de exclusiones Git
└── README.md         # Documentación general y guía de ejecución
```

---

## 🛠️ Requisitos Previos

- **PHP**: `>= 8.2` (con extensiones `pdo_mysql`, `pdo_sqlite`, `mbstring`, `xml`, `dom`, `curl`)
- **Composer**: `>= 2.2`
- **Node.js**: `>= 20.x`
- **NPM**: `>= 10.x`
- **Expo Go** (opcional en dispositivo físico Android/iOS para pruebas del aplicativo móvil)

---

## 🚀 Guía de Ejecución Local

### 1. Backend (`backend/`) - Laravel API

```bash
cd backend

# 1. Instalar dependencias PHP
composer install

# 2. Configurar entorno
cp .env.example .env
php artisan key:generate

# 3. Configurar base de datos en .env (MySQL o SQLite)
# Si usas SQLite:
# touch database/database.sqlite
# DB_CONNECTION=sqlite

# 4. Ejecutar migraciones y semillero inicial de Marcona
php artisan migrate:fresh --seed

# 5. Generar enlace simbólico de almacenamiento público
php artisan storage:link

# 6. Iniciar servidor de desarrollo
php artisan serve --port=8000
```
- Endpoint Base API: `http://127.0.0.1:8000/api/v1`
- Verificación de Estado: `http://127.0.0.1:8000/api/v1/health`
- Credenciales iniciales de prueba (Seeder):
  - **DNI / Email**: `10000001` / `admin@marcona.gob.pe`
  - **Contraseña**: `password`
  - **Rol**: `ADMIN`

---

### 2. Panel Web Administrativo (`web/`) - React + Vite

```bash
cd web

# 1. Instalar dependencias
npm install

# 2. Configurar entorno
cp .env.example .env

# 3. Iniciar servidor en modo desarrollo
npm run dev

# 4. Para compilar bundle de producción
npm run build
```
- URL local: `http://localhost:5173`
- Configuración en `.env`: `VITE_API_URL=http://127.0.0.1:8000/api/v1`

---

### 3. Aplicativo Móvil (`mobile/`) - React Native + Expo Router

```bash
cd mobile

# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Actualizar EXPO_PUBLIC_API_URL con la IP local de tu máquina en la red Wi-Fi
# Ejemplo: EXPO_PUBLIC_API_URL=http://192.168.1.100:8000/api/v1

# 3. Iniciar entorno Expo
npx expo start

# 4. Validar tipado TypeScript
npx tsc --noEmit
```

---

## 📑 Documentación Adicional

- [Guía de Arquitectura y Convención de Archivos](file:///home/wilmer/Documentos/Inventario/docs/ARQUITECTURA.md)
- [Contrato Oficial de API REST JSON](file:///home/wilmer/Documentos/Inventario/docs/API_CONTRACT.md)

---

## 🎨 Paleta Institucional (Marcona)

| Color | Hex | Uso |
|---|---|---|
| **Marcona Red** | `#B91C1C` | Color primario de marca, acentos de alerta y cabeceras |
| **Marcona Blue** | `#1E3A8A` | Fondo institucional, barras de navegación y tarjetas clave |
| **Marcona Gold** | `#D97706` | Acentos de advertencia, estados de inventario y medallas |
| **Marcona Green** | `#15803D` | Estados activos, bienes verificados y confirmaciones |
