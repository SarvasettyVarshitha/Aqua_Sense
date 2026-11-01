
from flask import Flask, request, jsonify
from flask_cors import CORS
from fuzzy_model import predict_water_quality
from mysql_connection import get_db_connection

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return jsonify({
        "message": "AquaSense API is running!"
    })


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        ph = float(data["ph"])
        turbidity = float(data["turbidity"])
        temperature = float(data["temperature"])
        dissolved_oxygen = float(data["dissolved_oxygen"])

        result = predict_water_quality(
            ph,
            turbidity,
            temperature,
            dissolved_oxygen
        )

        prediction = result["prediction"]
        quality_score = float(result["quality_score"])

        # Save prediction in MySQL
        connection = get_db_connection()
        cursor = connection.cursor()

        query = """
            INSERT INTO prediction_history
            (ph, turbidity, temperature, dissolved_oxygen,
             water_score, water_quality)
            VALUES (%s, %s, %s, %s, %s, %s)
        """

        values = (
            ph,
            turbidity,
            temperature,
            dissolved_oxygen,
            quality_score,
            prediction
        )

        cursor.execute(query, values)
        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "prediction": prediction,
            "quality_score": quality_score
        })

    except (KeyError, TypeError, ValueError) as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route("/history", methods=["GET"])
def get_history():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        query = """
            SELECT *
            FROM prediction_history
            ORDER BY created_at DESC
        """

        cursor.execute(query)
        history = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "history": history
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
