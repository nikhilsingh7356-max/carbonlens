
import React, { useState, useMemo } from "react";
import {
  Leaf,
  Car,
  Utensils,
  Home,
  ShoppingBag,
  Plus,
  TrendingDown,
  Award,
  X,
  ChevronRight,
  Flame,
} from "lucide-react";
 
// ---------------------------------------------------------------------------
// Emissions factors (kg CO2e per unit) — simplified, illustrative figures
// ---------------------------------------------------------------------------
const ACTIVITY_LIBRARY = {
  transport: [
    { id: "car_km", label: "Drove (per km, petrol car)", factor: 0.192, unit: "km", icon: Car },
    { id: "transit_km", label: "Took public transit (per km)", factor: 0.041, unit: "km", icon: Car },
    { id: "flight_short", label: "Short flight (<3h)", factor: 250, unit: "flight", icon: Car },
    { id: "bike_km", label: "Biked or walked (per km)", factor: 0, unit: "km", icon: Car },
  ],
  food: [
    { id: "beef_meal", label: "Beef-based meal", factor: 6.6, unit: "meal", icon: Utensils },
    { id: "chicken_meal", label: "Chicken-based meal", factor: 1.8, unit: "meal", icon: Utensils },
    { id: "veg_meal", label: "Vegetarian meal", factor: 0.6, unit: "meal", icon: Utensils },
    { id: "vegan_meal", label: "Vegan meal", factor: 0.4, unit: "meal", icon: Utensils },
  ],
  home: [
    { id: "electricity_kwh", label: "Electricity used (per kWh)", factor: 0.35, unit: "kWh", icon: Home },
    { id: "gas_kwh", label: "Natural gas used (per kWh)", factor: 0.18, unit: "kWh", icon: Home },
    { id: "laundry_load", label: "Laundry load (cold wash)", factor: 0.3, unit: "load", icon: Home },
  ],
  goods: [
    { id: "online_order", label: "Online order delivered", factor: 1.2, unit: "order", icon: ShoppingBag },
    { id: "new_clothing", label: "New clothing item bought", factor: 8.0, unit: "item", icon: ShoppingBag },
    { id: "secondhand_item", label: "Secondhand item bought", factor: 0.5, unit: "item", icon: ShoppingBag },
  ],
};
 
const CATEGORY_META = {
  transport: { label: "Transport", color: "#5A7D5A", accent: "#8FA68E" },
  food: { label: "Food", color: "#B0763F", accent: "#D9A66C" },
  home: { label: "Home Energy", color: "#7A6248", accent: "#A8927A" },
  goods: { label: "Goods & Shopping", color: "#A65D45", accent: "#D97B4A" },
};
 
// Rough national average: ~16,000 kg CO2e / year -> ~44 kg/day
const DAILY_AVERAGE_KG = 44;
 
const SUGGESTIONS = {
  transport: [
    "Swap one car trip per week for transit — saves roughly 8 kg CO2e weekly.",
    "Combine errands into a single trip to cut short drives.",
    "Try biking for trips under 3 km a few times a week.",
  ],
  food: [
    "Replace one beef meal a week with a vegetarian option — saves roughly 6 kg CO2e.",
    "Plan meals to reduce food waste, which cuts both cost and emissions.",
    "Choose chicken or plant-based proteins for a few meals weekly.",
  ],
  home: [
    "Wash clothes in cold water — saves around 0.3 kg CO2e per load.",
    "Lower the thermostat by 1–2 degrees in winter.",
    "Unplug devices on standby to trim phantom electricity use.",
  ],
  goods: [
    "Batch online orders into fewer deliveries.",
    "Choose secondhand for one purchase this month — saves roughly 7.5 kg CO2e per item.",
    "Repair instead of replace where possible.",
  ],
};
 
function uid() {
  return Math.random().toString(36).slice(2, 10);
}
 
function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
 
function formatDate(d) {
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
 
// ---------------------------------------------------------------------------
// Seed data so the dashboard isn't empty on first load
// ---------------------------------------------------------------------------
function seedEntries() {
  const today = new Date();
  const entries = [];
  const pattern = [
    { day: 0, items: [["car_km", 12], ["beef_meal", 1], ["electricity_kwh", 9]] },
    { day: 1, items: [["transit_km", 8], ["veg_meal", 1], ["electricity_kwh", 7]] },
    { day: 2, items: [["car_km", 6], ["chicken_meal", 1], ["electricity_kwh", 8], ["online_order", 1]] },
    { day: 3, items: [["bike_km", 5], ["vegan_meal", 1], ["electricity_kwh", 6]] },
    { day: 4, items: [["car_km", 18], ["beef_meal", 1], ["electricity_kwh", 10]] },
    { day: 5, items: [["transit_km", 4], ["veg_meal", 1], ["electricity_kwh", 7], ["new_clothing", 1]] },
    { day: 6, items: [["car_km", 3], ["chicken_meal", 1], ["electricity_kwh", 9], ["laundry_load", 2]] },
  ];
 
  pattern.forEach(({ day, items }) => {
    const d = new Date(today);
    d.setDate(d.getDate() - day);
    items.forEach(([activityId, qty]) => {
      const def = Object.values(ACTIVITY_LIBRARY)
        .flat()
        .find((a) => a.id === activityId);
      const category = Object.keys(ACTIVITY_LIBRARY).find((cat) =>
        ACTIVITY_LIBRARY[cat].some((a) => a.id === activityId)
      );
      entries.push({
        id: uid(),
        date: d.toISOString(),
        category,
        activityId,
        label: def.label,
        quantity: qty,
        unit: def.unit,
        co2: +(def.factor * qty).toFixed(2),
      });
    });
  });
 
  return entries;
}
 
// ---------------------------------------------------------------------------
// Impact dial — signature element
// ---------------------------------------------------------------------------
function ImpactDial({ value, max, label, sublabel }) {
  const pct = Math.min(value / max, 1.25);
  const angle = Math.min(pct, 1) * 270; // 270 degree sweep
  const radius = 70;
  const circumference = (270 / 360) * 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.min(pct, 1));
 
  const overUnder = value <= max;
 
  return (
    <div className="dial-wrap">
      <svg viewBox="0 0 200 200" className="dial-svg">
        <g transform="rotate(135 100 100)">
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#E3DCCB"
            strokeWidth="14"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeLinecap="round"
          />
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={overUnder ? "#5A7D5A" : "#C2603F"}
            strokeWidth="14"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="dial-progress"
          />
        </g>
        {/* tick marks */}
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (135 + (i / 11) * 270) * (Math.PI / 180);
          const x1 = 100 + Math.cos(a) * 84;
          const y1 = 100 + Math.sin(a) * 84;
          const x2 = 100 + Math.cos(a) * 90;
          const y2 = 100 + Math.sin(a) * 90;
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#C9BFA8" strokeWidth="2" />
          );
        })}
      </svg>
      <div className="dial-center">
        <span className="dial-value">{value.toFixed(1)}</span>
        <span className="dial-unit">kg CO₂e</span>
        <span className="dial-label">{label}</span>
        {sublabel && <span className="dial-sublabel">{sublabel}</span>}
      </div>
    </div>
  );
}
 
// ---------------------------------------------------------------------------
// Category bar chart (weekly totals by category)
// ---------------------------------------------------------------------------
function CategoryBreakdown({ totals, grandTotal }) {
  const cats = Object.keys(CATEGORY_META);
  return (
    <div className="breakdown">
      {cats.map((cat) => {
        const val = totals[cat] || 0;
        const pct = grandTotal > 0 ? (val / grandTotal) * 100 : 0;
        const meta = CATEGORY_META[cat];
        return (
          <div className="breakdown-row" key={cat}>
            <div className="breakdown-label">
              <span className="dot" style={{ background: meta.color }} />
              {meta.label}
            </div>
            <div className="breakdown-bar-track">
              <div
                className="breakdown-bar-fill"
                style={{ width: `${pct}%`, background: meta.color }}
              />
            </div>
            <div className="breakdown-value">{val.toFixed(1)} kg</div>
          </div>
        );
      })}
    </div>
  );
}
 
// ---------------------------------------------------------------------------
// Log entry modal
// ---------------------------------------------------------------------------
function LogModal({ onClose, onAdd }) {
  const [category, setCategory] = useState("transport");
  const [activityId, setActivityId] = useState(ACTIVITY_LIBRARY.transport[0].id);
  const [quantity, setQuantity] = useState(1);
 
  const activity = ACTIVITY_LIBRARY[category].find((a) => a.id === activityId);
  const estimate = activity ? +(activity.factor * quantity).toFixed(2) : 0;
 
  function handleCategoryChange(cat) {
    setCategory(cat);
    setActivityId(ACTIVITY_LIBRARY[cat][0].id);
  }
 
  function handleSubmit(e) {
    e.preventDefault();
    onAdd({
      id: uid(),
      date: new Date().toISOString(),
      category,
      activityId,
      label: activity.label,
      quantity,
      unit: activity.unit,
      co2: estimate,
    });
    onClose();
  }
 
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Log an activity</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
 
        <form onSubmit={handleSubmit} className="modal-form">
          <label className="field-label">Category</label>
          <div className="cat-tabs">
            {Object.keys(ACTIVITY_LIBRARY).map((cat) => (
              <button
                type="button"
                key={cat}
                className={`cat-tab ${category === cat ? "active" : ""}`}
                style={category === cat ? { borderColor: CATEGORY_META[cat].color, color: CATEGORY_META[cat].color } : {}}
                onClick={() => handleCategoryChange(cat)}
              >
                {CATEGORY_META[cat].label}
              </button>
            ))}
          </div>
 
          <label className="field-label" htmlFor="activity">Activity</label>
          <select
            id="activity"
            value={activityId}
            onChange={(e) => setActivityId(e.target.value)}
            className="select"
          >
            {ACTIVITY_LIBRARY[category].map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
 
          <label className="field-label" htmlFor="quantity">
            Quantity ({activity.unit}{activity.unit.endsWith("s") ? "" : "s"})
          </label>
          <input
            id="quantity"
            type="number"
            min="0"
            step="0.5"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(0, parseFloat(e.target.value) || 0))}
            className="input"
          />
 
          <div className="estimate-preview">
            Estimated impact: <strong>{estimate.toFixed(2)} kg CO₂e</strong>
          </div>
 
          <button type="submit" className="btn-primary">Add entry</button>
        </form>
      </div>
    </div>
  );
}
 
// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------
export default function App() {
  const [entries, setEntries] = useState(() => seedEntries());
  const [showModal, setShowModal] = useState(false);
 
  const now = new Date();
  const weekStart = startOfWeek(now);
 
  const todayEntries = useMemo(
    () =>
      entries.filter((e) => {
        const d = new Date(e.date);
        return d.toDateString() === now.toDateString();
      }),
    [entries]
  );
 
  const weekEntries = useMemo(
    () =>
      entries.filter((e) => {
        const d = new Date(e.date);
        return d >= weekStart;
      }),
    [entries]
  );
 
  const todayTotal = todayEntries.reduce((sum, e) => sum + e.co2, 0);
  const weekTotal = weekEntries.reduce((sum, e) => sum + e.co2, 0);
 
  const weekTotals = useMemo(() => {
    const totals = {};
    weekEntries.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.co2;
    });
    return totals;
  }, [weekEntries]);
 
  // Determine top contributing category for personalized suggestion
  const topCategory = useMemo(() => {
    let max = -1;
    let cat = "transport";
    Object.entries(weekTotals).forEach(([k, v]) => {
      if (v > max) {
        max = v;
        cat = k;
      }
    });
    return cat;
  }, [weekTotals]);
 
  const suggestion = SUGGESTIONS[topCategory][0];
 
  // Streak: consecutive days (including today) under daily average
  const streak = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayTotal = entries
        .filter((e) => new Date(e.date).toDateString() === d.toDateString())
        .reduce((sum, e) => sum + e.co2, 0);
      if (dayTotal === 0 && i === 0) continue; // skip empty today
      if (dayTotal > 0 && dayTotal <= DAILY_AVERAGE_KG) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }, [entries, now]);
 
  // Last 7 days for mini trend
  const last7 = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const total = entries
        .filter((e) => new Date(e.date).toDateString() === d.toDateString())
        .reduce((sum, e) => sum + e.co2, 0);
      days.push({ date: d, total });
    }
    return days;
  }, [entries, now]);
 
  const maxDay = Math.max(...last7.map((d) => d.total), DAILY_AVERAGE_KG);
 
  function addEntry(entry) {
    setEntries((prev) => [entry, ...prev]);
  }
 
  const recentEntries = entries.slice(0, 8);
 
  return (
    <div className="app">
      <style>{STYLES}</style>
 
      <header className="header">
        <div className="brand">
          <Leaf size={26} strokeWidth={2.5} />
          <span className="brand-name">CarbonLens</span>
        </div>
        <button className="btn-primary btn-log" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Log activity
        </button>
      </header>
 
      <main className="main">
        <section className="hero">
          <div className="hero-text">
            <p className="eyebrow">Today's reading</p>
            <h1>
              Your footprint is{" "}
              <span style={{ color: todayTotal <= DAILY_AVERAGE_KG ? "#5A7D5A" : "#C2603F" }}>
                {todayTotal <= DAILY_AVERAGE_KG ? "below" : "above"}
              </span>{" "}
              the daily average.
            </h1>
            <p className="hero-sub">
              Average daily footprint is around {DAILY_AVERAGE_KG} kg CO₂e. Small, consistent
              choices shift this dial over time — log today's activities to keep your record
              current.
            </p>
            <div className="streak-pill">
              <Flame size={16} />
              {streak > 0
                ? `${streak}-day streak under your average`
                : "Log activities daily to build a streak"}
            </div>
          </div>
          <ImpactDial value={todayTotal} max={DAILY_AVERAGE_KG} label="Today" sublabel={`vs ${DAILY_AVERAGE_KG} kg avg`} />
        </section>
 
        <section className="grid">
          <div className="card">
            <h3 className="card-title">This week by category</h3>
            <CategoryBreakdown totals={weekTotals} grandTotal={weekTotal} />
            <div className="week-total">
              Week total: <strong>{weekTotal.toFixed(1)} kg CO₂e</strong>
            </div>
          </div>
 
          <div className="card">
            <h3 className="card-title">Last 7 days</h3>
            <div className="trend">
              {last7.map((d, i) => {
                const h = Math.max((d.total / maxDay) * 100, 2);
                const over = d.total > DAILY_AVERAGE_KG;
                return (
                  <div className="trend-col" key={i}>
                    <div className="trend-bar-track">
                      <div
                        className="trend-bar-fill"
                        style={{ height: `${h}%`, background: over ? "#C2603F" : "#5A7D5A" }}
                        title={`${d.total.toFixed(1)} kg`}
                      />
                    </div>
                    <span className="trend-label">{formatDate(d.date).split(" ")[0]}</span>
                  </div>
                );
              })}
            </div>
            <div className="legend">
              <span><span className="dot" style={{ background: "#5A7D5A" }} /> Under average</span>
              <span><span className="dot" style={{ background: "#C2603F" }} /> Over average</span>
            </div>
          </div>
 
          <div className="card suggestion-card">
            <div className="suggestion-icon">
              <TrendingDown size={22} />
            </div>
            <div>
              <h3 className="card-title">Your next best action</h3>
              <p className="suggestion-text">{suggestion}</p>
              <p className="suggestion-meta">
                Based on <strong>{CATEGORY_META[topCategory].label}</strong> being your largest
                category this week.
              </p>
            </div>
          </div>
 
          <div className="card">
            <h3 className="card-title">Recent activity</h3>
            <ul className="entry-list">
              {recentEntries.map((e) => {
                const Icon = Object.values(ACTIVITY_LIBRARY).flat().find((a) => a.id === e.activityId)?.icon || Leaf;
                return (
                  <li key={e.id} className="entry-row">
                    <span className="entry-icon" style={{ background: CATEGORY_META[e.category].accent }}>
                      <Icon size={15} />
                    </span>
                    <span className="entry-text">
                      {e.label} · {e.quantity} {e.unit}
                    </span>
                    <span className="entry-co2">{e.co2.toFixed(1)} kg</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
 
        <section className="card milestones">
          <div className="milestone-header">
            <Award size={20} />
            <h3 className="card-title" style={{ margin: 0 }}>Milestones</h3>
          </div>
          <div className="milestone-grid">
            <MilestoneBadge
              earned={streak >= 3}
              title="3-day streak"
              desc="Stayed under your daily average for 3 days running."
            />
            <MilestoneBadge
              earned={weekTotals.goods !== undefined && weekTotals.goods < 5}
              title="Low-impact shopper"
              desc="Kept goods & shopping emissions under 5 kg this week."
            />
            <MilestoneBadge
              earned={(weekTotals.food || 0) < 15}
              title="Plate of the planet"
              desc="Kept food emissions under 15 kg this week."
            />
            <MilestoneBadge
              earned={weekTotal < DAILY_AVERAGE_KG * 7}
              title="Below the curve"
              desc="Your weekly total is below the national weekly average."
            />
          </div>
        </section>
      </main>
 
      {showModal && <LogModal onClose={() => setShowModal(false)} onAdd={addEntry} />}
    </div>
  );
}
 
function MilestoneBadge({ earned, title, desc }) {
  return (
    <div className={`badge ${earned ? "earned" : ""}`}>
      <div className="badge-icon">
        <Award size={18} />
      </div>
      <div>
        <p className="badge-title">{title}</p>
        <p className="badge-desc">{desc}</p>
      </div>
      {earned && <ChevronRight size={16} className="badge-check" />}
    </div>
  );
}
 
// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
 
* { box-sizing: border-box; }
 
.app {
  min-height: 100vh;
  background: #F5F1E8;
  color: #2D3B2D;
  font-family: 'Inter', sans-serif;
  padding-bottom: 48px;
}
 
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 32px;
  border-bottom: 1px solid #E3DCCB;
  background: #FAF7F0;
}
 
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #2D3B2D;
}
 
.brand-name {
  font-family: 'Fraunces', serif;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.5px;
}
 
.btn-log {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
}
 
.main {
  max-width: 1000px;
  margin: 0 auto;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
 
.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  background: #FAF7F0;
  border: 1px solid #E3DCCB;
  border-radius: 18px;
  padding: 32px;
}
 
.eyebrow {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #8FA68E;
  margin: 0 0 8px 0;
}
 
.hero h1 {
  font-family: 'Fraunces', serif;
  font-size: 32px;
  font-weight: 600;
  line-height: 1.25;
  margin: 0 0 12px 0;
  max-width: 460px;
}
 
.hero-sub {
  color: #5A4A3A;
  font-size: 14px;
  line-height: 1.6;
  max-width: 440px;
  margin: 0 0 16px 0;
}
 
.streak-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #EFE9D8;
  color: #B0763F;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 999px;
}
 
.dial-wrap {
  position: relative;
  width: 200px;
  height: 200px;
  flex-shrink: 0;
}
 
.dial-svg {
  width: 100%;
  height: 100%;
}
 
.dial-progress {
  transition: stroke-dashoffset 0.6s ease;
}
 
.dial-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
 
.dial-value {
  font-family: 'Fraunces', serif;
  font-size: 36px;
  font-weight: 600;
  line-height: 1;
}
 
.dial-unit {
  font-size: 12px;
  color: #8A8068;
  margin-top: 2px;
}
 
.dial-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #5A7D5A;
  margin-top: 8px;
}
 
.dial-sublabel {
  font-size: 11px;
  color: #A8927A;
  margin-top: 2px;
}
 
.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}
 
.card {
  background: #FAF7F0;
  border: 1px solid #E3DCCB;
  border-radius: 16px;
  padding: 22px;
}
 
.card-title {
  font-family: 'Fraunces', serif;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
}
 
.breakdown {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
 
.breakdown-row {
  display: grid;
  grid-template-columns: 130px 1fr 60px;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}
 
.breakdown-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #5A4A3A;
}
 
.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
}
 
.breakdown-bar-track {
  height: 8px;
  background: #EFE9D8;
  border-radius: 999px;
  overflow: hidden;
}
 
.breakdown-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s ease;
}
 
.breakdown-value {
  text-align: right;
  font-weight: 600;
  color: #5A4A3A;
}
 
.week-total {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #E3DCCB;
  font-size: 13px;
  color: #5A4A3A;
}
 
.trend {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  height: 140px;
}
 
.trend-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}
 
.trend-bar-track {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
 
.trend-bar-fill {
  width: 60%;
  border-radius: 6px 6px 2px 2px;
  transition: height 0.4s ease;
  min-height: 4px;
}
 
.trend-label {
  font-size: 11px;
  color: #A8927A;
  margin-top: 6px;
}
 
.legend {
  display: flex;
  gap: 16px;
  margin-top: 14px;
  font-size: 12px;
  color: #8A8068;
}
 
.legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
 
.suggestion-card {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  background: #EFE9D8;
}
 
.suggestion-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #5A7D5A;
  color: #F5F1E8;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
 
.suggestion-text {
  font-size: 15px;
  font-weight: 500;
  line-height: 1.5;
  margin: 0 0 8px 0;
  color: #2D3B2D;
}
 
.suggestion-meta {
  font-size: 12px;
  color: #8A8068;
  margin: 0;
}
 
.entry-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 200px;
  overflow-y: auto;
}
 
.entry-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}
 
.entry-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2D3B2D;
  flex-shrink: 0;
}
 
.entry-text {
  flex: 1;
  color: #5A4A3A;
}
 
.entry-co2 {
  font-weight: 600;
  color: #2D3B2D;
}
 
.milestones {
  display: flex;
  flex-direction: column;
}
 
.milestone-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: #B0763F;
}
 
.milestone-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
 
.badge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid #E3DCCB;
  opacity: 0.5;
}
 
.badge.earned {
  opacity: 1;
  background: #EFE9D8;
  border-color: #C9BFA8;
}
 
.badge-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #E3DCCB;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8A8068;
  flex-shrink: 0;
}
 
.badge.earned .badge-icon {
  background: #5A7D5A;
  color: #F5F1E8;
}
 
.badge-title {
  font-size: 13px;
  font-weight: 700;
  margin: 0 0 2px 0;
}
 
.badge-desc {
  font-size: 12px;
  color: #8A8068;
  margin: 0;
}
 
.badge-check {
  margin-left: auto;
  color: #5A7D5A;
}
 
.btn-primary {
  background: #5A7D5A;
  color: #F5F1E8;
  border: none;
  border-radius: 10px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}
 
.btn-primary:hover {
  background: #4A6B4A;
}
 
.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #8A8068;
  display: flex;
  align-items: center;
}
 
/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(45, 59, 45, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 16px;
}
 
.modal {
  background: #FAF7F0;
  border-radius: 18px;
  padding: 28px;
  width: 100%;
  max-width: 420px;
  border: 1px solid #E3DCCB;
}
 
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
 
.modal-header h2 {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}
 
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
 
.field-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #8A8068;
  margin-top: 14px;
  margin-bottom: 6px;
}
 
.cat-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
 
.cat-tab {
  border: 1px solid #E3DCCB;
  background: #FFFFFF;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  color: #8A8068;
  transition: all 0.15s ease;
}
 
.cat-tab.active {
  border-width: 2px;
  background: #FFFFFF;
}
 
.select, .input {
  border: 1px solid #E3DCCB;
  background: #FFFFFF;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  color: #2D3B2D;
  width: 100%;
  font-family: 'Inter', sans-serif;
}
 
.estimate-preview {
  margin-top: 18px;
  background: #EFE9D8;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 13px;
  color: #5A4A3A;
}
 
.modal-form .btn-primary {
  margin-top: 18px;
  width: 100%;
}
 
@media (max-width: 768px) {
  .header { padding: 16px 20px; }
  .hero { flex-direction: column; padding: 24px; text-align: center; }
  .hero-text { order: 2; }
  .hero h1 { font-size: 24px; max-width: none; }
  .hero-sub { max-width: none; }
  .grid { grid-template-columns: 1fr; }
  .milestone-grid { grid-template-columns: 1fr; }
  .breakdown-row { grid-template-columns: 100px 1fr 50px; font-size: 12px; }
}
`;
