import streamlit as st
import pandas as pd

import joblib

from pathlib import Path

# app settings
st.set_page_config(
    page_title="CityPulse AI",
    page_icon="🏙️",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# app folder
BASE_DIR = Path(__file__).resolve().parent


# load waste model
@st.cache_resource
def load_waste_bundle():

    model_path = (
        BASE_DIR
        / "models"
        / "waste_bundle.joblib"
    )

    return joblib.load(model_path)


try:

    waste_bundle = load_waste_bundle()

    waste_model = waste_bundle["model"]
    waste_features = waste_bundle["feature_columns"]

    waste_model_error = None

except Exception as error:

    waste_bundle = None
    waste_model = None
    waste_features = None

    waste_model_error = str(error)

# app style
st.markdown(
    """
    <style>

    .stApp {
        background-color: #f4f7fb;
    }

    .main .block-container {
        padding-top: 2rem;
        padding-bottom: 3rem;
        max-width: 1200px;
    }

    .hero {
        background: linear-gradient(120deg, #102a43, #16748f);
        padding: 45px;
        border-radius: 24px;
        color: white;
        margin-bottom: 30px;
    }

    .hero h1 {
        font-size: 48px;
        margin-bottom: 10px;
    }

    .hero p {
        font-size: 19px;
        max-width: 750px;
        line-height: 1.7;
    }

    .login-box {
        background-color: white;
        padding: 30px;
        border-radius: 22px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.05);
    }

    .app-card {
        background-color: white;
        padding: 24px;
        border-radius: 18px;
        border: 1px solid #e2e8f0;
        min-height: 165px;
        margin-bottom: 12px;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
    }

    .app-card h3 {
        color: #102a43;
        margin-bottom: 10px;
    }

    .app-card p {
        color: #52667a;
        line-height: 1.6;
    }

    .welcome-box {
        background-color: white;
        padding: 24px;
        border-radius: 18px;
        border: 1px solid #e2e8f0;
        margin-bottom: 25px;
    }

    .profile-box {
        background-color: white;
        padding: 24px;
        border-radius: 18px;
        border: 1px solid #e2e8f0;
        min-height: 260px;
    }

    .module-header {
        background-color: white;
        padding: 25px;
        border-radius: 18px;
        border: 1px solid #e2e8f0;
        margin-bottom: 20px;
    }

    .demo-badge {
        display: inline-block;
        background-color: #e8f3ff;
        color: #1769aa;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: bold;
    }

    div[data-testid="stMetric"] {
        background-color: white;
        border: 1px solid #e2e8f0;
        padding: 18px;
        border-radius: 16px;
    }

    div[data-testid="stButton"] button {
        border-radius: 12px;
        min-height: 45px;
    }

    div[data-testid="stForm"] {
        background-color: white;
        border: 1px solid #e2e8f0;
        padding: 24px;
        border-radius: 18px;
    }

    </style>
    """,
    unsafe_allow_html=True
)


# save app information
if "logged_in" not in st.session_state:
    st.session_state.logged_in = False

if "profile_ready" not in st.session_state:
    st.session_state.profile_ready = False

if "user_name" not in st.session_state:
    st.session_state.user_name = ""

if "user_email" not in st.session_state:
    st.session_state.user_email = ""

if "city_profile" not in st.session_state:
    st.session_state.city_profile = {}

if "advisor_messages" not in st.session_state:
    st.session_state.advisor_messages = []
    
if "waste_result" not in st.session_state:
    st.session_state.waste_result = None


# LOGIN PAGE
def login_page():

    st.markdown(
        """
        <div class="hero">
            <h1>CityPulse AI</h1>
            <p>
                One platform that helps governments understand city problems
                and prepare for future needs using data and artificial intelligence.
            </p>
        </div>
        """,
        unsafe_allow_html=True
    )

    left, middle, right = st.columns([1, 1.2, 1])

    with middle:

        st.markdown(
            """
            <div style="text-align:center; margin-bottom:20px;">
                <h2>Welcome to CityPulse</h2>
                <p style="color:#65758b;">
                    Sign in or create a simple demo account.
                </p>
            </div>
            """,
            unsafe_allow_html=True
        )

        sign_in_tab, create_tab = st.tabs(
            ["Sign In", "Create Account"]
        )

        with sign_in_tab:

            with st.form("sign_in_form"):

                email = st.text_input(
                    "Email",
                    placeholder="name@example.com",
                    key="sign_in_email"
                )

                password = st.text_input(
                    "Password",
                    type="password",
                    key="sign_in_password"
                )

                sign_in = st.form_submit_button(
                    "Sign In",
                    use_container_width=True
                )

            if sign_in:

                if email and password:

                    st.session_state.logged_in = True
                    st.session_state.profile_ready = False
                    st.session_state.user_email = email
                    st.session_state.user_name = email.split("@")[0].title()

                    st.rerun()

                else:
                    st.error("Please enter your email and password.")

        with create_tab:

            with st.form("create_account_form"):

                full_name = st.text_input(
                    "Full Name",
                    placeholder="Your name",
                    key="create_name"
                )

                new_email = st.text_input(
                    "Email Address",
                    placeholder="name@example.com",
                    key="create_email"
                )

                new_password = st.text_input(
                    "Create Password",
                    type="password",
                    key="create_password"
                )

                create_account = st.form_submit_button(
                    "Create Account",
                    use_container_width=True
                )

            if create_account:

                if full_name and new_email and new_password:

                    st.session_state.logged_in = True
                    st.session_state.profile_ready = False
                    st.session_state.user_name = full_name
                    st.session_state.user_email = new_email

                    st.rerun()

                else:
                    st.error("Please complete all fields.")

        st.caption(
            "This is a demo login for the project prototype."
        )


# CITY PROFILE PAGE
def city_profile_page():

    st.markdown(
        """
        <div class="module-header">
            <h1>Build Your City Profile</h1>
            <p>
                Add simple information about the city before starting
                the smart city assessment.
            </p>
        </div>
        """,
        unsafe_allow_html=True
    )

    old_profile = st.session_state.city_profile

    with st.form("city_profile_form"):

        st.subheader("City Information")

        col1, col2 = st.columns(2)

        with col1:

            city_name = st.text_input(
                "City Name",
                value=old_profile.get("city_name", ""),
                placeholder="Jeddah"
            )

            country = st.text_input(
                "Country",
                value=old_profile.get("country", ""),
                placeholder="Saudi Arabia"
            )

            user_role = st.selectbox(
                "Your Role",
                [
                    "City Manager",
                    "Data Analyst",
                    "Transportation Department",
                    "Energy Department",
                    "Public Services Department",
                    "Waste Management Department"
                ]
            )

        with col2:

            population = st.number_input(
                "Population",
                min_value=0,
                value=old_profile.get("population", 100000),
                step=1000
            )

            districts = st.number_input(
                "Number of Districts",
                min_value=1,
                value=old_profile.get("districts", 10),
                step=1
            )

            language = st.selectbox(
                "Preferred Language",
                ["English", "Arabic"]
            )

        goals = st.multiselect(
            "Main City Goals",
            [
                "Improve Transportation",
                "Reduce Energy Use",
                "Improve Public Services",
                "Improve Waste Collection",
                "Improve Quality of Life",
                "Reduce Environmental Problems"
            ],
            default=old_profile.get("goals", [])
        )

        st.subheader("Smart City Areas")

        selected_modules = st.multiselect(
            "Choose the areas you want to assess",
            [
                "Transportation",
                "Energy",
                "Public Services",
                "Waste Management"
            ],
            default=old_profile.get(
                "selected_modules",
                [
                    "Transportation",
                    "Energy",
                    "Public Services",
                    "Waste Management"
                ]
            )
        )

        create_profile = st.form_submit_button(
            "Save City Profile",
            use_container_width=True
        )

    if create_profile:

        if city_name and country:

            st.session_state.city_profile = {
                "city_name": city_name,
                "country": country,
                "role": user_role,
                "population": population,
                "districts": districts,
                "language": language,
                "goals": goals,
                "selected_modules": selected_modules
            }

            st.session_state.profile_ready = True

            st.rerun()

        else:
            st.error("Please enter the city name and country.")

# HOME PAGE
def home_page():

    profile = st.session_state.city_profile

    st.caption(
        f"Welcome, {st.session_state.user_name}"
    )

    st.markdown(
        f"""
        <div class="hero">
            <h1>{profile["city_name"]} Smart City Workspace</h1>
            <p>
                Understand the city needs, predict future problems
                and prepare better decisions in one platform.
            </p>
            <span class="demo-badge">Demo Mode</span>
        </div>
        """,
        unsafe_allow_html=True
    )

    col1, col2, col3 = st.columns(3)

    col1.metric(
        "Population",
        f'{profile["population"]:,}'
    )

    col2.metric(
        "Number of Districts",
        profile["districts"]
    )

    col3.metric(
        "Country",
        profile["country"]
    )

    st.write("")

    st.subheader("Choose a Smart City Area")

    col1, col2 = st.columns(2)

    with col1:

        st.markdown(
            """
            <div class="app-card">
                <h3>🚦 Smart Transportation</h3>
                <p>
                    Understand transportation risk and find times
                    that may need more city attention.
                </p>
            </div>
            """,
            unsafe_allow_html=True
        )

        if st.button(
            "Open Transportation",
            use_container_width=True,
            key="open_transportation"
        ):
            st.switch_page(transportation_page_link)

        st.write("")

        st.markdown(
            """
            <div class="app-card">
                <h3>🏛️ Public Services</h3>
                <p>
                    Find public service requests that may take
                    a long time to close.
                </p>
            </div>
            """,
            unsafe_allow_html=True
        )

        if st.button(
            "Open Public Services",
            use_container_width=True,
            key="open_governance"
        ):
            st.switch_page(governance_page_link)

    with col2:

        st.markdown(
            """
            <div class="app-card">
                <h3>⚡ Smart Energy</h3>
                <p>
                    Predict electricity demand and help buildings
                    use energy in a better way.
                </p>
            </div>
            """,
            unsafe_allow_html=True
        )

        if st.button(
            "Open Energy",
            use_container_width=True,
            key="open_energy"
        ):
            st.switch_page(energy_page_link)

        st.write("")

        st.markdown(
            """
            <div class="app-card">
                <h3>♻️ Waste Management</h3>
                <p>
                    Predict waste amount and help the city prepare
                    trucks and workers.
                </p>
            </div>
            """,
            unsafe_allow_html=True
        )

        if st.button(
            "Open Waste Management",
            use_container_width=True,
            key="open_waste"
        ):
            st.switch_page(waste_page_link)

    st.write("")
    st.subheader("Your City Goals")

    if profile["goals"]:

        goal_columns = st.columns(2)

        for index, goal in enumerate(profile["goals"]):
            goal_columns[index % 2].success(goal)

    else:
        st.info(
            "No city goals were selected. You can add them from Profile."
        )


# TRANSPORTATION PAGE
def transportation_page():

    st.markdown(
        """
        <div class="module-header">
            <h1>🚦 Smart Transportation</h1>
            <p>
                Understand transportation and road risk
                before problems become more serious.
            </p>
            <span class="demo-badge">Model will be connected later</span>
        </div>
        """,
        unsafe_allow_html=True
    )

    st.subheader("Transportation Assessment")

    with st.form("transportation_demo_form"):

        col1, col2 = st.columns(2)

        with col1:

            hour = st.slider(
                "Hour of the Day",
                min_value=0,
                max_value=23,
                value=8
            )

            day_type = st.selectbox(
                "Day Type",
                ["Weekday", "Weekend"]
            )

        with col2:

            weather = st.selectbox(
                "Weather Condition",
                ["Clear", "Rain", "Strong Wind", "High Temperature"]
            )

            traffic_level = st.selectbox(
                "Traffic Level",
                ["Low", "Medium", "High"]
            )

        transportation_button = st.form_submit_button(
            "Run Demo Assessment",
            use_container_width=True
        )

    if transportation_button:

        st.info(
            "The transportation model will use this information "
            "after it is connected."
        )


# ENERGY PAGE
def energy_page():

    st.markdown(
        """
        <div class="module-header">
            <h1>⚡ Smart Energy</h1>
            <p>
                Predict building electricity consumption
                and prepare for high demand.
            </p>
            <span class="demo-badge">Model will be connected later</span>
        </div>
        """,
        unsafe_allow_html=True
    )

    st.subheader("Building Energy Assessment")

    with st.form("energy_demo_form"):

        col1, col2 = st.columns(2)

        with col1:

            building_type = st.selectbox(
                "Building Type",
                [
                    "Office",
                    "Education",
                    "Residential",
                    "Hospital",
                    "Public Building"
                ]
            )

            building_area = st.number_input(
                "Building Area",
                min_value=1.0,
                value=1000.0
            )

        with col2:

            temperature = st.number_input(
                "Air Temperature",
                value=25.0
            )

            energy_hour = st.slider(
                "Hour",
                min_value=0,
                max_value=23,
                value=12
            )

        energy_button = st.form_submit_button(
            "Run Demo Assessment",
            use_container_width=True
        )

    if energy_button:

        st.info(
            "The energy model will use this information "
            "after it is connected."
        )


# GOVERNANCE PAGE
def governance_page():

    st.markdown(
        """
        <div class="module-header">
            <h1>🏛️ Smart Public Services</h1>
            <p>
                Find service requests that may need more attention
                before the resolution time becomes long.
            </p>
            <span class="demo-badge">Model will be connected later</span>
        </div>
        """,
        unsafe_allow_html=True
    )

    st.subheader("Service Request Assessment")

    with st.form("governance_demo_form"):

        col1, col2 = st.columns(2)

        with col1:

            agency = st.text_input(
                "Government Agency",
                placeholder="Example: Housing Department"
            )

            complaint = st.text_input(
                "Complaint Type",
                placeholder="Example: Street Condition"
            )

        with col2:

            area = st.text_input(
                "Area",
                placeholder="District name"
            )

            request_hour = st.slider(
                "Request Hour",
                min_value=0,
                max_value=23,
                value=10
            )

        governance_button = st.form_submit_button(
            "Check Demo Request",
            use_container_width=True
        )

    if governance_button:

        st.info(
            "The public services model will check delay risk "
            "after it is connected."
        )










# prepare waste data for the model
def predict_waste_amount(
    borough,
    district,
    year,
    month_number,
    last_month,
    two_months
):

    input_data = pd.DataFrame(
        [
            {
                "borough": borough,
                "communitydistrict": district,
                "year": year,
                "month_number": month_number,
                "waste_last_month": last_month,
                "waste_2_months_ago": two_months
            }
        ]
    )

    input_data = pd.get_dummies(
        input_data,
        columns=[
            "borough",
            "communitydistrict"
        ],
        drop_first=True,
        dtype=int
    )

    input_data = input_data.reindex(
        columns=waste_features,
        fill_value=0
    )

    prediction = waste_model.predict(
        input_data
    )[0]

    return float(prediction)



 # WASTE PAGE
def waste_page():

    st.markdown(
        """
        <div class="module-header">
            <h1>♻️ Smart Waste Management</h1>
            <p>
                Predict the expected waste amount
                and prepare city resources before the next month.
            </p>
        </div>
        """,
        unsafe_allow_html=True
    )

    if waste_model_error:

        st.error(
            "The waste model could not be loaded."
        )

        with st.expander("Show error"):
            st.code(waste_model_error)

        return

    st.success(
        "Waste prediction model is connected."
    )

    with st.form("waste_prediction_form"):

        st.subheader("Waste Demand Information")

        col1, col2 = st.columns(2)

        with col1:

            borough = st.selectbox(
                "Borough",
                [
                    "Bronx",
                    "Brooklyn",
                    "Manhattan",
                    "Queens",
                    "Staten Island"
                ]
            )

            district = st.number_input(
                "Community District",
                min_value=1,
                max_value=20,
                value=1,
                step=1
            )

            month_number = st.selectbox(
                "Prediction Month",
                list(range(1, 13))
            )

        with col2:

            last_month = st.number_input(
                "Waste from Last Month",
                min_value=0.0,
                value=4000.0,
                step=100.0
            )

            two_months = st.number_input(
                "Waste from Two Months Ago",
                min_value=0.0,
                value=3900.0,
                step=100.0
            )

            year = st.number_input(
                "Year",
                min_value=2000,
                max_value=2035,
                value=2026,
                step=1
            )

        predict_button = st.form_submit_button(
            "Predict Waste Demand",
            use_container_width=True
        )

    if predict_button:

        try:

            prediction = predict_waste_amount(
                borough=borough,
                district=district,
                year=year,
                month_number=month_number,
                last_month=last_month,
                two_months=two_months
            )

            difference = prediction - last_month

            if last_month > 0:

                change_percent = (
                    difference / last_month
                ) * 100

            else:

                change_percent = 0

            if change_percent >= 10:

                status = "High Priority"

                recommendation = (
                    "Waste demand may increase strongly. "
                    "Prepare more collection resources "
                    "and review the collection schedule."
                )

            elif change_percent >= 5:

                status = "Needs Attention"

                recommendation = (
                    "Waste demand may increase. "
                    "Review trucks workers and collection times."
                )

            else:

                status = "Normal"

                recommendation = (
                    "The expected waste level is stable. "
                    "Continue monitoring the district."
                )

            st.session_state.waste_result = {
                "borough": borough,
                "district": district,
                "month": month_number,
                "year": year,
                "prediction": prediction,
                "difference": difference,
                "change_percent": change_percent,
                "status": status,
                "recommendation": recommendation,
                "last_month": last_month,
                "two_months": two_months
            }

        except Exception as error:

            st.error(
                "The prediction could not be completed."
            )

            with st.expander("Show error"):
                st.code(str(error))

    result = st.session_state.waste_result

    if result:

        st.divider()

        st.subheader("Prediction Result")

        col1, col2, col3 = st.columns(3)

        col1.metric(
            "Expected Waste",
            f'{result["prediction"]:,.0f} tons',
            f'{result["difference"]:+,.0f} tons'
        )

        col2.metric(
            "Change from Last Month",
            f'{result["change_percent"]:+.1f}%'
        )

        col3.metric(
            "Planning Status",
            result["status"]
        )

        st.subheader("City Recommendation")

        if result["status"] == "High Priority":

            st.error(
                result["recommendation"]
            )

        elif result["status"] == "Needs Attention":

            st.warning(
                result["recommendation"]
            )

        else:

            st.success(
                result["recommendation"]
            )

        chart_data = pd.DataFrame(
            {
                "Period": [
                    "Two Months Ago",
                    "Last Month",
                    "Predicted Month"
                ],
                "Waste Tons": [
                    result["two_months"],
                    result["last_month"],
                    result["prediction"]
                ]
            }
        ).set_index("Period")

        st.subheader("Waste Change")

        st.line_chart(
            chart_data,
            use_container_width=True
        )

        model_name = waste_bundle.get(
            "model_name",
            "Waste Prediction Model"
        )

        st.caption(
            f"Prediction created using {model_name}. "
            "The result is decision support and needs human review."
        )


# AI ADVISOR PAGE
def advisor_page():

    profile = st.session_state.city_profile

    st.markdown(
        f"""
        <div class="module-header">
            <h1>🤖 AI City Advisor</h1>
            <p>
                Ask simple questions about {profile["city_name"]}
                and understand the smart city results.
            </p>
            <span class="demo-badge">Demo Assistant</span>
        </div>
        """,
        unsafe_allow_html=True
    )

    if not st.session_state.advisor_messages:

        st.chat_message("assistant").write(
            f"Hello {st.session_state.user_name}. "
            f"I am ready to help with {profile['city_name']}."
        )

    for message in st.session_state.advisor_messages:

        with st.chat_message(message["role"]):
            st.write(message["content"])

    user_message = st.chat_input(
        "Ask about the city"
    )

    if user_message:

        st.session_state.advisor_messages.append(
            {
                "role": "user",
                "content": user_message
            }
        )

        demo_answer = (
            "I will answer this question using the latest results "
            "from the transportation energy public services "
            "and waste models after they are connected."
        )

        st.session_state.advisor_messages.append(
            {
                "role": "assistant",
                "content": demo_answer
            }
        )

        st.rerun()


# REPORTS PAGE
def reports_page():

    profile = st.session_state.city_profile

    st.markdown(
        """
        <div class="module-header">
            <h1>📄 City Reports</h1>
            <p>
                View the city information predictions
                and recommendations in one place.
            </p>
        </div>
        """,
        unsafe_allow_html=True
    )

    st.subheader(
        f'{profile["city_name"]} Report Preview'
    )

    col1, col2, col3 = st.columns(3)

    col1.metric(
        "Population",
        f'{profile["population"]:,}'
    )

    col2.metric(
        "Districts",
        profile["districts"]
    )

    col3.metric(
        "Connected Models",
        "0 of 4"
    )

    st.info(
        "The report will show real prediction results "
        "after connecting the four models."
    )


# PROFILE PAGE
def profile_view_page():

    profile = st.session_state.city_profile

    st.markdown(
        """
        <div class="module-header">
            <h1>👤 User and City Profile</h1>
            <p>
                View and manage the user account
                and city information.
            </p>
        </div>
        """,
        unsafe_allow_html=True
    )

    col1, col2 = st.columns(2)

    with col1:

        st.markdown(
            """
            <div class="profile-box">
                <h3>User Information</h3>
            </div>
            """,
            unsafe_allow_html=True
        )

        st.write(
            "**Name:**",
            st.session_state.user_name
        )

        st.write(
            "**Email:**",
            st.session_state.user_email
        )

        st.write(
            "**Role:**",
            profile["role"]
        )

    with col2:

        st.markdown(
            """
            <div class="profile-box">
                <h3>City Information</h3>
            </div>
            """,
            unsafe_allow_html=True
        )

        st.write(
            "**City:**",
            profile["city_name"]
        )

        st.write(
            "**Country:**",
            profile["country"]
        )

        st.write(
            "**Population:**",
            f'{profile["population"]:,}'
        )

        st.write(
            "**Districts:**",
            profile["districts"]
        )

    st.subheader("Development Goals")

    if profile["goals"]:

        for goal in profile["goals"]:
            st.write("✓", goal)

    else:
        st.write("No goals selected.")

    st.write("")

    col1, col2 = st.columns(2)

    with col1:

        if st.button(
            "Edit City Profile",
            use_container_width=True
        ):

            st.session_state.profile_ready = False
            st.rerun()

    with col2:

        if st.button(
            "Log Out",
            use_container_width=True
        ):

            st.session_state.logged_in = False
            st.session_state.profile_ready = False
            st.session_state.user_name = ""
            st.session_state.user_email = ""
            st.session_state.city_profile = {}
            st.session_state.advisor_messages = []

            st.rerun()


# show login first
if not st.session_state.logged_in:
    login_page()
    st.stop()


# create city profile after login
if not st.session_state.profile_ready:
    city_profile_page()
    st.stop()


# create app pages
home_page_link = st.Page(
    home_page,
    title="Home",
    icon="🏙️",
    default=True
)

transportation_page_link = st.Page(
    transportation_page,
    title="Transportation",
    icon="🚦"
)

energy_page_link = st.Page(
    energy_page,
    title="Energy",
    icon="⚡"
)

governance_page_link = st.Page(
    governance_page,
    title="Public Services",
    icon="🏛️"
)

waste_page_link = st.Page(
    waste_page,
    title="Waste",
    icon="♻️"
)

advisor_page_link = st.Page(
    advisor_page,
    title="AI Advisor",
    icon="🤖"
)

reports_page_link = st.Page(
    reports_page,
    title="Reports",
    icon="📄"
)

profile_page_link = st.Page(
    profile_view_page,
    title="Profile",
    icon="👤"
)


# top navigation
pages = {
    "": [
        home_page_link
    ],

    "Smart City Areas": [
        transportation_page_link,
        energy_page_link,
        governance_page_link,
        waste_page_link
    ],

    "Support": [
        advisor_page_link,
        reports_page_link,
        profile_page_link
    ]
}


current_page = st.navigation(
    pages,
    position="top"
)

current_page.run()
