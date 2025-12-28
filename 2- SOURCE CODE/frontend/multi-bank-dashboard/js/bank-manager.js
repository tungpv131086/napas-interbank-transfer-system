// Bank Manager - Handles API interactions for a single bank
// Each bank instance manages authentication, accounts, and transfers

export class BankManager {
  constructor(bankCode, config) {
    this.bankCode = bankCode;
    this.config = config; // { name, apiUrl, signalRUrl, color }
    this.authToken = null;
    this.authApiUrl = 'http://localhost:5001/api/auth';
  }

  // Login - Authenticate with the auth service
  async login(username, password) {
    try {
      const response = await fetch(`${this.authApiUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      this.authToken = data.token;

      return {
        success: true,
        token: data.token,
        username: username
      };
    } catch (error) {
      console.error(`[${this.bankCode}] Login error:`, error);
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  }

  // Load all accounts for this bank
  async loadAccounts() {
    try {
      const response = await fetch(`${this.config.apiUrl}/accounts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load accounts');
      }

      const accounts = await response.json();
      return {
        success: true,
        accounts: accounts
      };
    } catch (error) {
      console.error(`[${this.bankCode}] Load accounts error:`, error);
      return {
        success: false,
        error: error.message || 'Failed to load accounts',
        accounts: []
      };
    }
  }

  // Get specific account details
  async getAccountDetails(accountNumber) {
    try {
      const response = await fetch(`${this.config.apiUrl}/accounts/${accountNumber}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load account details');
      }

      const account = await response.json();
      return {
        success: true,
        account: account
      };
    } catch (error) {
      console.error(`[${this.bankCode}] Load account details error:`, error);
      return {
        success: false,
        error: error.message || 'Failed to load account details',
        account: null
      };
    }
  }

  // Execute internal transfer (same bank)
  async executeInternalTransfer(fromAccountNumber, toAccountNumber, amount, description) {
    try {
      const response = await fetch(`${this.config.apiUrl}/transfer/internal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fromAccountNumber: fromAccountNumber,
          toAccountNumber: toAccountNumber,
          amount: parseFloat(amount),
          description: description
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.title || 'Transfer failed');
      }

      return {
        success: true,
        transactionId: result.transactionId,
        message: result.message
      };
    } catch (error) {
      console.error(`[${this.bankCode}] Internal transfer error:`, error);
      return {
        success: false,
        error: error.message || 'Internal transfer failed'
      };
    }
  }

  // Execute interbank transfer (via NAPAS)
  async executeInterbankTransfer(fromAccountNumber, toAccountNumber, toBankCode, amount, description) {
    try {
      const response = await fetch(`${this.config.apiUrl}/transfer/interbank`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fromAccountNumber: fromAccountNumber,
          toAccountNumber: toAccountNumber,
          toBankCode: toBankCode,
          amount: parseFloat(amount),
          description: description
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.title || 'Transfer failed');
      }

      return {
        success: true,
        transactionId: result.transactionId,
        message: result.message
      };
    } catch (error) {
      console.error(`[${this.bankCode}] Interbank transfer error:`, error);
      return {
        success: false,
        error: error.message || 'Interbank transfer failed'
      };
    }
  }

  // Load transaction history for an account
  async loadTransactions(accountNumber) {
    try {
      const response = await fetch(`${this.config.apiUrl}/accounts/${accountNumber}/transactions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load transactions');
      }

      const transactions = await response.json();
      return {
        success: true,
        transactions: transactions
      };
    } catch (error) {
      console.error(`[${this.bankCode}] Load transactions error:`, error);
      return {
        success: false,
        error: error.message || 'Failed to load transactions',
        transactions: []
      };
    }
  }

  // Logout
  logout() {
    this.authToken = null;
    return {
      success: true
    };
  }

  // Check if logged in
  isLoggedIn() {
    return this.authToken !== null;
  }

  // Get auth token
  getToken() {
    return this.authToken;
  }

  // Set auth token (for state restoration)
  setToken(token) {
    this.authToken = token;
  }

  // Create tables if not exist
  async createTables() {
    try {
      const response = await fetch(`${this.config.apiUrl}/admin/create-tables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create tables');
      }

      return {
        success: true,
        message: result.message,
        created: result.created
      };
    } catch (error) {
      console.error(`[${this.bankCode}] Create tables error:`, error);
      return {
        success: false,
        error: error.message || 'Failed to create tables'
      };
    }
  }

  // Seed sample data
  async seedData() {
    try {
      const response = await fetch(`${this.config.apiUrl}/admin/seed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to seed data');
      }

      return {
        success: true,
        message: result.message,
        count: result.count
      };
    } catch (error) {
      console.error(`[${this.bankCode}] Seed data error:`, error);
      return {
        success: false,
        error: error.message || 'Failed to seed data'
      };
    }
  }

  // Reset all data
  async resetData() {
    try {
      const response = await fetch(`${this.config.apiUrl}/admin/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset data');
      }

      return {
        success: true,
        message: result.message
      };
    } catch (error) {
      console.error(`[${this.bankCode}] Reset data error:`, error);
      return {
        success: false,
        error: error.message || 'Failed to reset data'
      };
    }
  }
}
