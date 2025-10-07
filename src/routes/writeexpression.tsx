import { createFileRoute } from "@tanstack/react-router";
import { ExpressionWriting } from "@/components/ExpressionWriting";
import { SharedLayout } from "@/components/SharedLayout";

export const Route = createFileRoute("/writeexpression")({
	component: WriteExpressionPage,
});

function WriteExpressionPage() {
	return (
		<SharedLayout>
			{(recordScoreAndUpdate) => (
				<ExpressionWriting onScoreUpdate={recordScoreAndUpdate} />
			)}
		</SharedLayout>
	);
}
