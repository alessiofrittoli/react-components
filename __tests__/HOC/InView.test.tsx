import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { useInView as _useInView, type UseInViewReturnType } from '@alessiofrittoli/react-hooks'
import { InView } from '@/HOC/InView'


jest.mock( '@alessiofrittoli/react-hooks', () => ( {
	useInView: jest.fn(),
} ) )


type UseInViewReturn	= Partial<UseInViewReturnType>
type MockedUseInView	= jest.Mock<UseInViewReturn, Parameters<typeof _useInView>>
const useInView			= _useInView as MockedUseInView


describe( 'InView', () => {

	afterEach( () => {
		jest.clearAllMocks().resetModules()
	} )


	it( 'mounts/unmounts children when mountInView is true (default)', () => {

		useInView.mockReturnValue( { inView: true } )
		
		const { rerender } = render(
			<InView>
				<span>Visible</span>
			</InView>
		)

		expect( screen.getByText( 'Visible' ) )
			.toBeInTheDocument()

		useInView.mockReturnValue( { inView: false } )

		rerender(
			<InView>
				<span>Visible</span>
			</InView>
		)

		expect( screen.queryByText( 'Visible' ) )
			.not.toBeInTheDocument()
	
	} )


	it( 'always renders children when mountInView is false, regardless of inView', () => {

		useInView.mockReturnValue( { inView: false } )

		render(
			<InView mountInView={ false }>
				<span>Always mounted</span>
			</InView>
		)

		expect( screen.getByText( 'Always mounted' ) )
			.toBeInTheDocument()

	} )
	
	
	it( 'accepts functions as children', () => {

		render(
			<InView mountInView={ false }>
				{ () => <div>Function children</div> }
			</InView>
		)

		expect( screen.getByText( 'Function children' ) )
			.toBeInTheDocument()

	} )


	it( 'passes the result of useInView to children function', () => {

		const result: UseInViewReturn = { inView: true, isExiting: false }
		
		useInView.mockReturnValue( result )

		const children = jest.fn( () => <span>Child</span> )
		
		render(
			<InView>{ children }</InView>
		)

		expect( children ).toHaveBeenCalledWith( result )

	} )


	it( 'accepts HTMLDivElement props and pass them to the IntersectionObserver target', () => {

		const result: UseInViewReturn = { inView: true, isExiting: false }
		
		useInView.mockReturnValue( result )

		const children = jest.fn( () => <span className='size-full'>Child</span> )
		
		render(
			<InView
				className='size-28'
				data-testid='intersection-observer-target'
			>{ children }</InView>
		)

		const element = screen.queryByTestId( 'intersection-observer-target' )
		
		expect( element ).toBeInTheDocument()
		expect( element?.classList.contains( 'size-28' ) ).toBe( true )

	} )

} )