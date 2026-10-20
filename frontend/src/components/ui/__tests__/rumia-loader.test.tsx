import { render, screen } from '@testing-library/react';
import { RumiaLoader } from '../rumia-loader';

describe('RumiaLoader', () => {
  it('exposes an accessible status and draws all four windows', () => {
    const { container } = render(<RumiaLoader label="Loading rent" text="Hold on" />);
    expect(screen.getByRole('status', { name: 'Loading rent' })).toBeInTheDocument();
    expect(screen.getByText('Hold on')).toBeInTheDocument();
    expect(container.querySelectorAll('.rumia-loader__win')).toHaveLength(4);
  });

  it('renders the mark alone when text is null', () => {
    const { container } = render(<RumiaLoader text={null} />);
    expect(container.querySelector('p')).toBeNull();
  });
});
