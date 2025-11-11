import { createFileRoute } from "@tanstack/react-router";
import { DrawCircuit } from "@/components/DrawCircuit";
import { SharedLayout } from "@/components/SharedLayout";

export const Route = createFileRoute("/drawcircuit")({
	component: DrawCircuitPage,
});

function DrawCircuitPage() {
	return (
		<SharedLayout>
			{(recordScoreAndUpdate) => (
				<DrawCircuit onScoreUpdate={recordScoreAndUpdate} />
			)}
		</SharedLayout>
	);
}
