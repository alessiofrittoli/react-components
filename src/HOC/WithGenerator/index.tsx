import { GeneratorComponent, type Generator } from './GeneratorComponent'

export * from './GeneratorComponent'

/**
 * Transform your generator function into a React.js Component.
 * 
 * ⚠️ This cannot be a client component neither rendered in a client component due to its async nature.
 * 
 * @param fn The async generator function.
 * @usage
 * 
 * ```tsx
 * interface StepProps
 * {
 * 	something: string
 * }
 * 
 * export const Steps = WithGenerator<StepProps>(
 * 	async function* ( props ) {
 * 		let i = 0
 * 		yield <h1>Step { ++i }</h1>
 * 		await new Promise( resolve => setTimeout( resolve, 2000 ) )
 * 		yield <h1>Step { ++i }</h1>
 * 		...
 * 		await new Promise( resolve => setTimeout( resolve, 2000 ) )
 * 		return <h1>Step { ++i }</h1>
 * 	}
 * )
 * ```
 */
export const WithGenerator = <
	T = unknown
>(
	fn: ( props: T ) => Generator
) => {

	const WithGeneratorComponent: React.FC<T> = (
		props => (
			<GeneratorComponent generator={ fn( props ) } />
		)
	)

	return WithGeneratorComponent
	
}