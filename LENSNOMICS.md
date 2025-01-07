# Community Token Portal (LENSNOMICS) 🌐

A cutting-edge decentralized social platform that revolutionizes community interactions through blockchain technology and innovative tokenization mechanisms.

## 🚀 Features

- **Community Creation**: Users can create their own communities with custom tokens
- **Token Economics**: Each community has its own token for rewards and governance
- **Social Interactions**: Post, comment, and like content to earn tokens
- **Achievement System**: Earn badges for community contributions
- **Web3 Integration**: Built with Lens Protocol and blockchain authentication
- **Real-time Analytics**: Track token earnings and engagement

## 🛠️ Technical Stack

- **Frontend**: React + TypeScript with Vite
- **Styling**: TailwindCSS + shadcn/ui
- **Web3**:
  - Lens Protocol for social graph
  - ConnectKit + wagmi for wallet connections
  - Thirdweb SDK for smart contract interactions (Client ID: 19767ce00287f7b76207566f400a8f48)
- **Backend**:
  - Node.js with Express
  - PostgreSQL Database
  - Drizzle ORM

## 🏗️ Local Setup

1. Clone the repository:
   ```bash
   git clone [REPO_URL]
   cd [REPO_NAME]
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the project root with:
   ```env
   DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[db_name]
   WALLET_CONNECT_PROJECT_ID=19767ce00287f7b76207566f400a8f48
   DEPLOYER_PRIVATE_KEY=[your_private_key]
   ```

4. Initialize the database:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open your browser at `http://localhost:5000`

## 🔑 Core Features

### LENI Token
- Contract Address: `0xC94E29B30D5A33556C26e8188B3ce3c6d1003F86`
- Network: Testnet (Chain ID: 37111)
- Minting Limit: 10 LENI per day
- Functions:
  - Token minting with daily limit
  - Token burning for posts (1 LENI per post)
  - Real-time balance display
  - Achievement rewards in LENI tokens

### Achievement System
- Unlockable achievements through actions
- LENI token rewards for completing achievements
- XP-based level progression
- Real-time leaderboard displaying top users

### Gamification Features
- Progressive onboarding with rewards
- Daily minting limits to encourage engagement
- Token-based posting system
- Achievement-based progression system

## 📝 Important Notes

- LENI contract is deployed on testnet (Chain ID: 37111)
- Web3-compatible wallet required (MetaMask recommended)
- Transactions require testnet gas
- Daily minting limit is 10 LENI per wallet
- Each post costs 1 LENI token to publish

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -m 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Create a Pull Request

## 📄 License

MIT License