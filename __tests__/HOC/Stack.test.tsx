import '@testing-library/jest-dom'
import { Component } from 'react'
import { render } from '@testing-library/react'
import { Stack, type StackComponent } from '@/HOC/Stack'


describe( 'Stack', () => {

	it( 'renders its children', () => {

		const { getByText } = render(
			<Stack>
				<div>Child</div>
			</Stack>
		)

		expect( getByText( 'Child' ) ).toBeInTheDocument()

	} )


	it( 'renders children wrapped with a single component', () => {

		const Wrapper: React.FC<React.PropsWithChildren> = ( { children } ) => (
			<div data-testid='wrapper'>{ children }</div>
		)

		const { getByTestId, getByText } = render(
			<Stack components={ [ Wrapper ] }>
				<div>Child</div>
			</Stack>
		)

		expect( getByTestId( 'wrapper' ) ).toBeInTheDocument()
		expect( getByText( 'Child' ) ).toBeInTheDocument()

	} )


	it( 'renders children wrapped with multiple components', () => {

		const Wrapper1: React.FC<React.PropsWithChildren> = ( { children } ) => (
			<div data-testid='wrapper1'>{ children }</div>
		)
		const Wrapper2: React.FC<React.PropsWithChildren> = ( { children } ) => (
			<div data-testid='wrapper2'>{ children }</div>
		)

		const { getByTestId, getByText } = render(
			<Stack components={ [ Wrapper1, Wrapper2 ] }>
				<div>Child</div>
			</Stack>
		)

		expect( getByTestId( 'wrapper1' ) ).toBeInTheDocument()
		expect( getByTestId( 'wrapper2' ) ).toBeInTheDocument()
		expect( getByText( 'Child' ) ).toBeInTheDocument()

	} )


	it( 'renders children wrapped with components and props', () => {

		type WrapperProps = React.PropsWithChildren<{
			/** The element CSS class name. */
			className?: string
		}>

		const Wrapper: React.FC<WrapperProps> = ( {
			className, children,
		} ) => <div className={ className }>{ children }</div>

		const { container, getByText } = render(
			<Stack components={ [
				[ Wrapper, { className: 'test-class' } ] as StackComponent<typeof Wrapper>
			] }>
				<div>Child</div>
			</Stack>
		)

		expect( container.querySelector( '.test-class' ) ).toBeInTheDocument()
		expect( getByText( 'Child' ) ).toBeInTheDocument()

	} )


	it( 'supports Class Components', () => {

		// eslint-disable-next-line react-server-components/use-client
		class ClassComponent extends Component<React.PropsWithChildren>
		{
			render()
			{
				return <div data-testid='wrapper'>{ this.props.children }</div>
			}
		}

		const { getByTestId, getByText } = render(
			<Stack components={ [ ClassComponent ] }>
				<div>Child</div>
			</Stack>
		)

		expect( getByTestId( 'wrapper' ) ).toBeInTheDocument()
		expect( getByText( 'Child' ) ).toBeInTheDocument()

	} )

} )