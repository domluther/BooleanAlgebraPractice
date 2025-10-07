import { createFileRoute } from "@tanstack/react-router";
import { SharedLayout } from "@/components/SharedLayout";
import { DrawCircuit } from "@/components/DrawCircuit";

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
