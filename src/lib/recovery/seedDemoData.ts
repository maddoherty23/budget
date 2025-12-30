import { createTransaction, Timestamp } from "@/lib/firebase/firestore";

export async function seedDemoTransactions(userId: string): Promise<void> {
  const now = new Date();

  const demoTransactions = [
    // Netflix - recurring monthly subscription (HIGH VALUE)
    { days: 30, merchant: "Netflix Premium", amount: 22.99, category: "Streaming" },
    { days: 60, merchant: "Netflix Premium", amount: 22.99, category: "Streaming" },
    { days: 90, merchant: "Netflix Premium", amount: 22.99, category: "Streaming" },
    { days: 120, merchant: "Netflix Premium", amount: 22.99, category: "Streaming" },
    { days: 150, merchant: "Netflix Premium", amount: 22.99, category: "Streaming" },

    // Spotify - recurring monthly subscription
    { days: 28, merchant: "Spotify Premium", amount: 10.99, category: "Music" },
    { days: 58, merchant: "Spotify Premium", amount: 10.99, category: "Music" },
    { days: 88, merchant: "Spotify Premium", amount: 10.99, category: "Music" },
    { days: 118, merchant: "Spotify Premium", amount: 10.99, category: "Music" },
    
    // iCloud - recurring monthly
    { days: 29, merchant: "Apple iCloud+ 200GB", amount: 2.99, category: "Cloud Storage" },
    { days: 59, merchant: "Apple iCloud+ 200GB", amount: 2.99, category: "Cloud Storage" },
    { days: 89, merchant: "Apple iCloud+ 200GB", amount: 2.99, category: "Cloud Storage" },
    { days: 119, merchant: "Apple iCloud+ 200GB", amount: 2.99, category: "Cloud Storage" },

    // Dropbox - duplicate cloud storage
    { days: 32, merchant: "Dropbox Plus", amount: 11.99, category: "Cloud Storage" },
    { days: 62, merchant: "Dropbox Plus", amount: 11.99, category: "Cloud Storage" },
    { days: 92, merchant: "Dropbox Plus", amount: 11.99, category: "Cloud Storage" },

    // Hulu - duplicate streaming service
    { days: 31, merchant: "Hulu", amount: 17.99, category: "Streaming" },
    { days: 61, merchant: "Hulu", amount: 17.99, category: "Streaming" },
    { days: 91, merchant: "Hulu", amount: 17.99, category: "Streaming" },
    { days: 121, merchant: "Hulu", amount: 17.99, category: "Streaming" },

    // Disney+ - another streaming duplicate
    { days: 33, merchant: "Disney Plus", amount: 13.99, category: "Streaming" },
    { days: 63, merchant: "Disney Plus", amount: 13.99, category: "Streaming" },
    { days: 93, merchant: "Disney Plus", amount: 13.99, category: "Streaming" },

    // Gym membership with price creep (HIGH VALUE)
    { days: 180, merchant: "Planet Fitness", amount: 19.99, category: "Fitness" },
    { days: 150, merchant: "Planet Fitness", amount: 19.99, category: "Fitness" },
    { days: 120, merchant: "Planet Fitness", amount: 22.99, category: "Fitness" },
    { days: 90, merchant: "Planet Fitness", amount: 24.99, category: "Fitness" },
    { days: 60, merchant: "Planet Fitness", amount: 29.99, category: "Fitness" },
    { days: 30, merchant: "Planet Fitness", amount: 29.99, category: "Fitness" },

    // Adobe Creative Cloud - price creep
    { days: 180, merchant: "Adobe Creative Cloud", amount: 52.99, category: "Software" },
    { days: 150, merchant: "Adobe Creative Cloud", amount: 52.99, category: "Software" },
    { days: 120, merchant: "Adobe Creative Cloud", amount: 54.99, category: "Software" },
    { days: 90, merchant: "Adobe Creative Cloud", amount: 59.99, category: "Software" },
    { days: 60, merchant: "Adobe Creative Cloud", amount: 59.99, category: "Software" },
    { days: 30, merchant: "Adobe Creative Cloud", amount: 59.99, category: "Software" },

    // Banking fees (HIGH VALUE)
    { days: 8, merchant: "OVERDRAFT FEE", amount: 35.00, category: "Fees" },
    { days: 15, merchant: "OVERDRAFT FEE", amount: 35.00, category: "Fees" },
    { days: 22, merchant: "ATM FEE", amount: 3.50, category: "Fees" },
    { days: 38, merchant: "ATM FEE", amount: 3.50, category: "Fees" },
    { days: 45, merchant: "LATE FEE - CREDIT CARD", amount: 40.00, category: "Fees" },
    { days: 52, merchant: "ATM FEE", amount: 3.50, category: "Fees" },
    { days: 68, merchant: "OVERDRAFT FEE", amount: 35.00, category: "Fees" },
    { days: 75, merchant: "INSUFFICIENT FUNDS FEE", amount: 30.00, category: "Fees" },
    { days: 82, merchant: "ATM FEE", amount: 3.50, category: "Fees" },
    { days: 105, merchant: "NSF FEE", amount: 30.00, category: "Fees" },

    // Unused subscriptions (forgotten)
    { days: 31, merchant: "LinkedIn Premium", amount: 29.99, category: "Software" },
    { days: 61, merchant: "LinkedIn Premium", amount: 29.99, category: "Software" },
    { days: 91, merchant: "LinkedIn Premium", amount: 29.99, category: "Software" },
    { days: 121, merchant: "LinkedIn Premium", amount: 29.99, category: "Software" },

    { days: 29, merchant: "NYTimes Digital", amount: 25.00, category: "Entertainment" },
    { days: 59, merchant: "NYTimes Digital", amount: 25.00, category: "Entertainment" },
    { days: 89, merchant: "NYTimes Digital", amount: 25.00, category: "Entertainment" },
    { days: 119, merchant: "NYTimes Digital", amount: 25.00, category: "Entertainment" },

    // Refunds (HIGH VALUE)
    { days: 20, merchant: "Amazon Refund", amount: -89.99, category: "Refund", isIncome: true },
    { days: 55, merchant: "Best Buy Return", amount: -124.50, category: "Refund", isIncome: true },
    { days: 80, merchant: "Walmart Return", amount: -45.75, category: "Refund", isIncome: true },

    // Regular expenses to add variety
    { days: 5, merchant: "Whole Foods", amount: 87.43, category: "Groceries" },
    { days: 12, merchant: "Target", amount: 52.18, category: "Shopping" },
    { days: 18, merchant: "Shell Gas Station", amount: 45.00, category: "Transportation" },
    { days: 25, merchant: "Starbucks", amount: 6.75, category: "Dining" },
    { days: 32, merchant: "Chipotle", amount: 14.50, category: "Dining" },
    { days: 38, merchant: "CVS Pharmacy", amount: 28.92, category: "Healthcare" },
    { days: 42, merchant: "Uber", amount: 23.45, category: "Transportation" },
    { days: 48, merchant: "Amazon", amount: 39.99, category: "Shopping" },
    { days: 55, merchant: "Trader Joe's", amount: 64.32, category: "Groceries" },
    { days: 62, merchant: "AMC Theaters", amount: 28.00, category: "Entertainment" },
    { days: 68, merchant: "Home Depot", amount: 156.78, category: "Home" },
    { days: 72, merchant: "Best Buy", amount: 89.99, category: "Electronics" },
    { days: 78, merchant: "Panera Bread", amount: 12.35, category: "Dining" },
    { days: 82, merchant: "Shell Gas Station", amount: 48.20, category: "Transportation" },
    { days: 95, merchant: "Whole Foods", amount: 92.16, category: "Groceries" },
    { days: 102, merchant: "Verizon Wireless", amount: 75.00, category: "Utilities" },
    { days: 108, merchant: "Electric Company", amount: 120.45, category: "Utilities" },
    { days: 115, merchant: "Target", amount: 67.89, category: "Shopping" },
    { days: 125, merchant: "Costco", amount: 234.56, category: "Groceries" },
    { days: 132, merchant: "Uber Eats", amount: 31.20, category: "Dining" },
    { days: 138, merchant: "PetSmart", amount: 45.67, category: "Pets" },
    { days: 145, merchant: "Starbucks", amount: 7.25, category: "Dining" },
    { days: 152, merchant: "Shell Gas Station", amount: 42.50, category: "Transportation" },
    { days: 158, merchant: "Trader Joe's", amount: 58.94, category: "Groceries" },
    { days: 165, merchant: "IKEA", amount: 178.33, category: "Home" },
    { days: 172, merchant: "Olive Garden", amount: 52.40, category: "Dining" },
    { days: 178, merchant: "Barnes & Noble", amount: 34.95, category: "Entertainment" },
    { days: 185, merchant: "Walgreens", amount: 23.18, category: "Healthcare" },
    { days: 192, merchant: "Gap", amount: 79.99, category: "Shopping" },
    { days: 198, merchant: "Safeway", amount: 71.45, category: "Groceries" },
    { days: 205, merchant: "Lyft", amount: 18.75, category: "Transportation" },
    { days: 212, merchant: "Five Guys", amount: 16.80, category: "Dining" },
    { days: 218, merchant: "Lowe's", amount: 203.67, category: "Home" },
    { days: 225, merchant: "Sephora", amount: 65.40, category: "Beauty" },
    { days: 232, merchant: "REI", amount: 142.99, category: "Sports" },
    { days: 238, merchant: "Whole Foods", amount: 95.22, category: "Groceries" },
    { days: 245, merchant: "Domino's Pizza", amount: 24.50, category: "Dining" },
    { days: 252, merchant: "Shell Gas Station", amount: 46.80, category: "Transportation" },
    { days: 258, merchant: "Office Depot", amount: 37.65, category: "Office" },
    { days: 265, merchant: "Petsco", amount: 52.30, category: "Pets" },
    { days: 272, merchant: "Trader Joe's", amount: 68.75, category: "Groceries" },
    { days: 278, merchant: "McDonald's", amount: 9.45, category: "Dining" },
    { days: 285, merchant: "TJ Maxx", amount: 84.20, category: "Shopping" },
    { days: 292, merchant: "Water Bill", amount: 45.00, category: "Utilities" },
    { days: 298, merchant: "Internet Service", amount: 79.99, category: "Utilities" },
    { days: 305, merchant: "Whole Foods", amount: 88.33, category: "Groceries" },
    { days: 312, merchant: "Red Lobster", amount: 67.90, category: "Dining" },
    { days: 318, merchant: "Shell Gas Station", amount: 44.25, category: "Transportation" },
    { days: 325, merchant: "Target", amount: 73.50, category: "Shopping" },
    { days: 332, merchant: "CVS Pharmacy", amount: 31.85, category: "Healthcare" },
    { days: 338, merchant: "Starbucks", amount: 6.95, category: "Dining" },
    { days: 345, merchant: "Costco", amount: 267.45, category: "Groceries" },
    { days: 352, merchant: "Uber", amount: 26.30, category: "Transportation" },
    { days: 358, merchant: "Cheesecake Factory", amount: 89.50, category: "Dining" },
  ];

  for (const txn of demoTransactions) {
    const date = new Date(now);
    date.setDate(date.getDate() - txn.days);

    await createTransaction({
      amount: Math.abs(txn.amount),
      type: txn.isIncome ? "income" : "expense",
      category: txn.category,
      description: txn.merchant,
      date: Timestamp.fromDate(date),
    });
  }
}
