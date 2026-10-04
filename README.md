# ⚡ ENERSENSE

### Predict. Shift. Measure. Care.

> **An AI-powered energy intelligence layer for smart buildings that predicts demand, identifies flexible energy use, recommends better consumption timings, and estimates the impact of energy-shifting actions.**

---

## 📌 Overview

**ENERSENSE** is an AI-powered building energy intelligence platform designed to make energy management more **predictive, actionable, human-aware, and measurable**.

Traditional building-energy dashboards primarily tell facility managers what has already happened:

> "The building consumed 340 kW."

ENERSENSE goes one step further:

> **"Demand is expected to rise, approximately X kW may be flexible, and here is what can potentially be shifted to reduce the upcoming peak."**

The platform combines:

- Building-energy data
- Historical consumption patterns
- Weather context
- Seasonal patterns
- Time-of-Day tariff context
- Demand forecasting
- Peak detection
- Flexibility estimation
- Human-facing recommendations
- What-If demand-response simulation
- Impact verification

The current MVP demonstrates this intelligence pipeline using **real Indian building-energy data from the I-BLEND dataset through historical replay**.

The architecture is designed so that the same intelligence layer can later consume live data from smart meters, BMS/EMS systems, BACnet, MQTT, or other building data sources.

---

# 🎯 Problem Statement

Buildings consume significant amounts of electricity across:

- HVAC systems
- Lighting
- Appliances
- EV charging
- Pumps
- Computing equipment
- Other flexible and non-flexible loads

However, conventional energy dashboards often focus on **monitoring** rather than **decision support**.

Facility managers may know:

- Current consumption
- Historical consumption
- Energy costs
- Peak demand

But they may not have a simple answer to:

### 1. What will demand look like next?

A building may be approaching a high-demand period, but the information may not be presented in an actionable way.

### 2. What energy use can potentially be shifted?

Not every load needs to operate at the same time.

Some activities can potentially be moved to another period without affecting essential building operations.

### 3. What should occupants do?

Energy intelligence is often presented in technical terms that are difficult for occupants to act upon.

### 4. What would happen if we reduced demand?

Facility managers need a way to test a hypothetical demand-response action before implementing it.

### 5. Did the action actually help?

A recommendation is more useful when its estimated impact can be quantified and verified.

---

# 💡 ENERSENSE Solution

ENERSENSE creates an intelligence layer between raw building-energy data and human decision-making.

```text
             BUILDING ENERGY DATA
                     │
                     ▼
          ┌──────────────────────┐
          │ Historical / Live    │
          │ Energy Information   │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Context Layer        │
          │                      │
          │ Weather              │
          │ Tariff               │
          │ Season               │
          │ Calendar             │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Demand Forecasting   │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Peak Detection       │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Flexibility          │
          │ Estimation           │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Recommendation       │
          │ Engine               │
          └──────────┬───────────┘
                     │
              ┌──────┴───────┐
              ▼              ▼
       Facility Manager    Occupant
          Dashboard       Dashboard
              │
              ▼
       What-If Simulation
              │
              ▼
       Impact Verification
