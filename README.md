# 🧾 Sistema de Gestión de Facturas - v1.3

Un sistema web profesional para gestionar facturas con funcionalidades avanzadas de filtrado, exportación y seguimiento automático.

## ✨ Características

✅ **ID Automático** - Genera IDs sin duplicidades (FAC-001, FAC-002...)  
✅ **Validación de Fechas** - Formato DD/MM/YYYY automáticamente validado  
✅ **Impuestos Automáticos** - Calcula 19% automáticamente  
✅ **Datos del Cliente** - Almacena teléfono y dirección (opcional)  
✅ **Indicador de Tiempo** - 🟢 Verde (0-14d), 🟠 Naranja (15-29d), 🔴 Rojo (30+d)  
✅ **Filtrado Avanzado** - Por cliente, monto, fecha, estado y tiempo  
✅ **Exportación Múltiple** - JSON, Excel (CSV), PDF  
✅ **Almacenamiento Local** - localStorage, sin servidor necesario  
✅ **Responsive** - Funciona en desktop, tablet y móvil  

## 🚀 Inicio Rápido

### 1. Clona el repositorio
```bash
git clone https://github.com/tuusuario/contador-de-facturas.git
cd contador-de-facturas
```

### 2. Abre la aplicación
```bash
# Simplemente abre en tu navegador:
web/index.html
```

### 3. Comienza a usar
- Completa los datos de la factura
- El ID se genera automáticamente
- Los impuestos se calculan automáticamente
- Haz clic en "Agregar Factura"

## 📋 Uso

### Agregar Factura
- **ID**: Auto-generado (FAC-001, FAC-002...)
- **Fecha**: Selecciona del calendar picker
- **Cliente**: Nombre de la empresa (requerido)
- **Teléfono**: Número del cliente (opcional)
- **Dirección**: Ubicación del cliente (opcional)
- **Monto**: Cantidad en dinero
- **Impuestos**: Se calcula automáticamente al 19%
- **Aseo**: Tipo de servicio (6 opciones o personalizado)
- **Estado**: Pagada, Pendiente, Vencida

### Filtrar Facturas
- Por cliente
- Por rango de monto
- Por rango de fecha
- Por estado (Pagada, Pendiente, Vencida)
- Por tiempo desde el aseo (🟢 Verde, 🟠 Naranja, 🔴 Rojo)

### Exportar Datos
- **JSON**: Para respaldo y sincronización
- **Excel**: Archivo CSV abre directamente en Excel
- **PDF**: Abre ventana de impresión, guarda como PDF

## 📁 Estructura del Proyecto

```
contador-de-facturas/
├── web/                          # Aplicación web
│   ├── index.html               # HTML principal
│   ├── app.js                   # Lógica JavaScript
│   ├── style.css                # Estilos CSS
│   ├── logo.svg                 # Logo de la marca
│   └── favicon.svg              # Ícono del sitio
│
├── docs/                        # Documentación GitHub Pages
│   ├── index.md
│   ├── README.md
│   └── _config.yml
│
├── .github/
│   └── workflows/
│       └── tests.yml            # CI/CD pipeline
│
├── .gitignore                   # Archivos a ignorar
├── package.json                 # Metadata del proyecto
└── README.md                    # Este archivo
```

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Storage**: localStorage (navegador)
- **Compatibilidad**: Todos los navegadores modernos
- **Sin dependencias externas**

## 💾 Almacenamiento

Todos los datos se guardan en `localStorage` del navegador:
- ✅ Datos locales, 100% privados
- ✅ Sin servidor necesario
- ✅ Persistencia automática
- ✅ Funciona offline
- ⚠️ Se pierden si se limpia caché del navegador (hacer backups exportando JSON)

## 📊 Formatos de Exportación

### JSON
```json
{
  "fecha_exportacion": "25/01/2024 14:30:45",
  "total_facturas": 3,
  "monto_total": 4000.00,
  "facturas": [...]
}
```

### Excel/CSV
Abre directamente en Excel con columnas:
- ID, Fecha, Cliente, Monto, Impuestos, Total, Aseo, Estado

### PDF
Tabla profesional con:
- Encabezados con estilos
- Resumen de totales
- Colores corporativos
- Listo para imprimir

## 🎨 Colores y Diseño

- **Verde oscuro** (#1B5E4F): Color primario
- **Naranja** (#FF9D3C): Color acento
- **Responsive design**: Desktop, tablet, móvil

## ⚙️ Configuración

No requiere configuración. Simplemente abre `web/index.html` en un navegador moderno.

## 🔄 Publicar en GitHub Pages

Para publicar en GitHub Pages:

1. En GitHub, ve a **Settings**
2. Scroll a **Pages**
3. Selecciona rama: `main` o `master`
4. Selecciona carpeta: `/docs`
5. Guarda

Tu sitio estará disponible en: `https://tuusuario.github.io/contador-de-facturas`

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/mejora`)
3. Commit cambios (`git commit -m 'Agrega mejora'`)
4. Push a la rama (`git push origin feature/mejora`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo licencia MIT.

---

**Versión**: 1.3  
**Estado**: ✅ Producción  
**Última actualización**: 2026

