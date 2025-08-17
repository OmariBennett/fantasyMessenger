// Tab Management for Fantasy Messenger
// Handles switching between Chat and RPG Game tabs

class TabManager {
	constructor() {
		this.currentTab = 'chat';
		this.initializeEventListeners();
	}

	initializeEventListeners() {
		document.addEventListener('DOMContentLoaded', () => {
			const tabButtons = document.querySelectorAll('.tab-button');
			const tabPanels = document.querySelectorAll('.tab-panel');

			tabButtons.forEach(button => {
				button.addEventListener('click', (e) => {
					e.preventDefault();
					const targetTab = button.dataset.tab;
					this.switchTab(targetTab);
				});
			});

			// Initialize with chat tab active
			this.switchTab('chat');
		});
	}

	switchTab(tabName) {
		if (this.currentTab === tabName) return;

		const tabButtons = document.querySelectorAll('.tab-button');
		const tabPanels = document.querySelectorAll('.tab-panel');

		// Remove active class from all tabs and panels
		tabButtons.forEach(btn => btn.classList.remove('active'));
		tabPanels.forEach(panel => panel.classList.remove('active'));

		// Add active class to selected tab and panel
		const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
		const activePanel = document.querySelector(`[data-panel="${tabName}"]`);

		if (activeButton && activePanel) {
			activeButton.classList.add('active');
			activePanel.classList.add('active');
			this.currentTab = tabName;

			// Trigger any tab-specific initialization
			this.onTabSwitch(tabName);
		}
	}

	onTabSwitch(tabName) {
		switch (tabName) {
			case 'chat':
				// Focus on message input if chat is visible and user is connected
				const messageInput = document.getElementById('message-input');
				if (messageInput && !messageInput.disabled) {
					messageInput.focus();
				}
				break;

			case 'rpg':
				// Initialize RPG game if not already done
				if (window.game && typeof window.game.updateCharacterDisplay === 'function') {
					window.game.updateCharacterDisplay();
				}
				break;
		}
	}

	getCurrentTab() {
		return this.currentTab;
	}

	// Method to switch tabs programmatically
	activateTab(tabName) {
		this.switchTab(tabName);
	}
}

// Initialize tab manager
const tabManager = new TabManager();

// Export for global access
window.tabManager = tabManager;