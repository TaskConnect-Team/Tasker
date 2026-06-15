/* eslint-env jest */
// import React from 'react';

import { describe, it, expect, jest } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SchedulePicker from '../components/SchedulePicker.jsx';

describe('Interactive Schedule Picker Component', () => {
  it('updates the selected time when a user clicks an hour chip', () => {
    // Create a mock function to track if the component passes data back to the parent
    const mockHandleChange = jest.fn();

    render(<SchedulePicker formData={{ scheduledAt: '' }} handleChange={mockHandleChange} />);

    // Simulate a user clicking the "10:00 AM" chip
    const timeChip = screen.getByText('10:00 AM');
    fireEvent.click(timeChip);

    // Assert the component visually updated (e.g., changed color/class)
    expect(timeChip.className).toMatch(/bg-primary/); // Assuming Tailwind primary color on active

    // Assert the parent form was notified of the change
    expect(mockHandleChange).toHaveBeenCalledTimes(1);
  });
});