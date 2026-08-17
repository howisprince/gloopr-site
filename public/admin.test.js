const fs = require('fs');
const path = require('path');

const jsCode = fs.readFileSync(path.resolve(__dirname, 'admin.js'), 'utf8');

describe('updateBookingStatus', () => {
    let updateBookingStatus;
    let mockLoadBookings;

    beforeEach(() => {
        document.body.innerHTML = '<div id="bookings-list"></div>';

        global.fetch = jest.fn();
        global.alert = jest.fn();
        global.prompt = jest.fn(() => 'fake-token');

        const localStorageMock = {
            getItem: jest.fn(() => 'fake-token'),
            setItem: jest.fn(),
            removeItem: jest.fn(),
        };
        Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

        mockLoadBookings = jest.fn();
        window.mockLoadBookings = mockLoadBookings;

        let modifiedCode = jsCode + `
            window.updateBookingStatus = updateBookingStatus;
        `;

        modifiedCode = modifiedCode.replace(/loadBookings\(\);/g, 'window.mockLoadBookings();');
        modifiedCode = modifiedCode.replace(/checkAuth\(\)\.then\([\s\S]*\}\);/g, ''); // Remove the initial call

        const script = document.createElement('script');
        script.textContent = modifiedCode;
        document.body.appendChild(script);

        updateBookingStatus = window.updateBookingStatus;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('successfully updates a booking status', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: jest.fn().mockResolvedValue({})
        });

        await updateBookingStatus(1, 'Confirmed');

        expect(global.fetch).toHaveBeenCalledWith('/api/bookings?id=1', expect.objectContaining({
            method: 'PATCH',
            headers: expect.objectContaining({
                'Content-Type': 'application/json',
                'Authorization': 'Bearer fake-token'
            }),
            body: JSON.stringify({ status: 'Confirmed' })
        }));

        expect(window.mockLoadBookings).toHaveBeenCalled();
    });

    it('alerts on unauthorized error (401)', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 401
        });

        await updateBookingStatus(1, 'Confirmed');

        expect(global.alert).toHaveBeenCalledWith("Unauthorized. Please refresh and login again.");
        expect(window.mockLoadBookings).not.toHaveBeenCalled();
    });

    it('alerts on fetch failure', async () => {
        global.fetch.mockRejectedValueOnce(new Error('Network Error'));

        await updateBookingStatus(1, 'Confirmed');

        expect(global.alert).toHaveBeenCalledWith("Failed to update status");
        expect(window.mockLoadBookings).not.toHaveBeenCalled();
    });
});
