import { createFileRoute } from "@tanstack/react-router";
import { CapacityCalculator } from "@/components/CapacityCalculator";
import { SharedLayout } from "@/components/SharedLayout";

export const Route = createFileRoute("/capacitycalculator")({
	component: CapacityCalculatorPage,
});

function CapacityCalculatorPage() {
	return (
		<SharedLayout>
			{(recordScoreAndUpdate) => (
				<CapacityCalculator onScoreUpdate={recordScoreAndUpdate} />
			)}
		</SharedLayout>
	);
}
