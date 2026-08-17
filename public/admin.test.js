/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const path = require('path');

describe('getAuthToken', () => {
    let getAuthToken;

    beforeAll(() => {
        const code = fs.readFileSync(path.join(__dirname, 'admin.js'), 'utf8');
        window.prompt = jest.fn();
        window.alert = jest.fn();
        window.fetch = jest.fn().mockResolvedValue({ json: jest.fn().mockResolvedValue({}) });

        // Use Function to execute the code in the current context and return the functions we want
        const setup = new Function(`
            ${code}
            return {
                getAuthToken: getAuthToken,
                escapeHTML: escapeHTML,
                checkAuth: checkAuth,
                switchTab: switchTab,
                loadBookings: loadBookings,
                updateBookingStatus: updateBookingStatus,
                loadPackages: loadPackages,
                savePackage: savePackage
            };
        `);
        const exportsObj = setup();
        getAuthToken = exportsObj.getAuthToken;
    });

    beforeEach(() => {
        localStorage.clear();
    });

    test('should return null if no token is in localStorage', () => {
        expect(getAuthToken()).toBeNull();
    });

    test('should return token from localStorage', () => {
        localStorage.setItem('gloopr_admin_token', 'my-secret-token');
        expect(getAuthToken()).toBe('my-secret-token');
    });
});
