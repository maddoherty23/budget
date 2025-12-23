const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, orderBy } = require('firebase/firestore');

// Firebase config (from your config file)
const firebaseConfig = {
  apiKey: "AIzaSyBOFAKfx2lU8rYJhF7SHzGJxbTHn1BLHWc",
  authDomain: "budgetbuddy-53e64.firebaseapp.com",
  projectId: "budgetbuddy-53e64",
  storageBucket: "budgetbuddy-53e64.firebasestorage.app",
  messagingSenderId: "841387776226",
  appId: "1:841387776226:web:3be36b5db44d51f5cfe59c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugTransactions() {
  try {
    console.log('=== DEBUGGING TRANSACTIONS ===\n');
    
    // Get ALL transactions (no user filter)
    console.log('1. Fetching ALL transactions (no user filter)...');
    const allTxnsRef = collection(db, 'transactions');
    const allTxnsSnapshot = await getDocs(allTxnsRef);
    console.log(`   Total transactions in DB: ${allTxnsSnapshot.size}`);
    
    if (allTxnsSnapshot.size > 0) {
      console.log('\n2. Sample transaction structure:');
      const firstDoc = allTxnsSnapshot.docs[0];
      console.log('   Doc ID:', firstDoc.id);
      console.log('   Data:', JSON.stringify(firstDoc.data(), null, 2));
      
      console.log('\n3. Checking userId field across all transactions:');
      const userIds = new Set();
      allTxnsSnapshot.docs.forEach(doc => {
        const userId = doc.data().userId;
        userIds.add(userId || 'MISSING_USERID');
      });
      console.log('   Unique userIds found:', Array.from(userIds));
      
      console.log('\n4. Transactions by userId:');
      userIds.forEach(uid => {
        const count = allTxnsSnapshot.docs.filter(d => (d.data().userId || 'MISSING_USERID') === uid).length;
        console.log(`   ${uid}: ${count} transactions`);
      });
      
      console.log('\n5. Checking date field formats:');
      const dateSample = allTxnsSnapshot.docs.slice(0, 5).map(doc => ({
        id: doc.id,
        date: doc.data().date,
        dateType: typeof doc.data().date,
        dateConstructor: doc.data().date?.constructor?.name
      }));
      console.log('   Sample dates:', JSON.stringify(dateSample, null, 2));
      
      console.log('\n6. Checking category field:');
      const categorySample = allTxnsSnapshot.docs.slice(0, 10).map(doc => ({
        id: doc.id,
        description: doc.data().description,
        category: doc.data().category || 'MISSING',
        amount: doc.data().amount,
        type: doc.data().type
      }));
      console.log('   Sample categories:', JSON.stringify(categorySample, null, 2));
    } else {
      console.log('   ⚠️  No transactions found in database!');
    }
    
    // Now try with the specific user from the Auth Debug popup
    const userId = 'U1WdZU24IcdJoY668VqgQfei2w02'; // From your screenshot
    console.log(`\n7. Querying transactions for user: ${userId}`);
    const userQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', userId)
    );
    const userSnapshot = await getDocs(userQuery);
    console.log(`   Transactions for this user: ${userSnapshot.size}`);
    
    if (userSnapshot.size > 0) {
      console.log('   Sample user transaction:');
      console.log(JSON.stringify(userSnapshot.docs[0].data(), null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugTransactions();
