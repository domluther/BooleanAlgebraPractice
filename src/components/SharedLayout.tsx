import { useState } from "react";
import { ScoreButton, SiteLayout, StatsModal } from "@/components";
import { ScoreManager } from "@/lib/scoreManager";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { ModeMenu } from "./ModeMenu";

interface SharedLayoutProps {
	children: (
		recordScoreAndUpdate: (isCorrect: boolean, questionType: string) => void,
	) => React.ReactNode;
}

export function useSharedLayout() {
	const [showStatsModal, setShowStatsModal] = useState(false);
	// Score update trigger to force re-renders when score changes
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [_scoreUpdateTrigger, setScoreUpdateTrigger] = useState(0);

	const siteConfig = SITE_CONFIG;

	// Score manager
	const [scoreManager] = useState(
		() => new ScoreManager(siteConfig.siteKey, siteConfig.scoring.customLevels),
	);

	const overallStats = scoreManager.getOverallStats();

	// Function to record score and trigger re-render
	const recordScoreAndUpdate = (isCorrect: boolean, questionType: string) => {
		scoreManager.recordScore(isCorrect, questionType);
		setScoreUpdateTrigger((prev) => prev + 1);
	};

	return {
		showStatsModal,
		setShowStatsModal,
		siteConfig,
		scoreManager,
		overallStats,
		recordScoreAndUpdate,
		setScoreUpdateTrigger,
	};
}

export function SharedLayout({ children }: SharedLayoutProps) {
	const {
		showStatsModal,
		setShowStatsModal,
		siteConfig,
		scoreManager,
		overallStats,
		recordScoreAndUpdate,
		setScoreUpdateTrigger,
	} = useSharedLayout();

	return (
		<SiteLayout
			title={siteConfig.title}
			subtitle={siteConfig.subtitle}
			titleIcon={siteConfig.icon}
			scoreButton={
				<ScoreButton
					levelEmoji={overallStats.currentLevel.emoji}
					levelTitle={overallStats.currentLevel.title}
					points={overallStats.totalPoints}
					onClick={() => setShowStatsModal(true)}
				/>
			}
		>
			{/* Mode Switch Buttons */}
			<ModeMenu />

			{/* Main Body */}
			<div className="max-w-4xl px-0 mx-auto sm:px-0">
				{children(recordScoreAndUpdate)}
			</div>
			<StatsModal
				isOpen={showStatsModal}
				onClose={() => setShowStatsModal(false)}
				scoreManager={scoreManager}
				title="Your Network Mastery"
				onStatsUpdate={() => setScoreUpdateTrigger((prev) => prev + 1)}
			/>
		</SiteLayout>
	);
}
