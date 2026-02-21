const CAR_CLASSES = {
    COMPACT: 'Compact',
    ELECTRIC: 'Electric',
    CABRIO: 'Cabrio',
    RACER: 'Racer',
    UNKNOWN: 'Unknown'
};

const SEASONS = {
    HIGH: 'High',
    LOW: 'Low'
};

const LIMITS = {
    MIN_AGE: 18,
    COMPACT_ONLY_MAX_AGE: 21,
    RACER_SURCHARGE_MAX_AGE: 25,
    LONG_RENTAL_DAYS: 10,
    MIN_LICENSE_YEARS: 1,
    LICENSE_UNDER_TWO_YEARS: 2,
    LICENSE_UNDER_THREE_YEARS: 3
};

const PRICE_FACTORS = {
    RACER_HIGH_SEASON: 1.5,
    HIGH_SEASON: 1.15,
    LONG_RENTAL_LOW_SEASON: 0.9,
    LICENSE_UNDER_TWO_YEARS: 1.3
};

const LICENSE_HIGH_SEASON_DAILY_SURCHARGE = 15;
const HIGH_SEASON_START_MONTH = 3;
const HIGH_SEASON_END_MONTH = 9;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function price(pickupDate, dropoffDate, type, age, licenseYears) {
    const carClass = getCarClass(type);
    const rentalDays = getRentalDays(pickupDate, dropoffDate);
    const season = getSeason(pickupDate, dropoffDate);

    const eligibilityError = getEligibilityError(age, carClass, licenseYears);
    if (eligibilityError) {
        return eligibilityError;
    }

    let totalPrice = getBasePrice(age, rentalDays);
    totalPrice = applyMultipliers(totalPrice, age, rentalDays, carClass, season, licenseYears);
    totalPrice = applyFixedAdditions(totalPrice, rentalDays, season, licenseYears);

    return '$' + totalPrice;
}

function getEligibilityError(age, carClass, licenseYears) {
    if (age < LIMITS.MIN_AGE) {
        return 'Driver too young - cannot quote the price';
    }

    if (licenseYears < LIMITS.MIN_LICENSE_YEARS) {
        return 'Driver has held a license for less than a year - cannot quote the price';
    }

    if (age <= LIMITS.COMPACT_ONLY_MAX_AGE && carClass !== CAR_CLASSES.COMPACT) {
        return 'Drivers 21 y/o or less can only rent Compact vehicles';
    }

    return null;
}

function getBasePrice(age, rentalDays) {
    return age * rentalDays;
}

function applyMultipliers(totalPrice, age, rentalDays, carClass, season, licenseYears) {
    let adjustedPrice = totalPrice;

    if (carClass === CAR_CLASSES.RACER && age <= LIMITS.RACER_SURCHARGE_MAX_AGE && season === SEASONS.HIGH) {
        adjustedPrice *= PRICE_FACTORS.RACER_HIGH_SEASON;
    }

    if (season === SEASONS.HIGH) {
        adjustedPrice *= PRICE_FACTORS.HIGH_SEASON;
    }

    if (season === SEASONS.LOW && rentalDays > LIMITS.LONG_RENTAL_DAYS) {
        adjustedPrice *= PRICE_FACTORS.LONG_RENTAL_LOW_SEASON;
    }

    if (licenseYears < LIMITS.LICENSE_UNDER_TWO_YEARS) {
        adjustedPrice *= PRICE_FACTORS.LICENSE_UNDER_TWO_YEARS;
    }

    return adjustedPrice;
}

function applyFixedAdditions(totalPrice, rentalDays, season, licenseYears) {
    if (season === SEASONS.HIGH && licenseYears < LIMITS.LICENSE_UNDER_THREE_YEARS) {
        return totalPrice + LICENSE_HIGH_SEASON_DAILY_SURCHARGE * rentalDays;
    }

    return totalPrice;
}

function getCarClass(type) {
    const normalizedType = String(type).trim().toLowerCase();

    switch (normalizedType) {
        case 'compact':
            return CAR_CLASSES.COMPACT;
        case 'electric':
            return CAR_CLASSES.ELECTRIC;
        case 'cabrio':
            return CAR_CLASSES.CABRIO;
        case 'racer':
            return CAR_CLASSES.RACER;
        default:
            return CAR_CLASSES.UNKNOWN;
    }
}

function getRentalDays(pickupDate, dropoffDate) {
    const pickup = new Date(pickupDate);
    const dropoff = new Date(dropoffDate);
    return Math.round(Math.abs((pickup - dropoff) / DAY_IN_MS)) + 1;
}

function getSeason(pickupDate, dropoffDate) {
    const pickup = new Date(pickupDate);
    const dropoff = new Date(dropoffDate);

    const pickupMonth = pickup.getMonth();
    const dropoffMonth = dropoff.getMonth();

    const startsInHighSeason =
        pickupMonth >= HIGH_SEASON_START_MONTH && pickupMonth <= HIGH_SEASON_END_MONTH;
    const endsInHighSeason =
        dropoffMonth >= HIGH_SEASON_START_MONTH && dropoffMonth <= HIGH_SEASON_END_MONTH;
    const spansFullHighSeason =
        pickupMonth < HIGH_SEASON_START_MONTH && dropoffMonth > HIGH_SEASON_END_MONTH;

    if (startsInHighSeason || endsInHighSeason || spansFullHighSeason) {
        return SEASONS.HIGH;
    }

    return SEASONS.LOW;
}

exports.price = price;