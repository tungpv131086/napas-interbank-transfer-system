// State Manager with Observer Pattern
// Manages global application state and notifies listeners of changes

export class StateManager {
  constructor() {
    this.state = this.getInitialState();
    this.listeners = new Map(); // path -> Set of callbacks
  }

  getInitialState() {
    return {
      banks: {
        'BANKA': {
          config: {
            code: 'BANKA',
            name: 'Bank A',
            apiUrl: 'http://localhost:5003/api',
            signalRUrl: 'http://localhost:5003/balanceHub',
            color: '#667eea',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          },
          auth: {
            isLoggedIn: false,
            token: null,
            username: ''
          },
          data: {
            currentAccount: null,
            accounts: [],
            transactions: []
          },
          ui: {
            isLoading: false,
            lastError: null
          }
        },
        'BANKB': {
          config: {
            code: 'BANKB',
            name: 'Bank B',
            apiUrl: 'http://localhost:5004/api',
            signalRUrl: 'http://localhost:5004/balanceHub',
            color: '#f5576c',
            gradient: 'linear-gradient(135deg, #f5576c 0%, #ff6e7f 100%)'
          },
          auth: {
            isLoggedIn: false,
            token: null,
            username: ''
          },
          data: {
            currentAccount: null,
            accounts: [],
            transactions: []
          },
          ui: {
            isLoading: false,
            lastError: null
          }
        },
        'BANKC': {
          config: {
            code: 'BANKC',
            name: 'Bank C',
            apiUrl: 'http://localhost:5005/api',
            signalRUrl: 'http://localhost:5005/balanceHub',
            color: '#00f2fe',
            gradient: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)'
          },
          auth: {
            isLoggedIn: false,
            token: null,
            username: ''
          },
          data: {
            currentAccount: null,
            accounts: [],
            transactions: []
          },
          ui: {
            isLoading: false,
            lastError: null
          }
        }
      },
      activeBank: 'BANKA'
    };
  }

  // Get current state (returns a copy)
  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  // Get state for a specific bank
  getBankState(bankCode) {
    return this.state.banks[bankCode] ?
      JSON.parse(JSON.stringify(this.state.banks[bankCode])) : null;
  }

  // Get value at a specific path (e.g., 'banks.BANKA.auth.token')
  getValueAtPath(path) {
    const keys = path.split('.');
    let value = this.state;
    for (const key of keys) {
      if (value === undefined || value === null) return null;
      value = value[key];
    }
    return value;
  }

  // Set state and notify listeners
  setState(updates) {
    // Deep merge the updates into state
    this.state = this.deepMerge(this.state, updates);

    // Notify all listeners
    this.notifyListeners();
  }

  // Update bank authentication
  setBankAuth(bankCode, authData) {
    if (!this.state.banks[bankCode]) return;

    this.setState({
      banks: {
        [bankCode]: {
          auth: authData
        }
      }
    });
  }

  // Update current account for a bank
  setCurrentAccount(bankCode, accountNumber) {
    if (!this.state.banks[bankCode]) return;

    this.setState({
      banks: {
        [bankCode]: {
          data: {
            currentAccount: accountNumber
          }
        }
      }
    });
  }

  // Update accounts list for a bank
  setAccounts(bankCode, accounts) {
    if (!this.state.banks[bankCode]) return;

    this.setState({
      banks: {
        [bankCode]: {
          data: {
            accounts: accounts
          }
        }
      }
    });
  }

  // Update balance for a specific account
  updateAccountBalance(bankCode, accountNumber, newBalance) {
    if (!this.state.banks[bankCode]) return;

    const currentAccounts = this.state.banks[bankCode].data.accounts;
    if (!Array.isArray(currentAccounts)) {
      console.error(`accounts is not an array for ${bankCode}:`, currentAccounts);
      return;
    }

    const accounts = [...currentAccounts];
    const accountIndex = accounts.findIndex(acc => acc.accountNumber === accountNumber);

    if (accountIndex !== -1) {
      accounts[accountIndex] = { ...accounts[accountIndex], balance: newBalance };

      this.setState({
        banks: {
          [bankCode]: {
            data: {
              accounts: accounts
            }
          }
        }
      });
    }
  }

  // Update transactions for a bank
  setTransactions(bankCode, transactions) {
    if (!this.state.banks[bankCode]) return;

    this.setState({
      banks: {
        [bankCode]: {
          data: {
            transactions: transactions
          }
        }
      }
    });
  }

  // Add a single transaction
  addTransaction(bankCode, transaction) {
    if (!this.state.banks[bankCode]) return;

    const transactions = [transaction, ...this.state.banks[bankCode].data.transactions];

    this.setState({
      banks: {
        [bankCode]: {
          data: {
            transactions: transactions
          }
        }
      }
    });
  }

  // Set loading state
  setLoading(bankCode, isLoading) {
    if (!this.state.banks[bankCode]) return;

    this.setState({
      banks: {
        [bankCode]: {
          ui: {
            isLoading: isLoading
          }
        }
      }
    });
  }

  // Set error
  setError(bankCode, error) {
    if (!this.state.banks[bankCode]) return;

    this.setState({
      banks: {
        [bankCode]: {
          ui: {
            lastError: error
          }
        }
      }
    });
  }

  // Set active bank
  setActiveBank(bankCode) {
    if (!this.state.banks[bankCode]) return;

    this.setState({
      activeBank: bankCode
    });
  }

  // Subscribe to state changes
  // path: string (e.g., 'banks.BANKA.auth') or null for all changes
  // callback: function to call when state changes
  subscribe(path, callback) {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Set());
    }
    this.listeners.get(path).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(path);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  // Notify all listeners
  notifyListeners() {
    // Notify global listeners (null path)
    if (this.listeners.has(null)) {
      this.listeners.get(null).forEach(callback => {
        callback(this.getState());
      });
    }

    // Notify path-specific listeners
    for (const [path, callbacks] of this.listeners.entries()) {
      if (path !== null) {
        const value = this.getValueAtPath(path);
        callbacks.forEach(callback => {
          callback(value, this.getState());
        });
      }
    }
  }

  // Deep merge helper
  deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
      // Arrays should be replaced, not merged
      if (Array.isArray(source[key]) || Array.isArray(target[key])) {
        result[key] = source[key];
      } else if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
        result[key] = this.deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  // Reset bank state (logout)
  resetBankState(bankCode) {
    if (!this.state.banks[bankCode]) return;

    const config = this.state.banks[bankCode].config;

    this.setState({
      banks: {
        [bankCode]: {
          config: config,
          auth: {
            isLoggedIn: false,
            token: null,
            username: ''
          },
          data: {
            currentAccount: null,
            accounts: [],
            transactions: []
          },
          ui: {
            isLoading: false,
            lastError: null
          }
        }
      }
    });
  }
}
