import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './button.jsx';

describe('Button component', () => {
  it('renders the provided label', () => {
    render(<Button>Click me</Button>);

    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    render(<Button variant="outline">Action</Button>);

    expect(screen.getByRole('button', { name: /action/i })).toHaveClass('border');
  });
});
