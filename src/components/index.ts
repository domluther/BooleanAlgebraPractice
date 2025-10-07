/**
 * GCSE CS Reusable Component Library
 * Export all reusable components for easy importing
 */

export { DrawCircuit } from "./DrawCircuit";
export { ExpressionWriting } from "./ExpressionWriting";
export { Footer } from "./Footer";
export { Header } from "./Header";
// Game Mode Components
export { NameThat } from "./NameThat";
// OLD TEMPLATE COMPONENTS - For reference only, delete after migration
export { CapacityCalculator } from "./old_CapacityCalculator";
export { FileSizeCalculator } from "./old_FileSizeCalculator";
export { MultipleChoice } from "./old_MultipleChoice";
export { UnitConverter } from "./old_UnitConverter";
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
export { TruthTable } from "./TruthTable";

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
