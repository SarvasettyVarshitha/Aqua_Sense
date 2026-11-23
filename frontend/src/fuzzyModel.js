
 // AquaSense - Mamdani Fuzzy Logic Model

// Trapezoidal membership function
function trapmf(x, points) {
  const [a, b, c, d] = points;

  if (x < a || x > d) return 0;
  if (x >= b && x <= c) return 1;

  if (x >= a && x < b) {
    return b === a ? 1 : (x - a) / (b - a);
  }

  if (x > c && x <= d) {
    return d === c ? 1 : (d - x) / (d - c);
  }

  return 0;
}

// Triangular membership function
function trimf(x, points) {
  const [a, b, c] = points;

  if (x < a || x > c) return 0;
  if (x === b) return 1;

  if (x < b) {
    return b === a ? 1 : (x - a) / (b - a);
  }

  return c === b ? 1 : (c - x) / (c - b);
}

// Centroid defuzzification
function centroid(xValues, yValues) {
  let totalArea = 0;
  let totalMoment = 0;

  for (let i = 0; i < xValues.length - 1; i++) {
    const x1 = xValues[i];
    const x2 = xValues[i + 1];
    const y1 = yValues[i];
    const y2 = yValues[i + 1];

    const dx = x2 - x1;
    const area = dx * (y1 + y2) / 2;

    const moment = dx * (
      x1 * (y1 + y2) / 2 +
      dx * (y1 / 2 + (y2 - y1) / 3)
    );

    totalArea += area;
    totalMoment += moment;
  }

  if (totalArea === 0) {
    throw new Error("Unable to calculate water quality score.");
  }

  return totalMoment / totalArea;
}

// Main prediction function
export function predictWaterQuality(
  phValue,
  turbidityValue,
  temperatureValue,
  dissolvedOxygenValue
) {
  const ph = Number(phValue);
  const turbidity = Number(turbidityValue);
  const temperature = Number(temperatureValue);
  const dissolvedOxygen = Number(dissolvedOxygenValue);

  // Validate inputs
  if (!Number.isFinite(ph) || ph < 0 || ph > 14) {
    throw new Error("pH must be between 0 and 14");
  }

  if (!Number.isFinite(turbidity) ||
      turbidity < 0 || turbidity > 100) {
    throw new Error("Turbidity must be between 0 and 100 NTU");
  }

  if (!Number.isFinite(temperature) ||
      temperature < 0 || temperature > 50) {
    throw new Error("Temperature must be between 0 and 50 °C");
  }

  if (!Number.isFinite(dissolvedOxygen) ||
      dissolvedOxygen < 0 || dissolvedOxygen > 14) {
    throw new Error("Dissolved Oxygen must be between 0 and 14 mg/L");
  }

  // Input membership functions

  const phAcidic = trapmf(ph, [0, 0, 6, 7]);
  const phAcceptable = trapmf(ph, [6.5, 6.8, 8.2, 8.5]);
  const phAlkaline = trapmf(ph, [8, 9, 14, 14]);

  const turbidityLow = trapmf(turbidity, [0, 0, 1, 5]);
  const turbidityMedium = trimf(turbidity, [3, 12, 25]);
  const turbidityHigh = trapmf(turbidity, [15, 30, 100, 100]);

  const temperatureCool = trapmf(temperature, [0, 0, 10, 18]);
  const temperatureModerate = trapmf(temperature, [16, 20, 26, 30]);
  const temperatureHot = trapmf(temperature, [27, 33, 50, 50]);

  const doLow = trapmf(dissolvedOxygen, [0, 0, 3, 5]);
  const doMedium = trimf(dissolvedOxygen, [3, 5.5, 8]);
  const doHigh = trapmf(dissolvedOxygen, [6, 8, 14, 14]);

  // Fuzzy IF-THEN rules

  // Rule 1: Poor quality
  const rule1 = Math.max(
    phAcidic,
    phAlkaline,
    turbidityHigh,
    doLow
  );

  // Rule 2: Moderate turbidity
  const rule2 = turbidityMedium;

  // Rule 3: Moderate dissolved oxygen
  const rule3 = doMedium;

  // Rule 4: Acceptable pH with cool or hot temperature
  const rule4 = Math.min(
    phAcceptable,
    Math.max(temperatureCool, temperatureHot)
  );

  // Rule 5: Good quality
  const rule5 = Math.min(
    phAcceptable,
    turbidityLow,
    doHigh,
    temperatureModerate
  );

  // Output activations
  const poorActivation = rule1;
  const moderateActivation = Math.max(rule2, rule3, rule4);
  const goodActivation = rule5;

  // Aggregate output membership functions
  const xValues = [];
  const yValues = [];

  for (let i = 0; i <= 1000; i++) {
    const x = i / 10;

    const poor = trapmf(x, [0, 0, 25, 45]);
    const moderate = trimf(x, [30, 50, 70]);
    const good = trapmf(x, [55, 75, 100, 100]);

    const aggregated = Math.max(
      Math.min(poor, poorActivation),
      Math.min(moderate, moderateActivation),
      Math.min(good, goodActivation)
    );

    xValues.push(x);
    yValues.push(aggregated);
  }

  // Calculate final score
  const rawScore = centroid(xValues, yValues);
  const score = Number(rawScore.toFixed(2));

  // Classify result
  let category;

  if (score >= 70) {
    category = "Good";
  } else if (score >= 40) {
    category = "Moderate";
  } else {
    category = "Poor";
  }

  return {
    quality_score: score,
    prediction: category
  };
}
