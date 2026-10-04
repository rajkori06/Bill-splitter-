/**
 * ==========================================================================
 * Bill Splitter - Fair & Custom Bill Splitting Application
 * Competition ID: ZC-A9E29191C395
 * Author: Raj Kori | SISTec Ratibad, Bhopal (MP)
 * Phone: 6263465690
 * Zero External Dependencies | Pure Vanilla ES6+ JavaScript
 * Strictly 3 Files: HTML, CSS, JS (No Extra Files Created)
 * ==========================================================================
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. Constants & State Management (In-Browser Storage Only - No Files)
  // --------------------------------------------------------------------------
  const STORAGE_KEYS = {
    THEME: 'billsplitter_theme_zc',
    CURRENT_DRAFT: 'billsplitter_current_draft_zc',
    RECORDS: 'billsplitter_records_zc'
  };

  const COMPETITION_ID = 'ZC-A9E29191C395';

  // Application State
  const defaultState = {
    occasion: 'Dinner with Friends',
    amount: 1500,
    currency: '₹',
    tipPercent: 0,
    splitMode: 'equal', // 'equal' or 'custom'
    participants: [
      { id: 'p_1', name: 'Raj Kori', customAmount: 375, isPaid: true },
      { id: 'p_2', name: 'Friend 2', customAmount: 375, isPaid: false },
      { id: 'p_3', name: 'Friend 3', customAmount: 375, isPaid: false },
      { id: 'p_4', name: 'Friend 4', customAmount: 375, isPaid: false }
    ],
    calculatedResult: null,
    lastCalculatedAt: null
  };

  let appState = { ...defaultState };

  // --------------------------------------------------------------------------
  // 2. DOM Elements Selection
  // --------------------------------------------------------------------------
  const dom = {
    html: document.documentElement,
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIcon: document.getElementById('themeIcon'),

    // Split Mode Toggle Buttons
    modeEqualBtn: document.getElementById('modeEqualBtn'),
    modeCustomBtn: document.getElementById('modeCustomBtn'),

    // Balance Tracker (Custom Mode)
    balanceTrackerBox: document.getElementById('balanceTrackerBox'),
    trackerTotalBill: document.getElementById('trackerTotalBill'),
    trackerAllocated: document.getElementById('trackerAllocated'),
    trackerRemaining: document.getElementById('trackerRemaining'),
    trackerStatusBadge: document.getElementById('trackerStatusBadge'),
    autofillRemainingBtn: document.getElementById('autofillRemainingBtn'),
    splitEvenlyBtn: document.getElementById('splitEvenlyBtn'),

    // Inputs
    occasionInput: document.getElementById('occasionInput'),
    billAmountInput: document.getElementById('billAmountInput'),
    currencySelect: document.getElementById('currencySelect'),
    peopleCountInput: document.getElementById('peopleCountInput'),
    decreasePeopleBtn: document.getElementById('decreasePeopleBtn'),
    increasePeopleBtn: document.getElementById('increasePeopleBtn'),
    participantsContainer: document.getElementById('participantsContainer'),
    addParticipantBtn: document.getElementById('addParticipantBtn'),
    tipChips: document.querySelectorAll('.tip-chip'),

    // Actions
    calculateBtn: document.getElementById('calculateBtn'),
    resetBtn: document.getElementById('resetBtn'),
    saveRecordBtn: document.getElementById('saveRecordBtn'),
    copySummaryBtn: document.getElementById('copySummaryBtn'),
    printReceiptBtn: document.getElementById('printReceiptBtn'),

    // Results
    resultsCard: document.getElementById('resultsCard'),
    emptyResultsState: document.getElementById('emptyResultsState'),
    calculatedResultsState: document.getElementById('calculatedResultsState'),
    exactProofText: document.getElementById('exactProofText'),
    statTotalBill: document.getElementById('statTotalBill'),
    statPeopleCount: document.getElementById('statPeopleCount'),
    statAverageShare: document.getElementById('statAverageShare'),
    sharesContainer: document.getElementById('sharesContainer'),

    // Previous Records (In-Memory / LocalStorage Only)
    recordsList: document.getElementById('recordsList'),
    recordsCountBadge: document.getElementById('recordsCountBadge'),
    clearRecordsBtn: document.getElementById('clearRecordsBtn'),

    // Developer & Contest ID
    copyCompetitionIdBtn: document.getElementById('copyCompetitionIdBtn'),

    // Modal
    receiptModal: document.getElementById('receiptModal'),
    receiptModalBody: document.getElementById('receiptModalBody'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    modalPrintBtn: document.getElementById('modalPrintBtn'),
    modalCopyBtn: document.getElementById('modalCopyBtn'),

    // Toast Container
    toastContainer: document.getElementById('toastContainer')
  };

  // --------------------------------------------------------------------------
  // 3. Theme Engine (Dark Mode / Light Mode)
  // --------------------------------------------------------------------------
  function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
    setTheme(savedTheme);

    if (dom.themeToggleBtn) {
      dom.themeToggleBtn.addEventListener('click', () => {
        const currentTheme = dom.html.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        showToast(`Switched to ${newTheme === 'dark' ? 'Dark Midnight' : 'Light Blue'} theme`, 'info');
      });
    }
  }

  function setTheme(theme) {
    dom.html.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);

    if (dom.themeIcon) {
      if (theme === 'light') {
        dom.themeIcon.innerHTML = `
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        `;
      } else {
        dom.themeIcon.innerHTML = `
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        `;
      }
    }
  }

  // --------------------------------------------------------------------------
  // 4. Split Mode Switcher (Equal Split vs Custom/Editable Unequal Split)
  // --------------------------------------------------------------------------
  function setSplitMode(mode) {
    appState.splitMode = mode;

    if (dom.modeEqualBtn && dom.modeCustomBtn) {
      dom.modeEqualBtn.classList.toggle('active', mode === 'equal');
      dom.modeCustomBtn.classList.toggle('active', mode === 'custom');
    }

    if (dom.balanceTrackerBox) {
      dom.balanceTrackerBox.style.display = mode === 'custom' ? 'flex' : 'none';
    }

    renderParticipantsInputs();
    updateBalanceTracker();
    saveDraftToStorage();

    if (appState.calculatedResult) {
      performCalculation();
    }
  }

  function updateBalanceTracker() {
    if (appState.splitMode !== 'custom' || !dom.balanceTrackerBox) return;

    const rawBill = parseFloat(dom.billAmountInput ? dom.billAmountInput.value : appState.amount) || 0;
    const tipPerc = appState.tipPercent || 0;
    const totalBill = Math.round((rawBill + (rawBill * tipPerc / 100)) * 100) / 100;
    const curr = dom.currencySelect ? dom.currencySelect.value : appState.currency;

    let totalAllocated = 0;
    appState.participants.forEach(p => {
      totalAllocated += parseFloat(p.customAmount) || 0;
    });
    totalAllocated = Math.round(totalAllocated * 100) / 100;

    const remaining = Math.round((totalBill - totalAllocated) * 100) / 100;

    if (dom.trackerTotalBill) dom.trackerTotalBill.textContent = `${curr}${formatNumber(totalBill)}`;
    if (dom.trackerAllocated) dom.trackerAllocated.textContent = `${curr}${formatNumber(totalAllocated)}`;
    if (dom.trackerRemaining) dom.trackerRemaining.textContent = `${curr}${formatNumber(remaining)}`;

    if (dom.trackerStatusBadge) {
      if (Math.abs(remaining) < 0.01) {
        dom.trackerStatusBadge.className = 'balance-status-badge balanced';
        dom.trackerStatusBadge.innerHTML = '✓ Exact Match';
      } else if (remaining > 0) {
        dom.trackerStatusBadge.className = 'balance-status-badge under';
        dom.trackerStatusBadge.innerHTML = `⚠️ ${curr}${formatNumber(remaining)} unassigned`;
      } else {
        dom.trackerStatusBadge.className = 'balance-status-badge over';
        dom.trackerStatusBadge.innerHTML = `⚠️ Over by ${curr}${formatNumber(Math.abs(remaining))}`;
      }
    }
  }

  function autofillRemainingBalance() {
    const rawBill = parseFloat(dom.billAmountInput.value) || 0;
    const tipPerc = appState.tipPercent || 0;
    const totalBill = Math.round((rawBill + (rawBill * tipPerc / 100)) * 100) / 100;

    let allocatedOther = 0;
    // Find unassigned participants (0 or empty)
    const zeroParticipants = appState.participants.filter(p => !p.customAmount || parseFloat(p.customAmount) === 0);

    appState.participants.forEach(p => {
      if (p.customAmount && parseFloat(p.customAmount) > 0) {
        allocatedOther += parseFloat(p.customAmount);
      }
    });

    const remainder = Math.max(0, Math.round((totalBill - allocatedOther) * 100) / 100);

    if (zeroParticipants.length > 0) {
      const perPerson = Math.round((remainder / zeroParticipants.length) * 100) / 100;
      zeroParticipants.forEach((p, idx) => {
        p.customAmount = perPerson;
      });
    } else {
      // Divide remainder evenly to the last participant
      const lastP = appState.participants[appState.participants.length - 1];
      lastP.customAmount = Math.round(((parseFloat(lastP.customAmount) || 0) + (totalBill - allocatedOther)) * 100) / 100;
    }

    renderParticipantsInputs();
    updateBalanceTracker();
    saveDraftToStorage();
    showToast('Unallocated balance auto-assigned!', 'info');
  }

  function splitEvenlyToCustom() {
    const rawBill = parseFloat(dom.billAmountInput.value) || 0;
    const tipPerc = appState.tipPercent || 0;
    const totalBill = Math.round((rawBill + (rawBill * tipPerc / 100)) * 100) / 100;
    const n = Math.max(1, appState.participants.length);

    const totalCents = Math.round(totalBill * 100);
    const baseCents = Math.floor(totalCents / n);
    const remainderCents = totalCents % n;

    appState.participants.forEach((p, idx) => {
      const cents = idx < remainderCents ? baseCents + 1 : baseCents;
      p.customAmount = cents / 100;
    });

    renderParticipantsInputs();
    updateBalanceTracker();
    saveDraftToStorage();
    showToast('Reset all amounts to equal split shares.', 'info');
  }

  // --------------------------------------------------------------------------
  // 5. Participants UI Management
  // --------------------------------------------------------------------------
  function renderParticipantsInputs() {
    if (!dom.participantsContainer) return;
    dom.participantsContainer.innerHTML = '';

    const isCustom = appState.splitMode === 'custom';
    const curr = dom.currencySelect ? dom.currencySelect.value : appState.currency;

    appState.participants.forEach((participant, index) => {
      const row = document.createElement('div');
      row.className = 'participant-row';
      row.setAttribute('data-id', participant.id);

      row.innerHTML = `
        <span class="participant-index">${index + 1}</span>
        <input 
          type="text" 
          class="participant-input" 
          placeholder="Friend ${index + 1} name" 
          value="${escapeHtml(participant.name)}"
          aria-label="Friend ${index + 1} name"
          maxlength="30"
        />
        ${isCustom ? `
          <div class="custom-share-input-box" title="Individual amount this friend pays">
            <span class="custom-share-prefix">${curr}</span>
            <input 
              type="number" 
              class="custom-share-input tabular" 
              step="0.01" 
              min="0"
              placeholder="0.00" 
              value="${participant.customAmount !== undefined ? participant.customAmount : ''}"
            />
          </div>
        ` : ''}
        ${appState.participants.length > 2 ? `
          <button type="button" class="remove-participant-btn" title="Remove ${escapeHtml(participant.name)}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        ` : ''}
      `;

      // Name change listener
      const nameInput = row.querySelector('.participant-input');
      nameInput.addEventListener('input', (e) => {
        participant.name = e.target.value;
        saveDraftToStorage();
      });

      // Custom amount change listener (if custom mode)
      if (isCustom) {
        const amountInput = row.querySelector('.custom-share-input');
        amountInput.addEventListener('input', (e) => {
          participant.customAmount = parseFloat(e.target.value) || 0;
          updateBalanceTracker();
          saveDraftToStorage();
        });
      }

      // Remove listener
      const removeBtn = row.querySelector('.remove-participant-btn');
      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          removeParticipant(participant.id);
        });
      }

      dom.participantsContainer.appendChild(row);
    });

    if (dom.peopleCountInput) {
      dom.peopleCountInput.value = appState.participants.length;
    }
  }

  function addParticipant(customName = '') {
    const newIndex = appState.participants.length + 1;
    const newParticipant = {
      id: 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: customName || `Friend ${newIndex}`,
      customAmount: 0,
      isPaid: false
    };

    appState.participants.push(newParticipant);
    renderParticipantsInputs();
    updateBalanceTracker();
    saveDraftToStorage();
    showToast(`Added ${newParticipant.name}`, 'info');

    if (appState.calculatedResult) {
      performCalculation();
    }
  }

  function removeParticipant(id) {
    if (appState.participants.length <= 2) {
      showToast('Minimum 2 friends required to split.', 'warning');
      return;
    }

    const removedPerson = appState.participants.find(p => p.id === id);
    appState.participants = appState.participants.filter(p => p.id !== id);
    renderParticipantsInputs();
    updateBalanceTracker();
    saveDraftToStorage();

    if (removedPerson) {
      showToast(`Removed ${removedPerson.name}`, 'info');
    }

    if (appState.calculatedResult) {
      performCalculation();
    }
  }

  function updatePeopleCount(targetCount) {
    const count = parseInt(targetCount, 10);
    if (isNaN(count) || count < 2) {
      showToast('At least 2 friends required.', 'warning');
      return;
    }

    const currentCount = appState.participants.length;

    if (count > currentCount) {
      const diff = count - currentCount;
      for (let i = 0; i < diff; i++) {
        const idx = appState.participants.length + 1;
        appState.participants.push({
          id: 'p_' + Date.now() + '_' + i,
          name: `Friend ${idx}`,
          customAmount: 0,
          isPaid: false
        });
      }
    } else if (count < currentCount) {
      appState.participants = appState.participants.slice(0, count);
    }

    renderParticipantsInputs();
    updateBalanceTracker();
    saveDraftToStorage();

    if (appState.calculatedResult) {
      performCalculation();
    }
  }

  // --------------------------------------------------------------------------
  // 6. Calculation Execution (Equal Split OR Custom/Editable Unequal Split)
  // --------------------------------------------------------------------------
  function calculateExactSplit(billAmount, tipPercent, participants, splitMode) {
    const validAmount = Math.max(0, parseFloat(billAmount) || 0);
    const validTipPercent = Math.max(0, parseFloat(tipPercent) || 0);
    const tipAmount = Math.round(validAmount * (validTipPercent / 100) * 100) / 100;
    const grandTotal = Math.round((validAmount + tipAmount) * 100) / 100;

    const n = Math.max(1, participants.length);
    let shares = [];

    if (splitMode === 'custom') {
      // Custom Split: Take each participant's edited amount
      shares = participants.map((p, index) => {
        const customVal = parseFloat(p.customAmount) || 0;
        const percentage = grandTotal > 0 ? ((customVal / grandTotal) * 100).toFixed(1) : (100 / n).toFixed(1);
        return {
          id: p.id,
          name: p.name.trim() || `Friend ${index + 1}`,
          isPaid: Boolean(p.isPaid),
          shareAmount: customVal,
          percentage: percentage,
          isCustom: true
        };
      });
    } else {
      // Equal Split with Penny Exactness: Remainder cents distributed sequentially
      const totalCents = Math.round(grandTotal * 100);
      const baseShareCents = Math.floor(totalCents / n);
      const remainderCents = totalCents % n;

      shares = participants.map((participant, index) => {
        const shareCents = index < remainderCents ? baseShareCents + 1 : baseShareCents;
        const shareAmount = shareCents / 100;
        const percentage = grandTotal > 0 ? ((shareAmount / grandTotal) * 100).toFixed(1) : (100 / n).toFixed(1);

        // Update customAmount in state so if they switch to custom mode it's already filled
        participant.customAmount = shareAmount;

        return {
          id: participant.id,
          name: participant.name.trim() || `Friend ${index + 1}`,
          isPaid: Boolean(participant.isPaid),
          shareAmount: shareAmount,
          percentage: percentage,
          isCustom: false,
          hasRemainderPenny: index < remainderCents
        };
      });
    }

    const verifiedSum = Math.round(shares.reduce((acc, curr) => acc + curr.shareAmount, 0) * 100) / 100;
    const discrepancy = Math.round((grandTotal - verifiedSum) * 100) / 100;
    const isExact = Math.abs(discrepancy) < 0.01;

    return {
      billAmount: validAmount,
      tipPercent: validTipPercent,
      tipAmount: tipAmount,
      grandTotal: grandTotal,
      shares: shares,
      verifiedSum: verifiedSum,
      discrepancy: discrepancy,
      isExact: isExact,
      participantCount: n,
      splitMode: splitMode
    };
  }

  function performCalculation() {
    const rawAmount = parseFloat(dom.billAmountInput.value);

    if (isNaN(rawAmount) || rawAmount <= 0) {
      showToast('Please enter a valid bill amount greater than 0.', 'warning');
      dom.billAmountInput.focus();
      return;
    }

    if (!dom.occasionInput.value.trim()) {
      dom.occasionInput.value = 'Friends Get-together';
    }

    appState.occasion = dom.occasionInput.value.trim();
    appState.amount = rawAmount;
    appState.currency = dom.currencySelect.value;

    const result = calculateExactSplit(
      appState.amount,
      appState.tipPercent,
      appState.participants,
      appState.splitMode
    );

    // If in custom mode and there's a discrepancy, inform the user
    if (appState.splitMode === 'custom' && !result.isExact) {
      if (result.discrepancy > 0) {
        showToast(`Heads up: ₹${formatNumber(result.discrepancy)} is still unassigned!`, 'warning');
      } else {
        showToast(`Heads up: Over-allocated by ₹${formatNumber(Math.abs(result.discrepancy))}!`, 'warning');
      }
    } else {
      showToast('Bill split calculated successfully!', 'success');
    }

    appState.calculatedResult = result;
    appState.lastCalculatedAt = new Date().toISOString();

    renderCalculatedResults(result);
    updateBalanceTracker();
    saveDraftToStorage();
  }

  function renderCalculatedResults(result) {
    if (!result) {
      dom.emptyResultsState.style.display = 'block';
      dom.calculatedResultsState.style.display = 'none';
      return;
    }

    dom.emptyResultsState.style.display = 'none';
    dom.calculatedResultsState.style.display = 'block';

    const curr = appState.currency;

    // Summary Metrics
    if (dom.statTotalBill) {
      dom.statTotalBill.textContent = `${curr}${formatNumber(result.grandTotal)}`;
    }
    if (dom.statPeopleCount) {
      dom.statPeopleCount.textContent = `${result.participantCount} Friends`;
    }
    if (dom.statAverageShare) {
      const avg = (result.grandTotal / result.participantCount).toFixed(2);
      dom.statAverageShare.textContent = `${curr}${avg}`;
    }

    // Exact Proof Badge
    if (dom.exactProofText) {
      if (result.isExact) {
        dom.exactProofText.innerHTML = `
          <strong>Exact Match Verified:</strong> Sum of shares (${curr}${formatNumber(result.verifiedSum)}) equals Total Bill (${curr}${formatNumber(result.grandTotal)}) exactly. Difference: 0.00.
        `;
        dom.exactProofText.parentElement.style.background = 'var(--success-bg)';
        dom.exactProofText.parentElement.style.color = 'var(--success-color)';
        dom.exactProofText.parentElement.style.borderColor = 'var(--success-border)';
      } else {
        const diffText = result.discrepancy > 0 
          ? `Short by ${curr}${formatNumber(result.discrepancy)}` 
          : `Over by ${curr}${formatNumber(Math.abs(result.discrepancy))}`;
        dom.exactProofText.innerHTML = `
          <strong>Custom Allocation Alert:</strong> Total Shares (${curr}${formatNumber(result.verifiedSum)}) vs Bill (${curr}${formatNumber(result.grandTotal)}) · ${diffText}.
        `;
        dom.exactProofText.parentElement.style.background = 'rgba(245, 158, 11, 0.12)';
        dom.exactProofText.parentElement.style.color = '#f59e0b';
        dom.exactProofText.parentElement.style.borderColor = 'rgba(245, 158, 11, 0.3)';
      }
    }

    // Individual Shares List
    if (dom.sharesContainer) {
      dom.sharesContainer.innerHTML = '';

      result.shares.forEach((share, index) => {
        const card = document.createElement('div');
        card.className = `share-card-item ${share.isPaid ? 'is-paid' : ''}`;
        card.setAttribute('data-id', share.id);

        const initials = getInitials(share.name);

        card.innerHTML = `
          <div class="share-person-meta">
            <div class="person-avatar">${initials}</div>
            <div class="person-name-box">
              <span class="person-name">${escapeHtml(share.name)}</span>
              <span class="person-percentage">
                ${share.percentage}% of bill ${share.hasRemainderPenny ? '· (+1¢ remainder)' : ''}
              </span>
            </div>
          </div>
          <div class="share-amount-box">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="share-amount-value tabular">${curr}${formatNumber(share.shareAmount)}</span>
              <button type="button" class="share-edit-btn" title="Edit this friend's share amount">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
            </div>
            <label class="paid-toggle-label">
              <input type="checkbox" class="paid-checkbox" ${share.isPaid ? 'checked' : ''} />
              <span>${share.isPaid ? 'Paid' : 'Mark as paid'}</span>
            </label>
          </div>
        `;

        // Interactive Inline Edit Button
        const editBtn = card.querySelector('.share-edit-btn');
        editBtn.addEventListener('click', () => {
          const currentAmount = share.shareAmount;
          const newAmountStr = prompt(`Edit amount for ${share.name} (${curr}):`, currentAmount);
          if (newAmountStr !== null) {
            const newAmount = parseFloat(newAmountStr);
            if (!isNaN(newAmount) && newAmount >= 0) {
              // Switch to custom mode if not already
              appState.splitMode = 'custom';
              if (dom.modeEqualBtn && dom.modeCustomBtn) {
                dom.modeEqualBtn.classList.remove('active');
                dom.modeCustomBtn.classList.add('active');
              }
              if (dom.balanceTrackerBox) {
                dom.balanceTrackerBox.style.display = 'flex';
              }

              const targetP = appState.participants.find(p => p.id === share.id);
              if (targetP) {
                targetP.customAmount = newAmount;
              }

              renderParticipantsInputs();
              performCalculation();
              showToast(`Updated ${share.name}'s share to ${curr}${formatNumber(newAmount)}`, 'info');
            } else {
              showToast('Invalid amount entered.', 'warning');
            }
          }
        });

        // Checkbox Paid Toggle
        const checkbox = card.querySelector('.paid-checkbox');
        checkbox.addEventListener('change', (e) => {
          const isChecked = e.target.checked;
          share.isPaid = isChecked;

          const original = appState.participants.find(p => p.id === share.id);
          if (original) original.isPaid = isChecked;

          if (isChecked) {
            card.classList.add('is-paid');
            checkbox.nextElementSibling.textContent = 'Paid';
            showToast(`${share.name} marked as paid!`, 'success');
          } else {
            card.classList.remove('is-paid');
            checkbox.nextElementSibling.textContent = 'Mark as paid';
          }

          saveDraftToStorage();
        });

        dom.sharesContainer.appendChild(card);
      });
    }
  }

  // --------------------------------------------------------------------------
  // 7. Persistence Engine (Auto-Save to LocalStorage Only - No Files)
  // --------------------------------------------------------------------------
  function saveDraftToStorage() {
    const draft = {
      occasion: dom.occasionInput ? dom.occasionInput.value : appState.occasion,
      amount: dom.billAmountInput ? parseFloat(dom.billAmountInput.value) || 0 : appState.amount,
      currency: dom.currencySelect ? dom.currencySelect.value : appState.currency,
      tipPercent: appState.tipPercent,
      splitMode: appState.splitMode,
      participants: appState.participants,
      calculatedResult: appState.calculatedResult,
      lastCalculatedAt: appState.lastCalculatedAt
    };

    localStorage.setItem(STORAGE_KEYS.CURRENT_DRAFT, JSON.stringify(draft));
  }

  function loadDraftFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_DRAFT);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.participants) && parsed.participants.length >= 2) {
          appState = { ...defaultState, ...parsed };
        }
      }
    } catch (err) {
      console.warn('Could not parse saved draft from localStorage:', err);
    }

    if (dom.occasionInput) dom.occasionInput.value = appState.occasion || '';
    if (dom.billAmountInput) dom.billAmountInput.value = appState.amount > 0 ? appState.amount : '';
    if (dom.currencySelect) dom.currencySelect.value = appState.currency || '₹';

    // Tip Chips Active State
    dom.tipChips.forEach(chip => {
      const val = parseInt(chip.getAttribute('data-tip'), 10);
      chip.classList.toggle('active', val === appState.tipPercent);
    });

    // Split Mode
    if (dom.modeEqualBtn && dom.modeCustomBtn) {
      dom.modeEqualBtn.classList.toggle('active', appState.splitMode === 'equal');
      dom.modeCustomBtn.classList.toggle('active', appState.splitMode === 'custom');
    }
    if (dom.balanceTrackerBox) {
      dom.balanceTrackerBox.style.display = appState.splitMode === 'custom' ? 'flex' : 'none';
    }

    renderParticipantsInputs();
    updateBalanceTracker();

    // If a calculation was already present, restore results immediately upon reload!
    if (appState.calculatedResult) {
      renderCalculatedResults(appState.calculatedResult);
    }
  }

  function resetCalculator() {
    if (!confirm('Are you sure you want to reset current bill splitter fields?')) {
      return;
    }

    appState = {
      ...defaultState,
      amount: 0,
      splitMode: 'equal',
      calculatedResult: null,
      participants: [
        { id: 'p_1', name: 'Raj Kori', customAmount: 0, isPaid: false },
        { id: 'p_2', name: 'Friend 2', customAmount: 0, isPaid: false },
        { id: 'p_3', name: 'Friend 3', customAmount: 0, isPaid: false }
      ]
    };

    if (dom.occasionInput) dom.occasionInput.value = '';
    if (dom.billAmountInput) dom.billAmountInput.value = '';
    if (dom.currencySelect) dom.currencySelect.value = '₹';

    dom.tipChips.forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('data-tip') === '0');
    });

    setSplitMode('equal');
    renderCalculatedResults(null);
    saveDraftToStorage();
    showToast('Calculator reset to default.', 'info');
  }

  // --------------------------------------------------------------------------
  // 8. Previous Records (Saved in Browser LocalStorage Only - No Files)
  // --------------------------------------------------------------------------
  function getSavedRecords() {
    try {
      const records = localStorage.getItem(STORAGE_KEYS.RECORDS);
      return records ? JSON.parse(records) : [];
    } catch (e) {
      return [];
    }
  }

  function saveRecordToHistory() {
    if (!appState.calculatedResult) {
      showToast('Please calculate a bill split first before saving.', 'warning');
      return;
    }

    const records = getSavedRecords();
    const curr = appState.currency;

    const newRecord = {
      id: 'rec_' + Date.now(),
      occasion: appState.occasion || 'Split Bill',
      date: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      currency: curr,
      totalAmount: appState.calculatedResult.grandTotal,
      billAmount: appState.calculatedResult.billAmount,
      tipPercent: appState.calculatedResult.tipPercent,
      splitMode: appState.splitMode,
      participants: appState.calculatedResult.shares.map(s => ({
        name: s.name,
        share: s.shareAmount,
        isPaid: s.isPaid
      }))
    };

    records.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));

    renderRecordsList();
    showToast(`Saved "${newRecord.occasion}" to previous records!`, 'success');
  }

  function renderRecordsList() {
    if (!dom.recordsList) return;

    const records = getSavedRecords();

    if (dom.recordsCountBadge) {
      dom.recordsCountBadge.textContent = `${records.length} Record${records.length === 1 ? '' : 's'} Stored`;
    }

    if (records.length === 0) {
      dom.recordsList.innerHTML = `
        <div class="glass-panel" style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; color: var(--text-muted);">
          <svg style="width: 48px; height: 48px; margin: 0 auto 12px; opacity: 0.4;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <p style="font-weight: 600; font-size: 1.05rem; margin-bottom: 4px; color: var(--text-primary);">No Previous Records Stored</p>
          <p style="font-size: 0.88rem;">Calculate a bill in Section 2 and click "Save to Records" to archive it in your browser memory.</p>
        </div>
      `;
      return;
    }

    dom.recordsList.innerHTML = '';

    records.forEach(record => {
      const card = document.createElement('div');
      card.className = 'glass-panel record-card';

      const participantsChips = record.participants.slice(0, 4).map(p => `
        <span class="record-chip">${escapeHtml(p.name)}: ${record.currency}${formatNumber(p.share)}</span>
      `).join('');

      const extraCount = record.participants.length > 4 ? `<span class="record-chip">+${record.participants.length - 4} more</span>` : '';

      card.innerHTML = `
        <div>
          <div class="record-card-top">
            <div>
              <h4 class="record-occasion">${escapeHtml(record.occasion)}</h4>
              <span class="record-date">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                ${record.date}
              </span>
            </div>
            <div>
              <div class="record-amount-badge tabular">${record.currency}${formatNumber(record.totalAmount)}</div>
              <div class="record-people-count">${record.participants.length} Friends · ${record.splitMode === 'custom' ? 'Custom' : 'Equal'}</div>
            </div>
          </div>

          <div class="record-participants-preview">
            ${participantsChips}
            ${extraCount}
          </div>
        </div>

        <div class="record-card-footer">
          <button type="button" class="btn btn-secondary btn-sm load-record-btn" title="Load into Calculator">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="1 4 1 10 7 10"></polyline>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
            </svg>
            Load
          </button>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-secondary btn-sm view-receipt-btn" title="View Receipt">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              </svg>
              Receipt
            </button>
            <button type="button" class="btn btn-danger btn-sm delete-record-btn" title="Delete Record">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      `;

      card.querySelector('.load-record-btn').addEventListener('click', () => {
        loadRecordIntoCalculator(record);
      });

      card.querySelector('.view-receipt-btn').addEventListener('click', () => {
        openReceiptModal(record);
      });

      card.querySelector('.delete-record-btn').addEventListener('click', () => {
        deleteRecord(record.id);
      });

      dom.recordsList.appendChild(card);
    });
  }

  function loadRecordIntoCalculator(record) {
    appState.occasion = record.occasion;
    appState.amount = record.billAmount || record.totalAmount;
    appState.currency = record.currency || '₹';
    appState.tipPercent = record.tipPercent || 0;
    appState.splitMode = record.splitMode || 'equal';

    appState.participants = record.participants.map((p, i) => ({
      id: 'p_load_' + i + '_' + Date.now(),
      name: p.name,
      customAmount: p.share,
      isPaid: Boolean(p.isPaid)
    }));

    if (dom.occasionInput) dom.occasionInput.value = appState.occasion;
    if (dom.billAmountInput) dom.billAmountInput.value = appState.amount;
    if (dom.currencySelect) dom.currencySelect.value = appState.currency;

    dom.tipChips.forEach(chip => {
      const val = parseInt(chip.getAttribute('data-tip'), 10);
      chip.classList.toggle('active', val === appState.tipPercent);
    });

    setSplitMode(appState.splitMode);
    performCalculation();

    const workingSection = document.getElementById('working');
    if (workingSection) {
      workingSection.scrollIntoView({ behavior: 'smooth' });
    }

    showToast(`Loaded record "${record.occasion}" into Bill Splitter!`, 'success');
  }

  function deleteRecord(recordId) {
    let records = getSavedRecords();
    records = records.filter(r => r.id !== recordId);
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    renderRecordsList();
    showToast('Record removed from history.', 'info');
  }

  function clearAllRecords() {
    const records = getSavedRecords();
    if (records.length === 0) {
      showToast('No records to clear.', 'info');
      return;
    }

    if (confirm('Are you sure you want to permanently clear all previous split records from browser memory?')) {
      localStorage.removeItem(STORAGE_KEYS.RECORDS);
      renderRecordsList();
      showToast('All previous records have been cleared.', 'info');
    }
  }

  // --------------------------------------------------------------------------
  // 9. Receipt Generation & Share Summaries (No External Files)
  // --------------------------------------------------------------------------
  function generateFormattedReceiptText(result, occasion, currency) {
    const dateStr = new Date().toLocaleString();
    let text = `========================================\n`;
    text += `       BILL SPLITTER - FAIR RECEIPT     \n`;
    text += `========================================\n`;
    text += `Occasion: ${occasion}\n`;
    text += `Date:     ${dateStr}\n`;
    text += `Contest:  ${COMPETITION_ID}\n`;
    text += `Dev:      Raj Kori (SISTec Ratibad, Bhopal)\n`;
    text += `Mode:     ${result.splitMode === 'custom' ? 'Custom / Unequal Split' : 'Equal Split'}\n`;
    text += `----------------------------------------\n`;
    text += `Subtotal:     ${currency}${formatNumber(result.billAmount)}\n`;
    if (result.tipAmount > 0) {
      text += `Tip / Extra:  ${currency}${formatNumber(result.tipAmount)} (${result.tipPercent}%)\n`;
    }
    text += `TOTAL BILL:   ${currency}${formatNumber(result.grandTotal)}\n`;
    text += `Friends:      ${result.participantCount}\n`;
    text += `----------------------------------------\n`;
    text += `ITEMIZED BREAKDOWN:\n`;
    result.shares.forEach((s, idx) => {
      const status = s.isPaid ? '[PAID]' : '[DUE]';
      text += `${idx + 1}. ${padString(s.name, 18)} ${currency}${formatNumber(s.shareAmount)}  ${status}\n`;
    });
    text += `----------------------------------------\n`;
    text += `Sum of Shares: ${currency}${formatNumber(result.verifiedSum)} ${result.isExact ? '(100% Exact)' : ''}\n`;
    text += `========================================\n`;
    return text;
  }

  function copySummaryToClipboard() {
    if (!appState.calculatedResult) {
      showToast('Calculate a bill first to copy summary.', 'warning');
      return;
    }

    const receipt = generateFormattedReceiptText(
      appState.calculatedResult,
      appState.occasion,
      appState.currency
    );

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(receipt)
        .then(() => showToast('Full summary receipt copied to clipboard!', 'success'))
        .catch(() => fallbackCopyText(receipt));
    } else {
      fallbackCopyText(receipt);
    }
  }

  function fallbackCopyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast('Copied to clipboard!', 'success');
    } catch (err) {
      showToast('Please copy manually.', 'warning');
    }
    document.body.removeChild(textArea);
  }

  function openReceiptModal(record = null) {
    let receiptText = '';
    if (record) {
      receiptText = `========================================\n`;
      receiptText += `       BILL SPLITTER - FAIR RECEIPT     \n`;
      receiptText += `========================================\n`;
      receiptText += `Occasion: ${record.occasion}\n`;
      receiptText += `Date:     ${record.date}\n`;
      receiptText += `Total:    ${record.currency}${formatNumber(record.totalAmount)}\n`;
      receiptText += `Friends:  ${record.participants.length}\n`;
      receiptText += `----------------------------------------\n`;
      record.participants.forEach((p, idx) => {
        receiptText += `${idx + 1}. ${padString(p.name, 18)} ${record.currency}${formatNumber(p.share)}  ${p.isPaid ? '[PAID]' : '[DUE]'}\n`;
      });
      receiptText += `========================================\n`;
    } else if (appState.calculatedResult) {
      receiptText = generateFormattedReceiptText(
        appState.calculatedResult,
        appState.occasion,
        appState.currency
      );
    } else {
      showToast('No active bill to display receipt.', 'warning');
      return;
    }

    if (dom.receiptModalBody) {
      dom.receiptModalBody.textContent = receiptText;
    }

    if (dom.receiptModal) {
      dom.receiptModal.classList.add('active');
    }
  }

  function closeReceiptModal() {
    if (dom.receiptModal) {
      dom.receiptModal.classList.remove('active');
    }
  }

  // --------------------------------------------------------------------------
  // 10. Toast System & Scroll Animations
  // --------------------------------------------------------------------------
  function showToast(message, type = 'info') {
    if (!dom.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast';

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'warning') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
      ${iconSvg}
      <span>${escapeHtml(message)}</span>
    `;

    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px) scale(0.95)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      reveals.forEach(el => el.classList.add('active'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, {
      root: null,
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    reveals.forEach(el => observer.observe(el));
  }

  // --------------------------------------------------------------------------
  // 11. Utility Helper Functions
  // --------------------------------------------------------------------------
  function formatNumber(num) {
    if (isNaN(num)) return '0.00';
    return Number(num).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getInitials(name) {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function padString(str, len) {
    str = String(str);
    if (str.length >= len) return str.substring(0, len);
    return str + ' '.repeat(len - str.length);
  }

  // --------------------------------------------------------------------------
  // 12. Event Listeners Setup
  // --------------------------------------------------------------------------
  function setupEventListeners() {
    // Mode Switcher
    if (dom.modeEqualBtn) {
      dom.modeEqualBtn.addEventListener('click', () => setSplitMode('equal'));
    }
    if (dom.modeCustomBtn) {
      dom.modeCustomBtn.addEventListener('click', () => setSplitMode('custom'));
    }

    // Custom Mode Helpers
    if (dom.autofillRemainingBtn) {
      dom.autofillRemainingBtn.addEventListener('click', autofillRemainingBalance);
    }
    if (dom.splitEvenlyBtn) {
      dom.splitEvenlyBtn.addEventListener('click', splitEvenlyToCustom);
    }

    // Form Inputs Auto-Drafting
    if (dom.occasionInput) {
      dom.occasionInput.addEventListener('input', () => {
        appState.occasion = dom.occasionInput.value;
        saveDraftToStorage();
      });
    }

    if (dom.billAmountInput) {
      dom.billAmountInput.addEventListener('input', () => {
        appState.amount = parseFloat(dom.billAmountInput.value) || 0;
        updateBalanceTracker();
        saveDraftToStorage();
      });
      dom.billAmountInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          performCalculation();
        }
      });
    }

    if (dom.currencySelect) {
      dom.currencySelect.addEventListener('change', () => {
        appState.currency = dom.currencySelect.value;
        renderParticipantsInputs();
        updateBalanceTracker();
        saveDraftToStorage();
        if (appState.calculatedResult) {
          performCalculation();
        }
      });
    }

    // People Count +/-
    if (dom.decreasePeopleBtn) {
      dom.decreasePeopleBtn.addEventListener('click', () => {
        updatePeopleCount(appState.participants.length - 1);
      });
    }

    if (dom.increasePeopleBtn) {
      dom.increasePeopleBtn.addEventListener('click', () => {
        updatePeopleCount(appState.participants.length + 1);
      });
    }

    if (dom.peopleCountInput) {
      dom.peopleCountInput.addEventListener('change', (e) => {
        updatePeopleCount(e.target.value);
      });
    }

    if (dom.addParticipantBtn) {
      dom.addParticipantBtn.addEventListener('click', () => {
        addParticipant();
      });
    }

    // Tip Chips
    dom.tipChips.forEach(chip => {
      chip.addEventListener('click', () => {
        dom.tipChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        appState.tipPercent = parseInt(chip.getAttribute('data-tip'), 10) || 0;
        updateBalanceTracker();
        saveDraftToStorage();
        if (appState.calculatedResult) {
          performCalculation();
        }
      });
    });

    // Primary Calculate Button
    if (dom.calculateBtn) {
      dom.calculateBtn.addEventListener('click', performCalculation);
    }

    // Reset Button
    if (dom.resetBtn) {
      dom.resetBtn.addEventListener('click', resetCalculator);
    }

    // Save to Records Button
    if (dom.saveRecordBtn) {
      dom.saveRecordBtn.addEventListener('click', saveRecordToHistory);
    }

    // Copy Summary Button
    if (dom.copySummaryBtn) {
      dom.copySummaryBtn.addEventListener('click', copySummaryToClipboard);
    }

    // Print Receipt Button
    if (dom.printReceiptBtn) {
      dom.printReceiptBtn.addEventListener('click', () => openReceiptModal());
    }

    // Records Clear Action
    if (dom.clearRecordsBtn) {
      dom.clearRecordsBtn.addEventListener('click', clearAllRecords);
    }

    // Modal Events
    if (dom.closeModalBtn) {
      dom.closeModalBtn.addEventListener('click', closeReceiptModal);
    }

    if (dom.receiptModal) {
      dom.receiptModal.addEventListener('click', (e) => {
        if (e.target === dom.receiptModal) closeReceiptModal();
      });
    }

    if (dom.modalPrintBtn) {
      dom.modalPrintBtn.addEventListener('click', () => window.print());
    }

    if (dom.modalCopyBtn) {
      dom.modalCopyBtn.addEventListener('click', () => {
        const text = dom.receiptModalBody ? dom.receiptModalBody.textContent : '';
        fallbackCopyText(text);
      });
    }

    // Competition ID Copy
    if (dom.copyCompetitionIdBtn) {
      dom.copyCompetitionIdBtn.addEventListener('click', () => {
        fallbackCopyText(COMPETITION_ID);
        showToast(`Copied Contest ID: ${COMPETITION_ID}`, 'success');
      });
    }
  }

  // --------------------------------------------------------------------------
  // 13. Initialization on Page Load
  // --------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadDraftFromStorage();
    renderRecordsList();
    setupEventListeners();
    initScrollReveal();

    if (!appState.calculatedResult && appState.amount > 0) {
      performCalculation();
    }
  });

})();
