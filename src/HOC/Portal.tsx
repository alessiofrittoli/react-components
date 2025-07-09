import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type PortalProps = React.PropsWithChildren<{
	/** A valid CSS selector string. */
	selector: string
}>


/**
 * Mount a Component in a target DOM node out of standard React layout flow.
 *
 * @example
 *
 * ```tsx
 * <Portal selector='#off-canvas'>
 * 	<MyServerOrClientComponent />
 * </Portal>
 * ```
 */
export const Portal: React.FC<PortalProps> = ( { selector, children } ) => {

	const [ target, setTarget ] = useState<Element>()

	useEffect( () => {
		// update state with target to make sure the component is mounted and we have a portal target.
		setTarget( document.querySelector( selector ) || undefined )
	}, [ selector ] )

	if ( ! target ) return children

	return createPortal( children, target )

}