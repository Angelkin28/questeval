# 🎨 RESUMEN: Email OTP Personalizado para QuestEval

## ✅ ¿Qué Hemos Creado?

Un **template de email hermoso y profesional** para los códigos OTP que:

### 🎨 Diseño Visual
- ✨ **Gradiente morado** (#667eea → #764ba2) igual que tu frontend
- 🎯 **Código OTP gigante** y fácil de leer (48px, con espaciado)
- 💎 **Diseño premium** con sombras, bordes redondeados y efectos modernos
- 📱 **100% Responsive** (se ve perfecto en móvil, tablet y desktop)

### 🔒 Seguridad y Profesionalismo
- ⏰ Información clara de expiración (60 minutos)
- 🔐 Advertencias de seguridad destacadas
- 📧 Footer profesional con copyright
- 🌐 Enlaces a redes sociales (personalizables)

### 🎯 Branding
- Logo/Icono de QuestEval en el header
- Colores de marca consistentes
- Tipografía moderna y legible
- Mensaje personalizado en español

---

## 📂 Archivos Creados

1. ✅ `docs/EMAIL_TEMPLATE_OTP.html`
   - Template HTML completo listo para usar

2. ✅ `docs/GUIA_EMAIL_TEMPLATE.md`
   - Guía paso a paso de cómo configurarlo en Supabase
   - Opciones de personalización
   - Variantes de colores

---

## 🚀 Cómo Usarlo (3 Pasos)

### Paso 1: Copiar el Template
```bash
# Abre el archivo:
docs/EMAIL_TEMPLATE_OTP.html

# Copia TODO el contenido (Ctrl+A, Ctrl+C)
```

### Paso 2: Ir a Supabase
1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a: **Project Settings** → **Auth** → **Email Templates**
4. Haz clic en **"Magic Link"**

### Paso 3: Pegar y Guardar
1. **BORRA** todo el contenido actual
2. **PEGA** el template de `EMAIL_TEMPLATE_OTP.html`
3. Haz clic en **"Save"**

**¡Listo!** 🎉

---

## 📧 Cómo Se Verá el Email

```
╔═══════════════════════════════════════════════╗
║                                               ║
║     [Fondo con Gradiente Morado]             ║
║                                               ║
║         ┌─────────────────────┐              ║
║         │   [Icono Blanco]    │              ║
║         └─────────────────────┘              ║
║                                               ║
║            QuestEval                          ║
║     Plataforma de Evaluación                 ║
║                                               ║
╚═══════════════════════════════════════════════╝

┌───────────────────────────────────────────────┐
│                                               │
│  ¡Hola! 👋                                    │
│                                               │
│  Gracias por registrarte en QuestEval.       │
│  Para completar tu registro, necesitamos     │
│  verificar tu dirección de correo.           │
│                                               │
│  Tu código de verificación es:               │
│                                               │
│  ╔═══════════════════════════════════════╗   │
│  ║  ┌─────────────────────────────────┐  ║   │
│  ║  │                                 │  ║   │
│  ║  │      1  2  3  4  5  6          │  ║   │
│  ║  │                                 │  ║   │
│  ║  └─────────────────────────────────┘  ║   │
│  ╚═══════════════════════════════════════╝   │
│                                               │
│  ┌─────────────────────────────────────┐     │
│  │ ⏰ Información importante:          │     │
│  │ • Expira en 60 minutos              │     │
│  │ • Solo puedes usarlo una vez        │     │
│  │ • No lo compartas con nadie         │     │
│  └─────────────────────────────────────┘     │
│                                               │
│  ┌─────────────────────────────────────┐     │
│  │ 🔒 Si no solicitaste este código,  │     │
│  │ ignora este email. Estás seguro.   │     │
│  └─────────────────────────────────────┘     │
│                                               │
│         ¿Necesitas ayuda?                    │
│      [Contactar Soporte]                     │
│                                               │
├───────────────────────────────────────────────┤
│                                               │
│         Síguenos en:                         │
│    Twitter | LinkedIn | GitHub               │
│                                               │
│  © 2026 QuestEval. Todos los derechos        │
│  reservados.                                  │
│                                               │
└───────────────────────────────────────────────┘
```

---

## 🎨 Personalización Rápida

### Cambiar Colores

Busca en el template:
```html
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

Reemplaza por:
- **Azul:** `#4299e1 0%, #3182ce 100%`
- **Verde:** `#48bb78 0%, #38a169 100%`
- **Rojo:** `#f56565 0%, #e53e3e 100%`

### Agregar tu Logo

Reemplaza el SVG por:
```html
<img src="https://tu-dominio.com/logo.png" width="60" height="60" alt="QuestEval">
```

### Cambiar Email de Soporte

Busca:
```html
<a href="mailto:soporte@questeval.com">
```

Cambia a tu email real.

---

## ✅ Ventajas de Este Template

### 🎯 Profesional
- Diseño moderno y elegante
- Consistente con tu marca
- Primera impresión impactante

### 📱 Compatible
- Funciona en Gmail, Outlook, Apple Mail, etc.
- Se ve bien en móvil y desktop
- Modo oscuro compatible

### 🔒 Seguro
- Advertencias claras
- Información de expiración
- Instrucciones de uso

### ⚡ Rápido
- HTML ligero
- Carga instantánea
- Sin imágenes pesadas

---

## 🧪 Probar el Email

### Desde Supabase Dashboard
1. Ve a **Authentication** → **Users**
2. Haz clic en **"Invite user"**
3. Ingresa tu email
4. Revisa tu bandeja (o spam)

### Desde tu Backend (cuando esté listo)
```bash
POST http://localhost:5000/api/Users/send-otp
Content-Type: application/json

{
  "email": "tu-email@ejemplo.com"
}
```

---

## 📋 Checklist Final

- [ ] Template copiado de `EMAIL_TEMPLATE_OTP.html`
- [ ] Supabase Dashboard abierto
- [ ] Template pegado en "Magic Link"
- [ ] Guardado correctamente
- [ ] Email de prueba enviado
- [ ] Email recibido y se ve hermoso ✨

---

## 🎉 Resultado Final

Tus usuarios recibirán un email:
- ✨ **Hermoso** y profesional
- 🎨 **Con tu marca** (colores, logo, estilo)
- 📱 **Responsive** (se ve bien en todos los dispositivos)
- 🔒 **Seguro** (con advertencias claras)
- ⚡ **Rápido** (carga instantánea)

**¡Mucho mejor que el email genérico de Supabase!** 🚀

---

## 📞 Soporte

Si tienes dudas:
1. Lee la guía completa: `docs/GUIA_EMAIL_TEMPLATE.md`
2. Revisa el template: `docs/EMAIL_TEMPLATE_OTP.html`
3. Prueba con un email de prueba

---

**¡Disfruta de tus emails hermosos! 💜**
