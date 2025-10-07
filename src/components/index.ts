/**
 * GCSE CS Reusable Component Library
 * Export all reusable components for easy importing
 */

export { CapacityCalculator } from "./CapacityCalculator";
export { FileSizeCalculator } from "./FileSizeCalculator";
export { Footer } from "./Footer";
export { Header } from "./Header";
export type {
	QuizButtonProps,
	QuizButtonSize,
	QuizButtonVariant,
} from "./QuizButton";
export { QuizButton } from "./QuizButton";
// Utility Components
export { ScoreButton } from "./ScoreButton";
export { SharedLayout, useSharedLayout } from "./SharedLayout";
// Layout Components
export { SiteLayout } from "./SiteLayout";
export { SiteNavigation } from "./SiteNavigation";
// Modal Components
export { StatsModal } from "./StatsModal";
export { UnitConverter } from "./UnitConverter";

/**
 * Usage Example:
 *
 * import {
 *   SiteLayout,
 *   SimpleQuizBody,
 *   StatsModal,
 *   QuizButton,
 *   ScoreButton,
 *   HintPanel,
 *   Header,
 *   Footer,
 *   CapacityCalculator,
 *   FileSizeCalculator
 * } from "@/components";
 */
