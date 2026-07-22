# AI-Driven Smart City Quality of Life Framework

## Main Goal

Build a multi-aspect machine-learning project that helps cities improve quality of life through safer mobility, efficient energy use, better public services, and optional environmental monitoring.

Each Smart City aspect is developed in a separate notebook with its own datasets, target, feature engineering, models, and evaluation. The notebooks are connected by the same overall Smart City goal, but their raw datasets are not merged together.

---

## Project Structure

| Notebook | Smart City Aspect | Main Goal |
|---|---|---|
| 01. Smart London Urban Risk Prediction | Transportation and Safety | Predict high-risk urban hours |
| 02. Smart Building Energy Prediction | Energy and Sustainable Buildings | Predict energy consumption and detect high-demand patterns |
| 03. Smart Public Service Response | Governance and Digital Services | Predict delayed public-service requests |
| 04. Smart Urban Air Quality Forecasting | Environment — Optional | Predict harmful pollution levels |

---

# Notebook 1: Smart London Urban Risk Prediction

## Goal
Predict high-risk hours in London using road collisions, weather, air quality, time patterns, and bike-sharing activity.

## Datasets
- UK Road Safety Accidents: main collision and severity data.
- London Weather: daily temperature, rain, wind, and pressure.
- UK DEFRA AURN Air Quality: hourly pollution measurements from London stations.
- London Bike Sharing: hourly mobility-activity indicator.

## Target
- Classification: `high_risk_hour`
- Alternative regression target: `collision_count`

## Notebook Contents
1. Load and verify all datasets.
2. Filter the common location and time period.
3. Clean missing values and duplicates.
4. Aggregate all datasets to the same hourly level.
5. Merge using date and hour.
6. Perform EDA.
7. Create time, weather, pollution, mobility, lag, and interaction features.
8. Train three models.
9. Compare model results.
10. Explain the main urban-risk insights.

## Suggested Models
- Logistic Regression
- Random Forest
- XGBoost or LightGBM

## Main Metrics
- Recall
- Precision
- F1-score
- ROC-AUC or PR-AUC

---

# Notebook 2: Smart Building Energy Prediction

## Goal
Predict building energy consumption and identify buildings or periods with unusually high energy demand.

## Dataset
### ASHRAE Great Energy Predictor III

The dataset contains three connected files:

- `train.csv`: hourly meter readings and the target `meter_reading`
- `building_metadata.csv`: building use, size, construction year, and floor count
- `weather_train.csv`: hourly weather conditions for each site

## Merge Keys
- `building_id`
- `site_id`
- `timestamp`

## Target
- Regression: `meter_reading`

## Notebook Contents
1. Load the three ASHRAE files.
2. Check shape, data types, missing values, and duplicates.
3. Merge meter readings with building metadata.
4. Merge the result with weather data.
5. Perform EDA on consumption, building type, meter type, time, and weather.
6. Create time, building-age, weather, lag, rolling-average, and interaction features.
7. Split data using time order.
8. Train three regression models.
9. Compare model results.
10. Identify peak-demand periods and high-consumption building patterns.

## Suggested Models
- Linear or Ridge Regression
- Random Forest Regressor
- XGBoost or LightGBM Regressor

## Main Metrics
- MAE
- RMSE
- R²
- RMSLE

---

# Notebook 3: Smart Public Service Response

## Goal
Predict which city-service requests are likely to be delayed so agencies can prioritize work and allocate resources better.

## Dataset
### NYC 311 Service Requests

Main fields include:
- Created date
- Closed date
- Agency
- Complaint type
- Borough
- Location type
- Status
- Due date
- Service channel

## Target
Recommended classification target:

`delayed_request = 1` if resolution exceeds the allowed or expected time, otherwise `0`.

## Notebook Contents
1. Select a manageable date range.
2. Clean missing and duplicate requests.
3. Calculate resolution time.
4. Define the delayed-request target.
5. Perform EDA by agency, complaint type, borough, time, and delay.
6. Create time, workload, complaint-frequency, and historical-response features.
7. Train three classification models.
8. Compare results.
9. Identify the strongest causes or indicators of delay.

## Suggested Models
- Logistic Regression
- Random Forest
- XGBoost, LightGBM, or CatBoost

## Main Metrics
- Recall
- Precision
- F1-score
- PR-AUC

---

# Notebook 4: Smart Urban Air Quality Forecasting — Optional

## Goal
Predict future pollution levels and identify conditions linked to dangerous air-quality periods.

## Suggested Dataset
### Beijing Multi-Site Air Quality Dataset

It contains hourly pollution and weather measurements from multiple real monitoring stations.

## Target
- Regression: future `PM2.5`
- Alternative classification target: `high_pollution_warning`

## Notebook Contents
1. Clean station-level hourly data.
2. Handle missing pollution values.
3. Perform EDA by station, hour, month, weather, and pollutant.
4. Create lag, rolling-average, weather, wind, and time features.
5. Train three models.
6. Compare results.
7. Identify pollution-spike patterns and warning conditions.

## Suggested Models
- Ridge Regression
- Random Forest
- XGBoost or LightGBM

## Main Metrics
- MAE
- RMSE
- R²

---

## Shared Rule for All Notebooks

Every notebook must include:

1. Clear problem and target
2. Real dataset sources
3. Cleaning and preprocessing
4. EDA
5. Feature engineering
6. Three machine-learning models
7. Model comparison
8. Final insights
9. Smart City recommendations
10. Limitations

## Current Next Step

Start **Notebook 2: Smart Building Energy Prediction** using the ASHRAE dataset.
