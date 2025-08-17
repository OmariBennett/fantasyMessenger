// PvP Broadcasting System with requestAnimationFrame
// Handles real-time PvP communication through chat.js

class PvPBroadcaster {
	constructor(socket, chatApp) {
		this.socket = socket;
		this.chatApp = chatApp;
		this.animationId = null;
		this.isAnimating = false;
		this.lastUpdate = 0;
		this.updateInterval = 16; // ~60fps
		
		// PvP state management
		this.activeBattles = new Map();
		this.pendingChallenges = new Map();
		this.onlinePlayers = new Map();
		this.localPlayer = null;
		
		this.setupSocketListeners();
		this.startAnimationLoop();
	}

	setupSocketListeners() {
		// PvP system event listeners
		this.socket.on('pvp-broadcast', (data) => {
			this.handlePvPBroadcast(data);
		});

		this.socket.on('pvp-challenge-sent', (data) => {
			this.handleChallengeReceived(data);
		});

		this.socket.on('pvp-challenge-response', (data) => {
			this.handleChallengeResponse(data);
		});

		this.socket.on('pvp-battle-start', (data) => {
			this.handleBattleStart(data);
		});

		this.socket.on('pvp-battle-update', (data) => {
			this.handleBattleUpdate(data);
		});

		this.socket.on('pvp-battle-end', (data) => {
			this.handleBattleEnd(data);
		});

		this.socket.on('pvp-player-list', (data) => {
			this.handlePlayerList(data);
		});

		// User management
		this.socket.on('user joined', (data) => {
			if (data.character) {
				this.onlinePlayers.set(data.socketId, data.character);
				this.broadcastPlayerListUpdate();
			}
		});

		this.socket.on('user left', (data) => {
			this.onlinePlayers.delete(data.socketId);
			this.broadcastPlayerListUpdate();
		});
	}

	startAnimationLoop() {
		if (this.isAnimating) return;
		
		this.isAnimating = true;
		this.animationId = requestAnimationFrame((timestamp) => this.animate(timestamp));
	}

	stopAnimationLoop() {
		if (!this.isAnimating) return;
		
		this.isAnimating = false;
		if (this.animationId) {
			cancelAnimationFrame(this.animationId);
			this.animationId = null;
		}
	}

	animate(timestamp) {
		if (!this.isAnimating) return;

		// Throttle updates for performance
		if (timestamp - this.lastUpdate >= this.updateInterval) {
			this.updateBattleAnimations(timestamp);
			this.updateUIAnimations(timestamp);
			this.lastUpdate = timestamp;
		}

		this.animationId = requestAnimationFrame((ts) => this.animate(ts));
	}

	updateBattleAnimations(timestamp) {
		// Update active battle animations
		this.activeBattles.forEach((battle, battleId) => {
			if (battle.animationState) {
				this.updateBattleStateAnimation(battle, timestamp);
			}
		});
	}

	updateUIAnimations(timestamp) {
		// Update UI animations like health bars, timers, etc.
		if (window.game && window.game.pvpManager) {
			const currentBattle = window.game.pvpManager.getCurrentBattle();
			if (currentBattle) {
				this.updateBattleUI(currentBattle, timestamp);
			}
		}
	}

	updateBattleStateAnimation(battle, timestamp) {
		// Smooth health/mana transitions
		if (battle.player1 && battle.player1.animatedHealth !== undefined) {
			this.animateStatChange(battle.player1, 'health', timestamp);
		}
		if (battle.player2 && battle.player2.animatedHealth !== undefined) {
			this.animateStatChange(battle.player2, 'health', timestamp);
		}
	}

	animateStatChange(player, statType, timestamp) {
		const targetValue = player[statType];
		const animatedProperty = `animated${statType.charAt(0).toUpperCase() + statType.slice(1)}`;
		
		if (player[animatedProperty] === undefined) {
			player[animatedProperty] = targetValue;
			return;
		}

		const current = player[animatedProperty];
		const difference = targetValue - current;
		
		if (Math.abs(difference) > 0.5) {
			// Smooth animation over 500ms
			const animationSpeed = difference * 0.05;
			player[animatedProperty] += animationSpeed;
			
			// Update UI with animated value
			this.updatePlayerStatUI(player, statType, player[animatedProperty]);
		} else {
			player[animatedProperty] = targetValue;
		}
	}

	updatePlayerStatUI(player, statType, animatedValue) {
		if (!window.game) return;
		
		const roundedValue = Math.round(animatedValue);
		const maxValue = player[`max${statType.charAt(0).toUpperCase() + statType.slice(1)}`];
		
		// Update progress bars and text with smooth values
		if (statType === 'health') {
			const healthBar = document.getElementById(`${player.slot}-combat-health`);
			const healthText = document.getElementById(`${player.slot}-combat-hp`);
			
			if (healthBar) {
				healthBar.value = roundedValue;
				healthBar.style.transition = 'none'; // Disable CSS transition for smooth RAF animation
			}
			if (healthText) {
				healthText.textContent = `${roundedValue}/${maxValue} HP`;
			}
		}
	}

	updateBattleUI(battle, timestamp) {
		// Update turn timer with smooth countdown
		if (battle.turnTimeRemaining !== undefined) {
			const timerElement = document.getElementById('turn-timer');
			const timerBar = document.getElementById('timer-bar');
			
			if (timerElement && timerBar) {
				timerElement.textContent = Math.ceil(battle.turnTimeRemaining);
				timerBar.value = battle.turnTimeRemaining;
				
				// Smooth color transitions based on time remaining
				const timeRatio = battle.turnTimeRemaining / battle.maxTurnTime;
				if (timeRatio <= 0.33) {
					timerBar.style.accentColor = 'oklch(65% 0.15 25)'; // Red
				} else if (timeRatio <= 0.66) {
					timerBar.style.accentColor = 'oklch(75% 0.15 90)'; // Orange  
				} else {
					timerBar.style.accentColor = 'oklch(60% 0.15 250)'; // Blue
				}
			}
		}
	}

	// PvP Event Handlers
	handlePvPBroadcast(data) {
		switch (data.type) {
			case 'character-created':
				this.handleCharacterCreated(data);
				break;
			case 'challenge-request':
				this.handleChallengeReceived(data);
				break;
			case 'battle-action':
				this.handleBattleAction(data);
				break;
			case 'player-status-update':
				this.handlePlayerStatusUpdate(data);
				break;
		}
	}

	handleCharacterCreated(data) {
		this.onlinePlayers.set(data.socketId, {
			name: data.character.name,
			class: data.character.class,
			level: data.character.level,
			username: data.username
		});
		
		this.broadcastPlayerListUpdate();
		this.chatApp.showSystemMessage(`🎮 ${data.username} created character: ${data.character.name} (${data.character.class})`);
	}

	handleChallengeReceived(data) {
		if (window.game && window.game.pvpManager) {
			window.game.pvpManager.handleChallengeReceived(data);
		}
		
		this.chatApp.showSystemMessage(`⚔️ ${data.challengerName} challenges you to battle!`);
	}

	handleChallengeResponse(data) {
		if (window.game && window.game.pvpManager) {
			window.game.pvpManager.handleChallengeResponse(data);
		}
		
		const status = data.accepted ? 'accepted' : 'declined';
		this.chatApp.showSystemMessage(`${data.accepted ? '✅' : '❌'} ${data.responderName} ${status} your challenge`);
	}

	handleBattleStart(data) {
		this.activeBattles.set(data.battleId, {
			...data,
			animationState: {
				startTime: Date.now(),
				phase: 'starting'
			}
		});
		
		if (window.game && window.game.pvpManager) {
			window.game.pvpManager.startPvPBattle(data);
		}
		
		this.chatApp.showSystemMessage(`⚔️ Battle begins: ${data.player1.name} vs ${data.player2.name}!`);
	}

	handleBattleUpdate(data) {
		const battle = this.activeBattles.get(data.battleId);
		if (battle) {
			// Set up smooth animations for stat changes
			if (data.player1) {
				battle.player1 = { ...battle.player1, ...data.player1, slot: 'player1' };
			}
			if (data.player2) {
				battle.player2 = { ...battle.player2, ...data.player2, slot: 'player2' };
			}
			
			battle.currentTurn = data.currentTurn;
			battle.turnTimeRemaining = data.turnTimeRemaining;
			
			this.activeBattles.set(data.battleId, battle);
		}
		
		if (window.game && window.game.pvpManager) {
			window.game.pvpManager.updateBattleState(data);
		}
	}

	handleBattleEnd(data) {
		this.activeBattles.delete(data.battleId);
		
		if (window.game && window.game.pvpManager) {
			window.game.pvpManager.endPvPBattle(data);
		}
		
		const winner = data.winner || 'No one';
		this.chatApp.showSystemMessage(`🏆 Battle ended! Winner: ${winner}`);
	}

	handlePlayerList(data) {
		this.onlinePlayers.clear();
		data.players.forEach(player => {
			this.onlinePlayers.set(player.socketId, player);
		});
		
		if (window.game) {
			window.game.displayOnlinePlayers(Array.from(this.onlinePlayers.values()));
		}
	}

	handlePlayerStatusUpdate(data) {
		const player = this.onlinePlayers.get(data.socketId);
		if (player) {
			Object.assign(player, data.status);
		}
	}

	// Broadcasting methods
	broadcastCharacterCreated(character) {
		this.socket.emit('pvp-broadcast', {
			type: 'character-created',
			character: character,
			username: this.chatApp.username,
			socketId: this.socket.id,
			timestamp: Date.now()
		});
	}

	broadcastChallenge(targetSocketId, challengeData) {
		this.socket.emit('pvp-challenge-sent', {
			...challengeData,
			targetSocketId: targetSocketId,
			challengerSocketId: this.socket.id,
			timestamp: Date.now()
		});
	}

	broadcastChallengeResponse(challengeId, accepted, challengerSocketId) {
		this.socket.emit('pvp-challenge-response', {
			challengeId: challengeId,
			accepted: accepted,
			responderName: this.localPlayer?.name || this.chatApp.username,
			responderSocketId: this.socket.id,
			challengerSocketId: challengerSocketId,
			timestamp: Date.now()
		});
	}

	broadcastBattleAction(battleId, action, actionData) {
		this.socket.emit('pvp-battle-update', {
			battleId: battleId,
			action: action,
			actionData: actionData,
			playerSocketId: this.socket.id,
			timestamp: Date.now()
		});
	}

	broadcastPlayerListUpdate() {
		if (window.game) {
			window.game.displayOnlinePlayers(Array.from(this.onlinePlayers.values()));
		}
	}

	requestPlayerList() {
		this.socket.emit('pvp-get-players', {
			requesterId: this.socket.id,
			timestamp: Date.now()
		});
	}

	// Public API for RPG game
	setLocalPlayer(player) {
		this.localPlayer = player;
	}

	getOnlinePlayers() {
		return Array.from(this.onlinePlayers.values());
	}

	isConnected() {
		return this.socket && this.socket.connected;
	}

	// Cleanup
	destroy() {
		this.stopAnimationLoop();
		
		if (this.socket) {
			this.socket.off('pvp-broadcast');
			this.socket.off('pvp-challenge-sent');
			this.socket.off('pvp-challenge-response');
			this.socket.off('pvp-battle-start');
			this.socket.off('pvp-battle-update');
			this.socket.off('pvp-battle-end');
			this.socket.off('pvp-player-list');
		}
		
		this.activeBattles.clear();
		this.pendingChallenges.clear();
		this.onlinePlayers.clear();
	}
}

// Export for module use
export { PvPBroadcaster };

// Global access
window.PvPBroadcaster = PvPBroadcaster;