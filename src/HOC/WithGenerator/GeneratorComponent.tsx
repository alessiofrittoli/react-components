import { Suspense } from 'react'

export type Generator = AsyncGenerator<React.ReactNode, React.ReactNode, React.ReactNode>
export interface GeneratorComponentProps
{
	generator: Generator
}


export const GeneratorComponent: React.FC<GeneratorComponentProps> = (
	async ( { generator } ) => {

		const result = await generator.next()

		if ( result.done ) return result.value

		return (
			<Suspense fallback={ result.value }>
				<GeneratorComponent generator={ generator } />
			</Suspense>
		)
		
	}
)