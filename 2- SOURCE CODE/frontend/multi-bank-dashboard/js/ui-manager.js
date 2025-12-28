// UI Manager - Orchestrates all UI rendering and event handling
// Handles tabs, forms, data display, and user interactions

export class UIManager {
  constructor(stateManager, bankManagers, signalRManager, i18n) {
    this.state = stateManager;
    this.banks = bankManagers;
    this.signalR = signalRManager;
    this.i18n = i18n;
    this.toastCounter = 0;

    // Subscribe to language changes
    this.i18n.subscribe(() => {
      this.onLanguageChanged();
    });
  }

  // Initialize the dashboard UI
  async initialize() {
    // Update static HTML elements with translations
    this.updateStaticTranslations();

    // Render bank tabs
    this.renderBankTabs();

    // Render global connection status
    this.renderGlobalConnectionStatus();

    // Render admin panel first
    this.renderAdminPanel();

    // Render panels for all banks
    const bankCodes = Object.keys(this.banks);
    for (const bankCode of bankCodes) {
      this.renderBankPanel(bankCode);
    }

    // Admin tab is active by default (no need to click)

    // Subscribe to state changes
    this.subscribeToStateChanges();

    // Subscribe to SignalR events
    this.subscribeToSignalREvents();

    console.log('✓ UI initialized with', bankCodes.length, 'banks');
  }

  // Handle language change
  onLanguageChanged() {
    console.log('Language changed, re-rendering UI...');

    // Update static translations
    this.updateStaticTranslations();

    // Re-render tabs
    this.renderBankTabs();

    // Re-render global connection status
    this.renderGlobalConnectionStatus();

    // Re-render admin panel
    const adminPanel = document.getElementById('panel-admin');
    if (adminPanel) {
      adminPanel.remove();
    }
    this.renderAdminPanel();

    // Re-render all bank panels
    for (const bankCode in this.banks) {
      this.refreshBankPanel(bankCode);
    }

    console.log('✓ UI re-rendered with new language');
  }

  // Update static HTML translations
  updateStaticTranslations() {
    // Update header
    const headerTitle = document.querySelector('.dashboard-header h1');
    if (headerTitle) {
      headerTitle.innerHTML = `🏦 ${this.i18n.t('header.title')}`;
    }

    const headerSubtitle = document.querySelector('.dashboard-header p');
    if (headerSubtitle) {
      headerSubtitle.textContent = this.i18n.t('header.subtitle');
    }
  }

  // Render global connection status indicators
  renderGlobalConnectionStatus() {
    const container = document.getElementById('globalConnectionStatus');
    if (!container) return;

    const state = this.state.getState();
    let html = '';

    for (const bankCode in state.banks) {
      const bank = state.banks[bankCode];
      html += `
        <div class="d-flex align-items-center gap-2">
          <span class="text-white small fw-semibold">${bank.config.name}</span>
          <div class="connection-dot status-idle" id="global-dot-${bankCode}" title="${this.i18n.t('connection.idle')}"></div>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  // Render bank tabs navigation
  renderBankTabs() {
    const tabsContainer = document.getElementById('bankTabs');
    const state = this.state.getState();

    let tabsHTML = '';

    // Add Admin tab first
    tabsHTML += `
      <li class="nav-item" role="presentation">
        <button
          class="nav-link active admin-tab"
          id="tab-admin"
          data-bs-toggle="tab"
          data-bs-target="#panel-admin"
          type="button"
          role="tab">
          <span class="tab-title">⚙️ ${this.i18n.t('tabs.admin')}</span>
        </button>
      </li>
    `;

    // Add bank tabs
    for (const bankCode in state.banks) {
      const bank = state.banks[bankCode];

      tabsHTML += `
        <li class="nav-item" role="presentation">
          <button
            class="nav-link bank-tab bank-tab-${bankCode.toLowerCase()}"
            id="tab-${bankCode}"
            data-bs-toggle="tab"
            data-bs-target="#panel-${bankCode}"
            type="button"
            role="tab"
            data-bank="${bankCode}">
            <span class="tab-title">${bank.config.name}</span>
            <span class="tab-badge" id="badge-${bankCode}">
              <span class="connection-dot" id="dot-${bankCode}"></span>
            </span>
          </button>
        </li>
      `;
    }

    tabsContainer.innerHTML = tabsHTML;

    // Add tab click handlers for bank tabs
    tabsContainer.querySelectorAll('.bank-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const bankCode = e.currentTarget.dataset.bank;
        this.handleTabSwitch(bankCode);
      });
    });
  }

  // Render admin panel (no login required)
  renderAdminPanel() {
    const contentContainer = document.getElementById('bankTabContent');
    const state = this.state.getState();

    const panelHTML = `
      <div class="tab-pane fade show active"
           id="panel-admin"
           role="tabpanel">
        <div class="admin-panel">
          <div class="row g-3">
            <div class="col-12">
              <div class="alert alert-info">
                <h5>🔧 ${this.i18n.t('admin.title')}</h5>
                <p class="mb-0">
                  ${this.i18n.t('admin.description')}
                  <strong>${this.i18n.t('common.warning')}:</strong> ${this.i18n.t('admin.warning')}
                </p>
              </div>
            </div>

            <!-- Auth Service Admin -->
            <div class="col-md-6 col-lg-4">
              <div class="card shadow-sm border-primary">
                <div class="card-body">
                  <h5 class="card-title text-primary">
                    🔐 ${this.i18n.t('admin.authService')}
                  </h5>
                  <p class="text-muted small">${this.i18n.t('admin.authServiceDescription')}</p>
                  <div class="d-grid gap-2">
                    <button class="btn btn-outline-primary btn-sm" id="auth-create-tables-btn">
                      🛠️ ${this.i18n.t('admin.createTables')}
                    </button>
                    <button class="btn btn-outline-success btn-sm" id="auth-seed-btn">
                      🌱 ${this.i18n.t('admin.seedUsers')}
                    </button>
                    <button class="btn btn-outline-danger btn-sm" id="auth-reset-btn">
                      🔄 ${this.i18n.t('admin.resetUsers')}
                    </button>
                  </div>
                  <div id="auth-result" class="mt-2"></div>
                </div>
              </div>
            </div>

            ${Object.keys(state.banks).map(bankCode => {
              const bank = state.banks[bankCode];
              return `
                <!-- ${bank.config.name} Admin -->
                <div class="col-md-6 col-lg-4">
                  <div class="card shadow-sm" style="border-color: ${bank.config.color}">
                    <div class="card-body">
                      <h5 class="card-title" style="color: ${bank.config.color}">
                        🏦 ${bank.config.name}
                      </h5>
                      <p class="text-muted small">${this.i18n.t('admin.manageAccounts')}</p>
                      <div class="d-grid gap-2">
                        <button class="btn btn-outline-primary btn-sm" id="${bankCode}-create-tables-btn">
                          🛠️ ${this.i18n.t('admin.createTables')}
                        </button>
                        <button class="btn btn-outline-success btn-sm" id="${bankCode}-seed-btn">
                          🌱 ${this.i18n.t('admin.seedAccounts')}
                        </button>
                        <button class="btn btn-outline-danger btn-sm" id="${bankCode}-reset-btn">
                          🔄 ${this.i18n.t('admin.resetData')}
                        </button>
                      </div>
                      <div id="${bankCode}-result" class="mt-2"></div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    contentContainer.insertAdjacentHTML('beforeend', panelHTML);

    // Attach event listeners for admin buttons
    this.attachAdminEventListeners();
  }

  // Render bank panel content
  renderBankPanel(bankCode) {
    const contentContainer = document.getElementById('bankTabContent');
    const bankState = this.state.getBankState(bankCode);
    const isActive = this.state.getState().activeBank === bankCode;

    const panelHTML = `
      <div class="tab-pane fade ${isActive ? 'show active' : ''}"
           id="panel-${bankCode}"
           role="tabpanel"
           data-bank="${bankCode}">

        <div class="bank-panel" style="border-top: 4px solid ${bankState.config.color}">
          ${this.renderPanelContent(bankCode, bankState)}
        </div>
      </div>
    `;

    contentContainer.insertAdjacentHTML('beforeend', panelHTML);

    // Attach event listeners
    this.attachPanelEventListeners(bankCode);
  }

  // Render panel content based on login status
  renderPanelContent(bankCode, bankState) {
    if (!bankState.auth.isLoggedIn) {
      return this.renderLoginForm(bankCode, bankState);
    } else {
      return this.renderDashboard(bankCode, bankState);
    }
  }

  // Render login form
  renderLoginForm(bankCode, bankState) {
    return `
      <div class="login-section">
        <div class="row justify-content-center">
          <div class="col-md-6 col-lg-4">
            <div class="card shadow-sm">
              <div class="card-body">
                <div class="text-center mb-4">
                  <div class="bank-logo" style="background: ${bankState.config.gradient}">
                    <h2 class="text-white mb-0">${bankState.config.name}</h2>
                  </div>
                </div>
                <h5 class="card-title">${this.i18n.t('login.title')}</h5>
                <form id="login-form-${bankCode}" class="login-form">
                  <div class="mb-3">
                    <label class="form-label">${this.i18n.t('login.username')}</label>
                    <input
                      type="text"
                      class="form-control"
                      id="username-${bankCode}"
                      placeholder="${this.i18n.t('login.usernameplaceholder')}"
                      value="user_${bankCode.toLowerCase()}"
                      required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">${this.i18n.t('login.password')}</label>
                    <input
                      type="password"
                      class="form-control"
                      id="password-${bankCode}"
                      placeholder="${this.i18n.t('login.passwordPlaceholder')}"
                      value="pass123"
                      required>
                  </div>
                  <div class="mb-3">
                    <div class="alert alert-danger d-none" id="login-error-${bankCode}"></div>
                  </div>
                  <button type="submit" class="btn btn-primary w-100" id="login-btn-${bankCode}">
                    <span class="btn-text">${this.i18n.t('login.loginButton')}</span>
                    <span class="spinner-border spinner-border-sm d-none" role="status"></span>
                  </button>
                </form>
                <div class="mt-3 text-muted small text-center">
                  <p class="mb-0">${this.i18n.t('login.demoCredentials')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Render dashboard (after login)
  renderDashboard(bankCode, bankState) {
    return `
      <div class="dashboard-section">
        <div class="row g-3">
          <!-- Left Column: Account & Transfer -->
          <div class="col-lg-6">
            <!-- Account Selection Card -->
            <div class="card shadow-sm mb-3">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h5 class="card-title mb-0">${this.i18n.t('dashboard.accountBalance')}</h5>
                  <button class="btn btn-sm btn-outline-secondary" id="logout-btn-${bankCode}">
                    ${this.i18n.t('common.logout')}
                  </button>
                </div>

                <select id="account-select-${bankCode}" class="form-select mb-3">
                  <option value="">${this.i18n.t('dashboard.selectAccount')}</option>
                </select>

                <div id="balance-display-${bankCode}" class="balance-display">
                  <div class="text-muted">${this.i18n.t('dashboard.selectAccountPrompt')}</div>
                </div>
              </div>
            </div>

            <!-- Transfer Form Card -->
            <div class="card shadow-sm">
              <div class="card-body">
                <h5 class="card-title">${this.i18n.t('dashboard.makeTransfer')}</h5>
                <form id="transfer-form-${bankCode}" class="transfer-form">
                  <div class="mb-3">
                    <label class="form-label">${this.i18n.t('transfer.transferType')}</label>
                    <select class="form-select" id="transfer-type-${bankCode}">
                      <option value="internal">${this.i18n.t('transfer.internal')}</option>
                      <option value="interbank">${this.i18n.t('transfer.interbank')}</option>
                    </select>
                  </div>

                  <div class="mb-3" id="to-bank-div-${bankCode}" style="display: none;">
                    <label class="form-label">${this.i18n.t('transfer.destinationBank')}</label>
                    <select class="form-select" id="to-bank-${bankCode}">
                      ${this.renderBankOptions(bankCode)}
                    </select>
                  </div>

                  <div class="mb-3">
                    <label class="form-label">${this.i18n.t('transfer.toAccountNumber')}</label>
                    <input
                      type="text"
                      class="form-control"
                      id="to-account-${bankCode}"
                      placeholder="${this.i18n.t('transfer.toAccountPlaceholder')}"
                      required>
                  </div>

                  <div class="mb-3">
                    <label class="form-label">${this.i18n.t('transfer.amount')}</label>
                    <input
                      type="number"
                      class="form-control"
                      id="amount-${bankCode}"
                      placeholder="${this.i18n.t('transfer.amountPlaceholder')}"
                      min="0.01"
                      step="0.01"
                      required>
                  </div>

                  <div class="mb-3">
                    <label class="form-label">${this.i18n.t('transfer.description')}</label>
                    <input
                      type="text"
                      class="form-control"
                      id="description-${bankCode}"
                      placeholder="${this.i18n.t('transfer.descriptionPlaceholder')}"
                      required>
                  </div>

                  <div id="transfer-result-${bankCode}" class="mb-3"></div>

                  <button type="submit" class="btn btn-primary w-100">
                    <span class="btn-text">${this.i18n.t('transfer.executeTransfer')}</span>
                    <span class="spinner-border spinner-border-sm d-none" role="status"></span>
                  </button>
                </form>
              </div>
            </div>
          </div>

          <!-- Right Column: Transactions -->
          <div class="col-lg-6">
            <div class="card shadow-sm">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h5 class="card-title mb-0">${this.i18n.t('dashboard.transactionHistory')}</h5>
                  <button class="btn btn-sm btn-outline-primary" id="refresh-transactions-${bankCode}">
                    <span>↻ ${this.i18n.t('common.refresh')}</span>
                  </button>
                </div>
                <div id="transactions-${bankCode}" class="transactions-list">
                  <div class="text-muted text-center py-4">
                    ${this.i18n.t('dashboard.selectAccountForTransactions')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Render bank options for interbank transfers (excluding current bank)
  renderBankOptions(currentBankCode) {
    const state = this.state.getState();
    let options = '';

    for (const bankCode in state.banks) {
      if (bankCode !== currentBankCode) {
        options += `<option value="${bankCode}">${state.banks[bankCode].config.name}</option>`;
      }
    }

    return options;
  }

  // Attach event listeners to panel elements
  attachPanelEventListeners(bankCode) {
    const panel = document.getElementById(`panel-${bankCode}`);
    if (!panel) return;

    // Login form
    const loginForm = panel.querySelector(`#login-form-${bankCode}`);
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e, bankCode));
    }

    // Logout button
    const logoutBtn = panel.querySelector(`#logout-btn-${bankCode}`);
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout(bankCode));
    }

    // Account selection
    const accountSelect = panel.querySelector(`#account-select-${bankCode}`);
    if (accountSelect) {
      accountSelect.addEventListener('change', (e) => this.handleAccountSelection(e, bankCode));
    }

    // Transfer type change
    const transferType = panel.querySelector(`#transfer-type-${bankCode}`);
    if (transferType) {
      transferType.addEventListener('change', (e) => this.handleTransferTypeChange(e, bankCode));
    }

    // Transfer form
    const transferForm = panel.querySelector(`#transfer-form-${bankCode}`);
    if (transferForm) {
      transferForm.addEventListener('submit', (e) => this.handleTransferSubmit(e, bankCode));
    }

    // Refresh transactions button
    const refreshBtn = panel.querySelector(`#refresh-transactions-${bankCode}`);
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadTransactions(bankCode));
    }
  }

  // Attach event listeners to admin panel buttons
  attachAdminEventListeners() {
    // Auth service buttons
    const authCreateBtn = document.getElementById('auth-create-tables-btn');
    if (authCreateBtn) {
      authCreateBtn.addEventListener('click', () => this.handleAuthCreateTables());
    }

    const authSeedBtn = document.getElementById('auth-seed-btn');
    if (authSeedBtn) {
      authSeedBtn.addEventListener('click', () => this.handleAuthSeed());
    }

    const authResetBtn = document.getElementById('auth-reset-btn');
    if (authResetBtn) {
      authResetBtn.addEventListener('click', () => this.handleAuthReset());
    }

    // Bank buttons
    for (const bankCode in this.banks) {
      // Create tables button
      const createBtn = document.getElementById(`${bankCode}-create-tables-btn`);
      if (createBtn) {
        createBtn.addEventListener('click', () => this.handleBankCreateTables(bankCode));
      }

      // Seed button
      const seedBtn = document.getElementById(`${bankCode}-seed-btn`);
      if (seedBtn) {
        seedBtn.addEventListener('click', () => this.handleBankSeed(bankCode));
      }

      // Reset button
      const resetBtn = document.getElementById(`${bankCode}-reset-btn`);
      if (resetBtn) {
        resetBtn.addEventListener('click', () => this.handleBankReset(bankCode));
      }
    }
  }

  // Handle tab switch
  handleTabSwitch(bankCode) {
    this.state.setActiveBank(bankCode);
    console.log(`Switched to ${bankCode}`);
  }

  // Handle login
  async handleLogin(event, bankCode) {
    event.preventDefault();

    const username = document.getElementById(`username-${bankCode}`).value;
    const password = document.getElementById(`password-${bankCode}`).value;
    const errorDiv = document.getElementById(`login-error-${bankCode}`);
    const btn = document.getElementById(`login-btn-${bankCode}`);

    // Show loading
    this.setButtonLoading(btn, true);
    errorDiv.classList.add('d-none');

    // Attempt login
    const result = await this.banks[bankCode].login(username, password);

    this.setButtonLoading(btn, false);

    if (result.success) {
      // Update state
      this.state.setBankAuth(bankCode, {
        isLoggedIn: true,
        token: result.token,
        username: username
      });

      // Re-render panel to show dashboard
      this.refreshBankPanel(bankCode);

      // Load accounts
      await this.loadAccounts(bankCode);

      // Show success toast
      this.showToast(this.i18n.t('login.loginSuccess', { bankName: this.state.getBankState(bankCode).config.name }), 'success');

      // Initialize SignalR connection
      const signalRResult = await this.signalR.createConnection(
        bankCode,
        this.state.getBankState(bankCode).config.signalRUrl
      );

      if (signalRResult.success) {
        this.updateConnectionStatus(bankCode, 'connected');
        this.showToast(this.i18n.t('login.realTimeEnabled', { bankName: this.state.getBankState(bankCode).config.name }), 'info');
      } else {
        this.updateConnectionStatus(bankCode, 'disconnected');
        console.warn(`SignalR connection failed for ${bankCode}`);
      }
    } else {
      errorDiv.textContent = result.error || this.i18n.t('login.loginFailed', { error: '' });
      errorDiv.classList.remove('d-none');
      this.showToast(this.i18n.t('login.loginFailed', { error: result.error }), 'danger');
    }
  }

  // Handle logout
  async handleLogout(bankCode) {
    // Close SignalR connection
    await this.signalR.closeConnection(bankCode);
    this.updateConnectionStatus(bankCode, 'idle');

    // Clear auth
    this.banks[bankCode].logout();
    this.state.resetBankState(bankCode);

    // Re-render panel
    this.refreshBankPanel(bankCode);

    // Show toast
    this.showToast(this.i18n.t('dashboard.logoutSuccess', { bankName: this.state.getBankState(bankCode).config.name }), 'info');
  }

  // Load accounts for a bank
  async loadAccounts(bankCode) {
    const result = await this.banks[bankCode].loadAccounts();

    if (result.success && result.accounts.length > 0) {
      // Update state
      this.state.setAccounts(bankCode, result.accounts);

      // Populate dropdown
      const select = document.getElementById(`account-select-${bankCode}`);
      if (select) {
        select.innerHTML = '<option value="">Select Account</option>';
        result.accounts.forEach(acc => {
          select.innerHTML += `
            <option value="${acc.accountNumber}">
              ${acc.accountHolderName} (${acc.accountNumber}) - ${this.i18n.formatCurrency(acc.balance)}
            </option>
          `;
        });
      }
    }
  }

  // Handle account selection
  async handleAccountSelection(event, bankCode) {
    const accountNumber = event.target.value;

    if (!accountNumber) {
      return;
    }

    // Update state
    this.state.setCurrentAccount(bankCode, accountNumber);

    // Load account details
    const result = await this.banks[bankCode].getAccountDetails(accountNumber);

    if (result.success) {
      // Update balance display
      const balanceDiv = document.getElementById(`balance-display-${bankCode}`);
      if (balanceDiv) {
        balanceDiv.innerHTML = `
          <div class="balance-amount" id="balance-amount-${bankCode}">
            ${this.i18n.formatCurrency(result.account.balance)}
          </div>
          <div class="balance-label">${this.i18n.t('dashboard.availableBalance')}</div>
        `;
      }

      // Subscribe to SignalR updates for this account
      await this.signalR.subscribeToAccount(bankCode, accountNumber);

      // Load transactions
      await this.loadTransactions(bankCode);
    }
  }

  // Handle transfer type change
  handleTransferTypeChange(event, bankCode) {
    const transferType = event.target.value;
    const toBankDiv = document.getElementById(`to-bank-div-${bankCode}`);

    if (toBankDiv) {
      toBankDiv.style.display = transferType === 'interbank' ? 'block' : 'none';
    }
  }

  // Handle transfer submission
  async handleTransferSubmit(event, bankCode) {
    event.preventDefault();

    const bankState = this.state.getBankState(bankCode);
    const currentAccount = bankState.data.currentAccount;

    if (!currentAccount) {
      this.showToast(this.i18n.t('transfer.selectAccountWarning'), 'warning');
      return;
    }

    const transferType = document.getElementById(`transfer-type-${bankCode}`).value;
    const toAccount = document.getElementById(`to-account-${bankCode}`).value;
    const amount = document.getElementById(`amount-${bankCode}`).value;
    const description = document.getElementById(`description-${bankCode}`).value;
    const toBankCode = transferType === 'interbank' ?
      document.getElementById(`to-bank-${bankCode}`).value : null;

    const resultDiv = document.getElementById(`transfer-result-${bankCode}`);
    const form = event.target;
    const btn = form.querySelector('button[type="submit"]');

    // Show loading
    this.setButtonLoading(btn, true);
    resultDiv.innerHTML = '';

    let result;
    if (transferType === 'internal') {
      result = await this.banks[bankCode].executeInternalTransfer(
        currentAccount, toAccount, amount, description
      );
    } else {
      result = await this.banks[bankCode].executeInterbankTransfer(
        currentAccount, toAccount, toBankCode, amount, description
      );
    }

    this.setButtonLoading(btn, false);

    if (result.success) {
      resultDiv.innerHTML = `
        <div class="alert alert-success">
          ${this.i18n.t('transfer.transferSuccess', { transactionId: result.transactionId })}
        </div>
      `;
      form.reset();
      document.getElementById(`transfer-type-${bankCode}`).value = 'internal';
      document.getElementById(`to-bank-div-${bankCode}`).style.display = 'none';

      this.showToast(this.i18n.t('transfer.transferInitiated', { amount: this.i18n.formatCurrency(parseFloat(amount)) }), 'success');

      // Reload account details and transactions (balance will update via SignalR in Phase 3)
      setTimeout(async () => {
        await this.handleAccountSelection(
          { target: { value: currentAccount } },
          bankCode
        );
      }, 1000);
    } else {
      resultDiv.innerHTML = `
        <div class="alert alert-danger">
          ${this.i18n.t('transfer.transferFailed', { error: result.error })}
        </div>
      `;
      this.showToast(this.i18n.t('transfer.transferFailed', { error: result.error }), 'danger');
    }
  }

  // Load transactions
  async loadTransactions(bankCode) {
    const bankState = this.state.getBankState(bankCode);
    const currentAccount = bankState.data.currentAccount;

    if (!currentAccount) return;

    const result = await this.banks[bankCode].loadTransactions(currentAccount);

    if (result.success) {
      // Update state
      this.state.setTransactions(bankCode, result.transactions);

      // Render transactions
      this.renderTransactions(bankCode, result.transactions);
    }
  }

  // Render transactions list
  renderTransactions(bankCode, transactions) {
    const container = document.getElementById(`transactions-${bankCode}`);
    if (!container) return;

    if (transactions.length === 0) {
      container.innerHTML = `
        <div class="text-muted text-center py-4">
          ${this.i18n.t('dashboard.noTransactions')}
        </div>
      `;
      return;
    }

    let html = '<div class="transaction-items">';
    transactions.slice(0, 20).forEach(tx => {
      const statusClass = tx.status === 'SUCCESS' ? 'success' :
                         tx.status === 'PENDING' ? 'warning' : 'danger';
      const typeClass = tx.type === 'INTERNAL' ? 'internal' : 'interbank';

      // Translate type and status
      const txType = this.i18n.t(`transaction.${tx.type.toLowerCase()}`);
      const txStatus = this.i18n.t(`transaction.${tx.status.toLowerCase()}`);

      html += `
        <div class="transaction-item">
          <div class="transaction-header">
            <div class="transaction-type">
              <span class="badge bg-${typeClass === 'internal' ? 'info' : 'primary'}">${txType}</span>
              <span class="badge bg-${statusClass}">${txStatus}</span>
            </div>
            <div class="transaction-amount">${this.i18n.formatCurrency(tx.amount)}</div>
          </div>
          <div class="transaction-details">
            <div class="transaction-accounts">
              <small>${this.i18n.t('transaction.from')}: ${tx.fromAccountNumber}</small>
              <small>${this.i18n.t('transaction.to')}: ${tx.toAccountNumber}${tx.toBankCode ? ` (${tx.toBankCode})` : ''}</small>
            </div>
            <div class="transaction-description">${tx.description}</div>
            <div class="transaction-date">
              <small class="text-muted">${this.i18n.formatDate(tx.createdAt, { dateStyle: 'short', timeStyle: 'short' })}</small>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';

    container.innerHTML = html;
  }

  // Refresh entire bank panel
  refreshBankPanel(bankCode) {
    const panel = document.getElementById(`panel-${bankCode}`);
    if (!panel) return;

    const bankState = this.state.getBankState(bankCode);
    const panelContent = panel.querySelector('.bank-panel');

    if (panelContent) {
      panelContent.innerHTML = this.renderPanelContent(bankCode, bankState);
      this.attachPanelEventListeners(bankCode);
    }
  }

  // Handle auth service create tables
  async handleAuthCreateTables() {
    const btn = document.getElementById('auth-create-tables-btn');
    const resultDiv = document.getElementById('auth-result');

    if (!confirm('Create tables in Auth Service database?')) {
      return;
    }

    this.setButtonLoading(btn, true);
    resultDiv.innerHTML = '';

    try {
      const response = await fetch('http://localhost:5001/api/auth/admin/create-tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create tables');
      }

      resultDiv.innerHTML = `
        <div class="alert alert-success alert-sm mt-2">
          ✅ ${result.message}
        </div>
      `;
      this.showToast(`✅ ${result.message}`, 'success');
    } catch (error) {
      resultDiv.innerHTML = `
        <div class="alert alert-danger alert-sm mt-2">
          ❌ ${error.message}
        </div>
      `;
      this.showToast(`❌ ${error.message}`, 'danger');
    }

    this.setButtonLoading(btn, false);

    setTimeout(() => {
      resultDiv.innerHTML = '';
    }, 5000);
  }

  // Handle auth service seed
  async handleAuthSeed() {
    const btn = document.getElementById('auth-seed-btn');
    const resultDiv = document.getElementById('auth-result');

    if (!confirm('Seed demo users in Auth Service?')) {
      return;
    }

    this.setButtonLoading(btn, true);
    resultDiv.innerHTML = '';

    try {
      const response = await fetch('http://localhost:5001/api/auth/admin/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to seed users');
      }

      resultDiv.innerHTML = `
        <div class="alert alert-success alert-sm mt-2">
          ✅ ${result.message}
        </div>
      `;
      this.showToast(`✅ ${result.message}`, 'success');
    } catch (error) {
      resultDiv.innerHTML = `
        <div class="alert alert-danger alert-sm mt-2">
          ❌ ${error.message}
        </div>
      `;
      this.showToast(`❌ ${error.message}`, 'danger');
    }

    this.setButtonLoading(btn, false);

    setTimeout(() => {
      resultDiv.innerHTML = '';
    }, 5000);
  }

  // Handle auth service reset
  async handleAuthReset() {
    const btn = document.getElementById('auth-reset-btn');
    const resultDiv = document.getElementById('auth-result');

    if (!confirm(this.i18n.t('admin.confirmAuthReset'))) {
      return;
    }

    this.setButtonLoading(btn, true);
    resultDiv.innerHTML = '';

    try {
      const response = await fetch('http://localhost:5001/api/auth/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset users');
      }

      resultDiv.innerHTML = `
        <div class="alert alert-warning alert-sm mt-2">
          🔄 ${result.message}
        </div>
      `;
      this.showToast(`🔄 ${result.message}`, 'warning');
    } catch (error) {
      resultDiv.innerHTML = `
        <div class="alert alert-danger alert-sm mt-2">
          ❌ ${error.message}
        </div>
      `;
      this.showToast(`❌ ${error.message}`, 'danger');
    }

    this.setButtonLoading(btn, false);

    setTimeout(() => {
      resultDiv.innerHTML = '';
    }, 5000);
  }

  // Handle bank create tables
  async handleBankCreateTables(bankCode) {
    const btn = document.getElementById(`${bankCode}-create-tables-btn`);
    const resultDiv = document.getElementById(`${bankCode}-result`);
    const bankName = this.state.getBankState(bankCode).config.name;

    if (!confirm(this.i18n.t('admin.confirmCreateTables', { name: bankName }))) {
      return;
    }

    this.setButtonLoading(btn, true);
    resultDiv.innerHTML = '';

    const result = await this.banks[bankCode].createTables();

    if (result.success) {
      resultDiv.innerHTML = `
        <div class="alert alert-success alert-sm mt-2">
          ✅ ${result.message}
        </div>
      `;
      this.showToast(`✅ ${result.message}`, 'success');
    } else {
      resultDiv.innerHTML = `
        <div class="alert alert-danger alert-sm mt-2">
          ❌ ${result.error}
        </div>
      `;
      this.showToast(`❌ ${result.error}`, 'danger');
    }

    this.setButtonLoading(btn, false);

    setTimeout(() => {
      resultDiv.innerHTML = '';
    }, 5000);
  }

  // Handle bank seed data
  async handleBankSeed(bankCode) {
    const seedBtn = document.getElementById(`${bankCode}-seed-btn`);
    const resultDiv = document.getElementById(`${bankCode}-result`);

    // Confirm action
    if (!confirm(this.i18n.t('admin.confirmSeed', { name: this.state.getBankState(bankCode).config.name }))) {
      return;
    }

    // Show loading
    this.setButtonLoading(seedBtn, true);
    resultDiv.innerHTML = '';

    // Call seed endpoint
    const result = await this.banks[bankCode].seedData();

    this.setButtonLoading(seedBtn, false);

    if (result.success) {
      resultDiv.innerHTML = `
        <div class="alert alert-success alert-sm mt-2">
          ✅ ${result.message}
        </div>
      `;
      this.showToast(`✅ ${result.message}`, 'success');

      // Reload accounts
      await this.loadAccounts(bankCode);
    } else {
      resultDiv.innerHTML = `
        <div class="alert alert-danger alert-sm mt-2">
          ❌ ${result.error}
        </div>
      `;
      this.showToast(`❌ Seed failed: ${result.error}`, 'danger');
    }

    // Clear result after 5 seconds
    setTimeout(() => {
      resultDiv.innerHTML = '';
    }, 5000);
  }

  // Handle bank reset data
  async handleBankReset(bankCode) {
    const resetBtn = document.getElementById(`${bankCode}-reset-btn`);
    const resultDiv = document.getElementById(`${bankCode}-result`);
    const bankName = this.state.getBankState(bankCode).config.name;

    // Confirm action with strong warning
    if (!confirm(this.i18n.t('admin.confirmReset', { type: this.i18n.t('admin.accounts'), name: bankName }))) {
      return;
    }

    // Double confirmation
    if (!confirm(this.i18n.t('admin.confirmResetFinal'))) {
      return;
    }

    // Show loading
    this.setButtonLoading(resetBtn, true);
    resultDiv.innerHTML = '';

    // Call reset endpoint
    const result = await this.banks[bankCode].resetData();

    this.setButtonLoading(resetBtn, false);

    if (result.success) {
      resultDiv.innerHTML = `
        <div class="alert alert-warning alert-sm mt-2">
          🔄 ${result.message}
        </div>
      `;
      this.showToast(`🔄 ${result.message}`, 'warning');

      // Clear state and reload
      this.state.setAccounts(bankCode, []);
      this.state.setTransactions(bankCode, []);
      this.state.setCurrentAccount(bankCode, null);

      // Update UI
      const accountSelect = document.getElementById(`account-select-${bankCode}`);
      if (accountSelect) {
        accountSelect.innerHTML = '<option value="">Select Account</option>';
      }

      const balanceDiv = document.getElementById(`balance-display-${bankCode}`);
      if (balanceDiv) {
        balanceDiv.innerHTML = '<div class="text-muted">Select an account to view balance</div>';
      }

      const transactionsDiv = document.getElementById(`transactions-${bankCode}`);
      if (transactionsDiv) {
        transactionsDiv.innerHTML = '<div class="text-muted text-center py-4">No transactions found</div>';
      }
    } else {
      resultDiv.innerHTML = `
        <div class="alert alert-danger alert-sm mt-2">
          ❌ ${result.error}
        </div>
      `;
      this.showToast(`❌ Reset failed: ${result.error}`, 'danger');
    }

    // Clear result after 5 seconds
    setTimeout(() => {
      resultDiv.innerHTML = '';
    }, 5000);
  }

  // Subscribe to state changes
  subscribeToStateChanges() {
    // Subscribe to global state changes
    this.state.subscribe(null, (state) => {
      // Update UI based on state changes
      // Could implement more granular updates here
    });
  }

  // Subscribe to SignalR events
  subscribeToSignalREvents() {
    // Listen for balance updates
    window.addEventListener('signalr-balance-updated', (event) => {
      const { bankCode, data } = event.detail;
      this.handleSignalRBalanceUpdate(bankCode, data);
    });

    // Listen for transaction received
    window.addEventListener('signalr-transaction-received', (event) => {
      const { bankCode, data } = event.detail;
      this.handleSignalRTransactionReceived(bankCode, data);
    });

    // Listen for connection status changes
    window.addEventListener('signalr-status-changed', (event) => {
      const { bankCode, status } = event.detail;
      this.updateConnectionStatus(bankCode, status);

      // Show toast for important status changes
      if (status === 'connecting') {
        this.showToast(this.i18n.t('connection.reconnecting', { bankName: this.state.getBankState(bankCode).config.name }), 'warning');
      } else if (status === 'connected') {
        this.showToast(this.i18n.t('connection.reconnected', { bankName: this.state.getBankState(bankCode).config.name }), 'success');
      } else if (status === 'disconnected') {
        this.showToast(this.i18n.t('connection.lostConnection', { bankName: this.state.getBankState(bankCode).config.name }), 'warning');
      }
    });
  }

  // Handle SignalR balance update
  handleSignalRBalanceUpdate(bankCode, data) {
    console.log(`[${bankCode}] Balance updated via SignalR:`, data);

    // Update balance in state
    this.state.updateAccountBalance(bankCode, data.accountNumber, data.balance);

    // Update balance display if this account is currently selected
    const bankState = this.state.getBankState(bankCode);
    if (bankState.data.currentAccount === data.accountNumber) {
      const balanceEl = document.getElementById(`balance-amount-${bankCode}`);
      if (balanceEl) {
        balanceEl.textContent = this.i18n.formatCurrency(data.balance);
        balanceEl.classList.add('balance-updating');
        setTimeout(() => balanceEl.classList.remove('balance-updating'), 500);
      }
    }

    // Show toast notification
    this.showToast(
      this.i18n.t('notification.balanceUpdated', {
        accountNumber: data.accountNumber,
        balance: this.i18n.formatCurrency(data.balance)
      }),
      'success'
    );

    // Reload transactions to show the new transaction
    this.loadTransactions(bankCode);
  }

  // Handle SignalR transaction received
  handleSignalRTransactionReceived(bankCode, data) {
    console.log(`[${bankCode}] Transaction received via SignalR:`, data);

    // Show toast notification
    this.showToast(
      this.i18n.t('notification.transactionReceived', {
        amount: this.i18n.formatCurrency(data.amount),
        fromBank: data.fromBank,
        fromAccount: data.fromAccount
      }),
      'success'
    );

    // Reload transactions to show the new transaction
    this.loadTransactions(bankCode);

    // Reload account details to get updated balance
    const bankState = this.state.getBankState(bankCode);
    if (bankState.data.currentAccount) {
      this.banks[bankCode].getAccountDetails(bankState.data.currentAccount).then(result => {
        if (result.success) {
          this.state.updateAccountBalance(bankCode, result.account.accountNumber, result.account.balance);

          const balanceEl = document.getElementById(`balance-amount-${bankCode}`);
          if (balanceEl) {
            balanceEl.textContent = this.i18n.formatCurrency(result.account.balance);
            balanceEl.classList.add('balance-updating');
            setTimeout(() => balanceEl.classList.remove('balance-updating'), 500);
          }
        }
      });
    }
  }

  // Show toast notification
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toastId = `toast-${Date.now()}-${this.toastCounter++}`;

    const iconMap = {
      success: '✅',
      danger: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const typeLabel = this.i18n.t(`common.${type}`).toUpperCase();

    const toastHTML = `
      <div class="toast toast-${type} show" id="${toastId}" role="alert">
        <div class="toast-header">
          <strong class="me-auto">${iconMap[type] || 'ℹ️'} ${typeLabel}</strong>
          <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">${message}</div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', toastHTML);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      const toast = document.getElementById(toastId);
      if (toast) {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);
  }

  // Helper: Set button loading state
  setButtonLoading(button, isLoading) {
    const btnText = button.querySelector('.btn-text');
    const spinner = button.querySelector('.spinner-border');

    if (isLoading) {
      button.disabled = true;
      if (btnText) btnText.classList.add('d-none');
      if (spinner) spinner.classList.remove('d-none');
    } else {
      button.disabled = false;
      if (btnText) btnText.classList.remove('d-none');
      if (spinner) spinner.classList.add('d-none');
    }
  }

  // Update connection status indicator
  updateConnectionStatus(bankCode, status) {
    // Update tab dot
    const dot = document.getElementById(`dot-${bankCode}`);
    if (dot) {
      dot.className = 'connection-dot';
      dot.classList.add(`status-${status}`);
      dot.title = this.i18n.t(`connection.${status}`);
    }

    // Update global status dot
    const globalDot = document.getElementById(`global-dot-${bankCode}`);
    if (globalDot) {
      globalDot.className = 'connection-dot';
      globalDot.classList.add(`status-${status}`);
      globalDot.title = this.i18n.t(`connection.${status}`);
    }
  }
}
