import type { LevelInfo } from "@/lib/scoreManager";

/** Configuration interface for GCSE CS practice sites */
export interface SiteConfig {
	/** Unique site identifier for score tracking */
	siteKey: string;
	/** Site title displayed in header */
	title: string;
	/** Site subtitle/description */
	subtitle: string;
	/** Site icon/emoji */
	icon: string;
	/** Scoring configuration */
	scoring: ScoringConfig;
}

export interface ScoringConfig {
	/** Custom level system (optional, falls back to duck levels) */
	customLevels?: LevelInfo[];
}

export interface Level {
	emoji: string;
	title: string;
	description: string;
	minPoints: number;
	minAccuracy: number;
}

/** Network Address Practice site configuration */
export const SITE_CONFIG: SiteConfig = {
	siteKey: "boolean-algebra",
	title: "Boolean Algebra Practice",
	subtitle: "Master Logic Gates & Truth Tables",
	icon: "🦆",
	scoring: {
		customLevels: [
			{
				minPoints: 0,
				minAccuracy: 0,
				title: "Newcomer",
				emoji: "🥚",
				description: "Just hatched!",
			},
			{
				minPoints: 10,
				minAccuracy: 0,
				title: "Duckling Logic",
				emoji: "🐣",
				description: "Taking your first waddle into logic gates!",
			},
			{
				minPoints: 75,
				minAccuracy: 40,
				title: "Quack Calculator",
				emoji: "🐤",
				description: "Your Boolean expressions are starting to compute!",
			},
			{
				minPoints: 200,
				minAccuracy: 50,
				title: "Duck Circuit Designer",
				emoji: "🦆",
				description: "Swimming confidently through truth tables!",
			},
			{
				minPoints: 500,
				minAccuracy: 60,
				title: "Mallard Gate Master",
				emoji: "🦆✨",
				description: "Soaring above with elegant Boolean solutions!",
			},
			{
				minPoints: 1000,
				minAccuracy: 70,
				title: "Golden Logic Goose",
				emoji: "🪿👑",
				description: "The legendary gate guru of the digital pond!",
			},
		],
	},
};
