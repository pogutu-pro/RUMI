import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SimplePager } from '../simple-pager';

describe('SimplePager', () => {
  it('renders nothing for an empty list', () => {
    const { container } = render(<SimplePager page={1} pageSize={10} total={0} onPageChange={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('is still shown, with both buttons disabled, when everything fits on one page', () => {
    render(<SimplePager page={1} pageSize={10} total={4} onPageChange={jest.fn()} />);
    expect(screen.getByText('1–4 of 4')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Previous page')).toBeDisabled();
    expect(screen.getByLabelText('Next page')).toBeDisabled();
  });

  it('shows the range and pages forward and back', async () => {
    const onPageChange = jest.fn();
    render(<SimplePager page={2} pageSize={10} total={47} onPageChange={onPageChange} />);
    expect(screen.getByText('11–20 of 47')).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 5')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('Next page'));
    expect(onPageChange).toHaveBeenCalledWith(3);
    await userEvent.click(screen.getByLabelText('Previous page'));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('disables Previous on the first page and Next on the last', () => {
    const { rerender } = render(<SimplePager page={1} pageSize={10} total={25} onPageChange={jest.fn()} />);
    expect(screen.getByLabelText('Previous page')).toBeDisabled();
    rerender(<SimplePager page={3} pageSize={10} total={25} onPageChange={jest.fn()} />);
    expect(screen.getByLabelText('Next page')).toBeDisabled();
    expect(screen.getByText('21–25 of 25')).toBeInTheDocument();
  });
});
