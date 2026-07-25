import streamlit as st


# application settings
st.set_page_config(
    page_title="CityPulse AI",
    page_icon="🏙️",
    layout="wide",
    initial_sidebar_state="collapsed"
)


# application style
st.markdown(
    """
    <style>

    .stApp {
        background-color: #f5f7fa;
    }

    .main .block-container {
        padding-top: 2rem;
        padding-bottom: 3rem;
        max-width: 1200px;
    }

    .hero {
        background: linear-gradient(120deg, #102a43, #176b87);
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

    .app-card {
        background-color: white;
        padding: 22px;
        border-radius: 18px;
        border: 1px solid #e2e8f0;
        min-height: 180px;
        margin-bottom: 15px;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
    }

    .app-card h3 {
        color: #102a43;
        margin-bottom: 10px;
    }

    .status-normal {
        color: #12805c;
        font-weight: bold;
    }

    .status-warning {
        color: #b7791f;
        font-weight: bold;
    }

    .status-high {
        color: #c53030;
        font-weight: bold;
    }

    .small-title {
        color: #52667a;
        font-size: 15px;
        margin-bottom: 4px;
    }

    div[data-testid="stMetric"] {
        background-color: white;
        border: 1px solid #e2e8f0;
        padding: 18px;
        border-radius: 16px;
    }

    </style>
    """,
    unsafe_allow_html=True
)


# HOME PAGE
def home_page():

    st.markdown(
        """
        <div class="hero">
            <h1>CityPulse AI</h1>
            <p>
                One smart city platform that helps governments understand city
                problems and prepare for future needs using data and artificial intelligence.
            </p>
        </div>
        """,
        unsafe_allow_html=True
    )

    st.subheader("Build a smarter city")

    st.write(
        "CityPulse AI connects transportation energy public services "
        "and waste management in one application."
    )

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.markdown(
            """
            <div class="app-card">
                <h3>🚦 Transportation</h3>
                <p>Find high risk times and help the city improve road safety.</p>
            </div>
            """,
            unsafe_allow_html=True
        )

    with col2:
        st.markdown(
            """
            <div class="app-card">
                <h3>⚡ Energy</h3>
                <p>Predict electricity use and prepare for high energy demand.</p>
            </div>
            """,
            unsafe_allow_html=True
        )

    with col3:
        st.markdown(
            """
            <div class="app-card">
                <h3>🏛️ Public Services</h3>
                <p>Find service requests that may take a long time to close.</p>
            </div>
            """,
            unsafe_allow_html=True
        )

    with col4:
        st.markdown(
            """
            <div class="app-card">
                <h3>♻️ Waste</h3>
                <p>Predict waste amount and help the city prepare trucks and workers.</p>
            </div>
            """,
            unsafe_allow_html=True
        )

    st.info("Demo Mode is active. The machine learning models will be connected later.")


# OVERVIEW PAGE
def overview_page():

    st.title("City Overview")
    st.caption("A simple view of the main city areas")

    col1, col2, col3, col4 = st.columns(4)

    col1.metric("Transportation", "Needs Attention", "Demo")
    col2.metric("Energy", "Normal", "Demo")
    col3.metric("Public Services", "High Priority", "Demo")
    col4.metric("Waste Demand", "Needs Attention", "Demo")

    st.subheader("City Priorities")

    st.markdown(
        """
        <div class="app-card">
            <p><b>1.</b> Review public service requests with high delay risk.</p>
            <p><b>2.</b> Prepare for higher waste demand in some districts.</p>
            <p><b>3.</b> Monitor electricity use during peak hours.</p>
            <p><b>4.</b> Review transportation conditions during risky times.</p>
        </div>
        """,
        unsafe_allow_html=True
    )


# TRANSPORTATION PAGE
def transportation_page():

    st.title("🚦 Smart Transportation")

    st.write(
        "This section will use the transportation model "
        "to predict high risk road conditions."
    )

    st.warning("The transportation model is not connected yet.")


# ENERGY PAGE
def energy_page():

    st.title("⚡ Smart Energy")

    st.write(
        "This section will predict electricity consumption "
        "for buildings using building weather and time information."
    )

    st.warning("The energy model is not connected yet.")


# GOVERNANCE PAGE
def governance_page():

    st.title("🏛️ Smart Public Services")

    st.write(
        "This section will predict if a public service request "
        "may take a long time to close."
    )

    st.warning("The governance model is not connected yet.")


# WASTE PAGE
def waste_page():

    st.title("♻️ Smart Waste Management")

    st.write(
        "This section will predict the expected waste amount "
        "for every district."
    )

    st.warning("The waste model is not connected yet.")


# AI ADVISOR PAGE
def advisor_page():

    st.title("🤖 AI City Advisor")

    st.write(
        "The AI Advisor will explain predictions "
        "and help the city make a simple action plan."
    )

    user_message = st.chat_input("Ask about the city")

    if user_message:
        st.chat_message("user").write(user_message)

        st.chat_message("assistant").write(
            "The AI Advisor will be connected after we finish "
            "the prediction pages."
        )


# REPORTS PAGE
def reports_page():

    st.title("📄 City Reports")

    st.write(
        "This page will show predictions recommendations "
        "and city priorities in one report."
    )

    st.info("Reports will be added later.")


# application pages
pages = {
    "": [
        st.Page(
            home_page,
            title="Home",
            icon="🏙️",
            default=True
        ),
        st.Page(
            overview_page,
            title="Overview",
            icon="📊"
        )
    ],

    "Smart City Areas": [
        st.Page(
            transportation_page,
            title="Transportation",
            icon="🚦"
        ),
        st.Page(
            energy_page,
            title="Energy",
            icon="⚡"
        ),
        st.Page(
            governance_page,
            title="Public Services",
            icon="🏛️"
        ),
        st.Page(
            waste_page,
            title="Waste",
            icon="♻️"
        )
    ],

    "Support": [
        st.Page(
            advisor_page,
            title="AI Advisor",
            icon="🤖"
        ),
        st.Page(
            reports_page,
            title="Reports",
            icon="📄"
        )
    ]
}


# show navigation at the top
current_page = st.navigation(
    pages,
    position="top"
)

current_page.run()
