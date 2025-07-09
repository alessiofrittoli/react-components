import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { Portal } from '@/client'


describe( 'Portal', () => {

	let portalRoot: HTMLDivElement

	beforeEach( () => {

		portalRoot = document.createElement( 'div' )
		portalRoot.setAttribute( 'id', 'portal-root' )
		document.body.appendChild( portalRoot )

	} )


	afterEach( () => {
		document.body.removeChild( portalRoot )
	} )


	it( 'renders children into the portal target', () => {

		render(
			<Portal selector='#portal-root'>
				<div data-testid='portal-child'>Content</div>
			</Portal>
		)
		
		const child = portalRoot.querySelector( '[data-testid="portal-child"]' )

		expect( child ).toBeInTheDocument()
		expect( child ).toHaveTextContent( 'Content' )

	} )


	it( 'renders children in place if selector does not match', () => {

		render(
			<Portal selector='#non-existent'>
				<div data-testid='fallback-child'>Fallback</div>
			</Portal>
		)

		// Should be in the document, but not in the portalRoot
		expect( screen.getByTestId( 'fallback-child' ) )
			.toBeInTheDocument()

		expect( portalRoot.querySelector( '[data-testid="fallback-child"]' ) )
			.toBeNull()

	} )


	it( 'updates portal target when selector changes', () => {

		const { rerender } = render(
			<Portal selector='#portal-root'>
				<div data-testid='dynamic-child'>Dynamic</div>
			</Portal>
		)

		expect( portalRoot.querySelector( '[data-testid="dynamic-child"]' ) )
			.toBeInTheDocument()

		const newRoot = document.createElement( 'div' )
		newRoot.setAttribute( 'id', 'new-root' )
		document.body.appendChild( newRoot )

		rerender(
			<Portal selector='#new-root'>
				<div data-testid='dynamic-child'>Dynamic</div>
			</Portal>
		)
		
		expect( newRoot.querySelector( '[data-testid="dynamic-child"]' ) )
			.toBeInTheDocument()

		expect( portalRoot.querySelector( '[data-testid="dynamic-child"]' ) )
			.toBeNull()

		document.body.removeChild( newRoot )
	} )

} )