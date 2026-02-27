#!/usr/bin/env node

/**
 * Account Management System
 * Converted from COBOL to Node.js
 * 
 * Original COBOL Structure:
 * - MainProgram: Menu control and main loop
 * - DataProgram: Account balance storage (READ/WRITE operations)
 * - Operations: Business logic for credit/debit transactions
 */

const readline = require('readline');

// ============================================================================
// DATA STORAGE MODULE (formerly DataProgram.cob)
// ============================================================================
const DataStorage = {
  // Initial balance from COBOL: STORAGE-BALANCE PIC 9(6)V99 VALUE 1000.00
  balance: 1000.00,

  /**
   * READ operation - retrieves current balance
   * Equivalent to: IF OPERATION-TYPE = 'READ' MOVE STORAGE-BALANCE TO BALANCE
   */
  read() {
    return this.balance;
  },

  /**
   * WRITE operation - updates balance
   * Equivalent to: IF OPERATION-TYPE = 'WRITE' MOVE BALANCE TO STORAGE-BALANCE
   */
  write(newBalance) {
    this.balance = newBalance;
  }
};

// ============================================================================
// OPERATIONS MODULE (formerly Operations.cob)
// ============================================================================
const Operations = {
  /**
   * TOTAL operation - display current balance
   * Equivalent to COBOL:
   *   IF OPERATION-TYPE = 'TOTAL'
   *     CALL 'DataProgram' USING 'READ', FINAL-BALANCE
   *     DISPLAY "Current balance: " FINAL-BALANCE
   */
  async viewBalance(rl) {
    const currentBalance = DataStorage.read();
    console.log(`\nCurrent balance: $${currentBalance.toFixed(2)}\n`);
  },

  /**
   * CREDIT operation - add amount to balance
   * Equivalent to COBOL:
   *   IF OPERATION-TYPE = 'CREDIT'
   *     DISPLAY "Enter credit amount: "
   *     ACCEPT AMOUNT
   *     CALL 'DataProgram' USING 'READ', FINAL-BALANCE
   *     ADD AMOUNT TO FINAL-BALANCE
   *     CALL 'DataProgram' USING 'WRITE', FINAL-BALANCE
   *     DISPLAY "Amount credited. New balance: " FINAL-BALANCE
   */
  async credit(rl) {
    const amount = await this.getAmount(rl, "Enter credit amount: ");
    if (amount === null) return;

    let currentBalance = DataStorage.read();
    currentBalance += amount;
    DataStorage.write(currentBalance);
    console.log(`\nAmount credited. New balance: $${currentBalance.toFixed(2)}\n`);
  },

  /**
   * DEBIT operation - subtract amount from balance
   * Equivalent to COBOL:
   *   IF OPERATION-TYPE = 'DEBIT'
   *     DISPLAY "Enter debit amount: "
   *     ACCEPT AMOUNT
   *     CALL 'DataProgram' USING 'READ', FINAL-BALANCE
   *     IF FINAL-BALANCE >= AMOUNT
   *       SUBTRACT AMOUNT FROM FINAL-BALANCE
   *       CALL 'DataProgram' USING 'WRITE', FINAL-BALANCE
   *       DISPLAY "Amount debited. New balance: " FINAL-BALANCE
   *     ELSE
   *       DISPLAY "Insufficient funds for this debit."
   *     END-IF
   */
  async debit(rl) {
    const amount = await this.getAmount(rl, "Enter debit amount: ");
    if (amount === null) return;

    let currentBalance = DataStorage.read();
    
    // Validation: Check sufficient funds (equivalent to: IF FINAL-BALANCE >= AMOUNT)
    if (currentBalance >= amount) {
      currentBalance -= amount;
      DataStorage.write(currentBalance);
      console.log(`\nAmount debited. New balance: $${currentBalance.toFixed(2)}\n`);
    } else {
      console.log("\nInsufficient funds for this debit.\n");
    }
  },

  /**
   * Helper function to get and validate amount input
   */
  async getAmount(rl, prompt) {
    return new Promise((resolve) => {
      rl.question(prompt, (answer) => {
        const amount = parseFloat(answer);
        if (isNaN(amount) || amount <= 0) {
          console.log("Invalid amount. Please enter a positive number.");
          resolve(null);
        } else {
          resolve(amount);
        }
      });
    });
  }
};

// ============================================================================
// MAIN PROGRAM (formerly MainProgram.cob)
// ============================================================================
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // CONTINUE-FLAG equivalent: controls the main loop
  let continueFlag = true;

  // PERFORM UNTIL CONTINUE-FLAG = 'NO'
  while (continueFlag) {
    // Display menu
    console.log("--------------------------------");
    console.log("Account Management System");
    console.log("1. View Balance");
    console.log("2. Credit Account");
    console.log("3. Debit Account");
    console.log("4. Exit");
    console.log("--------------------------------");

    // Get user choice
    const choice = await new Promise((resolve) => {
      rl.question("Enter your choice (1-4): ", (answer) => {
        resolve(answer.trim());
      });
    });

    // EVALUATE USER-CHOICE
    switch (choice) {
      case '1':
        // WHEN 1: CALL 'Operations' USING 'TOTAL '
        await Operations.viewBalance(rl);
        break;
      case '2':
        // WHEN 2: CALL 'Operations' USING 'CREDIT'
        await Operations.credit(rl);
        break;
      case '3':
        // WHEN 3: CALL 'Operations' USING 'DEBIT '
        await Operations.debit(rl);
        break;
      case '4':
        // WHEN 4: MOVE 'NO' TO CONTINUE-FLAG
        continueFlag = false;
        break;
      default:
        // WHEN OTHER
        console.log("\nInvalid choice, please select 1-4.\n");
    }
  }

  // DISPLAY "Exiting the program. Goodbye!"
  console.log("\nExiting the program. Goodbye!");
  
  // STOP RUN
  rl.close();
  process.exit(0);
}

// Export modules for testing
module.exports = {
  DataStorage,
  Operations
};

// Start the application only if this is the main module being run directly
if (require.main === module) {
  main().catch((err) => {
    console.error("An error occurred:", err);
    process.exit(1);
  });
}
