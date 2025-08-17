// Fantasy RPG Console Game
// A modern JavaScript RPG that runs in the browser console

/**
 *  I've created a complete modern JavaScript RPG game that runs in the browser console! Here's what
 *
 *_  Game Features:
 *     - Character Classes: Fighter, Mage, Rogue, Cleric with unique stats and skills
 *     - Combat System: Turn-based battles with monsters
 *     - Equipment & Inventory: Weapons, armor, accessories, and consumables
 *     - Exploration: Multiple locations (town, forest, dungeon) with random encounters
 *     - Progression: Leveling system with stat increases and experience points
 *     - Shop System: Buy items and equipment in town
 *     - Skills: Class-specific abilities (Heal, Fireball, Backstab)
 *
 *_  How to Play:
 *
 *      1. Open browser console and load the game:
 **         Copy and paste the rpg-game.js content into console
 *      2. Create your character:
 *           game.createCharacter("Hero", "Fighter")
 *      3. Use these commands:
 * ^       - game.showStatus() - View character info
 * ^       - game.explore() - Find monsters and treasures
 * ^       - game.travel("forest") - Travel to different locations
 * ^       - game.shop() - Visit shop in town
 * ^       - game.rest() - Restore health/mana in town
 *
 *      The game is fully functional with automatic combat, character progression, item management, and multiple gameplay systems. All interactions
 *      happen through the browser console with colorful emoji feedback!
 */

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
		if (this.weapon && this.weapon.stats[stat])
			bonus += this.weapon.stats[stat];
		if (this.armor && this.armor.stats[stat]) bonus += this.armor.stats[stat];
		if (this.accessory && this.accessory.stats[stat])
			bonus += this.accessory.stats[stat];
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

		// Stat increases on level up
		this.stats.maxHealth += 10;
		this.stats.maxMana += 5;
		this.stats.attack += 2;
		this.stats.defense += 1;
		this.stats.speed += 1;

		// Heal to full on level up
		this.stats.health = this.stats.maxHealth;
		this.stats.mana = this.stats.maxMana;

		console.log(`🎉 ${this.name} reached level ${this.level}!`);
		console.log(
			`💪 Stats increased! Health: ${this.stats.maxHealth}, Attack: ${this.stats.attack}`,
		);
	}

	useSkill(skillName, target = null) {
		const skill = this.skills.find(s => s.name === skillName);
		if (!skill) {
			console.log(`❌ ${this.name} doesn't know the skill "${skillName}"`);
			return null;
		}

		if (!this.stats.useMana(skill.manaCost)) {
			console.log(`❌ ${this.name} doesn't have enough mana for ${skillName}`);
			return null;
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
		console.log(
			`🗡️ ${this.name} attacks ${target.name} for ${actualDamage} damage!`,
		);
		return actualDamage;
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

class RPGGame {
	constructor() {
		this.player = null;
		this.currentLocation = 'town';
		this.gameState = 'menu';
		this.locations = this.initializeLocations();
		this.items = this.initializeItems();
		this.skills = this.initializeSkills();
		this.monsters = this.initializeMonsters();
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
				description:
					'A dangerous dungeon with powerful monsters and treasures.',
				actions: ['explore', 'return'],
				monsters: ['Skeleton', 'Orc', 'Dark Mage'],
			},
		};
	}

	initializeItems() {
		return [
			new Item(
				'Iron Sword',
				'weapon',
				'A sturdy iron sword',
				{ attack: 5 },
				50,
			),
			new Item(
				'Steel Armor',
				'armor',
				'Protective steel armor',
				{ defense: 8, health: 20 },
				100,
			),
			new Item(
				'Magic Ring',
				'accessory',
				'A ring that enhances magical power',
				{ mana: 30, attack: 3 },
				75,
			),
			new Item('Health Potion', 'consumable', 'Restores 50 health', {}, 25),
			new Item('Mana Potion', 'consumable', 'Restores 30 mana', {}, 20),
		];
	}

	initializeSkills() {
		const skills = [
			new Skill('Heal', 'Restores health', 15, (caster, target) => {
				const healAmount = 30 + Math.floor(Math.random() * 20);
				caster.stats.heal(healAmount);
				console.log(`✨ ${caster.name} heals for ${healAmount} health!`);
				return { type: 'heal', amount: healAmount };
			}),
			new Skill('Fireball', 'Deals fire damage', 20, (caster, target) => {
				const damage = 25 + Math.floor(Math.random() * 15);
				const actualDamage = target.stats.takeDamage(damage);
				console.log(
					`🔥 ${caster.name} casts Fireball on ${target.name} for ${actualDamage} damage!`,
				);
				return { type: 'damage', amount: actualDamage };
			}),
			new Skill(
				'Backstab',
				'High damage sneak attack',
				10,
				(caster, target) => {
					const damage = caster.getTotalStats().attack * 2;
					const actualDamage = target.stats.takeDamage(damage);
					console.log(
						`🗡️ ${caster.name} backstabs ${target.name} for ${actualDamage} damage!`,
					);
					return { type: 'damage', amount: actualDamage };
				},
			),
		];

		return skills;
	}

	initializeMonsters() {
		const monsterTemplates = {
			Goblin: { name: 'Goblin', description: 'A small, cunning creature' },
			Wolf: { name: 'Wolf', description: 'A fierce predator of the forest' },
			'Forest Sprite': {
				name: 'Forest Sprite',
				description: 'A magical forest guardian',
			},
			Skeleton: { name: 'Skeleton', description: 'An undead warrior' },
			Orc: { name: 'Orc', description: 'A brutal, muscular warrior' },
			'Dark Mage': {
				name: 'Dark Mage',
				description: 'A practitioner of forbidden magic',
			},
		};

		return monsterTemplates;
	}

	start() {
		console.clear();
		console.log('🏰 Welcome to the Fantasy RPG Console Game! 🗡️');
		console.log('=====================================');
		console.log('');
		console.log('Available commands:');
		console.log('• game.createCharacter(name, class) - Create your character');
		console.log('• game.showStatus() - View character status');
		console.log('• game.explore() - Explore current location');
		console.log('• game.travel(location) - Travel to a new location');
		console.log('• game.rest() - Rest to restore health and mana');
		console.log('• game.shop() - Visit the shop');
		console.log('• game.help() - Show all commands');
		console.log('');
		console.log('Classes: Fighter, Mage, Rogue, Cleric');
		console.log('Locations: town, forest, dungeon');
		console.log('');
		console.log('Example: game.createCharacter("Hero", "Fighter")');
	}

	createCharacter(name, characterClass) {
		const validClasses = ['Fighter', 'Mage', 'Rogue', 'Cleric'];
		if (!validClasses.includes(characterClass)) {
			console.log(`❌ Invalid class. Choose from: ${validClasses.join(', ')}`);
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

		console.log(`✨ Created ${characterClass} named ${name}!`);
		this.showStatus();
		this.gameState = 'playing';
	}

	showStatus() {
		if (!this.player) {
			console.log('❌ No character created yet!');
			return;
		}

		const stats = this.player.getTotalStats();
		console.log(
			`\n📊 ${this.player.name} the ${this.player.class} (Level ${this.player.level})`,
		);
		console.log(`📍 Location: ${this.locations[this.currentLocation].name}`);
		console.log(`❤️ Health: ${this.player.stats.health}/${stats.maxHealth}`);
		console.log(`💙 Mana: ${this.player.stats.mana}/${stats.maxMana}`);
		console.log(
			`⚔️ Attack: ${stats.attack} | 🛡️ Defense: ${stats.defense} | ⚡ Speed: ${stats.speed}`,
		);
		console.log(
			`✨ Experience: ${this.player.experience}/${this.player.experienceToNext}`,
		);
		console.log(`💰 Gold: ${this.player.inventory.gold}`);

		if (this.player.skills.length > 0) {
			console.log(
				`🎯 Skills: ${this.player.skills.map(s => s.name).join(', ')}`,
			);
		}

		if (this.player.inventory.items.length > 0) {
			console.log(
				`🎒 Items: ${this.player.inventory.items
					.map(i => `${i.name} (${i.quantity})`)
					.join(', ')}`,
			);
		}
	}

	explore() {
		if (!this.player) {
			console.log('❌ Create a character first!');
			return;
		}

		const location = this.locations[this.currentLocation];
		console.log(`\n🔍 Exploring ${location.name}...`);
		console.log(location.description);

		if (location.monsters.length > 0 && Math.random() < 0.6) {
			this.startCombat();
		} else {
			console.log(
				'🌟 You found nothing of interest, but gained 5 experience from exploring.',
			);
			this.player.gainExperience(5);
		}
	}

	startCombat() {
		const location = this.locations[this.currentLocation];
		const monsterName =
			location.monsters[Math.floor(Math.random() * location.monsters.length)];
		const monster = new Monster(
			monsterName,
			Math.max(1, this.player.level + Math.floor(Math.random() * 3) - 1),
		);

		console.log(
			`\n⚔️ A wild ${monster.name} (Level ${monster.level}) appears!`,
		);

		// Combat loop
		while (this.player.isAlive() && monster.isAlive()) {
			// Player turn
			console.log(
				`\n${this.player.name}: ${this.player.stats.health}/${this.player.stats.maxHealth} HP`,
			);
			console.log(
				`${monster.name}: ${monster.stats.health}/${monster.stats.maxHealth} HP`,
			);
			console.log('Choose action: attack, skill, item, or run');

			// For console game, we'll auto-battle with random actions
			const action = this.getRandomPlayerAction();

			if (action === 'attack') {
				const damage =
					this.player.getTotalStats().attack + Math.floor(Math.random() * 5);
				const actualDamage = monster.stats.takeDamage(damage);
				console.log(
					`⚔️ ${this.player.name} attacks for ${actualDamage} damage!`,
				);
			} else if (action === 'skill' && this.player.skills.length > 0) {
				const skill =
					this.player.skills[
						Math.floor(Math.random() * this.player.skills.length)
					];
				this.player.useSkill(skill.name, monster);
			} else if (action === 'run') {
				console.log(`🏃 ${this.player.name} runs away!`);
				return;
			}

			if (!monster.isAlive()) break;

			// Monster turn
			monster.attack(this.player);
		}

		if (this.player.isAlive()) {
			console.log(`🎉 Victory! ${monster.name} defeated!`);
			console.log(
				`💰 Gained ${monster.goldReward} gold and ${monster.experienceReward} experience!`,
			);
			this.player.inventory.gold += monster.goldReward;
			this.player.gainExperience(monster.experienceReward);

			// Random item drop
			if (Math.random() < 0.3) {
				const item = this.items[Math.floor(Math.random() * this.items.length)];
				this.player.inventory.addItem(item);
				console.log(`🎁 Found ${item.name}!`);
			}
		} else {
			console.log('💀 Game Over! Your character has fallen...');
			this.gameState = 'menu';
		}
	}

	getRandomPlayerAction() {
		const actions = ['attack', 'attack', 'attack']; // Bias toward attack
		if (this.player.skills.length > 0 && this.player.stats.mana > 10) {
			actions.push('skill');
		}
		if (Math.random() < 0.1) {
			actions.push('run');
		}
		return actions[Math.floor(Math.random() * actions.length)];
	}

	travel(locationName) {
		if (!this.player) {
			console.log('❌ Create a character first!');
			return;
		}

		if (!this.locations[locationName]) {
			console.log(`❌ Unknown location: ${locationName}`);
			console.log(
				`Available locations: ${Object.keys(this.locations).join(', ')}`,
			);
			return;
		}

		this.currentLocation = locationName;
		const location = this.locations[locationName];
		console.log(`🗺️ Traveled to ${location.name}`);
		console.log(location.description);
	}

	rest() {
		if (!this.player) {
			console.log('❌ Create a character first!');
			return;
		}

		if (this.currentLocation !== 'town') {
			console.log('❌ You can only rest in town!');
			return;
		}

		this.player.stats.health = this.player.stats.maxHealth;
		this.player.stats.mana = this.player.stats.maxMana;
		console.log('😴 You rest at the inn and recover fully!');
	}

	shop() {
		if (!this.player) {
			console.log('❌ Create a character first!');
			return;
		}

		if (this.currentLocation !== 'town') {
			console.log('❌ The shop is only available in town!');
			return;
		}

		console.log('\n🏪 Welcome to the Shop!');
		console.log('Available items:');
		this.items.forEach((item, index) => {
			console.log(
				`${index + 1}. ${item.name} - ${item.value} gold (${item.description})`,
			);
		});
		console.log(`\n💰 Your gold: ${this.player.inventory.gold}`);
		console.log('Use game.buyItem(itemNumber) to purchase');
	}

	buyItem(itemNumber) {
		if (!this.player) {
			console.log('❌ Create a character first!');
			return;
		}

		const item = this.items[itemNumber - 1];
		if (!item) {
			console.log('❌ Invalid item number!');
			return;
		}

		if (this.player.inventory.gold < item.value) {
			console.log('❌ Not enough gold!');
			return;
		}

		this.player.inventory.gold -= item.value;
		this.player.inventory.addItem(item);
		console.log(`✅ Purchased ${item.name}!`);
	}

	useItem(itemName) {
		if (!this.player) {
			console.log('❌ Create a character first!');
			return;
		}

		if (!this.player.inventory.hasItem(itemName)) {
			console.log(`❌ You don't have ${itemName}!`);
			return;
		}

		if (itemName === 'Health Potion') {
			this.player.stats.heal(50);
			this.player.inventory.removeItem(itemName);
			console.log('💊 Used Health Potion! Restored 50 health.');
		} else if (itemName === 'Mana Potion') {
			this.player.stats.restoreMana(30);
			this.player.inventory.removeItem(itemName);
			console.log('💊 Used Mana Potion! Restored 30 mana.');
		} else {
			console.log(`❌ ${itemName} cannot be used as a consumable.`);
		}
	}

	equipItem(itemName) {
		if (!this.player) {
			console.log('❌ Create a character first!');
			return;
		}

		const inventoryItem = this.player.inventory.items.find(
			i => i.name === itemName,
		);
		if (!inventoryItem) {
			console.log(`❌ You don't have ${itemName}!`);
			return;
		}

		if (['weapon', 'armor', 'accessory'].includes(inventoryItem.type)) {
			this.player.equipment.equip(inventoryItem);
			console.log(`⚔️ Equipped ${itemName}!`);
		} else {
			console.log(`❌ ${itemName} cannot be equipped.`);
		}
	}

	help() {
		console.log('\n📖 Game Commands:');
		console.log('• game.createCharacter(name, class) - Create character');
		console.log('• game.showStatus() - View character info');
		console.log('• game.explore() - Explore current location');
		console.log('• game.travel(location) - Travel (town, forest, dungeon)');
		console.log('• game.rest() - Rest in town');
		console.log('• game.shop() - Visit shop in town');
		console.log('• game.buyItem(number) - Buy item from shop');
		console.log('• game.useItem(name) - Use consumable item');
		console.log('• game.equipItem(name) - Equip weapon/armor');
		console.log('• game.help() - Show this help');
	}
}

// Create and start the game
const game = new RPGGame();
game.start();
// game.createCharacter('Hero', 'Fighter')

console.log(
	'\n🎮 Game instance created as "game" variable. Type game.help() for commands!',
);
