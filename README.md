# Formance Ledger Visualizer

A comprehensive UI visualization tool that demonstrates the power and versatility of Formance Ledger across various use cases and industries. This project showcases how Formance Ledger can be used for e-commerce, banking, accounting, gaming, and marketplace applications.

## 🚀 Features

- **Interactive Dashboard**: Real-time visualization of ledger data and statistics
- **Multiple Use Cases**: Demonstrations for different industries and applications
- **Data Visualization**: Charts, graphs, and analytics using Recharts
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🎯 Use Cases Demonstrated

### 1. E-Commerce
- Payment processing and order management
- Revenue tracking and analytics
- Multi-payment method support
- Customer transaction history

### 2. Banking
- Account management and transfers
- Deposit and withdrawal tracking
- Interest calculations
- Multi-currency support

### 3. Accounting
- Double-entry bookkeeping
- Financial reporting (P&L, Balance Sheet)
- Expense categorization
- Budget tracking

### 4. Gaming
- Virtual currency management
- In-game microtransactions
- Player wallet systems
- Reward distribution

### 5. Marketplace
- Multi-vendor payment processing
- Commission tracking
- Escrow services
- Vendor settlement

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Notifications**: React Hot Toast

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/formance-ledger-visualizer.git
cd formance-ledger-visualizer
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main layout component
│   ├── StatsCard.tsx   # Statistics display card
│   ├── TransactionList.tsx # Transaction list component
│   └── AccountBalance.tsx  # Account balance component
├── pages/              # Page components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── ECommerceDemo.tsx
│   ├── BankingDemo.tsx
│   ├── AccountingDemo.tsx
│   ├── GamingDemo.tsx
│   └── MarketplaceDemo.tsx
├── hooks/              # Custom React hooks
│   └── useLedger.ts    # Ledger data hooks
├── services/           # API services
│   └── ledgerService.ts # Formance Ledger integration
├── types/              # TypeScript type definitions
│   └── ledger.ts       # Ledger-related types
├── utils/              # Utility functions
│   └── cn.ts          # Class name utility
└── assets/             # Static assets
```

## 🔧 Configuration

The application uses mock data for demonstration purposes. To connect to a real Formance Ledger instance:

1. Update the `ledgerService.ts` file with your Formance Ledger API endpoint
2. Replace mock data with actual API calls using the Formance SDK
3. Configure authentication and API keys as needed

## 📊 Data Visualization

The application includes various chart types:
- Line charts for trend analysis
- Bar charts for category comparisons
- Pie charts for distribution visualization
- Area charts for cumulative data

## 🎨 UI Components

- **StatsCard**: Displays key metrics with trend indicators
- **TransactionList**: Shows transaction history with details
- **AccountBalance**: Displays account balances and status
- **Layout**: Responsive navigation and page structure

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy with zero configuration

### Netlify
1. Build the project: `npm run build`
2. Deploy the `dist` folder to Netlify

### GitHub Pages
1. Build the project: `npm run build`
2. Push the `dist` folder to the `gh-pages` branch

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Formance](https://formance.com/) for the powerful ledger technology
- [Recharts](https://recharts.org/) for beautiful data visualizations
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Lucide](https://lucide.dev/) for beautiful icons

## 📞 Support

If you have any questions or need help with the project, please:
- Open an issue on GitHub
- Check the [Formance documentation](https://docs.formance.com/)
- Join the [Formance community](https://formance.com/community)

---

**Note**: This is a demonstration project showcasing Formance Ledger capabilities. For production use, ensure proper security measures and real API integration.
