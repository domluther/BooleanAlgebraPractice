import { createFileRoute } from "@tanstack/react-router";
import { MultipleChoice } from "@/components/MultipleChoice";
import { SharedLayout } from "@/components/SharedLayout";

export const Route = createFileRoute("/multiplechoice")({
	component: MultipleChoicePage,
});

function MultipleChoicePage() {
	return (
		<SharedLayout>
			{(recordScoreAndUpdate) => (
				<MultipleChoice onScoreUpdate={recordScoreAndUpdate} />
			)}
		</SharedLayout>
	);
}
