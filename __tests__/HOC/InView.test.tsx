import { useInView as _useInView, type UseInViewReturnType } from '@alessiofrittoli/react-hooks'
import { describe, expect, it, vi, type Mock } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InView } from '@/HOC/InView'

vi.mock('@alessiofrittoli/react-hooks', () => ({
	useInView: vi.fn(),
}))

const useInView = _useInView as Mock<typeof _useInView>

describe('InView', () => {
	it('mounts/unmounts children when mountInView is true (default)', () => {
		useInView.mockReturnValue({ inView: true } as UseInViewReturnType)

		const { rerender } = render(
			<InView>
				<span>Visible</span>
			</InView>,
		)

		expect(screen.getByText('Visible')).toBeInTheDocument()

		useInView.mockReturnValue({ inView: false } as UseInViewReturnType)

		rerender(
			<InView>
				<span>Visible</span>
			</InView>,
		)

		expect(screen.queryByText('Visible')).not.toBeInTheDocument()
	})

	it('always renders children when mountInView is false, regardless of inView', () => {
		useInView.mockReturnValue({ inView: false } as UseInViewReturnType)

		render(
			<InView mountInView={false}>
				<span>Always mounted</span>
			</InView>,
		)

		expect(screen.getByText('Always mounted')).toBeInTheDocument()
	})

	it('accepts functions as children', () => {
		render(<InView mountInView={false}>{() => <div>Function children</div>}</InView>)

		expect(screen.getByText('Function children')).toBeInTheDocument()
	})

	it('passes the result of useInView to children function', () => {
		const result: UseInViewReturnType = { inView: true, isExiting: false } as UseInViewReturnType

		useInView.mockReturnValue(result)

		const children = vi.fn(() => <span>Child</span>)

		render(<InView>{children}</InView>)

		expect(children).toHaveBeenCalledWith(result)
	})

	it('accepts HTMLDivElement props and pass them to the IntersectionObserver target', () => {
		const result: UseInViewReturnType = { inView: true, isExiting: false } as UseInViewReturnType

		useInView.mockReturnValue(result)

		const children = vi.fn(() => <span className='size-full'>Child</span>)

		render(
			<InView className='size-28' data-testid='intersection-observer-target'>
				{children}
			</InView>,
		)

		const element = screen.queryByTestId('intersection-observer-target')

		expect(element).toBeInTheDocument()
		expect(element?.classList.contains('size-28')).toBe(true)
	})
})
