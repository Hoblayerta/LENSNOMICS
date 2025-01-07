# Community Token Portal 🌐

A cutting-edge decentralized social platform that revolutionizes community interactions through blockchain-powered token economics. Built on Lens Protocol, this platform enables users to engage, earn, and transfer tokens within a dynamic Web3 social network that rewards meaningful participation.

## 🚀 Features

- **Community Creation**: Users can create their own communities with custom tokens
- **Token Economics**: Each community has its own token for rewards and governance
- **Social Interactions**: Post, comment, and like content to earn tokens
- **Achievement System**: Earn badges for community contributions
- **Web3 Integration**: Built on Lens Protocol with blockchain-based authentication
- **Real-time Analytics**: Track token earnings and community engagement

## 🛠️ Technical Stack

- **Frontend**: React + TypeScript with Vite
- **Styling**: TailwindCSS + shadcn/ui
- **Web3**:
  - Lens Protocol for social graph
  - ConnectKit + wagmi for wallet connections
  - Polygon Mumbai testnet
- **Backend**:
  - Node.js with Express
  - Neon Database (Serverless Postgres)
  - Drizzle ORM

## 🏗️ Architecture

- Decentralized social graph powered by Lens Protocol
- Community-specific token contracts for incentivization
- Real-time token distribution based on user engagement
- Achievement system with on-chain verification

## 🚦 Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```env
   DATABASE_URL=your_neon_database_url
   WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id
   ```

4. Initialize the database:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## 🌍 Deployment

The application is configured to deploy on Replit with the following features:
- Automatic HTTPS
- PostgreSQL database integration
- Environment variable management
- Real-time collaboration

## 🤝 Contributing

This project is open for contributions. Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## 📄 License

MIT License

## 🏆 Hackathon Submission

This project was built for [Hackathon Name] to demonstrate the potential of Web3 social platforms powered by Lens Protocol. It showcases:

- Integration with Lens Protocol on testnet
- Custom token economics for community engagement
- Achievement system with on-chain verification
- Real-time analytics and token distribution

### Demo Links
- Live Demo: [Your Replit URL]
- Video Demo: [Add your demo video link]
- Pitch Deck: [Add your pitch deck link]

### Team
- [Your Name/Team Members]
- Contact: [Your Contact Information]

### Next Steps
- [ ] Deploy to Lens Protocol mainnet
- [ ] Implement governance features
- [ ] Add advanced analytics dashboard
- [ ] Mobile app development
