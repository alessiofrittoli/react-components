'use client'

import { useRef } from 'react'
import { useInView, type UseInViewOptions, type UseInViewReturnType } from '@alessiofrittoli/react-hooks'
import { childrenFn, type FunctionChildren } from '@alessiofrittoli/react-api'


export interface InViewProps extends UseInViewOptions
{
	/**
	 * Indicates whether to mount/unmount children when in view.
	 * 
	 * @default true
	 */
	mountInView?: boolean
	/**
	 * A React.ReactNode or a callable function that returns a React.ReactNode.
	 * 
	 */
	children?: FunctionChildren<[ result: UseInViewReturnType ]>
}


/**
 * A React higher-order component that renders its children based on their visibility within the viewport.
 *
 * @param props Additional props passed to the underlying `useInView` hook. See {@link InViewProps} for more info.
 *
 * @returns A `<div />` that conditionally renders its children based on the in-view state.
 *
 * @example
 * 
 * ```tsx
 * <InView>
 *   <MyComponent />
 * </InView>
 * ```
 */
export const InView: React.FC<InViewProps> = ( {
	mountInView = true, children, ...props
} ) => {

	const ref			= useRef<HTMLDivElement>( null )
	const result		= useInView( ref, props )
	const { inView }	= result

	return (
		<div ref={ ref }>
			{ mountInView ? (
				inView ? childrenFn( children, result ) : null
			) : (
				childrenFn( children, result )
			) }
		</div>
	)

}