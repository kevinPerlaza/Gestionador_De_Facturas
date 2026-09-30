# 🔧 Configuración de Firebase para Sincronización Multi-Dispositivo

## ⚠️ IMPORTANTE: Primeros Pasos

Tu aplicación ahora está configurada para usar **Firebase Realtime Database** para sincronizar datos entre dispositivos. Sin esto, cada dispositivo/navegador solo verá sus propios datos locales.

## Pasos Rápidos para Configurar (10 minutos)

### 1️⃣ Crear Proyecto Firebase

1. Ve a https://console.firebase.google.com/
2. Haz click en **"Crear proyecto"**
3. Nombre: `gestionador-facturas`
4. Selecciona país: Chile (o tu país)
5. Haz click en **"Crear proyecto"** (espera a que se complete)

### 2️⃣ Configurar Realtime Database

1. En el menú izquierdo, busca **"Base de datos"** (Database)
2. Haz click en **"Crear base de datos"**
3. Selecciona: **"Comenzar en modo de prueba"** 
4. Ubicación: **`southamerica-east1`** (Argentina, más cercano a Chile)
5. Haz click en **"Habilitar"**

### 3️⃣ Configurar Autenticación

1. En el menú izquierdo, busca **"Autenticación"**
2. Haz click en **"Configurar proveedor"**
3. Selecciona **"Anónima"**
4. Haz click en el botón azul **"Habilitar"**
5. Haz click en **"Guardar"**

### 4️⃣ Obtener Tu Configuración

1. Ve a **"Configuración del proyecto"** (rueda engranaje arriba)
2. Copia toda la configuración JSON que aparece
3. Abre el archivo `web/app.js`
4. Busca esta sección (línea 10-18):

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyA7X5z9K2L-M9N3O4P5Q6R7S8T9U0V1W2X",
    authDomain: "gestionador-facturas.firebaseapp.com",
    projectId: "gestionador-facturas",
    storageBucket: "gestionador-facturas.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};
```

5. **Reemplaza** con tu configuración real de Firebase

### 5️⃣ Configurar Reglas de Seguridad

1. En Firebase Console, ve a **"Base de datos"**
2. Haz click en la pestaña **"Reglas"**
3. Reemplaza con esto:

```json
{
  "rules": {
    "invoices": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

4. Haz click en **"Publicar"**

### 6️⃣ Actualizar GitHub Pages

```bash
git add .
git commit -m "v1.5: Add Firebase sync for multi-device"
git push origin main
```

## ✅ Verificar que Funciona

1. Abre tu sitio en un dispositivo
2. Agrega una factura
3. Abre el sitio en otro navegador/dispositivo/teléfono
4. **Deberías ver la misma factura sincronizada automáticamente**

## 🚨 Si Algo Falla

Si no ves los datos sincronizados:

1. Abre **Consola del Navegador** (F12 → Console)
2. Busca mensajes de error rojo
3. Verifica que tu configuración de Firebase es correcta
4. Verifica que autenticación anónima está **HABILITADA**
5. Verifica que las reglas de seguridad están publicadas

## 📱 Alternativa: Usar localStorage (Sin Sincronización)

Si no quieres configurar Firebase, el app funcionará con `localStorage` (datos locales solo):
- Los datos se guardarán en cada dispositivo por separado
- Cada navegador/dispositivo tendrá sus propias facturas

## 🎯 Resultado Final

Una vez configurado, tendrás:
- ✅ Sincronización en tiempo real entre dispositivos
- ✅ Datos guardados en la nube
- ✅ Acceso desde cualquier dispositivo
- ✅ Sin necesidad de servidor propio

¡Listo! 🚀
