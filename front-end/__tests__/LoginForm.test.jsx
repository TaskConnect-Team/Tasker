
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import LoginForm from '../components/LoginForm.jsx'; // Adjust path to your component

/* eslint-env jest */
describe('LoginForm Component', () => {
    it('renders email input, password input, and the submit button', () => {
        render(
            <BrowserRouter>
                <LoginForm />
            </BrowserRouter>
        );

        // Look for inputs by their label or placeholder text
        expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();

        // Look for the primary button
        expect(screen.getByRole('button', { name: /login|submit/i })).toBeInTheDocument();
    });
});