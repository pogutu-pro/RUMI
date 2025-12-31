import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Use a simple component for testing
const SimpleComponent = () => <div>Hello RUMI</div>;

describe('Simple Test', () => {
    it('renders correctly', () => {
        render(<SimpleComponent />);
        expect(screen.getByText('Hello RUMI')).toBeInTheDocument();
    });
});
