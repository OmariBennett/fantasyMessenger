// Fantasy RPG Browser Game
// A modern JavaScript RPG that runs in the browser with DOM manipulation

class Stats {
	constructor(health = 100, mana = 50, attack = 10, defense = 5, speed = 10) {
		this.health = health;
		this.maxHealth = health;
		this.mana = mana;
		this.maxMana = mana;
		this.attack = attack;
		this.defense = defense;
		this.speed = speed;
	}

	takeDamage(damage) {
		const actualDamage = Math.max(1, damage - this.defense);
		this.health = Math.max(0, this.health - actualDamage);
		return actualDamage;
	}

	heal(amount) {
		this.health = Math.min(this.maxHealth, this.health + amount);
	}

	useMana(amount) {
		if (this.mana >= amount) {
			this.mana -= amount;
			return true;
		}
		return false;
	}

	restoreMana(amount) {
		this.mana = Math.min(this.maxMana, this.mana + amount);
	}
}

class Equipment {
	constructor() {
		this.weapon = null;
		this.armor = null;
		this.accessory = null;
	}

	equip(item) {
		if (item.type === 'weapon') {
			this.weapon = item;
		} else if (item.type === 'armor') {
			this.armor = item;
		} else if (item.type === 'accessory') {
			this.accessory = item;
		}
	}

	getStatBonus(stat) {
		let bonus = 0;
		if (this.weapon && this.weapon.stats[stat]) bonus += this.weapon.stats[stat];
		if (this.armor && this.armor.stats[stat]) bonus += this.armor.stats[stat];
		if (this.accessory && this.accessory.stats[stat]) bonus += this.accessory.stats[stat];
		return bonus;
	}
}

class Inventory {
	constructor() {
		this.items = [];
		this.gold = 100;
	}

	addItem(item, quantity = 1) {
		const existingItem = this.items.find(i => i.name === item.name);
		if (existingItem) {
			existingItem.quantity += quantity;
		} else {
			this.items.push({ ...item, quantity });
		}
	}

	removeItem(itemName, quantity = 1) {
		const item = this.items.find(i => i.name === itemName);
		if (item && item.quantity >= quantity) {
			item.quantity -= quantity;
			if (item.quantity === 0) {
				this.items = this.items.filter(i => i.name !== itemName);
			}
			return true;
		}
		return false;
	}

	hasItem(itemName, quantity = 1) {
		const item = this.items.find(i => i.name === itemName);
		return item && item.quantity >= quantity;
	}
}

class Character {
	constructor(name, characterClass) {
		this.name = name;
		this.class = characterClass;
		this.level = 1;
		this.experience = 0;
		this.experienceToNext = 100;
		this.stats = new Stats();
		this.equipment = new Equipment();
		this.inventory = new Inventory();
		this.skills = [];
		
		this.applyClassStats();
	}

	applyClassStats() {
		const classStats = {
			Fighter: { health: 120, mana: 30, attack: 15, defense: 8, speed: 8 },
			Mage: { health: 80, mana: 100, attack: 8, defense: 3, speed: 12 },
			Rogue: { health: 90, mana: 60, attack: 12, defense: 5, speed: 15 },
			Cleric: { health: 100, mana: 80, attack: 10, defense: 6, speed: 10 },
		};

		const baseStats = classStats[this.class] || classStats['Fighter'];
		this.stats = new Stats(
			baseStats.health,
			baseStats.mana,
			baseStats.attack,
			baseStats.defense,
			baseStats.speed,
		);
	}

	getTotalStats() {
		return {
			health: this.stats.health,
			maxHealth: this.stats.maxHealth + this.equipment.getStatBonus('health'),
			mana: this.stats.mana,
			maxMana: this.stats.maxMana + this.equipment.getStatBonus('mana'),
			attack: this.stats.attack + this.equipment.getStatBonus('attack'),
			defense: this.stats.defense + this.equipment.getStatBonus('defense'),
			speed: this.stats.speed + this.equipment.getStatBonus('speed'),
		};
	}

	gainExperience(amount) {
		this.experience += amount;
		if (this.experience >= this.experienceToNext) {
			this.levelUp();
		}
	}

	levelUp() {
		this.level++;
		this.experience -= this.experienceToNext;
		this.experienceToNext = Math.floor(this.experienceToNext * 1.5);
		
		this.stats.maxHealth += 10;
		this.stats.maxMana += 5;
		this.stats.attack += 2;
		this.stats.defense += 1;
		this.stats.speed += 1;
		
		this.stats.health = this.stats.maxHealth;
		this.stats.mana = this.stats.maxMana;
		
		return `🎉 ${this.name} reached level ${this.level}! Stats increased!`;
	}

	useSkill(skillName, target = null) {
		const skill = this.skills.find(s => s.name === skillName);
		if (!skill) {
			return `❌ ${this.name} doesn't know the skill "${skillName}"`;
		}

		if (!this.stats.useMana(skill.manaCost)) {
			return `❌ ${this.name} doesn't have enough mana for ${skillName}`;
		}

		return skill.use(this, target);
	}

	isAlive() {
		return this.stats.health > 0;
	}
}

class Monster {
	constructor(name, level = 1) {
		this.name = name;
		this.level = level;
		this.stats = new Stats();
		this.experienceReward = level * 25;
		this.goldReward = level * 10;
		
		this.generateStats();
	}

	generateStats() {
		const baseMultiplier = 1 + (this.level - 1) * 0.3;
		this.stats.maxHealth = Math.floor(80 * baseMultiplier);
		this.stats.health = this.stats.maxHealth;
		this.stats.attack = Math.floor(8 * baseMultiplier);
		this.stats.defense = Math.floor(3 * baseMultiplier);
		this.stats.speed = Math.floor(8 * baseMultiplier);
	}

	attack(target) {
		const damage = this.stats.attack + Math.floor(Math.random() * 5);
		const actualDamage = target.stats.takeDamage(damage);
		return `🗡️ ${this.name} attacks ${target.name} for ${actualDamage} damage!`;
	}

	isAlive() {
		return this.stats.health > 0;
	}
}

class Skill {
	constructor(name, description, manaCost, effect) {
		this.name = name;
		this.description = description;
		this.manaCost = manaCost;
		this.effect = effect;
	}

	use(caster, target) {
		return this.effect(caster, target);
	}
}

class Item {
	constructor(name, type, description, stats = {}, value = 0) {
		this.name = name;
		this.type = type;
		this.description = description;
		this.stats = stats;
		this.value = value;
	}
}

class RPGBrowserGame {
	constructor() {
		this.player = null;
		this.currentLocation = 'town';
		this.gameState = 'menu';
		this.currentMonster = null;
		this.locations = this.initializeLocations();
		this.items = this.initializeItems();
		this.skills = this.initializeSkills();
		this.monsters = this.initializeMonsters();
		this.pvpManager = null;
		this.socket = null;
		
		this.initializeEventListeners();
		this.initializeTabs();
	}

	initializeLocations() {
		return {
			town: {
				name: 'Mystral Town',
				description: 'A peaceful town with shops and friendly faces.',
				actions: ['shop', 'rest', 'explore'],
				monsters: [],
			},
			forest: {
				name: 'Whispering Forest',
				description: 'A dark forest filled with mysterious creatures.',
				actions: ['explore', 'return'],
				monsters: ['Goblin', 'Wolf', 'Forest Sprite'],
			},
			dungeon: {
				name: 'Ancient Dungeon',
				description: 'A dangerous dungeon with powerful monsters and treasures.',
				actions: ['explore', 'return'],
				monsters: ['Skeleton', 'Orc', 'Dark Mage'],
			},
		};
	}

	initializeItems() {
		return [
			new Item('Iron Sword', 'weapon', 'A sturdy iron sword', { attack: 5 }, 50),
			new Item('Steel Armor', 'armor', 'Protective steel armor', { defense: 8, health: 20 }, 100),
			new Item('Magic Ring', 'accessory', 'A ring that enhances magical power', { mana: 30, attack: 3 }, 75),
			new Item('Health Potion', 'consumable', 'Restores 50 health', {}, 25),
			new Item('Mana Potion', 'consumable', 'Restores 30 mana', {}, 20),
		];
	}

	initializeSkills() {
		const skills = [
			new Skill('Heal', 'Restores health', 15, (caster, target) => {
				const healAmount = 30 + Math.floor(Math.random() * 20);
				caster.stats.heal(healAmount);
				return `✨ ${caster.name} heals for ${healAmount} health!`;
			}),
			new Skill('Fireball', 'Deals fire damage', 20, (caster, target) => {
				const damage = 25 + Math.floor(Math.random() * 15);
				const actualDamage = target.stats.takeDamage(damage);
				return `🔥 ${caster.name} casts Fireball on ${target.name} for ${actualDamage} damage!`;
			}),
			new Skill('Backstab', 'High damage sneak attack', 10, (caster, target) => {
				const damage = caster.getTotalStats().attack * 2;
				const actualDamage = target.stats.takeDamage(damage);
				return `🗡️ ${caster.name} backstabs ${target.name} for ${actualDamage} damage!`;
			}),
		];

		return skills;
	}

	initializeMonsters() {
		const monsterTemplates = {
			Goblin: { name: 'Goblin', description: 'A small, cunning creature' },
			Wolf: { name: 'Wolf', description: 'A fierce predator of the forest' },
			'Forest Sprite': { name: 'Forest Sprite', description: 'A magical forest guardian' },
			Skeleton: { name: 'Skeleton', description: 'An undead warrior' },
			Orc: { name: 'Orc', description: 'A brutal, muscular warrior' },
			'Dark Mage': { name: 'Dark Mage', description: 'A practitioner of forbidden magic' },
		};

		return monsterTemplates;
	}

	initializeTabs() {
		const tabButtons = document.querySelectorAll('.tab-button');
		const tabPanels = document.querySelectorAll('.tab-panel');

		tabButtons.forEach(button => {
			button.addEventListener('click', () => {
				const targetTab = button.dataset.tab;
				
				tabButtons.forEach(btn => btn.classList.remove('active'));
				tabPanels.forEach(panel => panel.classList.remove('active'));
				
				button.classList.add('active');
				document.querySelector(`[data-panel="${targetTab}"]`).classList.add('active');
			});
		});
	}

	initializeEventListeners() {
		console.log('Initializing RPG event listeners...'); // Debug log
		
		// Character creation
		const createBtn = document.getElementById('create-character');
		console.log('Create button found:', createBtn); // Debug log
		if (createBtn) {
			createBtn.addEventListener('click', () => this.createCharacter());
			console.log('Create character event listener added'); // Debug log
		}

		// Action buttons
		const exploreBtn = document.getElementById('explore-btn');
		if (exploreBtn) {
			exploreBtn.addEventListener('click', () => this.explore());
		}

		const restBtn = document.getElementById('rest-btn');
		if (restBtn) {
			restBtn.addEventListener('click', () => this.rest());
		}

		const shopBtn = document.getElementById('shop-btn');
		if (shopBtn) {
			shopBtn.addEventListener('click', () => this.showShop());
		}

		const statusBtn = document.getElementById('status-btn');
		if (statusBtn) {
			statusBtn.addEventListener('click', () => this.showStatus());
		}

		// Travel buttons
		const travelTown = document.getElementById('travel-town');
		if (travelTown) {
			travelTown.addEventListener('click', () => this.travel('town'));
		}

		const travelForest = document.getElementById('travel-forest');
		if (travelForest) {
			travelForest.addEventListener('click', () => this.travel('forest'));
		}

		const travelDungeon = document.getElementById('travel-dungeon');
		if (travelDungeon) {
			travelDungeon.addEventListener('click', () => this.travel('dungeon'));
		}

		// Combat buttons
		const attackBtn = document.getElementById('attack-btn');
		if (attackBtn) {
			attackBtn.addEventListener('click', () => this.playerAttack());
		}

		const skillBtn = document.getElementById('skill-btn');
		if (skillBtn) {
			skillBtn.addEventListener('click', () => this.usePlayerSkill());
		}

		const runBtn = document.getElementById('run-btn');
		if (runBtn) {
			runBtn.addEventListener('click', () => this.runFromCombat());
		}

		// Shop/inventory close buttons
		const closeShop = document.getElementById('close-shop');
		if (closeShop) {
			closeShop.addEventListener('click', () => this.closeShop());
		}

		const closeInventory = document.getElementById('close-inventory');
		if (closeInventory) {
			closeInventory.addEventListener('click', () => this.closeInventory());
		}

		// PvP event listeners
		const findPlayersBtn = document.getElementById('find-players-btn');
		if (findPlayersBtn) {
			findPlayersBtn.addEventListener('click', () => this.findPlayers());
		}

		const challengeRandomBtn = document.getElementById('challenge-random-btn');
		if (challengeRandomBtn) {
			challengeRandomBtn.addEventListener('click', () => this.challengeRandomPlayer());
		}

		const closePlayers = document.getElementById('close-players');
		if (closePlayers) {
			closePlayers.addEventListener('click', () => this.closePlayers());
		}

		const acceptChallenge = document.getElementById('accept-challenge');
		if (acceptChallenge) {
			acceptChallenge.addEventListener('click', () => this.acceptChallenge());
		}

		const declineChallenge = document.getElementById('decline-challenge');
		if (declineChallenge) {
			declineChallenge.addEventListener('click', () => this.declineChallenge());
		}

		// PvP Battle controls
		const pvpAttackBtn = document.getElementById('pvp-attack-btn');
		if (pvpAttackBtn) {
			pvpAttackBtn.addEventListener('click', () => this.pvpAttack());
		}

		const pvpSkillBtn = document.getElementById('pvp-skill-btn');
		if (pvpSkillBtn) {
			pvpSkillBtn.addEventListener('click', () => this.pvpUseSkill());
		}

		const pvpSurrenderBtn = document.getElementById('pvp-surrender-btn');
		if (pvpSurrenderBtn) {
			pvpSurrenderBtn.addEventListener('click', () => this.pvpSurrender());
		}

		const closeResults = document.getElementById('close-results');
		if (closeResults) {
			closeResults.addEventListener('click', () => this.closeBattleResults());
		}

		const cancelSkill = document.getElementById('cancel-skill');
		if (cancelSkill) {
			cancelSkill.addEventListener('click', () => this.cancelSkillSelection());
		}
	}

	createCharacter() {
		console.log('Create character button clicked!'); // Debug log
		
		const nameInput = document.getElementById('character-name');
		const classSelect = document.getElementById('character-class');
		
		if (!nameInput || !classSelect) {
			console.error('Could not find character creation elements');
			return;
		}
		
		const name = nameInput.value.trim();
		const characterClass = classSelect.value;

		console.log('Character data:', { name, characterClass }); // Debug log

		if (!name || !characterClass) {
			this.addToLog('❌ Please enter a character name and select a class!');
			return;
		}

		this.player = new Character(name, characterClass);
		
		// Give starting skills based on class
		if (characterClass === 'Cleric') {
			this.player.skills.push(this.skills[0]); // Heal
		} else if (characterClass === 'Mage') {
			this.player.skills.push(this.skills[1]); // Fireball
		} else if (characterClass === 'Rogue') {
			this.player.skills.push(this.skills[2]); // Backstab
		}

		// Give starting equipment
		if (characterClass === 'Fighter') {
			this.player.inventory.addItem(this.items[0]); // Iron Sword
		}

		this.addToLog(`✨ Created ${characterClass} named ${name}!`);
		this.updateCharacterDisplay();
		this.updateLocationDisplay();
		this.gameState = 'playing';

		// Initialize PvP manager with socket if available
		this.initializePvPManager();

		// Broadcast character creation through chat app
		if (window.chatApp && window.chatApp.pvpBroadcaster) {
			window.chatApp.pvpBroadcaster.broadcastCharacterCreated({
				name: name,
				class: characterClass,
				level: this.player.level
			});
			window.chatApp.pvpBroadcaster.setLocalPlayer(this.player);
		}
	}

	updateCharacterDisplay() {
		if (!this.player) return;

		// Hide creation form, show status
		document.getElementById('character-creation').classList.add('hidden');
		document.getElementById('character-status').classList.remove('hidden');
		document.getElementById('action-controls').classList.remove('hidden');

		// Update character info
		const stats = this.player.getTotalStats();
		document.getElementById('character-title').textContent = 
			`${this.player.name} the ${this.player.class} (Level ${this.player.level})`;
		
		// Update health
		document.getElementById('health-display').textContent = 
			`${this.player.stats.health}/${stats.maxHealth}`;
		const healthBar = document.getElementById('health-bar');
		healthBar.max = stats.maxHealth;
		healthBar.value = this.player.stats.health;

		// Update mana
		document.getElementById('mana-display').textContent = 
			`${this.player.stats.mana}/${stats.maxMana}`;
		const manaBar = document.getElementById('mana-bar');
		manaBar.max = stats.maxMana;
		manaBar.value = this.player.stats.mana;

		// Update level and experience
		document.getElementById('level-display').textContent = this.player.level;
		document.getElementById('exp-display').textContent = 
			`${this.player.experience}/${this.player.experienceToNext}`;
		const expBar = document.getElementById('exp-bar');
		expBar.max = this.player.experienceToNext;
		expBar.value = this.player.experience;

		// Update gold
		document.getElementById('gold-display').textContent = this.player.inventory.gold;
	}

	updateLocationDisplay() {
		if (!this.player) return;

		const location = this.locations[this.currentLocation];
		document.getElementById('location-name').textContent = location.name;
		document.getElementById('location-description').textContent = location.description;
	}

	addToLog(message) {
		const gameLog = document.getElementById('game-log');
		const logMessage = document.createElement('div');
		logMessage.className = 'log-message';
		logMessage.textContent = message;
		gameLog.appendChild(logMessage);
		gameLog.scrollTop = gameLog.scrollHeight;
	}

	explore() {
		if (!this.player) {
			this.addToLog('❌ Create a character first!');
			return;
		}

		const location = this.locations[this.currentLocation];
		this.addToLog(`🔍 Exploring ${location.name}...`);

		if (location.monsters.length > 0 && Math.random() < 0.6) {
			this.startCombat();
		} else {
			this.addToLog('🌟 You found nothing of interest, but gained 5 experience from exploring.');
			this.player.gainExperience(5);
			this.updateCharacterDisplay();
		}
	}

	startCombat() {
		const location = this.locations[this.currentLocation];
		const monsterName = location.monsters[Math.floor(Math.random() * location.monsters.length)];
		this.currentMonster = new Monster(
			monsterName,
			Math.max(1, this.player.level + Math.floor(Math.random() * 3) - 1)
		);

		this.addToLog(`⚔️ A wild ${this.currentMonster.name} (Level ${this.currentMonster.level}) appears!`);
		
		// Hide action controls, show combat panel
		document.getElementById('action-controls').classList.add('hidden');
		document.getElementById('combat-panel').classList.remove('hidden');
		
		this.updateCombatDisplay();
	}

	updateCombatDisplay() {
		if (!this.currentMonster || !this.player) return;

		// Update player combat info
		document.getElementById('player-combat-name').textContent = this.player.name;
		const playerHealthBar = document.getElementById('player-combat-health');
		playerHealthBar.max = this.player.stats.maxHealth;
		playerHealthBar.value = this.player.stats.health;
		document.getElementById('player-combat-hp').textContent = 
			`${this.player.stats.health}/${this.player.stats.maxHealth} HP`;

		// Update enemy combat info
		document.getElementById('enemy-combat-name').textContent = this.currentMonster.name;
		const enemyHealthBar = document.getElementById('enemy-combat-health');
		enemyHealthBar.max = this.currentMonster.stats.maxHealth;
		enemyHealthBar.value = this.currentMonster.stats.health;
		document.getElementById('enemy-combat-hp').textContent = 
			`${this.currentMonster.stats.health}/${this.currentMonster.stats.maxHealth} HP`;
	}

	playerAttack() {
		if (!this.currentMonster || !this.player) return;

		const damage = this.player.getTotalStats().attack + Math.floor(Math.random() * 5);
		const actualDamage = this.currentMonster.stats.takeDamage(damage);
		this.addToLog(`⚔️ ${this.player.name} attacks for ${actualDamage} damage!`);

		this.updateCombatDisplay();

		if (!this.currentMonster.isAlive()) {
			this.endCombat(true);
			return;
		}

		// Monster's turn
		setTimeout(() => {
			const monsterAttackMessage = this.currentMonster.attack(this.player);
			this.addToLog(monsterAttackMessage);
			this.updateCombatDisplay();
			this.updateCharacterDisplay();

			if (!this.player.isAlive()) {
				this.endCombat(false);
			}
		}, 1000);
	}

	usePlayerSkill() {
		if (!this.currentMonster || !this.player || this.player.skills.length === 0) {
			this.addToLog('❌ No skills available!');
			return;
		}

		const skill = this.player.skills[0]; // Use first available skill
		const result = this.player.useSkill(skill.name, this.currentMonster);
		this.addToLog(result);

		this.updateCombatDisplay();
		this.updateCharacterDisplay();

		if (!this.currentMonster.isAlive()) {
			this.endCombat(true);
			return;
		}

		// Monster's turn
		setTimeout(() => {
			const monsterAttackMessage = this.currentMonster.attack(this.player);
			this.addToLog(monsterAttackMessage);
			this.updateCombatDisplay();
			this.updateCharacterDisplay();

			if (!this.player.isAlive()) {
				this.endCombat(false);
			}
		}, 1000);
	}

	runFromCombat() {
		this.addToLog(`🏃 ${this.player.name} runs away!`);
		this.endCombat(false, true);
	}

	endCombat(victory, ran = false) {
		if (victory && !ran) {
			this.addToLog(`🎉 Victory! ${this.currentMonster.name} defeated!`);
			this.addToLog(`💰 Gained ${this.currentMonster.goldReward} gold and ${this.currentMonster.experienceReward} experience!`);
			this.player.inventory.gold += this.currentMonster.goldReward;
			this.player.gainExperience(this.currentMonster.experienceReward);
			
			// Random item drop
			if (Math.random() < 0.3) {
				const item = this.items[Math.floor(Math.random() * this.items.length)];
				this.player.inventory.addItem(item);
				this.addToLog(`🎁 Found ${item.name}!`);
			}
		} else if (!victory && !ran) {
			this.addToLog('💀 Game Over! Your character has fallen...');
			this.gameState = 'menu';
		}

		// Hide combat panel, show action controls
		document.getElementById('combat-panel').classList.add('hidden');
		document.getElementById('action-controls').classList.remove('hidden');
		
		this.currentMonster = null;
		this.updateCharacterDisplay();
	}

	travel(locationName) {
		if (!this.player) {
			this.addToLog('❌ Create a character first!');
			return;
		}

		if (!this.locations[locationName]) {
			this.addToLog(`❌ Unknown location: ${locationName}`);
			return;
		}

		this.currentLocation = locationName;
		const location = this.locations[locationName];
		this.addToLog(`🗺️ Traveled to ${location.name}`);
		this.updateLocationDisplay();
	}

	rest() {
		if (!this.player) {
			this.addToLog('❌ Create a character first!');
			return;
		}

		if (this.currentLocation !== 'town') {
			this.addToLog('❌ You can only rest in town!');
			return;
		}

		this.player.stats.health = this.player.stats.maxHealth;
		this.player.stats.mana = this.player.stats.maxMana;
		this.addToLog('😴 You rest at the inn and recover fully!');
		this.updateCharacterDisplay();
	}

	showShop() {
		if (!this.player) {
			this.addToLog('❌ Create a character first!');
			return;
		}

		if (this.currentLocation !== 'town') {
			this.addToLog('❌ The shop is only available in town!');
			return;
		}

		const shopPanel = document.getElementById('shop-panel');
		const shopItems = document.getElementById('shop-items');
		
		shopItems.innerHTML = '';
		
		this.items.forEach((item, index) => {
			const itemDiv = document.createElement('div');
			itemDiv.className = 'shop-item';
			itemDiv.innerHTML = `
				<div>
					<strong>${item.name}</strong><br>
					<small>${item.description}</small>
				</div>
				<div>
					<span>${item.value} gold</span>
					<button onclick="game.buyItem(${index})" ${this.player.inventory.gold < item.value ? 'disabled' : ''}>
						Buy
					</button>
				</div>
			`;
			shopItems.appendChild(itemDiv);
		});

		shopPanel.classList.remove('hidden');
	}

	buyItem(itemIndex) {
		const item = this.items[itemIndex];
		if (!item) return;

		if (this.player.inventory.gold < item.value) {
			this.addToLog('❌ Not enough gold!');
			return;
		}

		this.player.inventory.gold -= item.value;
		this.player.inventory.addItem(item);
		this.addToLog(`✅ Purchased ${item.name}!`);
		this.updateCharacterDisplay();
		this.showShop(); // Refresh shop display
	}

	closeShop() {
		document.getElementById('shop-panel').classList.add('hidden');
	}

	closeInventory() {
		document.getElementById('inventory-panel').classList.add('hidden');
	}

	showStatus() {
		if (!this.player) {
			this.addToLog('❌ Create a character first!');
			return;
		}

		const stats = this.player.getTotalStats();
		this.addToLog(`📊 ${this.player.name} the ${this.player.class} (Level ${this.player.level})`);
		this.addToLog(`❤️ Health: ${this.player.stats.health}/${stats.maxHealth} | 💙 Mana: ${this.player.stats.mana}/${stats.maxMana}`);
		this.addToLog(`⚔️ Attack: ${stats.attack} | 🛡️ Defense: ${stats.defense} | ⚡ Speed: ${stats.speed}`);
		this.addToLog(`💰 Gold: ${this.player.inventory.gold} | ✨ Experience: ${this.player.experience}/${this.player.experienceToNext}`);
		
		if (this.player.skills.length > 0) {
			this.addToLog(`🎯 Skills: ${this.player.skills.map(s => s.name).join(', ')}`);
		}
		
		if (this.player.inventory.items.length > 0) {
			this.addToLog(`🎒 Items: ${this.player.inventory.items.map(i => `${i.name} (${i.quantity})`).join(', ')}`);
		}
	}

	// PvP System Methods
	initializePvPManager() {
		// Get socket from global chat app if available
		if (window.chatApp && window.chatApp.isSocketConnected()) {
			this.socket = window.chatApp.getSocket();
			this.pvpManager = new window.PvPManager(this, this.socket);
			console.log('✅ PvP Manager initialized with chat socket');
		} else {
			console.log('⏳ Waiting for chat socket connection...');
		}
	}

	onSocketReady(socket) {
		console.log('🔌 Socket ready callback received');
		this.socket = socket;
		if (!this.pvpManager) {
			this.pvpManager = new window.PvPManager(this, socket);
			console.log('✅ PvP Manager initialized via callback');
		}
	}

	findPlayers() {
		if (!this.player) {
			this.addToLog('❌ Create a character first!');
			return;
		}

		if (!this.pvpManager) {
			this.addToLog('❌ PvP system not available - not connected to server');
			return;
		}

		this.pvpManager.requestOnlinePlayers();
		document.getElementById('players-panel').classList.remove('hidden');
	}

	displayOnlinePlayers(players) {
		const playersList = document.getElementById('players-list');
		playersList.innerHTML = '';

		if (players.length === 0) {
			playersList.innerHTML = '<div class="no-players">No other players online</div>';
			return;
		}

		players.forEach(player => {
			if (player.name === this.player.name) return; // Skip self

			const playerItem = document.createElement('div');
			playerItem.className = 'player-item';
			playerItem.innerHTML = `
				<div class="player-info">
					<div class="player-name">${player.name}</div>
					<div class="player-details">${player.class} - Level ${player.level}</div>
				</div>
				<button onclick="game.challengePlayer('${player.id}')">⚔️ Challenge</button>
			`;
			playersList.appendChild(playerItem);
		});
	}

	challengePlayer(playerId) {
		if (this.pvpManager) {
			this.pvpManager.challengePlayer(playerId);
			this.closePlayers();
		}
	}

	challengeRandomPlayer() {
		if (!this.player) {
			this.addToLog('❌ Create a character first!');
			return;
		}

		if (!this.pvpManager) {
			this.addToLog('❌ PvP system not available - not connected to server');
			return;
		}

		this.pvpManager.challengeRandomPlayer();
	}

	closePlayers() {
		document.getElementById('players-panel').classList.add('hidden');
	}

	showPvPChallenge(challengeData) {
		const challengePanel = document.getElementById('pvp-challenge-panel');
		const challengeMessage = document.getElementById('challenge-message');
		
		challengeMessage.textContent = 
			`${challengeData.challengerName} (${challengeData.challengerClass} Level ${challengeData.challengerLevel}) challenges you to battle!`;
		
		challengePanel.classList.remove('hidden');
		
		// Store challenge data for response
		this.currentChallenge = challengeData;
	}

	acceptChallenge() {
		if (this.currentChallenge && this.pvpManager) {
			this.pvpManager.acceptChallenge(this.currentChallenge.challengeId);
			document.getElementById('pvp-challenge-panel').classList.add('hidden');
			this.currentChallenge = null;
		}
	}

	declineChallenge() {
		if (this.currentChallenge && this.pvpManager) {
			this.pvpManager.declineChallenge(this.currentChallenge.challengeId);
			document.getElementById('pvp-challenge-panel').classList.add('hidden');
			this.currentChallenge = null;
		}
	}

	startPvPBattleUI(battleData, isPlayer1) {
		// Hide normal game UI
		document.getElementById('action-controls').classList.add('hidden');
		document.getElementById('combat-panel').classList.add('hidden');
		
		// Show PvP battle UI
		document.getElementById('pvp-combat-panel').classList.remove('hidden');
		
		// Update player information
		this.updatePvPCombatantUI('player1', battleData.player1);
		this.updatePvPCombatantUI('player2', battleData.player2);
		
		// Set initial turn
		this.updateCurrentTurn(battleData.currentTurn, isPlayer1);
		
		this.addPvPLogEntry('⚔️ PvP Battle begins!');
	}

	updatePvPCombatantUI(playerSlot, playerData) {
		document.getElementById(`${playerSlot}-combat-name`).textContent = playerData.name;
		document.getElementById(`${playerSlot}-class`).textContent = playerData.class;
		document.getElementById(`${playerSlot}-level`).textContent = `Level ${playerData.level}`;
		
		// Update health
		const healthBar = document.getElementById(`${playerSlot}-combat-health`);
		healthBar.max = playerData.maxHealth;
		healthBar.value = playerData.health;
		document.getElementById(`${playerSlot}-combat-hp`).textContent = 
			`${playerData.health}/${playerData.maxHealth} HP`;
		
		// Update mana
		const manaBar = document.getElementById(`${playerSlot}-combat-mana`);
		manaBar.max = playerData.maxMana;
		manaBar.value = playerData.mana;
		document.getElementById(`${playerSlot}-combat-mp`).textContent = 
			`${playerData.mana}/${playerData.maxMana} MP`;
	}

	updateCurrentTurn(currentTurn, isPlayer1) {
		const isMyTurn = (isPlayer1 && currentTurn === 1) || (!isPlayer1 && currentTurn === 2);
		const currentPlayerName = currentTurn === 1 ? 
			document.getElementById('player1-combat-name').textContent :
			document.getElementById('player2-combat-name').textContent;
		
		document.getElementById('current-turn').textContent = `${currentPlayerName}'s Turn`;
		
		// Enable/disable action buttons
		const actionButtons = ['pvp-attack-btn', 'pvp-skill-btn', 'pvp-item-btn'];
		actionButtons.forEach(btnId => {
			const btn = document.getElementById(btnId);
			if (btn) {
				btn.disabled = !isMyTurn;
			}
		});
		
		// Highlight active player
		document.querySelectorAll('.pvp-combatant').forEach(el => el.classList.remove('active'));
		document.querySelector(`.player${currentTurn}-combatant`).classList.add('active');
	}

	addPvPLogEntry(message) {
		const logContainer = document.getElementById('pvp-combat-log');
		const logEntry = document.createElement('div');
		logEntry.className = 'log-message';
		logEntry.textContent = message;
		logContainer.appendChild(logEntry);
		logContainer.scrollTop = logContainer.scrollHeight;
	}

	updatePvPTimer(timeRemaining) {
		document.getElementById('turn-timer').textContent = timeRemaining;
		const timerBar = document.getElementById('timer-bar');
		timerBar.value = timeRemaining;
		
		// Change color as time runs low
		if (timeRemaining <= 10) {
			timerBar.style.accentColor = 'oklch(65% 0.15 25)'; // Red
		} else if (timeRemaining <= 20) {
			timerBar.style.accentColor = 'oklch(75% 0.15 90)'; // Orange
		} else {
			timerBar.style.accentColor = 'oklch(60% 0.15 250)'; // Blue
		}
	}

	pvpAttack() {
		if (this.pvpManager) {
			this.pvpManager.executePlayerAction({ type: 'attack' });
		}
	}

	pvpUseSkill() {
		if (!this.player || this.player.skills.length === 0) {
			this.addPvPLogEntry('❌ No skills available!');
			return;
		}
		
		this.showSkillSelection();
	}

	showSkillSelection() {
		const skillSelection = document.getElementById('skill-selection');
		const skillsList = document.getElementById('skills-list');
		
		skillsList.innerHTML = '';
		
		this.player.skills.forEach(skill => {
			const skillItem = document.createElement('div');
			skillItem.className = 'skill-item';
			skillItem.innerHTML = `
				<span class="skill-name">${skill.name}</span>
				<span class="skill-cost">${skill.manaCost} MP</span>
			`;
			skillItem.addEventListener('click', () => this.selectSkill(skill.name));
			skillsList.appendChild(skillItem);
		});
		
		skillSelection.classList.remove('hidden');
	}

	selectSkill(skillName) {
		this.cancelSkillSelection();
		if (this.pvpManager) {
			this.pvpManager.executePlayerAction({ type: 'skill', skillName });
		}
	}

	cancelSkillSelection() {
		document.getElementById('skill-selection').classList.add('hidden');
	}

	pvpSurrender() {
		if (confirm('Are you sure you want to surrender this battle?')) {
			if (this.pvpManager) {
				this.pvpManager.executePlayerAction({ type: 'surrender' });
			}
		}
	}

	updatePvPBattleUI(data) {
		// Update both players' stats
		this.updatePvPCombatantUI('player1', data.player1);
		this.updatePvPCombatantUI('player2', data.player2);
		
		// Update turn indicator
		const isPlayer1 = data.player1.name === this.player.name;
		this.updateCurrentTurn(data.currentTurn, isPlayer1);
		
		// Add action result to log
		if (data.result && data.result.message) {
			this.addPvPLogEntry(data.result.message);
		}
	}

	endPvPBattleUI(data) {
		// Show battle results
		this.showBattleResults(data);
		
		// Hide PvP battle UI
		document.getElementById('pvp-combat-panel').classList.add('hidden');
		
		// Show normal game UI
		document.getElementById('action-controls').classList.remove('hidden');
		
		// Update character display if player won
		if (data.winner === this.player.name) {
			this.updateCharacterDisplay();
		}
	}

	showBattleResults(data) {
		const resultsPanel = document.getElementById('battle-results-panel');
		const winnerAnnouncement = document.getElementById('winner-announcement');
		const battleStats = document.getElementById('battle-stats');
		const rewardsInfo = document.getElementById('rewards-info');
		
		// Winner announcement
		if (data.winner) {
			winnerAnnouncement.textContent = `🏆 ${data.winner} wins the battle!`;
			winnerAnnouncement.style.backgroundColor = 
				data.winner === this.player.name ? 'oklch(80% 0.1 120)' : 'oklch(80% 0.1 25)';
		} else {
			winnerAnnouncement.textContent = '⚖️ Battle ended in a draw';
		}
		
		// Battle statistics
		battleStats.innerHTML = `
			<h4>Battle Statistics</h4>
			<div class="stat-line">
				<span>Battle Duration:</span>
				<span>${Math.floor(data.battleLog.length / 2)} turns</span>
			</div>
			<div class="stat-line">
				<span>End Reason:</span>
				<span>${data.endReason}</span>
			</div>
		`;
		
		// Rewards information
		if (data.winner === this.player.name) {
			rewardsInfo.innerHTML = `
				<h4>Victory Rewards</h4>
				<div class="reward-line">
					<span>Experience Gained:</span>
					<span>+${Math.floor(data.finalStats.player2.level * 15 + 25)} XP</span>
				</div>
				<div class="reward-line">
					<span>Gold Earned:</span>
					<span>+${Math.floor(data.finalStats.player2.level * 8 + 15)} Gold</span>
				</div>
			`;
		} else {
			rewardsInfo.innerHTML = `
				<h4>Battle Results</h4>
				<div class="reward-line">
					<span>Experience:</span>
					<span>No rewards for defeat</span>
				</div>
			`;
		}
		
		resultsPanel.classList.remove('hidden');
	}

	closeBattleResults() {
		document.getElementById('battle-results-panel').classList.add('hidden');
	}
}

// Initialize the game when DOM is loaded
let game;
document.addEventListener('DOMContentLoaded', () => {
	game = new RPGBrowserGame();
});

// Export for global access
window.game = game;