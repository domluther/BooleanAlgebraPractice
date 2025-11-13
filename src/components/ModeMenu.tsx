import { Link, useLocation } from "@tanstack/react-router";
import { QuizButton } from "./QuizButton";

type QuizMode = {
	label: string;
	path: string;
	emoji: string;
	shortLabel?: string; // Optional short version for tablet view
};

// Mode button data
const QUIZ_MODES: QuizMode[] = [
	{ label: "Name That", path: "/namethat", emoji: "🎯", shortLabel: "Name" },
	{
		label: "Expression Writing",
		path: "/writeexpression",
		emoji: "✍️",
		shortLabel: "Write",
	},
	{
		label: "Truth Tables",
		path: "/truthtable",
		emoji: "0️⃣1️⃣",
		shortLabel: "Tables",
	},
	{
		label: "Draw Circuit",
		path: "/drawCircuit",
		emoji: "🔌",
		shortLabel: "Draw",
	},
	{
		label: "Scenarios",
		path: "/scenario",
		emoji: "📝",
		shortLabel: "Story",
	},
];

export const ModeMenu = () => {
	const location = useLocation();

	return (
		<div className="w-full px-2 mt-2 mb-4 overflow-x-auto sm:px-4">
			<div className="flex flex-row justify-center gap-1.5 min-w-max sm:gap-2 md:gap-4">
				{QUIZ_MODES.map((mode) => (
					<Link
						key={mode.path}
						to={mode.path}
						className="shrink-0"
						title={mode.label}
					>
						<QuizButton
							variant="menu"
							className={`
								px-2 py-2.5 text-base
								sm:px-3 sm:py-3 sm:text-lg
								md:px-6 md:py-4
								whitespace-nowrap
								${
									location.pathname === mode.path
										? "text-action-button-text bg-action-button-bg hover:bg-action-button-bg-hover hover:shadow-lg ring-2 ring-action-button-bg ring-offset-2"
										: ""
								}
							`}
						>
							{/* Mobile: emoji only */}
							<span className="inline md:hidden text-xl">{mode.emoji}</span>
							{/* Tablet: emoji + short label */}
							<span className="hidden md:inline lg:hidden">
								{mode.emoji} {mode.shortLabel}
							</span>
							{/* Desktop: emoji + full label */}
							<span className="hidden lg:inline">
								{mode.emoji} {mode.label}
							</span>
						</QuizButton>
					</Link>
				))}
			</div>
		</div>
	);
};
