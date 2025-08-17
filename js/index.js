class FantasyCharacter {
	constructor(name = 'Unnamed Character', options = {}) {
		this.name = name;

		// Core attributes (default values can be overridden)
		this.coreAttributes = {
			strength: options.strength || 10,
			agility: options.agility || 10,
			stamina: options.stamina || 10,
			intellect: options.intellect || 10,
			wisdom: options.wisdom || 10,
			charm: options.charm || 10,
		};

		// Derived stats (calculated from core attributes)
		this.derivedStats = {
			attackRating: this.calculateAttackRating(),
			defenseRating: this.calculateDefenseRating(),
			hitPoints: this.calculateHitPoints(),
			maxHitPoints: this.calculateHitPoints(),
		};

		// Skills (based on core attributes)
		this.skills = {
			alchemy: { level: 1, baseAttribute: 'intellect' },
			animalHandling: { level: 1, baseAttribute: 'wisdom' },
			athletics: { level: 1, baseAttribute: 'strength' },
			meleeCombat: { level: 1, baseAttribute: 'strength' },
			stealth: { level: 1, baseAttribute: 'agility' },
			survival: { level: 1, baseAttribute: 'wisdom' },
			spellcasting: { level: 1, baseAttribute: 'intellect' },
			diplomacy: { level: 1, baseAttribute: 'charm' },
			intimidation: { level: 1, baseAttribute: 'charm' },
			perception: { level: 1, baseAttribute: 'wisdom' },
		};

		// Magic/Special abilities
		this.magicAbilities = options.magicAbilities || [];

		// Character traits
		this.traits = {
			positive: options.positiveTraits || [],
			flaws: options.flaws || [],
		};

		this.level = options.level || 1;
		this.experience = options.experience || 0;
	}

	// Calculate derived stats based on core attributes
	calculateAttackRating() {
		return (
			Math.floor(
				(this.coreAttributes.strength + this.coreAttributes.agility) / 2,
			) + 5
		);
	}

	calculateDefenseRating() {
		return (
			Math.floor(
				(this.coreAttributes.agility + this.coreAttributes.stamina) / 2,
			) + 5
		);
	}

	calculateHitPoints() {
		return this.coreAttributes.stamina * 5 + this.level * 3;
	}

	// Skill-related methods
	getSkillBonus(skillName) {
		const skill = this.skills[skillName];
		if (!skill) return 0;

		const baseAttributeValue = this.coreAttributes[skill.baseAttribute];
		const attributeBonus = Math.floor((baseAttributeValue - 10) / 2);
		return skill.level + attributeBonus;
	}

	improveSkill(skillName, points = 1) {
		if (this.skills[skillName]) {
			this.skills[skillName].level += points;
			this.updateDerivedStats();
		}
	}

	// Attribute modification
	increaseAttribute(attributeName, points = 1) {
		if (this.coreAttributes.hasOwnProperty(attributeName)) {
			this.coreAttributes[attributeName] += points;
			this.updateDerivedStats();
		}
	}

	updateDerivedStats() {
		this.derivedStats.attackRating = this.calculateAttackRating();
		this.derivedStats.defenseRating = this.calculateDefenseRating();
		this.derivedStats.maxHitPoints = this.calculateHitPoints();

		// Heal character if max HP increased
		if (this.derivedStats.hitPoints > this.derivedStats.maxHitPoints) {
			this.derivedStats.hitPoints = this.derivedStats.maxHitPoints;
		}
	}

	// Trait management
	addPositiveTrait(trait) {
		if (!this.traits.positive.includes(trait)) {
			this.traits.positive.push(trait);
		}
	}

	addFlaw(flaw) {
		if (!this.traits.flaws.includes(flaw)) {
			this.traits.flaws.push(flaw);
		}
	}

	// Magic ability management
	addMagicAbility(ability) {
		this.magicAbilities.push(ability);
	}

	// Combat methods
	takeDamage(damage) {
		this.derivedStats.hitPoints = Math.max(
			0,
			this.derivedStats.hitPoints - damage,
		);
		return this.derivedStats.hitPoints <= 0;
	}

	heal(amount) {
		this.derivedStats.hitPoints = Math.min(
			this.derivedStats.maxHitPoints,
			this.derivedStats.hitPoints + amount,
		);
	}

	isAlive() {
		return this.derivedStats.hitPoints > 0;
	}

	// Level progression
	gainExperience(exp) {
		this.experience += exp;
		const newLevel = Math.floor(this.experience / 100) + 1;

		if (newLevel > this.level) {
			this.levelUp(newLevel - this.level);
		}
	}

	levelUp(levels = 1) {
		this.level += levels;
		this.updateDerivedStats();
	}

	// Get character summary
	getCharacterSheet() {
		return {
			name: this.name,
			level: this.level,
			experience: this.experience,
			coreAttributes: { ...this.coreAttributes },
			derivedStats: { ...this.derivedStats },
			skills: { ...this.skills },
			magicAbilities: [...this.magicAbilities],
			traits: {
				positive: [...this.traits.positive],
				flaws: [...this.traits.flaws],
			},
		};
	}

	// Display character information
	displayCharacter() {
		console.log(`=== ${this.name} (Level ${this.level}) ===`);
		console.log(`Experience: ${this.experience}`);
		console.log(
			`HP: ${this.derivedStats.hitPoints}/${this.derivedStats.maxHitPoints}`,
		);
		console.log('\nCore Attributes:');
		Object.entries(this.coreAttributes).forEach(([attr, value]) => {
			console.log(
				`  ${attr.charAt(0).toUpperCase() + attr.slice(1)}: ${value}`,
			);
		});
		console.log('\nDerived Stats:');
		console.log(`  Attack Rating: ${this.derivedStats.attackRating}`);
		console.log(`  Defense Rating: ${this.derivedStats.defenseRating}`);
		console.log('\nSkills:');
		Object.entries(this.skills).forEach(([skill, data]) => {
			const bonus = this.getSkillBonus(skill);
			console.log(`  ${skill}: Level ${data.level} (Total Bonus: +${bonus})`);
		});
		if (this.traits.positive.length > 0) {
			console.log(`\nPositive Traits: ${this.traits.positive.join(', ')}`);
		}
		if (this.traits.flaws.length > 0) {
			console.log(`\nFlaws: ${this.traits.flaws.join(', ')}`);
		}
		if (this.magicAbilities.length > 0) {
			console.log(`\nMagic Abilities: ${this.magicAbilities.join(', ')}`);
		}
	}
}

// Example usage and predefined trait lists
FantasyCharacter.POSITIVE_TRAITS = [
	'Brave',
	'Loyal',
	'Clever',
	'Resourceful',
	'Compassionate',
	'Honest',
	'Determined',
	'Patient',
	'Generous',
	'Humble',
];

FantasyCharacter.FLAWS = [
	'Arrogant',
	'Impulsive',
	'Greedy',
	'Clumsy',
	'Naive',
	'Stubborn',
	'Cowardly',
	'Lazy',
	'Jealous',
	'Hot-tempered',
];

module.exports = FantasyCharacter;

/**!SECTION
 *   The PvP system has been fully integrated into the RPG game with modern web technologies:

  🎮 PvP Features Implemented:

  ⚔️ Turn-Based Combat System

  - Real-time Battles: Socket.IO powered multiplayer battles
  - Turn Timer: 30-second turn limit with visual countdown
  - Action Types: Attack, Skills, Items, and Surrender options
  - Battle State Management: Comprehensive turn and battle tracking

  👥 Player Management

  - Online Player List: Find and challenge other players
  - Matchmaking: Random challenge system for quick battles
  - Challenge System: Send/accept/decline battle invitations
  - Character Integration: Uses existing RPG character stats and skills

  🔄 Real-time Synchronization

  - Live Updates: Health, mana, and turn changes sync instantly
  - Battle Log: Real-time combat action broadcasting
  - Timer Sync: Synchronized turn timers across clients
  - State Consistency: Server-authoritative battle state

  🏆 Battle Results & Rewards

  - Victory Conditions: Health depletion or surrender
  - Experience & Gold: Winners gain XP and gold rewards
  - Battle Statistics: Turn count, duration, and end reason
  - Results Display: Comprehensive post-battle summary

  🛠️ Technical Implementation:

  Modern HTML5

  - Semantic Structure: Proper dialog and form elements
  - Progress Elements: Health/mana/timer bars with accessibility
  - Modal Overlays: Full-screen battle interface with responsive design

  Modern CSS Layout

  - CSS Grid: Responsive battle layout with mobile support
  - Flexbox: Action buttons and player information panels
  - CSS Custom Properties: Consistent theming and animations
  - Media Queries: Mobile-first responsive design

  Modern JavaScript

  - ES6+ Classes: PvPBattle, PvPManager with clean architecture
  - Async/Await: Promise-based action handling
  - Event Delegation: Efficient DOM event management
  - Module System: Proper imports/exports and encapsulation

  Socket.IO Integration

  - Real-time Events: Battle sync, challenges, player lists
  - Error Handling: Connection loss and invalid state management
  - Server Authority: Battle validation and state consistency

  🎯 How to Use:

  1. Create Characters: Both players must create RPG characters
  2. Find Players: Click "👥 Find Players" to see online players
  3. Send Challenge: Challenge specific players or use random match
  4. Accept/Decline: Respond to incoming battle challenges
  5. Battle: Take turns using Attack, Skills, or Items
  6. Win Rewards: Victors gain experience points and gold
 */