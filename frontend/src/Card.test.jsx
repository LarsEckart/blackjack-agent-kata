import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Card } from './App.jsx'

test('renders a red hearts card with its rank and suit symbol', () => {
  const { container } = render(<Card card={{ suit: 'HEARTS', rank: 'Q' }} index={0} />)

  const card = container.querySelector('.card')
  expect(card).toHaveClass('red')
  expect(card).toHaveTextContent('Q')
  expect(card).toHaveTextContent('♥')
  expect(screen.getByRole('img', { name: 'Hearts' })).toBeInTheDocument()
})
