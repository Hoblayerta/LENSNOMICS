# Community Token Portal 🌐

Una plataforma social descentralizada que revoluciona las interacciones comunitarias a través de la economía de tokens basada en blockchain. Construida sobre el Protocolo Lens, esta plataforma permite a los usuarios participar, ganar y transferir tokens dentro de una red social Web3 dinámica.

## 🚀 Características

- **Creación de Comunidades**: Los usuarios pueden crear sus propias comunidades con tokens personalizados
- **Economía de Tokens**: Cada comunidad tiene su propio token para recompensas y gobernanza
- **Interacciones Sociales**: Publica, comenta y da me gusta para ganar tokens
- **Sistema de Logros**: Gana insignias por contribuciones a la comunidad
- **Integración Web3**: Construido con Protocolo Lens y autenticación blockchain
- **Análisis en Tiempo Real**: Seguimiento de ganancias de tokens y participación

## 🛠️ Stack Tecnológico

- **Frontend**: React + TypeScript con Vite
- **Styling**: TailwindCSS + shadcn/ui
- **Web3**:
  - Lens Protocol para el grafo social
  - ConnectKit + wagmi para conexiones de wallet
  - Thirdweb SDK para interacciones con smart contracts
- **Backend**:
  - Node.js con Express
  - PostgreSQL Database
  - Drizzle ORM

## 🏗️ Configuración Local

1. Clona el repositorio:
   ```bash
   git clone [URL_DEL_REPO]
   cd [NOMBRE_DEL_REPO]
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   Crea un archivo `.env` en la raíz del proyecto con:
   ```env
   DATABASE_URL=postgresql://[usuario]:[contraseña]@[host]:[puerto]/[nombre_db]
   WALLET_CONNECT_PROJECT_ID=19767ce00287f7b76207566f400a8f48
   DEPLOYER_PRIVATE_KEY=[tu_private_key]
   ```

4. Inicializa la base de datos:
   ```bash
   npm run db:push
   ```

5. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

6. Abre el navegador en `http://localhost:5000`

## 🔑 Funcionalidades Principales

### Token LENI
- Dirección del Contrato: `0xC94E29B30D5A33556C26e8188B3ce3c6d1003F86`
- Red: Testnet (Chain ID: 37111)
- Límite de Minteo: 10 LENI por día
- Funciones:
  - Minteo de tokens
  - Quemado de tokens por publicación
  - Visualización de balance en tiempo real

### Sistema de Logros
- Logros desbloqueables por acciones
- Recompensas en tokens LENI
- Progresión de nivel basada en XP
- Tablero de clasificación en tiempo real

## 📝 Notas Importantes

- El contrato de LENI está desplegado en la testnet
- Se requiere una wallet compatible con Web3 (MetaMask recomendado)
- Las transacciones requieren gas en la testnet
- El límite de minteo diario es de 10 LENI por wallet

## 🤝 Contribuir

1. Haz fork del repositorio
2. Crea una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`
3. Commitea tus cambios: `git commit -m 'Añade nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crea un Pull Request

## 📄 Licencia

MIT License