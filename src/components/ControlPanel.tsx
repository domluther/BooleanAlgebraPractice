import { useId, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { NotationType } from "@/lib/config";

/**
 * Difficulty configuration for the control panel
 */
export interface DifficultyConfig {
	/** Current difficulty level */
	value: number;
	/** Callback when difficulty changes */
	onChange: (level: number) => void;
	/** Available difficulty options [value, label] */
	options: Array<[number, string]>;
}

/**
 * Notation toggle configuration
 */
export interface NotationConfig {
	/** Current notation type */
	value: NotationType;
	/** Callback when notation changes */
	onChange: (checked: boolean) => void;
}

/**
 * ControlPanel Props
 */
interface ControlPanelProps {
	/** Difficulty selector configuration */
	difficulty: DifficultyConfig;
	/** Notation toggle configuration (optional) */
	notation?: NotationConfig;
	/** Show the shuffle/random button (optional, defaults to true) */
	showShuffleButton?: boolean;
	/** Callback when shuffle button is clicked */
	onShuffle?: () => void;
	/** Additional toggle controls to render (optional) */
	additionalControls?: ReactNode;
}

/**
 * ControlPanel Component - Reusable control panel for game modes
 *
 * Provides consistent UI for:
 * - Difficulty selector
 * - Notation toggle (Words/Symbols)
 * - Shuffle button (🎲)
 * - Optional mode-specific controls
 *
 * @example
 * ```tsx
 * <ControlPanel
 *   difficulty={{
 *     value: currentLevel,
 *     onChange: setDifficulty,
 *     options: [[1, "Easy"], [2, "Medium"], [3, "Hard"]]
 *   }}
 *   notation={{
 *     value: notationType,
 *     onChange: handleNotationToggle
 *   }}
 *   onShuffle={generateNewQuestion}
 *   additionalControls={
 *     <div className="flex items-center gap-2">
 *       <label>
 *         <input type="checkbox" checked={helpMode} onChange={toggleHelp} />
 *         Show hints
 *       </label>
 *     </div>
 *   }
 * />
 * ```
 */
export function ControlPanel({
	difficulty,
	notation,
	showShuffleButton = true,
	onShuffle,
	additionalControls,
}: ControlPanelProps) {
	const difficultySelectId = useId();

	return (
		<div className="p-4 rounded-lg border-2 bg-stats-card-bg border-stats-card-border">
			<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
				{/* Difficulty Selector */}
				<div className="flex items-center gap-3">
					<label
						htmlFor={difficultySelectId}
						className="font-medium text-sm whitespace-nowrap text-stats-label"
					>
						Difficulty:
					</label>
					<select
						id={difficultySelectId}
						value={difficulty.value}
						onChange={(e) =>
							difficulty.onChange(Number.parseInt(e.target.value, 10))
						}
						className="px-3 py-1.5 rounded-md border-2 bg-background border-checkbox-label-border hover:border-checkbox-label-border-hover text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:border-checkbox-label-border-hover"
					>
						{difficulty.options.map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				</div>

				{/* Additional Mode-Specific Controls */}
				{additionalControls}

				{/* Notation Toggle */}
				{notation && (
					<div className="flex items-center gap-3">
						<span className="text-sm font-medium text-stats-label">Words</span>
						<Switch
							checked={notation.value === "symbol"}
							onCheckedChange={notation.onChange}
							aria-label="Toggle between word and symbol notation"
							className="data-[state=checked]:bg-stats-points data-[state=unchecked]:bg-checkbox-label-border"
						/>
						<span className="text-sm font-medium text-stats-label">
							Symbols
						</span>
					</div>
				)}

				{/* Shuffle Button */}
				{showShuffleButton && onShuffle && (
					<Button
						variant="outline"
						size="sm"
						onClick={onShuffle}
						title="Generate a new question"
						className="text-xl px-3 border-2 border-checkbox-label-border hover:bg-checkbox-label-bg-hover hover:border-checkbox-label-border-hover"
					>
						🎲
					</Button>
				)}
			</div>
		</div>
	);
}
