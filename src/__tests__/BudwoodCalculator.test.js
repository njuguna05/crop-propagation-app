import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BudwoodCalculator from '../components/BudwoodCalculator';

describe('BudwoodCalculator', () => {
  const mockOnCalculationUpdate = jest.fn();

  const defaultProps = {
    quantity: 100,
    propagationMethod: 'grafting',
    onCalculationUpdate: mockOnCalculationUpdate,
    existingCalculation: {
      requiredBudwood: 0,
      wasteFactorPercent: 15,
      extraForSafety: 0,
      totalRequired: 0
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders budwood calculator with initial values', () => {
    render(<BudwoodCalculator {...defaultProps} />);

    expect(screen.getByText('Budwood Calculator')).toBeInTheDocument();
    expect(screen.getByText('Grafting Method')).toBeInTheDocument();
    expect(screen.getByDisplayValue('15')).toBeInTheDocument(); // waste factor
  });

  test('calculates budwood requirements for grafting method', async () => {
    render(<BudwoodCalculator {...defaultProps} />);

    await waitFor(() => {
      expect(mockOnCalculationUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          requiredBudwood: 120, // 100 * 1.2 ratio
          totalRequired: 138, // 120 * 1.15 waste factor
          wasteFactorPercent: 15
        })
      );
    });
  });

  test('calculates budwood requirements for cutting method', async () => {
    render(<BudwoodCalculator {...defaultProps} propagationMethod="cutting" />);

    await waitFor(() => {
      expect(mockOnCalculationUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          requiredBudwood: 200, // 100 * 2.0 ratio for cuttings
          totalRequired: 230 // 200 * 1.15 waste factor
        })
      );
    });
  });

  test('updates waste factor when input changes', async () => {
    render(<BudwoodCalculator {...defaultProps} />);

    const wasteFactorInput = screen.getByDisplayValue('15');
    fireEvent.change(wasteFactorInput, { target: { value: '20' } });

    await waitFor(() => {
      expect(mockOnCalculationUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          wasteFactorPercent: 20,
          totalRequired: 144 // 120 * 1.20 waste factor
        })
      );
    });
  });

  test('adds safety buffer when specified', async () => {
    render(<BudwoodCalculator {...defaultProps} />);

    const safetyInput = screen.getByDisplayValue('0');
    fireEvent.change(safetyInput, { target: { value: '10' } });

    await waitFor(() => {
      expect(mockOnCalculationUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          extraForSafety: 10,
          totalRequired: 148 // 138 + 10 safety
        })
      );
    });
  });

  test('shows warning for low waste factor', () => {
    const lowWasteProps = {
      ...defaultProps,
      existingCalculation: {
        ...defaultProps.existingCalculation,
        wasteFactorPercent: 5
      }
    };

    render(<BudwoodCalculator {...lowWasteProps} />);

    expect(screen.getByText(/Very low waste factor/)).toBeInTheDocument();
    expect(screen.getByText(/high risk of shortage/)).toBeInTheDocument();
  });

  test('shows success message for preventing over-harvesting', () => {
    render(<BudwoodCalculator {...defaultProps} />);

    expect(screen.getByText(/Prevents over-harvesting/)).toBeInTheDocument();
  });

  test('displays method-specific description', () => {
    render(<BudwoodCalculator {...defaultProps} propagationMethod="tissue_culture" />);

    expect(screen.getByText(/Tissue culture requires 0.1 sample per plant/)).toBeInTheDocument();
  });

  test('handles zero quantity gracefully', () => {
    render(<BudwoodCalculator {...defaultProps} quantity={0} />);

    expect(screen.getByText(/Enter order quantity to calculate/)).toBeInTheDocument();
  });

  test('validates waste factor range recommendations', () => {
    render(<BudwoodCalculator {...defaultProps} />);

    const wasteFactorInput = screen.getByDisplayValue('15');

    // Test high waste factor
    fireEvent.change(wasteFactorInput, { target: { value: '35' } });
    expect(screen.getByText(/High waste factor - may increase costs/)).toBeInTheDocument();

    // Test recommended range
    fireEvent.change(wasteFactorInput, { target: { value: '18' } });
    expect(screen.getByText(/Recommended waste factor range/)).toBeInTheDocument();
  });
});