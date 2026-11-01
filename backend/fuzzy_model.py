
import numpy as np
import skfuzzy as fuzz
from skfuzzy import control as ctrl


# ==========================================
# 1. DEFINE INPUT VARIABLES
# ==========================================

ph = ctrl.Antecedent(np.arange(0, 14.1, 0.1), "ph")

turbidity = ctrl.Antecedent(
    np.arange(0, 100.1, 0.1), "turbidity"
)

temperature = ctrl.Antecedent(
    np.arange(0, 50.1, 0.1), "temperature"
)

dissolved_oxygen = ctrl.Antecedent(
    np.arange(0, 14.1, 0.1), "dissolved_oxygen"
)


# ==========================================
# 2. DEFINE OUTPUT VARIABLE
# ==========================================

quality = ctrl.Consequent(
    np.arange(0, 100.1, 0.1), "quality"
)


# ==========================================
# 3. MEMBERSHIP FUNCTIONS
# ==========================================

# pH membership functions

ph["acidic"] = fuzz.trapmf(
    ph.universe, [0, 0, 6, 7]
)

ph["acceptable"] = fuzz.trapmf(
    ph.universe, [6.5, 6.8, 8.2, 8.5]
)

ph["alkaline"] = fuzz.trapmf(
    ph.universe, [8, 9, 14, 14]
)


# Turbidity membership functions

turbidity["low"] = fuzz.trapmf(
    turbidity.universe, [0, 0, 1, 5]
)

turbidity["medium"] = fuzz.trimf(
    turbidity.universe, [3, 12, 25]
)

turbidity["high"] = fuzz.trapmf(
    turbidity.universe, [15, 30, 100, 100]
)


# Temperature membership functions

temperature["cool"] = fuzz.trapmf(
    temperature.universe, [0, 0, 10, 18]
)

temperature["moderate"] = fuzz.trapmf(
    temperature.universe, [16, 20, 26, 30]
)

temperature["hot"] = fuzz.trapmf(
    temperature.universe, [27, 33, 50, 50]
)


# Dissolved oxygen membership functions

dissolved_oxygen["low"] = fuzz.trapmf(
    dissolved_oxygen.universe, [0, 0, 3, 5]
)

dissolved_oxygen["medium"] = fuzz.trimf(
    dissolved_oxygen.universe, [3, 5.5, 8]
)

dissolved_oxygen["high"] = fuzz.trapmf(
    dissolved_oxygen.universe, [6, 8, 14, 14]
)


# Output membership functions

quality["poor"] = fuzz.trapmf(
    quality.universe, [0, 0, 25, 45]
)

quality["moderate"] = fuzz.trimf(
    quality.universe, [30, 50, 70]
)

quality["good"] = fuzz.trapmf(
    quality.universe, [55, 75, 100, 100]
)


# ==========================================
# 4. DEFINE FUZZY IF-THEN RULES
# ==========================================

# Rule 1: Poor water quality

rule1 = ctrl.Rule(
    ph["acidic"]
    | ph["alkaline"]
    | turbidity["high"]
    | dissolved_oxygen["low"],
    quality["poor"]
)


# Rule 2: Moderate turbidity

rule2 = ctrl.Rule(
    turbidity["medium"],
    quality["moderate"]
)


# Rule 3: Moderate dissolved oxygen

rule3 = ctrl.Rule(
    dissolved_oxygen["medium"],
    quality["moderate"]
)


# Rule 4: Temperature outside the preferred range
# when pH is acceptable

rule4 = ctrl.Rule(
    ph["acceptable"]
    & (temperature["cool"] | temperature["hot"]),
    quality["moderate"]
)


# Rule 5: Good water quality

rule5 = ctrl.Rule(
    ph["acceptable"]
    & turbidity["low"]
    & dissolved_oxygen["high"]
    & temperature["moderate"],
    quality["good"]
)


# ==========================================
# 5. CREATE FUZZY CONTROL SYSTEM
# ==========================================

water_quality_system = ctrl.ControlSystem([
    rule1,
    rule2,
    rule3,
    rule4,
    rule5
])


# ==========================================
# 6. PREDICTION FUNCTION
# ==========================================

def predict_water_quality(
    ph_value,
    turbidity_value,
    temperature_value,
    dissolved_oxygen_value
):

    # Validate input ranges

    if not 0 <= ph_value <= 14:
        raise ValueError("pH must be between 0 and 14")

    if not 0 <= turbidity_value <= 100:
        raise ValueError("Turbidity must be between 0 and 100 NTU")

    if not 0 <= temperature_value <= 50:
        raise ValueError("Temperature must be between 0 and 50 °C")

    if not 0 <= dissolved_oxygen_value <= 14:
        raise ValueError("Dissolved Oxygen must be between 0 and 14 mg/L")

    # Create simulation

    simulation = ctrl.ControlSystemSimulation(
        water_quality_system
    )

    # Supply input values

    simulation.input["ph"] = ph_value

    simulation.input["turbidity"] = turbidity_value

    simulation.input["temperature"] = temperature_value

    simulation.input["dissolved_oxygen"] = dissolved_oxygen_value

    # Perform fuzzy inference and defuzzification

    simulation.compute()

    score = float(simulation.output["quality"])

    # Classify water quality

    if score >= 70:
        category = "Good"

    elif score >= 40:
        category = "Moderate"

    else:
        category = "Poor"

    return {
        "quality_score": round(score, 2),
        "prediction": category
    }


# ==========================================
# 7. TEST THE MODEL
# ==========================================

if __name__ == "__main__":

    result = predict_water_quality(
        ph_value=7.2,
        turbidity_value=3,
        temperature_value=25,
        dissolved_oxygen_value=7
    )

    print("\nAquaSense Water Quality Prediction")
    print("-----------------------------------")

    print("pH: 7.2")
    print("Turbidity: 3 NTU")
    print("Temperature: 25 °C")
    print("Dissolved Oxygen: 7 mg/L")

    print("-----------------------------------")

    print("Prediction:", result["prediction"])

    print("Quality Score:", result["quality_score"])

    print("-----------------------------------")
