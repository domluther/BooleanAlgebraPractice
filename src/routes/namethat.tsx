import { createFileRoute } from '@tanstack/react-router'
import { NameThat } from '@/components/NameThat'
import { SharedLayout } from '@/components/SharedLayout'

/**
 * NameThat Route - Logic Gate Identification Game
 * 
 * Path: /namethat
 * Description: Interactive game for identifying logic gates and circuits
 */

export const Route = createFileRoute('/namethat')({
	component: NameThatRoute,
})

function NameThatRoute() {
	return (
		<SharedLayout>
			{(recordScoreAndUpdate) => (
				<NameThat level={1} onScoreUpdate={recordScoreAndUpdate} />
			)}
		</SharedLayout>
	)
}
