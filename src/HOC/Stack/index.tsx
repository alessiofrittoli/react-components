export type StackComponent<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends React.ElementType<React.PropsWithChildren<any>> = React.ElementType<React.PropsWithChildren<any>>,
	U extends Omit<React.ComponentProps<T>, 'children'> = Omit<React.ComponentProps<T>, 'children'>
> = T | ( [ T, U ] )


export type StackProps = React.PropsWithChildren<{
	/** An Array of Components or Component and props. The Component must accept and return children. */
	components?: StackComponent[]
}>


/**
 * Easily stack components avoiding creating a big Component stack pyramid.
 * 
 * @example
 * 
 * #### Basic Component
 * 
 * ```tsx
 * const SomeComponent: React.FC<React.PropsWithChildren> = ( { children } ) => (
 * 	<div>{ children }</div>
 * )
 * 
 * <Stack components={ [ SomeComponent ] }>
 * 	any children
 * </Stack>
 * ```
 * 
 * ---
 * 
 * @example
 * 
 * #### Component with props
 * 
 * ```tsx
 * type SomeComponentProps = React.PropsWithChildren<{
 * 	className?: string
 * }>
 * 
 * const SomeComponent: React.FC<SomeComponentProps> = ( {
 * 	className, children,
 * } ) => <div className={ className }>{ children }</div>
 * 
 * <Stack components={ [
 * 	[ SomeComponent, { className: 'test-class' } ] as StackComponent<typeof SomeComponent>
 * ] }>
 * 	any children
 * </Stack>
 * ```
 */
export const Stack: React.FC<StackProps> = (
	{ components = [], children }
) => (
	components.reduceRight( ( acc, Component ) => {
		if ( Array.isArray( Component ) ) {
			const [ Comp, props ] = Component
			return <Comp { ...props }>{ acc }</Comp>
		}
		return <Component>{ acc }</Component>
	}, children )
)