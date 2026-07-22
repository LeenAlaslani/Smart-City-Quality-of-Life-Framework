# AI-Driven Smart City Quality of Life Framework

## 1. Project Overview

The **AI-Driven Smart City Quality of Life Framework** is a modular machine-learning project designed to support cities in becoming safer, more sustainable, efficient, and citizen-centered.

The framework studies multiple Smart City aspects rather than focusing on a single urban problem. Each aspect is implemented as an independent notebook with its own real-world datasets, preprocessing pipeline, exploratory data analysis, feature engineering, target variable, and machine-learning models.

The notebooks are connected by one higher-level goal:

> **Use real-world urban data and machine learning to improve quality of life through safer mobility, efficient resource use, responsive public services, and environmental risk awareness.**

## 2. Core Project Principle

The project does **not** merge every Smart City dataset into one large table.

Instead:

- Each Smart City aspect solves a separate machine-learning problem.
- Each notebook uses datasets that are logically and technically compatible within that aspect.
- Three models are trained and compared inside each notebook.
- Results are combined at the decision-support level through common quality-of-life outcomes.
- Model scores from different notebooks are not compared directly because the tasks and evaluation metrics are different.

---

## 3. Project Structure

| Notebook | Smart City Aspect | Main Objective | Status |
|---|---|---|---|
| **Smart London Urban Risk Prediction** | Transportation and Safety | Predict high-risk urban hours and identify conditions associated with elevated road-collision risk | Core |
| **Smart Building Energy Prediction** | Energy and Sustainable Buildings | Predict building energy consumption and identify periods or buildings associated with unusually high demand | Core |
| **Smart Public Service Response** | Governance and Digital Services | Predict public-service requests that are likely to experience delayed resolution | Core |
| **Smart Urban Air Quality Forecasting** | Smart Environment | Forecast harmful air-pollution levels and support early environmental warnings | Optional |

---

# Module 1: Smart London Urban Risk Prediction

## Smart City Aspect

**Smart Transportation and Mobility / Urban Safety**

## Objective

Predict high-risk urban hours in London using historical road collisions, weather conditions, air-quality indicators, temporal patterns, and bike-sharing activity.

The primary focus is **urban road risk**. Bike-sharing activity and air quality are supporting urban indicators, not the central targets.

## Geographic and Temporal Scope

- **Location:** Greater London, United Kingdom
- **Recommended common period:** 2015–2016
- **Final observation level:** One London hour, or one station-hour if the analysis preserves air-monitoring stations

The common period is limited by the London bike-sharing dataset and the historical UK road-safety dataset.

## Dataset Specifications

### 1. UK DEFRA AURN Air Quality Data 2015–2023

- **Source:** Kaggle dataset derived from the UK DEFRA Automatic Urban and Rural Network
- **Data type:** Real hourly monitoring data
- **Coverage:** United Kingdom, 2015 to October 2023
- **Project filter:** London monitoring stations and the 2015–2016 common period
- **Granularity:** Monitoring station × hour
- **Main variables:**
  - `site`
  - `code`
  - `date`
  - `co`
  - `nox`
  - `no2`
  - `no`
  - `o3`
  - `so2`
  - `pm10`
  - `pm2.5`
  - Air temperature and station coordinates
- **Role in the module:** Environmental and urban-activity indicators
- **Important limitation:** Measurements come from multiple stations. The data must be aggregated to one row per hour or retained at station-hour level using a clear spatial design.
- **Reference:** https://www.kaggle.com/datasets/airqualityanthony/uk-defra-aurn-air-quality-data-2015-2023

### 2. London Weather 2000–2023

- **Source:** Kaggle; observations collected through Meteostat
- **Data type:** Real daily weather observations
- **Coverage:** January 1, 2000 to January 1, 2023
- **Size:** 8,402 rows and 10 columns
- **Project filter:** 2015–2016
- **Granularity:** Day
- **Main variables:**
  - `tavg`
  - `tmin`
  - `tmax`
  - `prcp`
  - `snow`
  - `wdir`
  - `wspd`
  - `wpgt`
  - `pres`
  - `tsun`
- **Role in the module:** Daily weather context for road-risk prediction
- **Merge key:** Calendar date
- **Important limitation:** Daily weather values repeat across all hours of the same day after merging. This is expected and is not a duplicate-data error.
- **Reference:** https://www.kaggle.com/datasets/noahx1/london-weather-2000-2023

### 3. London Bike Sharing Dataset

- **Source:** Kaggle; powered by Transport for London open data
- **Data type:** Real hourly bike-sharing activity
- **Coverage:** Approximately 2015–2017
- **Size:** 17,414 hourly rows and 10 columns
- **Recommended common period:** 2015–2016
- **Granularity:** Hour
- **Main variables:**
  - `timestamp`
  - `cnt`: number of new bike-share trips during the hour
  - `t1`: actual temperature
  - `t2`: feels-like temperature
  - `hum`
  - `wind_speed`
  - `weather_code`
  - `is_holiday`
  - `is_weekend`
  - `season`
- **Role in the module:** Supporting indicator of urban mobility activity
- **Merge key:** Hourly timestamp
- **Important limitation:** `cnt` represents shared-bike activity only. It does not represent all London traffic and does not indicate that recorded collisions involved cyclists.
- **Reference:** https://www.kaggle.com/datasets/hmavrodiev/london-bike-sharing-dataset

### 4. UK Road Safety: Traffic Accidents and Vehicles

- **Source:** Kaggle dataset based on UK Department for Transport road-safety records
- **Data type:** Real reported personal-injury collision data
- **Coverage:** 2005–2017
- **Project filter:** Greater London and the 2015–2016 common period
- **Granularity:** Individual collision, with related vehicle-level records
- **Main collision variables may include:**
  - Accident identifier
  - Date and time
  - Latitude and longitude
  - Local authority or police area
  - Accident severity
  - Number of vehicles
  - Number of casualties
  - Road type
  - Speed limit
  - Light conditions
  - Weather conditions
  - Road-surface conditions
- **Role in the module:** Main target source
- **Required preparation:** Aggregate individual collisions to hourly collision counts or high-risk-hour labels before merging.
- **Important limitation:** The data describe reported personal-injury road collisions, not every minor incident on the road.
- **Reference:** https://www.kaggle.com/datasets/tsiaras/uk-road-safety-accidents-and-vehicles

## Target Definition

Recommended classification target:

```text
high_risk_hour = 1 if the hourly collision count is above a threshold
                 or if the hour includes a serious/fatal collision
high_risk_hour = 0 otherwise
```

The collision-count threshold must be calculated using the **training data only** to avoid leakage.

An alternative regression target is:

```text
collision_count
```

## Recommended Feature Engineering

- Hour, day of week, month, season
- Weekend, night, and rush-hour indicators
- Cyclical encoding for hour and weekday
- Rain, strong wind, extreme temperature, and adverse-weather score
- Standardized pollution indicators and a combined pollution score
- Previous collision counts:
  - 1-hour lag
  - 24-hour lag
  - 168-hour lag
  - 24-hour and 7-day rolling averages
- Log-transformed bike activity
- Interaction features:
  - Rain × rush hour
  - Night × weekend
  - Mobility activity × adverse weather
  - Pollution × low wind speed

## Candidate Models

1. **Logistic Regression** — baseline classification model
2. **Random Forest Classifier**
3. **XGBoost or LightGBM Classifier**

## Evaluation Metrics

Because high-risk hours may be imbalanced:

- Recall
- Precision
- F1-score
- PR-AUC
- ROC-AUC
- Confusion matrix

Accuracy should not be used as the only evaluation metric.

## Expected Decision-Support Output

- High-risk hour warnings
- Temporal risk profiles
- Weather-related risk insights
- Conditions associated with serious collisions
- Recommendations for proactive road-safety resource allocation

---

# Module 2: Smart Building Energy Prediction

## Smart City Aspect

**Smart Energy and Sustainable Buildings**

## Objective

Predict hourly building energy consumption and identify buildings or time periods associated with unusually high energy demand.

This module supports energy-efficiency planning, peak-demand management, anomaly detection, and more sustainable building operations.

## Dataset

### ASHRAE Great Energy Predictor III

- **Source:** ASHRAE/Kaggle competition
- **Data type:** Real building-meter, weather, and building-metadata data
- **Scale:** More than 20 million training observations
- **Buildings:** 1,448
- **Meters:** 2,380
- **Sites:** 16 data-source locations
- **Granularity:** Building meter × hour
- **Meter types:**
  - Electricity
  - Chilled water
  - Steam
  - Hot water
- **Main files:**

#### `train.csv`

- `building_id`
- `meter`
- `timestamp`
- `meter_reading`

#### `building_metadata.csv`

- `site_id`
- `building_id`
- `primary_use`
- `square_feet`
- `year_built`
- `floor_count`

#### `weather_train.csv`

- `site_id`
- `timestamp`
- `air_temperature`
- `cloud_coverage`
- `dew_temperature`
- `precip_depth_1_hr`
- `sea_level_pressure`
- `wind_direction`
- `wind_speed`

- **Merge keys:**
  - `building_id`
  - `site_id`
  - `timestamp`
- **Target:** `meter_reading`
- **Problem type:** Regression
- **Important limitation:** The dataset is very large. Memory-efficient loading, dtype optimization, chunking, or sampling may be required.
- **Reference:** https://www.kaggle.com/c/ashrae-energy-prediction

## Recommended Feature Engineering

- Hour, weekday, month, season, weekend
- Building age
- Log-transformed floor area
- Meter type encoding
- Temperature and dew-point difference
- Heating-degree and cooling-degree indicators
- Previous-hour and previous-day consumption
- 24-hour and 7-day rolling consumption
- Consumption per square foot for analysis
- Building-use interactions
- Temperature × building-use interaction

## Candidate Models

1. **Linear Regression or Ridge Regression** — baseline
2. **Random Forest Regressor or HistGradientBoosting Regressor**
3. **LightGBM or XGBoost Regressor**

## Evaluation Metrics

- RMSLE
- RMSE
- MAE
- R²

## Expected Decision-Support Output

- Predicted energy demand
- Peak-demand periods
- High-consumption building categories
- Abnormal energy-use patterns
- Energy-efficiency recommendations

---

# Module 3: Smart Public Service Response

## Smart City Aspect

**Smart Governance and Digital Services**

## Objective

Predict which public-service requests are likely to experience delayed resolution so that municipal agencies can prioritize cases and allocate resources more effectively.

## Dataset

### NYC 311 Service Requests

- **Source:** NYC Open Data; also available through Kaggle
- **Data type:** Real public-service requests submitted by residents
- **Coverage:** 2010 to present
- **Scale:** More than 40 million rows before NYC split the source into separate historical periods
- **Update frequency:** Daily
- **Recommended manageable scope:**
  - Use a fixed multi-year period, such as 2022–2024, or
  - Select specific agencies or high-volume complaint categories
- **Granularity:** One service request
- **Main variables:**
  - `Unique Key`
  - `Created Date`
  - `Closed Date`
  - `Agency`
  - `Agency Name`
  - `Complaint Type`
  - `Descriptor`
  - `Location Type`
  - `Incident Zip`
  - `Borough`
  - `City`
  - `Status`
  - `Due Date`
  - `Resolution Description`
  - `Latitude`
  - `Longitude`
  - `Open Data Channel Type`
- **Target options:**

### Classification

```text
delayed_request = 1 if the request exceeds its due date
                  or exceeds a complaint-specific resolution threshold
delayed_request = 0 otherwise
```

### Regression

```text
resolution_time_hours = Closed Date - Created Date
```

- **Problem type:** Classification is recommended for a clear municipal early-warning use case.
- **Important leakage rule:** Do not use `Closed Date`, final status, or resolution text as input features when predicting delay at the time the request is created.
- **Official 2020–present source:** https://data.cityofnewyork.us/Social-Services/311-Service-Requests-from-2020-to-Present/erm2-nwe9
- **Historical 2010–2019 source:** https://catalog.data.gov/dataset/311-service-requests-from-2010-to-2019
- **Kaggle source:** https://www.kaggle.com/datasets/new-york-city/ny-311-service-requests

## Recommended Feature Engineering

- Request hour, weekday, month, and season
- Weekend and after-hours indicators
- Agency and complaint-type encoding
- Borough and location-type encoding
- Channel type
- Historical average resolution time by complaint type
- Historical agency workload
- Number of requests created in the same borough/day
- Complaint-category frequency
- Distance or spatial-zone features, if needed

All historical aggregate features must be calculated using past data only.

## Candidate Models

1. **Logistic Regression** — baseline
2. **Random Forest Classifier**
3. **XGBoost, LightGBM, or CatBoost Classifier**

## Evaluation Metrics

- Recall
- Precision
- F1-score
- PR-AUC
- ROC-AUC
- Confusion matrix

## Expected Decision-Support Output

- Early identification of requests at risk of delay
- Agency workload insights
- Complaint categories with long resolution times
- Geographic service-response gaps
- Resource-prioritization recommendations

---

# Optional Module 4: Smart Urban Air Quality Forecasting

## Smart City Aspect

**Smart Environment**

## Objective

Forecast harmful urban air-pollution levels and identify weather and temporal conditions associated with pollution spikes.

In Module 1, air quality is only a supporting transportation-risk feature. In this optional module, air quality becomes the primary target and environmental focus.

## Dataset

### Beijing Multi-Site Air Quality Dataset

- **Source:** UCI Machine Learning Repository
- **Data type:** Real hourly air-quality and meteorological observations
- **Location:** Beijing, China
- **Coverage:** March 1, 2013 to February 28, 2017
- **Size:** 420,768 instances
- **Stations:** 12 nationally controlled air-quality monitoring sites
- **Granularity:** Station × hour
- **Pollution variables:**
  - `PM2.5`
  - `PM10`
  - `SO2`
  - `NO2`
  - `CO`
  - `O3`
- **Meteorological variables:**
  - `TEMP`
  - `PRES`
  - `DEWP`
  - `RAIN`
  - `wd`
  - `WSPM`
- **Additional variables:**
  - Year
  - Month
  - Day
  - Hour
  - Station
- **Missing values:** Present and must be handled explicitly
- **License:** CC BY 4.0
- **Target options:**
  - Next-hour `PM2.5`
  - Next-6-hour average `PM2.5`
  - High-pollution warning category
- **Problem type:** Regression or classification
- **Reference:** https://archive.ics.uci.edu/dataset/501/beijing+multi+site+air+quality+data

## Recommended Feature Engineering

- Hour, weekday, month, and season
- Cyclical hour/month encoding
- Pollutant lags: 1, 3, 6, and 24 hours
- Rolling pollution averages
- Wind-direction encoding
- Low-wind pollution-trapping indicator
- Temperature inversion proxy
- Rain indicator
- Station encoding
- Cross-pollutant interaction features

## Candidate Models

1. **Linear Regression or Ridge Regression** — baseline
2. **Random Forest Regressor**
3. **XGBoost or LightGBM Regressor**

## Evaluation Metrics

- MAE
- RMSE
- R²

For a warning-classification target:

- Recall
- F1-score
- PR-AUC

## Expected Decision-Support Output

- Pollution-spike forecasts
- Early health-warning indicators
- Station-level pollution patterns
- Weather conditions associated with poor air quality
- Environmental monitoring recommendations

---

# 4. Standard Workflow for Every Notebook

Each notebook should follow the same high-level structure:

1. **Problem definition**
2. **Dataset download and source verification**
3. **Data dictionary**
4. **Data cleaning**
5. **Missing-value and duplicate analysis**
6. **Dataset filtering and internal merging**
7. **Exploratory data analysis**
8. **Feature engineering**
9. **Time-aware train/validation/test split**
10. **Baseline model**
11. **Two additional machine-learning models**
12. **Hyperparameter tuning**
13. **Model comparison**
14. **Feature importance or SHAP analysis**
15. **Final insights**
16. **Smart City recommendations**
17. **Limitations and ethical considerations**

---

# 5. Project-Wide Technical Requirements

- Use real-world, traceable datasets only.
- Keep a clear source link and license note for every dataset.
- Do not commit very large raw datasets to GitHub.
- Provide reproducible download scripts or Kaggle API instructions.
- Use time-based splitting for time-series prediction.
- Calculate thresholds and aggregate features from training data only.
- Prevent target leakage.
- Validate merge cardinality using `validate=` in pandas merges.
- Document the final observation level for every merged table.
- Compare models only within the same notebook.
- Include a baseline model before complex models.
- Report more than one evaluation metric.
- Explain model limitations.
- Do not interpret correlation as causation.
- Translate model outputs into concrete quality-of-life or city-management recommendations.

---

# 6. Recommended Repository Structure

```text
AI-Driven-Smart-City-Quality-of-Life-Framework/
│
├── README.md
├── requirements.txt
├── .gitignore
│
├── notebooks/
│   ├── 01_transportation_safety/
│   │   └── smart_london_urban_risk_prediction.ipynb
│   │
│   ├── 02_energy_buildings/
│   │   └── smart_building_energy_prediction.ipynb
│   │
│   ├── 03_governance_services/
│   │   └── smart_public_service_response.ipynb
│   │
│   └── 04_environment_optional/
│       └── smart_urban_air_quality_forecasting.ipynb
│
├── src/
│   ├── data_loading/
│   ├── preprocessing/
│   ├── feature_engineering/
│   ├── modeling/
│   └── evaluation/
│
├── reports/
│   ├── figures/
│   ├── model_results/
│   └── final_recommendations/
│
└── data/
    └── README.md
```

The `data/README.md` file should explain how to download each dataset. Raw large files should be excluded using `.gitignore`.

---

# 7. Final Framework Outcome

The final project should demonstrate how machine learning can support several connected dimensions of urban quality of life:

- **Safety:** Predicting high-risk transportation periods
- **Sustainability:** Forecasting and reducing building energy demand
- **Service efficiency:** Identifying public requests at risk of delay
- **Environmental health:** Forecasting harmful pollution levels, if the optional module is included

The framework is therefore broader than a single traffic, energy, governance, or pollution project. It is a collection of specialized machine-learning systems working under one Smart City quality-of-life vision.
