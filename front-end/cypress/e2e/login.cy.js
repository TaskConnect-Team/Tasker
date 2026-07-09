/// <reference types="cypress" />
import { describe, it, cy} from 'vitest';

describe('Authentication E2E Workflow', () => {
    it('allows a user to log in and redirects to the dashboard', () => {
        // 1. Navigate to the local frontend
        cy.visit('http://localhost:5173/login');

        // 2. Type credentials into the form
        // Adjust the selectors (e.g., input[name="email"]) to match your actual HTML elements
        cy.get('input[name="email"]').type('admin@taskconnect.com');
        cy.get('input[name="password"]').type('Password123!');

        // 3. Click the submit button
        cy.get('button[type="submit"]').click();

        // 4. Assert that the URL successfully changed (proves routing works)
        cy.url().should('include', '/dashboard');

        // 5. Assert that a specific element on the dashboard rendered
        cy.contains('Welcome back').should('be.visible');
    });
});