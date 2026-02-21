const { price } = require('./rentalPrice');

function toNumber(priceResult) {
    return Number(String(priceResult).replace('$', ''));
}

function date(value) {
    return Date.parse(value);
}

describe('rentalPrice business rules', () => {
    test('rejects drivers younger than 18', () => {
        const result = price(date('2026-01-10'), date('2026-01-10'), 'Compact', 17, 5);
        expect(result).toBe('Driver too young - cannot quote the price');
    });

    test('rejects drivers with license under 1 year', () => {
        const result = price(date('2026-01-10'), date('2026-01-10'), 'Compact', 30, 0.5);
        expect(result).toBe('Driver has held a license for less than a year - cannot quote the price');
    });

    test('allows age 18-21 only for Compact class', () => {
        const result = price(date('2026-01-10'), date('2026-01-10'), 'Electric', 20, 5);
        expect(result).toBe('Drivers 21 y/o or less can only rent Compact vehicles');
    });

    test('calculates base daily price for compact in low season', () => {
        const result = price(date('2026-01-15'), date('2026-01-15'), 'Compact', 30, 5);
        expect(result).toBe('$30');
    });

    test('applies high season +15% when rental starts in high season', () => {
        const result = price(date('2026-06-10'), date('2026-06-10'), 'Compact', 30, 5);
        expect(toNumber(result)).toBeCloseTo(34.5, 5);
    });

    test('applies high season when rental ends in high season', () => {
        const result = price(date('2026-03-31'), date('2026-04-01'), 'Compact', 30, 5);
        expect(toNumber(result)).toBeCloseTo(69, 5);
    });

    test('applies high season when rental spans across full high-season period', () => {
        const result = price(date('2026-01-15'), date('2026-12-15'), 'Compact', 30, 5);
        const days = 335;
        expect(toNumber(result)).toBeCloseTo(days * 30 * 1.15, 5);
    });

    test('applies 50% Racer surcharge for age 25 or younger in high season', () => {
        const result = price(date('2026-06-10'), date('2026-06-10'), 'Racer', 25, 5);
        expect(toNumber(result)).toBeCloseTo(43.125, 5);
    });

    test('does not apply Racer surcharge in low season', () => {
        const result = price(date('2026-01-10'), date('2026-01-10'), 'Racer', 25, 5);
        expect(result).toBe('$25');
    });

    test('applies 10% discount for rentals longer than 10 days in low season', () => {
        const result = price(date('2026-01-01'), date('2026-01-11'), 'Compact', 30, 5);
        expect(toNumber(result)).toBeCloseTo(297, 5);
    });

    test('applies 30% increase for license under 2 years', () => {
        const result = price(date('2026-01-10'), date('2026-01-10'), 'Compact', 30, 1.5);
        expect(toNumber(result)).toBeCloseTo(39, 5);
    });

    test('applies +15 per day in high season for license under 3 years', () => {
        const result = price(date('2026-06-10'), date('2026-06-11'), 'Compact', 30, 2.5);
        expect(toNumber(result)).toBeCloseTo(99, 5);
    });

    test('normalizes and handles all supported car classes', () => {
        const electric = price(date('2026-01-10'), date('2026-01-10'), 'Electric', 30, 5);
        const cabrio = price(date('2026-01-10'), date('2026-01-10'), 'Cabrio', 30, 5);
        const racer = price(date('2026-01-10'), date('2026-01-10'), 'Racer', 30, 5);

        expect(electric).toBe('$30');
        expect(cabrio).toBe('$30');
        expect(racer).toBe('$30');
    });

    test('handles unknown car class through default switch branch', () => {
        const result = price(date('2026-01-10'), date('2026-01-10'), 'Truck', 30, 5);
        expect(result).toBe('$30');
    });
});
