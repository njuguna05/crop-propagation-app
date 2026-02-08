import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import StageValidation from '../components/StageValidation';

describe('StageValidation', () => {
  const mockPropagationStages = {
    budwood_collection: {
      name: 'Budwood Collection',
      duration: 2,
      requirements: ['Quality budwood', 'Sterile tools']
    },
    grafting_operation: {
      name: 'Grafting Operation',
      duration: 3,
      requirements: ['Skilled grafter', 'Controlled environment']
    },
    post_graft_care: {
      name: 'Post-Graft Care',
      duration: 14,
      requirements: ['High humidity', 'Temperature control']
    }
  };

  const mockOrderWithBlockers = {
    id: 'PO-001',
    status: 'grafting_operation',
    currentStageQuantity: 0, // This will trigger a blocker
    workerAssignments: {
      grafter: null // Missing worker assignment
    },
    stageValidation: {
      currentStageComplete: false,
      readyForNextStage: false,
      blockers: [
        {
          type: 'quantity',
          message: 'No plants available in current stage',
          severity: 'critical',
          action: 'Check previous stage for losses'
        },
        {
          type: 'worker',
          message: 'No grafter assigned',
          severity: 'warning',
          action: 'Assign qualified grafter'
        }
      ]
    }
  };

  const mockOrderReady = {
    id: 'PO-002',
    status: 'grafting_operation',
    currentStageQuantity: 100,
    workerAssignments: {
      grafter: 'Alice Johnson'
    },
    stageValidation: {
      currentStageComplete: true,
      readyForNextStage: true,
      blockers: []
    }
  };

  const mockOnResolveBlocker = jest.fn();

  const defaultProps = {
    order: mockOrderWithBlockers,
    propagationStages: mockPropagationStages,
    onResolveBlocker: mockOnResolveBlocker,
    showValidation: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders stage validation component', () => {
    render(<StageValidation {...defaultProps} />);

    expect(screen.getByText('Stage Validation: Grafting Operation')).toBeInTheDocument();
    expect(screen.getByText('Blocked')).toBeInTheDocument();
  });

  test('displays blockers when present', () => {
    render(<StageValidation {...defaultProps} />);

    expect(screen.getByText('Issues to Resolve')).toBeInTheDocument();
    expect(screen.getAllByText('No plants available in current stage')[0]).toBeInTheDocument();
    expect(screen.getAllByText('No grafter assigned')[0]).toBeInTheDocument();
  });

  test('shows different severity indicators', () => {
    render(<StageValidation {...defaultProps} />);

    // Should show critical and warning indicators
    const criticalBlockers = screen.getAllByText(/critical|warning/i);
    expect(criticalBlockers.length).toBeGreaterThan(0);
  });

  test('displays ready status when no blockers', () => {
    const readyProps = {
      ...defaultProps,
      order: mockOrderReady
    };

    render(<StageValidation {...readyProps} />);

    expect(screen.getByText('Ready to Proceed')).toBeInTheDocument();
    expect(screen.getByText('✓ All requirements met')).toBeInTheDocument();
  });

  test('shows stage requirements', () => {
    render(<StageValidation {...defaultProps} />);

    expect(screen.getByText('Stage Requirements')).toBeInTheDocument();
    // Should show dynamically generated requirements for grafting operation
    expect(screen.getByText('Sterilized grafting tools')).toBeInTheDocument();
    expect(screen.getByText('Adequate budwood supply')).toBeInTheDocument();
  });

  test('displays stage progress bar', () => {
    render(<StageValidation {...defaultProps} />);

    expect(screen.getByText('Stage Progress')).toBeInTheDocument();
    expect(screen.getByText('Issues Need Resolution')).toBeInTheDocument();
  });

  test('shows next stage information', () => {
    // Add nextStage to the mock
    const propsWithNextStage = {
      ...defaultProps,
      propagationStages: {
        ...mockPropagationStages,
        grafting_operation: {
          ...mockPropagationStages.grafting_operation,
          nextStage: 'post_graft_care'
        }
      }
    };

    render(<StageValidation {...propsWithNextStage} />);

    expect(screen.getByText('Next Stage: Post-Graft Care')).toBeInTheDocument();
    expect(screen.getByText('Duration: 14 days')).toBeInTheDocument();
  });

  test('calls resolve blocker when button clicked', () => {
    render(<StageValidation {...defaultProps} />);

    const resolveButtons = screen.getAllByText('Resolve');
    fireEvent.click(resolveButtons[0]);

    expect(mockOnResolveBlocker).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'quantity',
        message: 'No plants available in current stage'
      })
    );
  });

  test('handles environmental requirements', () => {
    const orderWithEnvReqs = {
      ...mockOrderWithBlockers,
      status: 'post_graft_care'
    };

    const propsWithEnvReqs = {
      ...defaultProps,
      order: orderWithEnvReqs
    };

    render(<StageValidation {...propsWithEnvReqs} />);

    expect(screen.getByText('High humidity (85-95%)')).toBeInTheDocument();
    expect(screen.getByText('Temperature control (20-25°C)')).toBeInTheDocument();
  });

  test('shows equipment requirements for grafting', () => {
    render(<StageValidation {...defaultProps} />);

    expect(screen.getByText('Sterilized grafting tools')).toBeInTheDocument();
    expect(screen.getByText('Adequate budwood supply')).toBeInTheDocument();
  });

  test('displays validation summary', () => {
    render(<StageValidation {...defaultProps} />);

    expect(screen.getByText('Validation Status:')).toBeInTheDocument();
    expect(screen.getByText(/critical issues/)).toBeInTheDocument();
  });

  test('hides component when showValidation is false', () => {
    const hiddenProps = {
      ...defaultProps,
      showValidation: false
    };

    const { container } = render(<StageValidation {...hiddenProps} />);
    expect(container.firstChild).toBeNull();
  });

  test('handles missing order gracefully', () => {
    const noOrderProps = {
      ...defaultProps,
      order: null
    };

    const { container } = render(<StageValidation {...noOrderProps} />);
    expect(container.firstChild).toBeNull();
  });

  test('shows timing-based blockers', () => {
    const overdueOrder = {
      ...mockOrderWithBlockers,
      stageValidation: {
        ...mockOrderWithBlockers.stageValidation,
        blockers: [
          ...mockOrderWithBlockers.stageValidation.blockers,
          {
            type: 'timing',
            message: 'Stage overdue by 5 days',
            severity: 'critical',
            action: 'Immediate action required to prevent losses'
          }
        ]
      }
    };

    const overdueProps = {
      ...defaultProps,
      order: overdueOrder
    };

    render(<StageValidation {...overdueProps} />);

    expect(screen.getByText('Stage overdue by 5 days')).toBeInTheDocument();
    expect(screen.getByText('Immediate action required to prevent losses')).toBeInTheDocument();
  });

  test('progress bar reflects blocker count', () => {
    render(<StageValidation {...defaultProps} />);

    // With 2 blockers, progress should be limited
    const progressBar = document.querySelector('.h-3.rounded-full.transition-all.duration-300');
    expect(progressBar).toBeInTheDocument();
  });
});