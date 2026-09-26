# 📚 GUÍA COMPLETA: MONTAR EL PROYECTO EN GITHUB

Sigue estos pasos para subir tu proyecto a GitHub y publicarlo en GitHub Pages.

## 📋 REQUISITOS PREVIOS

✅ Tener una cuenta de GitHub (https://github.com)  
✅ Tener Git instalado en tu computadora  
✅ Terminal/CMD

## ⬇️ PASO 1: INSTALAR GIT

### Windows
1. Descarga desde: https://git-scm.com/download/win
2. Ejecuta el instalador
3. Acepta todas las opciones predeterminadas
4. Reinicia la computadora

### Verificar instalación
```bash
git --version
```

Deberá mostrar una versión (ej: git version 2.33.0)

---

## 🔑 PASO 2: CONFIGURAR GIT LOCALMENTE

Abre terminal/CMD y ejecuta:

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tuemail@example.com"
```

**Ejemplo:**
```bash
git config --global user.name "Kevin López"
git config --global user.email "kevin@example.com"
```

Verificar configuración:
```bash
git config --global user.name
git config --global user.email
```

---

## 🆕 PASO 3: CREAR REPOSITORIO EN GITHUB

### En GitHub.com:

1. Inicia sesión en tu cuenta
2. Click en **+** (esquina superior derecha)
3. Selecciona **New repository**
4. Completa los campos:
   - **Repository name**: `contador-de-facturas`
   - **Description**: "Sistema de gestión de facturas web"
   - **Public**: Selecciona (para que sea visible)
   - **Initialize**: NO marques "Add a README" (ya tenemos uno)
5. Click en **Create repository**

Copiarás la URL del repositorio (aparece en la pantalla)
Ejemplo: `https://github.com/tuusuario/contador-de-facturas.git`

---

## 📤 PASO 4: INICIALIZAR GIT EN TU PROYECTO

Abre terminal/CMD en la carpeta del proyecto:

```bash
# Navega a tu carpeta
cd "c:\Users\kevin\OneDrive\Escritorio\Contador de facturas"

# Inicializar git
git init

# Ver estado
git status
```

Deberá mostrar muchos archivos en rojo (no rastreados)

---

## 📝 PASO 5: AGREGAR ARCHIVOS AL STAGING

```bash
# Agregar todos los archivos
git add .

# Ver estado
git status
```

Todos los archivos deberán estar en verde ahora

---

## 💾 PASO 6: CREAR PRIMER COMMIT

```bash
git commit -m "Inicial: Sistema de Gestión de Facturas v1.3"
```

Este es tu primer punto de guardado

---

## 🔗 PASO 7: CONECTAR CON GITHUB

```bash
# Agregar el repositorio remoto
git remote add origin https://github.com/tuusuario/contador-de-facturas.git

# Verificar conexión
git remote -v
```

**IMPORTANTE**: Reemplaza `tuusuario` con tu usuario de GitHub

---

## ⬆️ PASO 8: SUBIR A GITHUB (PUSH)

```bash
# Subir al repositorio
git branch -M main
git push -u origin main
```

Te pedirá autenticación:
- **Usuario**: Tu usuario de GitHub
- **Token**: Tu Personal Access Token (PAT)

### Crear Personal Access Token:

Si no tienes token:

1. En GitHub: **Settings** → **Developer settings** → **Personal access tokens**
2. Click en **Generate new token**
3. Nombre: "Git Token"
4. Selecciona: `repo` y `workflow`
5. Expiration: 90 días
6. Click **Generate**
7. **Copia el token** (lo necesitarás ahora)

Usa el token como contraseña

---

## ✅ VERIFICACIÓN

Ve a tu repositorio en GitHub:
```
https://github.com/tuusuario/contador-de-facturas
```

Deberás ver:
- ✅ Carpeta `web/` con los archivos
- ✅ Carpeta `docs/` para GitHub Pages
- ✅ Carpeta `.github/` con workflows
- ✅ Archivo `.gitignore`
- ✅ Archivo `package.json`
- ✅ Archivo `README.md`

---

## 🌐 PASO 9: ACTIVAR GITHUB PAGES

1. Ve a tu repositorio en GitHub
2. Click en **Settings** (pestaña)
3. En el menú izquierdo: **Pages**
4. En **Source**:
   - **Branch**: Selecciona `main`
   - **Folder**: Selecciona `/docs`
5. Click en **Save**

GitHub te mostrará una URL:
```
https://tuusuario.github.io/contador-de-facturas
```

**Espera 1-2 minutos** para que se publique

---

## 🔄 PASO 10: HACER CAMBIOS FUTUROS

Cada vez que hagas cambios:

```bash
# 1. Ver qué cambió
git status

# 2. Agregar cambios
git add .

# 3. Crear commit
git commit -m "Descripción del cambio"

# 4. Subir a GitHub
git push
```

**Ejemplo:**
```bash
git commit -m "Agregado filtro por tiempo"
git push
```

---

## 🧹 LIMPIAR ARCHIVOS NO NECESARIOS

El proyecto ya está limpio. Si necesitas eliminar algo:

```bash
# Ver archivos que git va a ignorar
git status --ignored

# Eliminar archivos del repositorio (sin borrar localmente)
git rm --cached archivo.txt
git commit -m "Eliminado archivo innecesario"
git push
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "fatal: not a git repository"
```bash
# Estás en carpeta equivocada
cd "c:\ruta\correcta"
git init
```

### Error: "fatal: The current branch main has no upstream branch"
```bash
git push -u origin main
```

### Error de autenticación
1. Crea un Personal Access Token en GitHub
2. Usa el token como contraseña
3. O configura SSH (más avanzado)

### Cambios no se ven en GitHub Pages
1. Espera 1-2 minutos
2. Limpia caché del navegador (Ctrl+Shift+Del)
3. Verifica que publicaste correctamente

### Cambios en `/docs` no aparecen en el sitio
1. Verifica que el source sea `/docs`
2. Espera 1-2 minutos
3. Revisa en Settings → Pages

---

## 📊 ÁRBOL DE COMANDOS ÚTILES

```bash
# Ver historial de commits
git log

# Ver cambios no publicados
git status

# Deshacer último commit (cuidado)
git reset --soft HEAD~1

# Ver diferencias
git diff

# Crear rama nueva
git checkout -b nueva-rama

# Cambiar de rama
git checkout main

# Ver todas las ramas
git branch -a
```

---

## ✨ RESULTADO FINAL

Tendrás:

✅ Repositorio en GitHub  
✅ Código versionado  
✅ Sitio web en GitHub Pages  
✅ URL pública: `https://tuusuario.github.io/contador-de-facturas`  
✅ Sistema de historial de cambios  
✅ Backup en la nube  

---

## 📞 PRÓXIMOS PASOS

1. **Compartir**: Comparte tu URL con otros
2. **Colaborar**: Invita a colaboradores
3. **Automatizar**: Los workflows en `.github/workflows/` pueden ejecutar tests
4. **Mejorar**: Agrega más características

---

## 🎓 RECURSOS ÚTILES

- Git Tutorial: https://git-scm.com/book/es/v2
- GitHub Docs: https://docs.github.com
- GitHub Pages: https://pages.github.com
- Markdown Guide: https://www.markdownguide.org/

---

**¡Tu proyecto está en GitHub! 🎉**

Para compartir: `https://github.com/tuusuario/contador-de-facturas`  
Para usar: `https://tuusuario.github.io/contador-de-facturas`

