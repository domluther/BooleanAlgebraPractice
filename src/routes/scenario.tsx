import { createFileRoute } from "@tanstack/react-router";
import { Scenario, SharedLayout } from "@/components";

export const Route = createFileRoute("/scenario")({
	component: ScenarioRoute,
});

function ScenarioRoute() {
	return (
		<SharedLayout>
			{(recordScoreAndUpdate) => (
				<Scenario onScoreUpdate={recordScoreAndUpdate} />
			)}
		</SharedLayout>
	);
}
