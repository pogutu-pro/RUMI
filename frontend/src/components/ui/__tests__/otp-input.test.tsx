import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OTPInput } from '../otp-input';

function Harness({ onComplete }: { onComplete: (code: string) => void }) {
  const [value, setValue] = React.useState('');
  return <OTPInput length={6} value={value} onChange={setValue} onComplete={onComplete} />;
}

describe('OTPInput onComplete', () => {
  it('fires once the sixth digit is typed', async () => {
    const onComplete = jest.fn();
    render(<Harness onComplete={onComplete} />);
    const boxes = screen.getAllByRole('textbox');
    await userEvent.click(boxes[0]);
    await userEvent.keyboard('12345');
    expect(onComplete).not.toHaveBeenCalled();
    await userEvent.keyboard('6');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('fires when a full code is pasted', async () => {
    const onComplete = jest.fn();
    render(<Harness onComplete={onComplete} />);
    await userEvent.click(screen.getAllByRole('textbox')[0]);
    await userEvent.paste('654321');
    expect(onComplete).toHaveBeenCalledWith('654321');
  });
});
