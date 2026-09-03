
## 📄 Descripción de Archivos

### 1. personal.html
**Función**: Panel de acceso para el personal del hospital.

**Características**:
- Login por servicio con contraseña
- Registro individual de viandas
- Selección de guardia (12, 16 o 20 horas)
- Selección de dieta (General, Hiposódica, Diabética, etc.)
- Búsqueda de personal por nombre o DNI
- Advertencia de horario de carga
- Carga masiva para supervisores

**Flujo de trabajo**:
1. El personal ingresa con su contraseña de servicio
2. Verifica el menú del día
3. Selecciona su guardia y dieta
4. Se registra para recibir su vianda
5. Recibe confirmación de registro

### 2. nutricion.html
**Función**: Panel para el equipo de nutrición.

**Características**:
- Publicación de menú por turno (Almuerzo/Cena)
- Edición de menús existentes
- Especificaciones por tipo de dieta
- Visualización de menús del día
- Gestión de postres

**Flujo de trabajo**:
1. El equipo de nutrición publica el menú del día
2. Especifica las adaptaciones por dieta
3. Puede editar el menú si es necesario
4. El menú queda disponible para el personal

### 3. cocina.html
**Función**: Panel de control para el personal de cocina.

**Características**:
- Visualización de pedidos pendientes
- Validación de entregas por ID
- Eliminación de pedidos
- Carga manual de personal
- Estadísticas por tipo de dieta
- Cierre de turno con generación de estadísticas

**Flujo de trabajo**:
1. Visualiza los pedidos pendientes
2. Valida la entrega cuando el personal retira
3. Cierra el turno al finalizar
4. Genera estadísticas automáticas

### 4. appscript.gs
**Función**: Backend del sistema (Google Apps Script).

**Acciones disponibles**:
- `obtener_menu`: Obtiene el menú del día
- `cargar_menu`: Publica un nuevo menú
- `editar_menu`: Modifica un menú existente
- `obtener_pendientes`: Lista pedidos pendientes
- `generar_codigo`: Registra un nuevo pedido
- `verificar_duplicado`: Verifica si ya existe un pedido
- `validar_por_id`: Marca un pedido como entregado
- `eliminar_pedido`: Elimina un pedido
- `cerrar_turno`: Cierra el turno y genera estadísticas

## 🗄️ Base de Datos (Google Sheets)

### Hojas utilizadas:

1. **Menu_Dia**
   - Fecha | Turno | Plato Principal | Postre | Dietas (JSON) | Estado

2. **Registro_Pedidos**
   - ID | Fecha | Turno | Nombre | DNI | Servicio | Guardia | TipoComida | Dieta | Código | Código2 | Estado | Hora Entrega | Tipo

3. **Estadisticas**
   - Fecha | Turno | Total | Entregados | No Entregados

## 🔐 Sistema de Acceso

### Tipos de usuario:
- **Admin**: Acceso al panel de administración
- **Supervisor**: Acceso a carga masiva y todos los servicios
- **Normal**: Acceso solo a su servicio

### Servicios disponibles:
- Enfermería, Camilleros, UTI I y II, Cirugía General, Traumatología, etc.

## ⏰ Horarios de Carga

### Almuerzo:
- **Horario límite**: 10:30
- **Después del límite**: Sujeto a disponibilidad

### Cena:
- **Horario límite**: 18:30
- **Después del límite**: Sujeto a disponibilidad

## 🚀 Instalación

### Requisitos:
1. Cuenta de Google (para Apps Script)
2. Cuenta de GitHub (para hosting)
3. Google Sheets (base de datos)

### Pasos:
1. Crear Google Sheet con las hojas necesarias
2. Configurar Google Apps Script
3. Desplegar como Web App
4. Actualizar la URL en los archivos HTML
5. Subir archivos a GitHub Pages

## 🔧 Configuración

### API URL:
```javascript
const API = 'https://script.google.com/macros/s/TU_ID/exec';
