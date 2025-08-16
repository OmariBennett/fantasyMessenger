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
