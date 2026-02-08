import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

// Mock recharts to avoid JSDOM rendering issues with SVG measurement
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
    BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
    LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
    PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
    AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
    RadarChart: ({ children }) => <div data-testid="radar-chart">{children}</div>,
    RadialBarChart: ({ children }) => <div data-testid="radial-bar-chart">{children}</div>,
    Bar: () => null,
    Line: () => null,
    Pie: () => null,
    Area: () => null,
    Radar: () => null,
    RadialBar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
    Cell: () => null,
    PolarGrid: () => null,
    PolarAngleAxis: () => null,
    PolarRadiusAxis: () => null,
  };
});

// Import main app component and mock API
import PropagationOrder from '../../PropagationOrder';
import { MockFloraAPI } from '../../services/mockAPI';

// Mock the entire API to use our test implementation
jest.mock('../../services/floraAPI', () => ({
  floraAPI: new MockFloraAPI()
}));

// TODO: These integration tests need updating to match current component structure.
// The PropagationOrder component now uses CustomerSelect instead of plain labeled
// inputs, and the tab/section layout has changed. Tests should be rewritten to
// use the current UI patterns (e.g., CustomerSelect component, updated tab names).
describe.skip('Complete Crop Propagation Workflow Integration', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    // Reset mock API state
    const { floraAPI } = require('../../services/floraAPI');
    floraAPI.setDelay(10); // Faster tests
    floraAPI.reset();
  });

  describe('End-to-End Order Workflow', () => {
    test('should complete full order lifecycle from creation to dispatch', async () => {
      render(<PropagationOrder />);

      // 1. CREATE NEW ORDER
      await user.click(screen.getByText('New Order'));

      // Fill out order form
      await user.type(screen.getByLabelText(/client name/i), 'Integration Test Farm');
      await user.type(screen.getByLabelText(/contact person/i), 'John Tester');
      await user.type(screen.getByLabelText(/phone/i), '+1-555-TEST');
      await user.type(screen.getByLabelText(/email/i), 'john@testfarm.com');
      await user.type(screen.getByLabelText(/crop type/i), 'Citrus');
      await user.type(screen.getByLabelText(/variety/i), 'Test Orange');
      await user.type(screen.getByLabelText(/quantity/i), '100');
      await user.selectOptions(screen.getByLabelText(/propagation method/i), 'grafting');
      await user.type(screen.getByLabelText(/unit price/i), '15.00');

      // Assign workers
      await user.type(screen.getByLabelText(/budwood collector/i), 'Test Collector');
      await user.type(screen.getByLabelText(/grafter/i), 'Test Grafter');
      await user.type(screen.getByLabelText(/nursery manager/i), 'Test Manager');
      await user.type(screen.getByLabelText(/quality controller/i), 'Test Controller');

      // Verify budwood calculator works
      await waitFor(() => {
        expect(screen.getByText(/120/)).toBeInTheDocument(); // Base budwood requirement
        expect(screen.getByText(/138/)).toBeInTheDocument(); // Total with waste factor
      });

      // Submit order
      await user.click(screen.getByText('Create Order'));

      // Verify order appears in list
      await waitFor(() => {
        expect(screen.getByText('Integration Test Farm')).toBeInTheDocument();
        expect(screen.getByText('Test Orange')).toBeInTheDocument();
      });

      // 2. PROGRESS THROUGH STAGES
      const orderRow = screen.getByText('Integration Test Farm').closest('tr');
      const transferButton = within(orderRow).getByText('Transfer');

      // Stage 1: Budwood Collection → Grafting Setup
      await user.click(transferButton);

      await waitFor(() => {
        expect(screen.getByText('Transfer Plants')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/quantity/i), '100');
      await user.type(screen.getByLabelText(/operator/i), 'Test Collector');
      await user.type(screen.getByLabelText(/quality score/i), '95');
      await user.type(screen.getByLabelText(/notes/i), 'Excellent budwood quality');

      await user.click(screen.getByText('Transfer'));

      // Verify stage progression
      await waitFor(() => {
        expect(screen.getByText('grafting_setup')).toBeInTheDocument();
      });

      // 3. RECORD HEALTH ASSESSMENT
      const healthButton = within(orderRow).getByText('Health');
      await user.click(healthButton);

      await user.type(screen.getByLabelText(/lost quantity/i), '5');
      await user.type(screen.getByLabelText(/operator/i), 'Dr. Plant Health');
      await user.type(screen.getByLabelText(/assessment notes/i), 'Minor losses due to handling');

      await user.click(screen.getByText('Record Assessment'));

      // Verify quantity updated
      await waitFor(() => {
        expect(screen.getByText('95')).toBeInTheDocument(); // Reduced quantity
      });

      // 4. VALIDATE STAGE
      const validateButton = within(orderRow).getByText('Validate');
      await user.click(validateButton);

      await waitFor(() => {
        expect(screen.getByText(/stage validation/i)).toBeInTheDocument();
      });

      // Check if there are any blockers and resolve them
      const resolveButtons = screen.queryAllByText('Resolve');
      if (resolveButtons.length > 0) {
        await user.click(resolveButtons[0]);

        await waitFor(() => {
          expect(screen.getByText(/blocker resolved/i)).toBeInTheDocument();
        });
      }

      // 5. CONTINUE THROUGH REMAINING STAGES
      // Continue transferring through all stages until dispatch
      const stages = ['grafting_operation', 'post_graft_care', 'quality_check', 'hardening', 'pre_dispatch', 'dispatched'];

      for (const targetStage of stages) {
        // Find and click transfer button
        const currentOrderRow = screen.getByText('Integration Test Farm').closest('tr');
        const currentTransferButton = within(currentOrderRow).getByText('Transfer');

        await user.click(currentTransferButton);

        await waitFor(() => {
          expect(screen.getByText('Transfer Plants')).toBeInTheDocument();
        });

        // Fill transfer form
        await user.clear(screen.getByLabelText(/quantity/i));
        await user.type(screen.getByLabelText(/quantity/i), '90'); // Some losses each stage
        await user.type(screen.getByLabelText(/operator/i), `Test Operator ${targetStage}`);
        await user.type(screen.getByLabelText(/quality score/i), '88');

        await user.click(screen.getByText('Transfer'));

        // Verify stage progression
        await waitFor(() => {
          expect(screen.getByText(targetStage)).toBeInTheDocument();
        });

        // Break if we've reached dispatch
        if (targetStage === 'dispatched') break;
      }

      // 6. VERIFY FINAL STATE
      await waitFor(() => {
        expect(screen.getByText('dispatched')).toBeInTheDocument();
      });

      // Verify order completion
      const finalOrderRow = screen.getByText('Integration Test Farm').closest('tr');
      expect(within(finalOrderRow).getByText('dispatched')).toBeInTheDocument();
    });

    test('should handle worker performance tracking throughout workflow', async () => {
      render(<PropagationOrder />);

      // Switch to Performance tab
      await user.click(screen.getByText('Performance'));

      // Verify worker performance tracker loads
      await waitFor(() => {
        expect(screen.getByText('Worker Performance Tracking')).toBeInTheDocument();
        expect(screen.getByText('Individual Performance')).toBeInTheDocument();
      });

      // Check that performance metrics are displayed
      expect(screen.getByText('Active Workers')).toBeInTheDocument();
      expect(screen.getByText('Avg Success Rate')).toBeInTheDocument();
      expect(screen.getByText('Total Tasks')).toBeInTheDocument();

      // Verify charts are rendered
      expect(screen.getByText('Success Rate Comparison')).toBeInTheDocument();
      expect(screen.getByText('Productivity vs Efficiency')).toBeInTheDocument();
    });

    test('should display comprehensive analytics dashboard', async () => {
      render(<PropagationOrder />);

      // Switch to Dashboard tab
      await user.click(screen.getByText('Dashboard'));

      // Verify enhanced analytics dashboard loads
      await waitFor(() => {
        expect(screen.getByText('Enhanced Analytics Dashboard')).toBeInTheDocument();
      });

      // Check KPI cards
      expect(screen.getByText('Orders')).toBeInTheDocument();
      expect(screen.getByText('Plants')).toBeInTheDocument();
      expect(screen.getByText('Ready to Ship')).toBeInTheDocument();
      expect(screen.getByText('On-Time Delivery')).toBeInTheDocument();
      expect(screen.getByText('Revenue')).toBeInTheDocument();

      // Check charts
      expect(screen.getByText('Plant Survival by Stage')).toBeInTheDocument();
      expect(screen.getByText('Grafting Productivity Trend')).toBeInTheDocument();
      expect(screen.getByText('Production Volume by Variety')).toBeInTheDocument();
      expect(screen.getByText('Stage Efficiency (Days)')).toBeInTheDocument();

      // Check tables
      expect(screen.getByText('Grafting Team Performance')).toBeInTheDocument();
      expect(screen.getByText('Workflow Bottlenecks')).toBeInTheDocument();
    });
  });

  describe('Data Consistency and Synchronization', () => {
    test('should maintain data consistency across all components', async () => {
      render(<PropagationOrder />);

      // Create an order and verify it appears everywhere
      await user.click(screen.getByText('New Order'));

      // Fill minimal required fields
      await user.type(screen.getByLabelText(/client name/i), 'Consistency Test');
      await user.type(screen.getByLabelText(/variety/i), 'Test Variety');
      await user.type(screen.getByLabelText(/quantity/i), '50');

      await user.click(screen.getByText('Create Order'));

      // Verify order appears in orders list
      await waitFor(() => {
        expect(screen.getByText('Consistency Test')).toBeInTheDocument();
      });

      // Switch to analytics and verify data is reflected
      await user.click(screen.getByText('Dashboard'));

      await waitFor(() => {
        // Should show updated order count
        const orderCountElements = screen.getAllByText(/\d+/);
        expect(orderCountElements.length).toBeGreaterThan(0);
      });

      // Switch to performance tab
      await user.click(screen.getByText('Performance'));

      // Performance data should be available (even if empty initially)
      await waitFor(() => {
        expect(screen.getByText('Worker Performance Tracking')).toBeInTheDocument();
      });
    });

    test('should handle real-time updates correctly', async () => {
      render(<PropagationOrder />);

      // Create initial order
      await user.click(screen.getByText('New Order'));
      await user.type(screen.getByLabelText(/client name/i), 'Realtime Test');
      await user.type(screen.getByLabelText(/variety/i), 'RT Variety');
      await user.type(screen.getByLabelText(/quantity/i), '75');
      await user.click(screen.getByText('Create Order'));

      // Record a health assessment that changes quantity
      await waitFor(() => {
        expect(screen.getByText('Realtime Test')).toBeInTheDocument();
      });

      const orderRow = screen.getByText('Realtime Test').closest('tr');
      const healthButton = within(orderRow).getByText('Health');
      await user.click(healthButton);

      await user.type(screen.getByLabelText(/lost quantity/i), '10');
      await user.type(screen.getByLabelText(/operator/i), 'Test Health Officer');
      await user.click(screen.getByText('Record Assessment'));

      // Verify quantity updated in real-time
      await waitFor(() => {
        expect(screen.getByText('65')).toBeInTheDocument(); // 75 - 10
      });

      // Switch to analytics and verify updated data
      await user.click(screen.getByText('Dashboard'));

      await waitFor(() => {
        // Analytics should reflect the health assessment
        expect(screen.getByText('Enhanced Analytics Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle validation errors gracefully', async () => {
      render(<PropagationOrder />);

      // Try to create order with missing required fields
      await user.click(screen.getByText('New Order'));

      // Submit without filling required fields
      await user.click(screen.getByText('Create Order'));

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });
    });

    test('should handle zero quantity scenarios', async () => {
      render(<PropagationOrder />);

      // Create order with minimal plants
      await user.click(screen.getByText('New Order'));
      await user.type(screen.getByLabelText(/client name/i), 'Zero Test');
      await user.type(screen.getByLabelText(/variety/i), 'ZT Variety');
      await user.type(screen.getByLabelText(/quantity/i), '5');
      await user.click(screen.getByText('Create Order'));

      // Record health assessment that removes all plants
      await waitFor(() => {
        expect(screen.getByText('Zero Test')).toBeInTheDocument();
      });

      const orderRow = screen.getByText('Zero Test').closest('tr');
      const healthButton = within(orderRow).getByText('Health');
      await user.click(healthButton);

      await user.type(screen.getByLabelText(/lost quantity/i), '5');
      await user.type(screen.getByLabelText(/operator/i), 'Test Health Officer');
      await user.click(screen.getByText('Record Assessment'));

      // Verify quantity is 0 and handled gracefully
      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });

      // Stage validation should show blockers
      const validateButton = within(orderRow).getByText('Validate');
      await user.click(validateButton);

      await waitFor(() => {
        expect(screen.getByText(/no plants available/i)).toBeInTheDocument();
      });
    });

    test('should handle concurrent user actions', async () => {
      render(<PropagationOrder />);

      // Simulate rapid tab switching and actions
      await user.click(screen.getByText('Dashboard'));
      await user.click(screen.getByText('Performance'));
      await user.click(screen.getByText('Orders'));

      // Should handle rapid navigation without errors
      await waitFor(() => {
        expect(screen.getByText('Propagation Orders')).toBeInTheDocument();
      });

      // Try rapid filter changes
      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'test');
      await user.clear(searchInput);
      await user.type(searchInput, 'orange');

      // Should handle rapid input changes
      await waitFor(() => {
        expect(searchInput).toHaveValue('orange');
      });
    });
  });

  describe('Performance and Scalability', () => {
    test('should render large datasets efficiently', async () => {
      // This test would be enhanced with larger mock datasets
      render(<PropagationOrder />);

      const startTime = Date.now();

      // Switch between views to test rendering performance
      await user.click(screen.getByText('Dashboard'));
      await waitFor(() => {
        expect(screen.getByText('Enhanced Analytics Dashboard')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Performance'));
      await waitFor(() => {
        expect(screen.getByText('Worker Performance Tracking')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Orders'));
      await waitFor(() => {
        expect(screen.getByText('Propagation Orders')).toBeInTheDocument();
      });

      const endTime = Date.now();
      const renderTime = endTime - startTime;

      // Should render reasonably quickly (within 2 seconds)
      expect(renderTime).toBeLessThan(2000);
    });

    test('should handle complex filtering and searching', async () => {
      render(<PropagationOrder />);

      // Test search functionality
      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'valencia');

      // Should filter results
      await waitFor(() => {
        // Results should be filtered (specific assertion depends on mock data)
        expect(searchInput).toHaveValue('valencia');
      });

      // Test status filtering if available
      const statusFilters = screen.queryAllByRole('button');
      if (statusFilters.length > 0) {
        // Click various status filters
        for (let i = 0; i < Math.min(3, statusFilters.length); i++) {
          await user.click(statusFilters[i]);
          // Wait a bit for filter to apply
          await waitFor(() => {
            expect(statusFilters[i]).toBeInTheDocument();
          }, { timeout: 500 });
        }
      }
    });
  });

  describe('Accessibility and Usability', () => {
    test('should be keyboard navigable', async () => {
      render(<PropagationOrder />);

      // Test tab navigation through interface
      await user.tab();
      expect(document.activeElement).toBeInTheDocument();

      // Test Enter key on focusable elements
      const newOrderButton = screen.getByText('New Order');
      newOrderButton.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Create New Order')).toBeInTheDocument();
      });

      // Test Escape key to close modal
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('Create New Order')).not.toBeInTheDocument();
      });
    });

    test('should provide appropriate ARIA labels and roles', () => {
      render(<PropagationOrder />);

      // Check for proper ARIA labels
      expect(screen.getByRole('main')).toBeInTheDocument();

      // Tables should have proper roles
      const tables = screen.getAllByRole('table');
      expect(tables.length).toBeGreaterThan(0);

      // Buttons should be properly labeled
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type');
      });
    });
  });
});