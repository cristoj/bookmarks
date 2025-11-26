import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input Component', () => {
  describe('Rendering', () => {
    it('renders input field', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText(/enter text/i)).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<Input label="Email" />);
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('shows required asterisk when required', () => {
      render(<Input label="Email" required />);
      const label = screen.getByText(/email/i).parentElement;
      expect(label).toHaveTextContent('*');
    });

    it('renders with helper text', () => {
      render(<Input helperText="This is a helper text" />);
      expect(screen.getByText(/this is a helper text/i)).toBeInTheDocument();
    });

    it('renders with error message', () => {
      render(<Input error="This field is required" />);
      expect(screen.getByText(/this field is required/i)).toBeInTheDocument();
    });

    it('shows error instead of helper text when both provided', () => {
      render(
        <Input
          helperText="Helper text"
          error="Error message"
        />
      );
      expect(screen.getByText(/error message/i)).toBeInTheDocument();
      expect(screen.queryByText(/helper text/i)).not.toBeInTheDocument();
    });
  });

  describe('States', () => {
    it('applies error styles when error prop is provided', () => {
      render(<Input error="Error" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-red-500');
    });

    it('applies normal styles when no error', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-gray-300');
    });

    it('is disabled when disabled prop is true', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('is required when required prop is true', () => {
      render(<Input required />);
      expect(screen.getByRole('textbox')).toBeRequired();
    });
  });

  describe('Interactions', () => {
    it('calls onChange handler when value changes', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'test');
      expect(handleChange).toHaveBeenCalled();
    });

    it('updates value when controlled', async () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        );
      };

      const user = userEvent.setup();
      render(<TestComponent />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      await user.type(input, 'hello');

      expect(input.value).toBe('hello');
    });
  });

  describe('Input Types', () => {
    it('renders email input type', () => {
      render(<Input type="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    });

    it('renders password input type', () => {
      render(<Input type="password" />);
      const input = screen.getByPlaceholderText('') as HTMLInputElement;
      expect(input.type).toBe('password');
    });

    it('renders text input type by default', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
    });
  });

  describe('Custom Props', () => {
    it('accepts custom className', () => {
      render(<Input className="custom-class" />);
      expect(screen.getByRole('textbox')).toHaveClass('custom-class');
    });

    it('accepts custom containerClassName', () => {
      render(<Input containerClassName="container-class" label="Test" />);
      const container = screen.getByLabelText(/test/i).closest('div');
      expect(container).toHaveClass('container-class');
    });

    it('forwards all input HTML attributes', () => {
      render(
        <Input
          data-testid="custom-input"
          aria-label="Custom input"
          autoComplete="email"
        />
      );
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('data-testid', 'custom-input');
      expect(input).toHaveAttribute('aria-label', 'Custom input');
      expect(input).toHaveAttribute('autocomplete', 'email');
    });
  });

  describe('Error Display', () => {
    it('shows error icon when error is present', () => {
      render(<Input error="Error message" />);
      const errorContainer = screen.getByText(/error message/i).parentElement;
      expect(errorContainer?.querySelector('svg')).toBeInTheDocument();
    });

    it('applies correct error text color', () => {
      render(<Input error="Error message" />);
      const errorText = screen.getByText(/error message/i);
      expect(errorText).toHaveClass('text-red-500');
    });
  });
});

// Helper: Add React import for the controlled input test
import React from 'react';
