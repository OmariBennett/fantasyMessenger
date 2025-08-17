// Player vs Player Turn-Based Battle System
// Modern JavaScript implementation with Socket.IO integration

class PvPBattle {
	constructor(player1, player2, gameInstance, socket = null) {
		this.player1 = player1;
		this.player2 = player2;
		this.gameInstance = gameInstance;
		this.socket = socket;
		
		this.battleId = this.generateBattleId();
		this.currentTurn = 1; // 1 for player1, 2 for player2
		this.turnCount = 0;
		this.maxTurnTime = 30; // seconds
		this.turnTimer = null;
		this.turnTimeRemaining = this.maxTurnTime;
		
		this.battleState = 'active'; // active, finished, surrendered
		this.battleLog = [];
		this.spectators = new Set();
		
		this.initializeBattle();
	}

	generateBattleId() {
		return `pvp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	initializeBattle() {
		this.addLogEntry(`⚔️ Battle begins! ${this.player1.name} vs ${this.player2.name}`);
		this.addLogEntry(`🎲 ${this.currentTurn === 1 ? this.player1.name : this.player2.name} goes first!`);
		
		// Start turn timer
		this.startTurnTimer();
		
		// Broadcast battle start if socket available
		if (this.socket) {
			this.socket.emit('pvp-battle-start', {
				battleId: this.battleId,
				player1: this.getPlayerData(this.player1),
				player2: this.getPlayerData(this.player2),
				currentTurn: this.currentTurn
			});
		}
	}

	getPlayerData(player) {
		return {
			name: player.name,
			class: player.class,
			level: player.level,
			health: player.stats.health,
			maxHealth: player.stats.maxHealth,
			mana: player.stats.mana,
			maxMana: player.stats.maxMana,
			skills: player.skills.map(s => ({ name: s.name, manaCost: s.manaCost }))
		};
	}

	getCurrentPlayer() {
		return this.currentTurn === 1 ? this.player1 : this.player2;
	}

	getOpponentPlayer() {
		return this.currentTurn === 1 ? this.player2 : this.player1;
	}

	async executeAction(action) {
		if (this.battleState !== 'active') {
			return { success: false, message: 'Battle is not active' };
		}

		const currentPlayer = this.getCurrentPlayer();
		const opponent = this.getOpponentPlayer();
		let result = null;

		try {
			switch (action.type) {
				case 'attack':
					result = await this.executeAttack(currentPlayer, opponent);
					break;
				case 'skill':
					result = await this.executeSkill(currentPlayer, opponent, action.skillName);
					break;
				case 'item':
					result = await this.executeItem(currentPlayer, action.itemName);
					break;
				case 'surrender':
					result = await this.executeSurrender(currentPlayer);
					break;
				default:
					return { success: false, message: 'Invalid action type' };
			}

			if (result.success) {
				this.addLogEntry(result.message);
				
				// Check for battle end conditions
				if (this.checkBattleEnd()) {
					this.endBattle();
				} else {
					this.nextTurn();
				}

				// Broadcast action result
				if (this.socket) {
					this.socket.emit('pvp-action-result', {
						battleId: this.battleId,
						action: action,
						result: result,
						player1: this.getPlayerData(this.player1),
						player2: this.getPlayerData(this.player2),
						currentTurn: this.currentTurn,
						battleState: this.battleState
					});
				}
			}

			return result;
		} catch (error) {
			console.error('Error executing PvP action:', error);
			return { success: false, message: 'Action failed due to error' };
		}
	}

	async executeAttack(attacker, defender) {
		const attackerStats = attacker.getTotalStats();
		const baseDamage = attackerStats.attack + Math.floor(Math.random() * 5);
		const actualDamage = defender.stats.takeDamage(baseDamage);
		
		return {
			success: true,
			message: `⚔️ ${attacker.name} attacks ${defender.name} for ${actualDamage} damage!`,
			damage: actualDamage,
			type: 'attack'
		};
	}

	async executeSkill(caster, target, skillName) {
		const skill = caster.skills.find(s => s.name === skillName);
		if (!skill) {
			return { success: false, message: `${caster.name} doesn't know the skill "${skillName}"` };
		}

		if (!caster.stats.useMana(skill.manaCost)) {
			return { success: false, message: `${caster.name} doesn't have enough mana for ${skillName}` };
		}

		// Execute skill effect
		const skillResult = skill.use(caster, target);
		
		return {
			success: true,
			message: skillResult,
			type: 'skill',
			skillName: skillName
		};
	}

	async executeItem(user, itemName) {
		if (!user.inventory.hasItem(itemName)) {
			return { success: false, message: `${user.name} doesn't have ${itemName}` };
		}

		let message = '';
		let success = false;

		if (itemName === 'Health Potion') {
			user.stats.heal(50);
			user.inventory.removeItem(itemName);
			message = `💊 ${user.name} uses Health Potion and restores 50 health!`;
			success = true;
		} else if (itemName === 'Mana Potion') {
			user.stats.restoreMana(30);
			user.inventory.removeItem(itemName);
			message = `💊 ${user.name} uses Mana Potion and restores 30 mana!`;
			success = true;
		} else {
			message = `❌ ${itemName} cannot be used in battle`;
		}

		return { success, message, type: 'item', itemName };
	}

	async executeSurrender(player) {
		this.battleState = 'surrendered';
		return {
			success: true,
			message: `🏳️ ${player.name} surrenders the battle!`,
			type: 'surrender'
		};
	}

	checkBattleEnd() {
		return !this.player1.isAlive() || !this.player2.isAlive() || this.battleState === 'surrendered';
	}

	endBattle() {
		this.stopTurnTimer();
		this.battleState = 'finished';
		
		let winner = null;
		let loser = null;
		let endReason = '';

		if (this.battleState === 'surrendered') {
			// Winner is the one who didn't surrender
			winner = this.getCurrentPlayer() === this.player1 ? this.player2 : this.player1;
			loser = this.getCurrentPlayer();
			endReason = 'surrender';
		} else if (!this.player1.isAlive()) {
			winner = this.player2;
			loser = this.player1;
			endReason = 'defeat';
		} else if (!this.player2.isAlive()) {
			winner = this.player1;
			loser = this.player2;
			endReason = 'defeat';
		}

		if (winner) {
			this.addLogEntry(`🏆 ${winner.name} wins the battle!`);
			
			// Award experience and rewards
			const expReward = Math.floor(loser.level * 15 + 25);
			const goldReward = Math.floor(loser.level * 8 + 15);
			
			winner.gainExperience(expReward);
			winner.inventory.gold += goldReward;
			
			this.addLogEntry(`💰 ${winner.name} gains ${expReward} experience and ${goldReward} gold!`);
		}

		// Broadcast battle end
		if (this.socket) {
			this.socket.emit('pvp-battle-end', {
				battleId: this.battleId,
				winner: winner ? winner.name : null,
				loser: loser ? loser.name : null,
				endReason: endReason,
				battleLog: this.battleLog,
				finalStats: {
					player1: this.getPlayerData(this.player1),
					player2: this.getPlayerData(this.player2)
				}
			});
		}
	}

	nextTurn() {
		this.currentTurn = this.currentTurn === 1 ? 2 : 1;
		this.turnCount++;
		this.resetTurnTimer();
		
		const currentPlayerName = this.getCurrentPlayer().name;
		this.addLogEntry(`🔄 Turn ${this.turnCount + 1}: ${currentPlayerName}'s turn`);
	}

	startTurnTimer() {
		this.turnTimeRemaining = this.maxTurnTime;
		this.turnTimer = setInterval(() => {
			this.turnTimeRemaining--;
			
			// Update UI timer
			if (this.gameInstance) {
				this.gameInstance.updatePvPTimer(this.turnTimeRemaining);
			}
			
			// Broadcast timer update
			if (this.socket) {
				this.socket.emit('pvp-timer-update', {
					battleId: this.battleId,
					timeRemaining: this.turnTimeRemaining
				});
			}
			
			if (this.turnTimeRemaining <= 0) {
				this.handleTurnTimeout();
			}
		}, 1000);
	}

	stopTurnTimer() {
		if (this.turnTimer) {
			clearInterval(this.turnTimer);
			this.turnTimer = null;
		}
	}

	resetTurnTimer() {
		this.stopTurnTimer();
		this.startTurnTimer();
	}

	handleTurnTimeout() {
		const currentPlayer = this.getCurrentPlayer();
		this.addLogEntry(`⏰ ${currentPlayer.name}'s turn timed out! Turn skipped.`);
		
		if (this.checkBattleEnd()) {
			this.endBattle();
		} else {
			this.nextTurn();
		}
	}

	addLogEntry(message) {
		const logEntry = {
			message,
			timestamp: Date.now(),
			turn: this.turnCount
		};
		this.battleLog.push(logEntry);
		
		// Update UI log
		if (this.gameInstance) {
			this.gameInstance.addPvPLogEntry(message);
		}
	}

	addSpectator(playerId) {
		this.spectators.add(playerId);
	}

	removeSpectator(playerId) {
		this.spectators.delete(playerId);
	}

	getBattleState() {
		return {
			battleId: this.battleId,
			player1: this.getPlayerData(this.player1),
			player2: this.getPlayerData(this.player2),
			currentTurn: this.currentTurn,
			turnCount: this.turnCount,
			turnTimeRemaining: this.turnTimeRemaining,
			battleState: this.battleState,
			battleLog: this.battleLog,
			spectators: Array.from(this.spectators)
		};
	}
}

class PvPManager {
	constructor(gameInstance, socket = null) {
		this.gameInstance = gameInstance;
		this.socket = socket;
		this.activeBattle = null;
		this.onlinePlayers = new Map(); // playerId -> playerData
		this.pendingChallenges = new Map(); // challengeId -> challengeData
		this.spectatingBattle = null;
		
		this.setupSocketListeners();
	}

	setupSocketListeners() {
		if (!this.socket) return;

		this.socket.on('pvp-players-list', (data) => {
			this.updateOnlinePlayersList(data.players);
		});

		this.socket.on('pvp-challenge-received', (data) => {
			this.handleChallengeReceived(data);
		});

		this.socket.on('pvp-challenge-response', (data) => {
			this.handleChallengeResponse(data);
		});

		this.socket.on('pvp-battle-start', (data) => {
			if (this.isPlayerInBattle(data)) {
				this.startPvPBattle(data);
			}
		});

		this.socket.on('pvp-action-result', (data) => {
			if (this.activeBattle && this.activeBattle.battleId === data.battleId) {
				this.updateBattleState(data);
			}
		});

		this.socket.on('pvp-battle-end', (data) => {
			if (this.activeBattle && this.activeBattle.battleId === data.battleId) {
				this.endPvPBattle(data);
			}
		});

		this.socket.on('pvp-timer-update', (data) => {
			if (this.activeBattle && this.activeBattle.battleId === data.battleId) {
				this.gameInstance.updatePvPTimer(data.timeRemaining);
			}
		});
	}

	requestOnlinePlayers() {
		if (this.socket && this.gameInstance.player) {
			this.socket.emit('pvp-get-players', {
				playerName: this.gameInstance.player.name,
				playerClass: this.gameInstance.player.class,
				playerLevel: this.gameInstance.player.level
			});
		}
	}

	updateOnlinePlayersList(players) {
		this.onlinePlayers.clear();
		players.forEach(player => {
			this.onlinePlayers.set(player.id, player);
		});
		
		if (this.gameInstance) {
			this.gameInstance.displayOnlinePlayers(players);
		}
	}

	challengePlayer(targetPlayerId) {
		if (!this.socket || !this.gameInstance.player) return;

		const challengeId = this.generateChallengeId();
		const challengeData = {
			challengeId,
			challengerId: this.socket.id,
			challengerName: this.gameInstance.player.name,
			challengerClass: this.gameInstance.player.class,
			challengerLevel: this.gameInstance.player.level,
			targetPlayerId,
			timestamp: Date.now()
		};

		this.pendingChallenges.set(challengeId, challengeData);
		
		this.socket.emit('pvp-challenge-player', challengeData);
		this.gameInstance.addToLog(`⚔️ Challenge sent to player!`);
	}

	challengeRandomPlayer() {
		const availablePlayers = Array.from(this.onlinePlayers.values())
			.filter(player => player.id !== this.socket.id);
		
		if (availablePlayers.length === 0) {
			this.gameInstance.addToLog('❌ No players available for challenge');
			return;
		}

		const randomPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
		this.challengePlayer(randomPlayer.id);
	}

	handleChallengeReceived(challengeData) {
		if (this.gameInstance) {
			this.gameInstance.showPvPChallenge(challengeData);
		}
	}

	acceptChallenge(challengeId) {
		if (this.socket) {
			this.socket.emit('pvp-accept-challenge', { challengeId });
		}
	}

	declineChallenge(challengeId) {
		if (this.socket) {
			this.socket.emit('pvp-decline-challenge', { challengeId });
		}
	}

	handleChallengeResponse(data) {
		if (data.accepted) {
			this.gameInstance.addToLog(`✅ ${data.responderName} accepted your challenge!`);
		} else {
			this.gameInstance.addToLog(`❌ ${data.responderName} declined your challenge.`);
		}
	}

	isPlayerInBattle(battleData) {
		return this.gameInstance.player && 
			(battleData.player1.name === this.gameInstance.player.name || 
			 battleData.player2.name === this.gameInstance.player.name);
	}

	startPvPBattle(battleData) {
		// Determine which player is which
		const isPlayer1 = battleData.player1.name === this.gameInstance.player.name;
		const opponent = isPlayer1 ? battleData.player2 : battleData.player1;
		
		// Create opponent character object
		const opponentCharacter = this.createOpponentFromData(opponent);
		
		// Create battle instance
		this.activeBattle = new PvPBattle(
			isPlayer1 ? this.gameInstance.player : opponentCharacter,
			isPlayer1 ? opponentCharacter : this.gameInstance.player,
			this.gameInstance,
			this.socket
		);
		
		// Update UI
		this.gameInstance.startPvPBattleUI(battleData, isPlayer1);
	}

	createOpponentFromData(opponentData) {
		// Create a simplified opponent character for display purposes
		return {
			name: opponentData.name,
			class: opponentData.class,
			level: opponentData.level,
			stats: {
				health: opponentData.health,
				maxHealth: opponentData.maxHealth,
				mana: opponentData.mana,
				maxMana: opponentData.maxMana
			},
			skills: opponentData.skills || [],
			isAlive: () => opponentData.health > 0
		};
	}

	executePlayerAction(action) {
		if (!this.activeBattle) {
			return Promise.resolve({ success: false, message: 'No active battle' });
		}

		// Check if it's the player's turn
		const isPlayer1 = this.activeBattle.player1.name === this.gameInstance.player.name;
		const isPlayerTurn = (isPlayer1 && this.activeBattle.currentTurn === 1) || 
						   (!isPlayer1 && this.activeBattle.currentTurn === 2);

		if (!isPlayerTurn) {
			return Promise.resolve({ success: false, message: 'Not your turn!' });
		}

		return this.activeBattle.executeAction(action);
	}

	updateBattleState(data) {
		// Update opponent data and UI
		if (this.gameInstance) {
			this.gameInstance.updatePvPBattleUI(data);
		}
	}

	endPvPBattle(data) {
		if (this.gameInstance) {
			this.gameInstance.endPvPBattleUI(data);
		}
		this.activeBattle = null;
	}

	generateChallengeId() {
		return `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	isInBattle() {
		return this.activeBattle !== null;
	}

	getCurrentBattle() {
		return this.activeBattle;
	}
}

// Export for module use
export { PvPBattle, PvPManager };

// Global access
window.PvPBattle = PvPBattle;
window.PvPManager = PvPManager;