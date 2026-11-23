
import { useState, useEffect } from "react";

import { predictWaterQuality } from "./fuzzyModel";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import "./App.css";

function App() {

  const [form, setForm] = useState({
    ph: 7.2,
    turbidity: 3,
    temperature: 25,
    dissolved_oxygen: 7
  });

  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load prediction history from browser storage
  const loadHistory = () => {
    try {
      const savedHistory = localStorage.getItem("aquasense_history");

      const records = savedHistory
        ? JSON.parse(savedHistory)
        : [];

      setHistory(records);

      if (records.length > 0) {
        setResult({
          prediction: records[0].prediction,
          quality_score: records[0].score
        });
      } else {
        setResult(null);
      }

    } catch (err) {
      console.error("History loading error:", err);
      setHistory([]);
    }
  };

  // Load history when website opens
  useEffect(() => {
    loadHistory();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // Predict water quality using JavaScript fuzzy model
  const handlePredict = () => {

    if (
      form.ph === "" ||
      form.turbidity === "" ||
      form.temperature === "" ||
      form.dissolved_oxygen === ""
    ) {
      setError("Please fill in all fields.");
      return;
    }

    const values = Object.values(form).map(Number);

    if (values.some(v => !Number.isFinite(v))) {
      setError("Please enter valid numbers.");
      return;
    }

    if (
      Number(form.ph) < 0 || Number(form.ph) > 14 ||
      Number(form.turbidity) < 0 || Number(form.turbidity) > 100 ||
      Number(form.temperature) < 0 || Number(form.temperature) > 50 ||
      Number(form.dissolved_oxygen) < 0 ||
      Number(form.dissolved_oxygen) > 14
    ) {
      setError("Please check the permitted parameter ranges.");
      return;
    }

    setLoading(true);
    setError("");

    try {

      // Run fuzzy logic prediction
      const data = predictWaterQuality(
        Number(form.ph),
        Number(form.turbidity),
        Number(form.temperature),
        Number(form.dissolved_oxygen)
      );

      // Display prediction result
      setResult(data);

      // Create history record
      const newRecord = {
        id: Date.now(),
        time: new Date().toLocaleString(),
        ph: Number(form.ph),
        turbidity: Number(form.turbidity),
        temperature: Number(form.temperature),
        dissolved_oxygen: Number(form.dissolved_oxygen),
        score: data.quality_score,
        prediction: data.prediction
      };

      // Add latest prediction to history
      const updatedHistory = [
        newRecord,
        ...history
      ];

      // Save history in browser
      localStorage.setItem(
        "aquasense_history",
        JSON.stringify(updatedHistory)
      );

      setHistory(updatedHistory);

    } catch (err) {
      setError(err.message || "Prediction failed.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate average score
  const averageScore = history.length
    ? (
        history.reduce(
          (sum, item) => sum + Number(item.score), 0
        ) / history.length
      ).toFixed(2)
    : "—";

  return (
    <div className="dashboard">

      <header className="header">
        <div>
          <h1>🌊 AquaSense</h1>
          <p>Smart Water Quality Monitoring System</p>
        </div>

        <span className="status">● System Online</span>
      </header>

      <section className="welcome">
        <h2>Water Quality Dashboard</h2>
        <p>
          Monitor and predict water quality using fuzzy logic.
        </p>
      </section>

      <section className="cards">

        <div className="card">
          <h3>Latest Quality Score</h3>
          <h2>{result ? result.quality_score : "—"}</h2>
          <p>Out of 100</p>
        </div>

        <div className="card">
          <h3>Water Status</h3>
          <h2>{result ? result.prediction : "Not tested"}</h2>
          <p>Latest prediction</p>
        </div>

        <div className="card">
          <h3>Total Predictions</h3>
          <h2>{history.length}</h2>
          <p>Saved records</p>
        </div>

        <div className="card">
          <h3>Average Score</h3>
          <h2>{averageScore}</h2>
          <p>All saved predictions</p>
        </div>

      </section>

      <section className="main-grid">

        <div className="panel">

          <h2>Enter Water Parameters</h2>

          <label>pH Value</label>
          <input
            type="number"
            name="ph"
            min="0"
            max="14"
            step="0.1"
            value={form.ph}
            onChange={handleChange}
          />

          <label>Turbidity (NTU)</label>
          <input
            type="number"
            name="turbidity"
            min="0"
            max="100"
            step="0.1"
            value={form.turbidity}
            onChange={handleChange}
          />

          <label>Temperature (°C)</label>
          <input
            type="number"
            name="temperature"
            min="0"
            max="50"
            step="0.1"
            value={form.temperature}
            onChange={handleChange}
          />

          <label>Dissolved Oxygen (mg/L)</label>
          <input
            type="number"
            name="dissolved_oxygen"
            min="0"
            max="14"
            step="0.1"
            value={form.dissolved_oxygen}
            onChange={handleChange}
          />

          <button
            onClick={handlePredict}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Predict Water Quality"}
          </button>

          {error && (
            <p className="error">{error}</p>
          )}

        </div>

        <div className="panel result-panel">

          <h2>Prediction Result</h2>

          {result ? (
            <>
              <div className="score">
                {result.quality_score}
                <span>/100</span>
              </div>

              <h2 className="prediction">
                {result.prediction}
              </h2>

              <p>
                Water quality prediction completed successfully.
              </p>
            </>
          ) : (
            <div className="empty">
              <h3>No prediction yet</h3>
              <p>Enter parameters and click Predict.</p>
            </div>
          )}

        </div>

      </section>

      <section className="panel chart-panel">

        <h2>Water Quality Score Trend</h2>

        {history.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>

            <LineChart
              data={[...history].reverse()}
              margin={{
                top: 15,
                right: 20,
                left: 0,
                bottom: 5
              }}
            >

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="time" />

              <YAxis domain={[0, 100]} />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="score"
                stroke="#078b9b"
                strokeWidth={3}
                dot={{ r: 5 }}
                name="Quality Score"
              />

            </LineChart>

          </ResponsiveContainer>
        ) : (
          <p className="empty">
            Your score chart will appear after predictions.
          </p>
        )}

      </section>

      <section className="panel history-panel">

        <h2>Prediction History</h2>

        {history.length > 0 ? (

          <div className="table-scroll">

            <table>

              <thead>
                <tr>
                  <th>Time</th>
                  <th>pH</th>
                  <th>Turbidity</th>
                  <th>Temperature</th>
                  <th>Oxygen</th>
                  <th>Score</th>
                  <th>Prediction</th>
                </tr>
              </thead>

              <tbody>

                {history.map(item => (
                  <tr key={item.id}>
                    <td>{item.time}</td>
                    <td>{item.ph}</td>
                    <td>{item.turbidity}</td>
                    <td>{item.temperature}°C</td>
                    <td>{item.dissolved_oxygen}</td>
                    <td>{item.score}</td>
                    <td>{item.prediction}</td>
                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        ) : (
          <p className="empty">
            No prediction records available yet.
          </p>
        )}

      </section>

      <footer>
        <p>
          © 2026 AquaSense | Smart Water Quality Prediction
        </p>
      </footer>

    </div>
  );
}

export default App;
