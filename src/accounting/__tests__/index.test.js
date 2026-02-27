/**
 * Unit Tests for Account Management System
 * Mirrors scenarios from docs/TESTPLAN.md
 * 
 * Test Cases:
 * TC1 - View initial balance
 * TC2 - Credit account with positive amount
 * TC3 - Debit account with sufficient funds
 * TC4 - Debit account with insufficient funds
 * TC5 - Invalid menu choice handling
 * TC6 - Multiple operations sequence with persistence
 */

const { DataStorage, Operations } = require('../index.js');

// Create a mock readline interface for testing
const createMockReadline = (answers) => {
  let answerIndex = 0;
  return {
    question: (prompt, callback) => {
      const answer = answers[answerIndex] || '';
      answerIndex++;
      // Simulate async behavior
      setImmediate(() => callback(answer));
    },
    close: () => {}
  };
};

describe('DataStorage Module', () => {
  beforeEach(() => {
    // Reset balance to initial value before each test
    DataStorage.balance = 1000.00;
  });

  describe('TC1: View initial balance', () => {
    test('should read and return initial balance of 1000.00', () => {
      const balance = DataStorage.read();
      expect(balance).toBe(1000.00);
    });

    test('initial balance should be exactly 1000.00', () => {
      expect(DataStorage.read()).toEqual(1000.00);
    });
  });

  describe('READ operation', () => {
    test('should return the current balance', () => {
      DataStorage.balance = 1500.50;
      expect(DataStorage.read()).toBe(1500.50);
    });

    test('should return balance without modifying it', () => {
      const beforeRead = DataStorage.read();
      const afterRead = DataStorage.read();
      expect(beforeRead).toBe(afterRead);
    });
  });

  describe('WRITE operation', () => {
    test('should update balance to a new value', () => {
      DataStorage.write(2000.00);
      expect(DataStorage.read()).toBe(2000.00);
    });

    test('should handle decimal values correctly', () => {
      DataStorage.write(1234.56);
      expect(DataStorage.read()).toBe(1234.56);
    });

    test('should handle zero balance', () => {
      DataStorage.write(0.00);
      expect(DataStorage.read()).toBe(0.00);
    });
  });
});

describe('Operations Module - Credit Operation', () => {
  beforeEach(() => {
    DataStorage.balance = 1000.00;
  });

  describe('TC2: Credit account with positive amount', () => {
    test('should add credit amount to balance', async () => {
      const mockRl = createMockReadline(['500.00']);
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await Operations.credit(mockRl);
      consoleSpy.mockRestore();
      
      // Balance should be 1500.00 after crediting 500.00
      expect(DataStorage.read()).toBe(1500.00);
    });

    test('should display correct message after credit', async () => {
      const mockRl = createMockReadline(['500.00']);
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await Operations.credit(mockRl);
      
      // Check that the success message was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Amount credited')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('1500.00')
      );
      
      consoleSpy.mockRestore();
    });

    test('should update internal storage correctly', async () => {
      const mockRl = createMockReadline(['300.50']);
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await Operations.credit(mockRl);
      consoleSpy.mockRestore();
      
      expect(DataStorage.read()).toBe(1300.50);
    });
  });

  test('should reject invalid credit amounts', async () => {
    const mockRl = createMockReadline(['-100.00']);
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await Operations.credit(mockRl);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid amount')
    );
    
    consoleSpy.mockRestore();
  });

  test('should reject non-numeric credit amounts', async () => {
    const mockRl = createMockReadline(['abc']);
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await Operations.credit(mockRl);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid amount')
    );
    
    consoleSpy.mockRestore();
  });
});

describe('Operations Module - Debit Operation', () => {
  beforeEach(() => {
    DataStorage.balance = 1500.00;
  });

  describe('TC3: Debit account with sufficient funds', () => {
    test('should subtract debit amount from balance when sufficient funds exist', async () => {
      const mockRl = createMockReadline(['300.00']);
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await Operations.debit(mockRl);
      consoleSpy.mockRestore();
      
      // Balance should be 1200.00 after debiting 300.00 from 1500.00
      expect(DataStorage.read()).toBe(1200.00);
    });

    test('should display correct message after successful debit', async () => {
      const mockRl = createMockReadline(['300.00']);
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await Operations.debit(mockRl);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Amount debited')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('1200.00')
      );
      
      consoleSpy.mockRestore();
    });

    test('should update internal storage correctly after debit', async () => {
      const mockRl = createMockReadline(['250.75']);
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await Operations.debit(mockRl);
      consoleSpy.mockRestore();
      
      expect(DataStorage.read()).toBe(1249.25);
    });
  });

  describe('TC4: Debit account with insufficient funds', () => {
    test('should prevent debit when insufficient funds', async () => {
      DataStorage.balance = 1200.00;
      const mockRl = createMockReadline(['2000.00']);
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await Operations.debit(mockRl);
      
      // Should display insufficient funds message
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Insufficient funds')
      );
      
      consoleSpy.mockRestore();
    });

    test('should not modify balance on insufficient funds error', async () => {
      DataStorage.balance = 1200.00;
      const originalBalance = DataStorage.read();
      const mockRl = createMockReadline(['2000.00']);
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await Operations.debit(mockRl);
      consoleSpy.mockRestore();
      
      expect(DataStorage.read()).toBe(originalBalance);
    });

    test('should allow debit at exact balance amount', async () => {
      DataStorage.balance = 500.00;
      const mockRl = createMockReadline(['500.00']);
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await Operations.debit(mockRl);
      consoleSpy.mockRestore();
      
      expect(DataStorage.read()).toBe(0.00);
    });
  });

  test('should reject invalid debit amounts', async () => {
    const mockRl = createMockReadline(['-100.00']);
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await Operations.debit(mockRl);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid amount')
    );
    
    consoleSpy.mockRestore();
  });
});

describe('Operations Module - View Balance', () => {
  beforeEach(() => {
    DataStorage.balance = 1000.00;
  });

  test('should display current balance without modifying it', async () => {
    const mockRl = createMockReadline([]);
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await Operations.viewBalance(mockRl);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Current balance')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('1000.00')
    );
    
    consoleSpy.mockRestore();
  });

  test('should display updated balance correctly', async () => {
    DataStorage.balance = 2500.75;
    const mockRl = createMockReadline([]);
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await Operations.viewBalance(mockRl);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('2500.75')
    );
    
    consoleSpy.mockRestore();
  });
});

describe('TC5: Invalid input handling', () => {
  // Note: Direct UI input validation is tested in Operations tests above
  // Invalid menu choices are handled in the main program's switch statement
  test('Input validation should be part of getAmount helper', async () => {
    const mockRl = createMockReadline(['invalid']);
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await Operations.credit(mockRl);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid amount')
    );
    
    consoleSpy.mockRestore();
  });
});

describe('TC6: Multiple operations sequence with persistence', () => {
  test('should maintain state across multiple credit/debit operations', async () => {
    // Starting with balance = 1000.00
    DataStorage.balance = 1000.00;

    // Step 1: Credit 200.00
    const mockRl1 = createMockReadline(['200.00']);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await Operations.credit(mockRl1);
    consoleSpy.mockRestore();
    
    let currentBalance = DataStorage.read();
    expect(currentBalance).toBe(1200.00);

    // Step 2: Debit 50.00
    const mockRl2 = createMockReadline(['50.00']);
    const consoleSpy2 = jest.spyOn(console, 'log').mockImplementation();
    await Operations.debit(mockRl2);
    consoleSpy2.mockRestore();
    
    currentBalance = DataStorage.read();
    expect(currentBalance).toBe(1150.00);

    // Step 3: View balance
    const mockRl3 = createMockReadline([]);
    const consoleSpy3 = jest.spyOn(console, 'log').mockImplementation();
    await Operations.viewBalance(mockRl3);
    
    expect(consoleSpy3).toHaveBeenCalledWith(
      expect.stringContaining('1150.00')
    );
    
    consoleSpy3.mockRestore();

    // Final verification
    expect(DataStorage.read()).toBe(1150.00);
  });

  test('should persist balance across DataProgram-like READ/WRITE cycles', async () => {
    DataStorage.balance = 1000.00;

    // Simulate DataProgram READ operation
    const balance1 = DataStorage.read();
    expect(balance1).toBe(1000.00);

    // Modify balance via WRITE operation
    DataStorage.write(1500.00);

    // Simulate DataProgram READ operation again
    const balance2 = DataStorage.read();
    expect(balance2).toBe(1500.00);

    // One more WRITE
    DataStorage.write(1200.00);

    // Verify persistence
    const balance3 = DataStorage.read();
    expect(balance3).toBe(1200.00);
  });
});

describe('Integration Tests - Full Workflow', () => {
  test('complete transaction workflow: view → credit → debit → view', async () => {
    DataStorage.balance = 1000.00;

    // View initial balance
    const mockRl1 = createMockReadline([]);
    const spy1 = jest.spyOn(console, 'log').mockImplementation();
    await Operations.viewBalance(mockRl1);
    expect(spy1).toHaveBeenCalledWith(expect.stringContaining('1000.00'));
    spy1.mockRestore();

    // Credit 500
    const mockRl2 = createMockReadline(['500.00']);
    const spy2 = jest.spyOn(console, 'log').mockImplementation();
    await Operations.credit(mockRl2);
    expect(spy2).toHaveBeenCalledWith(expect.stringContaining('1500.00'));
    spy2.mockRestore();

    // Debit 300
    const mockRl3 = createMockReadline(['300.00']);
    const spy3 = jest.spyOn(console, 'log').mockImplementation();
    await Operations.debit(mockRl3);
    expect(spy3).toHaveBeenCalledWith(expect.stringContaining('1200.00'));
    spy3.mockRestore();

    // View final balance
    const mockRl4 = createMockReadline([]);
    const spy4 = jest.spyOn(console, 'log').mockImplementation();
    await Operations.viewBalance(mockRl4);
    expect(spy4).toHaveBeenCalledWith(expect.stringContaining('1200.00'));
    spy4.mockRestore();

    expect(DataStorage.read()).toBe(1200.00);
  });
});

describe('Edge Cases and Boundary Tests', () => {
  test('should handle very large credit amounts', async () => {
    DataStorage.balance = 1000.00;
    const mockRl = createMockReadline(['999999.99']);
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await Operations.credit(mockRl);
    consoleSpy.mockRestore();
    
    expect(DataStorage.read()).toBe(1000999.99);
  });

  test('should handle very small credit amounts', async () => {
    DataStorage.balance = 1000.00;
    const mockRl = createMockReadline(['0.01']);
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await Operations.credit(mockRl);
    consoleSpy.mockRestore();
    
    expect(DataStorage.read()).toBe(1000.01);
  });

  test('should handle floating point precision in calculations', async () => {
    DataStorage.balance = 1000.10;
    const mockRl = createMockReadline(['0.20']);
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await Operations.credit(mockRl);
    consoleSpy.mockRestore();
    
    const balance = DataStorage.read();
    // Check with small tolerance for floating point arithmetic
    expect(Math.abs(balance - 1000.30)).toBeLessThan(0.001);
  });

  test('should handle debit that brings balance to zero', async () => {
    DataStorage.balance = 100.00;
    const mockRl = createMockReadline(['100.00']);
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await Operations.debit(mockRl);
    consoleSpy.mockRestore();
    
    expect(DataStorage.read()).toBe(0.00);
  });

  test('should reject zero amount debit', async () => {
    DataStorage.balance = 1000.00;
    const mockRl = createMockReadline(['0.00']);
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await Operations.debit(mockRl);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid amount')
    );
    
    consoleSpy.mockRestore();
  });

  test('should reject zero amount credit', async () => {
    DataStorage.balance = 1000.00;
    const mockRl = createMockReadline(['0.00']);
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await Operations.credit(mockRl);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid amount')
    );
    
    consoleSpy.mockRestore();
  });
});
