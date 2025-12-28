// SignalR Manager - Manages multiple SignalR connections
// Handles real-time updates for all banks simultaneously

export class SignalRManager {
  constructor() {
    this.connections = new Map(); // bankCode -> { connection, status, subscribedAccounts }
  }

  // Create and start a SignalR connection for a bank
  async createConnection(bankCode, hubUrl) {
    try {
      console.log(`[${bankCode}] Creating SignalR connection to ${hubUrl}`);

      const connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl)
        .withAutomaticReconnect()
        .build();

      // Store connection info
      this.connections.set(bankCode, {
        connection: connection,
        status: 'connecting',
        subscribedAccounts: []
      });

      // Set up event handlers
      this.setupEventHandlers(bankCode, connection);

      // Start connection
      await connection.start();

      // Update status
      this.updateConnectionStatus(bankCode, 'connected');
      console.log(`[${bankCode}] SignalR connected`);

      return {
        success: true
      };
    } catch (error) {
      console.error(`[${bankCode}] SignalR connection error:`, error);
      this.updateConnectionStatus(bankCode, 'disconnected');

      return {
        success: false,
        error: error.message
      };
    }
  }

  // Set up event handlers for a connection
  setupEventHandlers(bankCode, connection) {
    // Handle balance updates
    connection.on("BalanceUpdated", (data) => {
      console.log(`[${bankCode}] BalanceUpdated:`, data);
      this.handleBalanceUpdated(bankCode, data);
    });

    // Handle transaction received
    connection.on("TransactionReceived", (data) => {
      console.log(`[${bankCode}] TransactionReceived:`, data);
      this.handleTransactionReceived(bankCode, data);
    });

    // Connection state handlers
    connection.onreconnecting(() => {
      console.log(`[${bankCode}] SignalR reconnecting...`);
      this.updateConnectionStatus(bankCode, 'connecting');
    });

    connection.onreconnected(async () => {
      console.log(`[${bankCode}] SignalR reconnected`);
      this.updateConnectionStatus(bankCode, 'connected');

      // Resubscribe to accounts
      const connInfo = this.connections.get(bankCode);
      if (connInfo) {
        for (const accountNumber of connInfo.subscribedAccounts) {
          await this.subscribeToAccount(bankCode, accountNumber);
        }
      }
    });

    connection.onclose(() => {
      console.log(`[${bankCode}] SignalR connection closed`);
      this.updateConnectionStatus(bankCode, 'disconnected');
    });
  }

  // Subscribe to account updates
  async subscribeToAccount(bankCode, accountNumber) {
    const connInfo = this.connections.get(bankCode);
    if (!connInfo || connInfo.status !== 'connected') {
      console.warn(`[${bankCode}] Cannot subscribe - not connected`);
      return;
    }

    try {
      await connInfo.connection.invoke("SubscribeToAccount", accountNumber);
      console.log(`[${bankCode}] Subscribed to account ${accountNumber}`);

      // Track subscription
      if (!connInfo.subscribedAccounts.includes(accountNumber)) {
        connInfo.subscribedAccounts.push(accountNumber);
      }
    } catch (error) {
      console.error(`[${bankCode}] Error subscribing to account:`, error);
    }
  }

  // Unsubscribe from account updates
  async unsubscribeFromAccount(bankCode, accountNumber) {
    const connInfo = this.connections.get(bankCode);
    if (!connInfo || connInfo.status !== 'connected') {
      return;
    }

    try {
      await connInfo.connection.invoke("UnsubscribeFromAccount", accountNumber);
      console.log(`[${bankCode}] Unsubscribed from account ${accountNumber}`);

      // Remove from tracking
      const index = connInfo.subscribedAccounts.indexOf(accountNumber);
      if (index > -1) {
        connInfo.subscribedAccounts.splice(index, 1);
      }
    } catch (error) {
      console.error(`[${bankCode}] Error unsubscribing from account:`, error);
    }
  }

  // Close connection
  async closeConnection(bankCode) {
    const connInfo = this.connections.get(bankCode);
    if (!connInfo) return;

    try {
      await connInfo.connection.stop();
      console.log(`[${bankCode}] SignalR connection closed`);
    } catch (error) {
      console.error(`[${bankCode}] Error closing connection:`, error);
    }

    this.connections.delete(bankCode);
    this.updateConnectionStatus(bankCode, 'idle');
  }

  // Get connection status
  getConnectionStatus(bankCode) {
    const connInfo = this.connections.get(bankCode);
    return connInfo ? connInfo.status : 'idle';
  }

  // Handle balance updated event
  handleBalanceUpdated(bankCode, data) {
    // This will be called by SignalR events
    // Dispatch custom event that UI manager can listen to
    window.dispatchEvent(new CustomEvent('signalr-balance-updated', {
      detail: { bankCode, data }
    }));
  }

  // Handle transaction received event
  handleTransactionReceived(bankCode, data) {
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('signalr-transaction-received', {
      detail: { bankCode, data }
    }));
  }

  // Update connection status (notifies UI)
  updateConnectionStatus(bankCode, status) {
    const connInfo = this.connections.get(bankCode);
    if (connInfo) {
      connInfo.status = status;
    }

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('signalr-status-changed', {
      detail: { bankCode, status }
    }));
  }
}
