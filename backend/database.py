import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models import Base, Product, Lead

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./solar_sales.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Create tables and seed initial verified solar catalog and leads"""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if products already exist
    if db.query(Product).count() == 0:
        initial_products = [
            Product(
                id="3kw-home",
                name="3kW Home Solar",
                category="Residential",
                badge="Entry",
                icon="☀️",
                description="Designed for smaller homes with essential daytime usage and basic appliances.",
                best_for="Small homes",
                price_range="PKR 750k - 900k",
                price_numeric=820000,
                inverter_spec="3.2kW Hybrid Solar Inverter",
                panels_spec="6x 550W Tier-1 Mono PERC Panels",
                daily_units="12 - 15 Units/day",
                battery_support="24V Gel / Lithium Support",
                net_metering=True,
                appliance_load="Fans, Lights, TV, Fridge & 1 Inverter AC (Daytime)"
            ),
            Product(
                id="5kw-hybrid",
                name="5kW Hybrid System",
                category="Residential",
                badge="Popular",
                icon="⚡",
                description="A balanced package for medium homes that need strong daily savings and backup support.",
                best_for="Medium homes",
                price_range="PKR 1.2M - 1.45M",
                price_numeric=1350000,
                inverter_spec="5kW IP65 Smart Hybrid Inverter",
                panels_spec="10x 550W Tier-1 Bifacial Panels",
                daily_units="22 - 26 Units/day",
                battery_support="48V Lithium-Ion or Tubular",
                net_metering=True,
                appliance_load="2 Inverter ACs, Refrigerator, Water Pump, LED Lights & Fans"
            ),
            Product(
                id="7kw-premium",
                name="7kW Premium Home",
                category="Residential",
                badge="Premium",
                icon="🏠",
                description="For larger homes with higher electricity usage and multiple heavy appliances.",
                best_for="Large homes",
                price_range="PKR 1.7M - 2.0M",
                price_numeric=1850000,
                inverter_spec="7kW Dual MPPT High-Efficiency Inverter",
                panels_spec="14x 555W N-Type TOPCon Panels",
                daily_units="32 - 38 Units/day",
                battery_support="High-Voltage / 48V Lithium Storage",
                net_metering=True,
                appliance_load="3 Inverter ACs, Deep Freezer, 1HP Water Pump, Washing Machine"
            ),
            Product(
                id="10kw-business",
                name="10kW Business Solar",
                category="Commercial",
                badge="Commercial",
                icon="🏢",
                description="A professional package for shops, offices, and small commercial spaces.",
                best_for="Offices",
                price_range="PKR 2.4M - 2.8M",
                price_numeric=2600000,
                inverter_spec="10kW 3-Phase Industrial Grade Inverter",
                panels_spec="18x 575W Commercial Grade Panels",
                daily_units="45 - 55 Units/day",
                battery_support="Optional 10kWh Industrial Battery Bank",
                net_metering=True,
                appliance_load="Office ACs, Workstations, Lighting, Servers & Displays"
            ),
            Product(
                id="20kw-commercial",
                name="20kW Commercial System",
                category="Commercial",
                badge="Scale",
                icon="🏭",
                description="For businesses that want larger savings, higher capacity, and a custom installation plan.",
                best_for="Warehouses",
                price_range="PKR 4.6M - 5.2M",
                price_numeric=4900000,
                inverter_spec="20kW 3-Phase Smart Grid Inverter",
                panels_spec="36x 580W High-Output Bifacial Panels",
                daily_units="90 - 110 Units/day",
                battery_support="High-Capacity Energy Storage System",
                net_metering=True,
                appliance_load="Heavy machinery, HVAC chillers, industrial refrigeration"
            ),
            Product(
                id="battery-inverter",
                name="Battery and Inverter",
                category="Backup",
                badge="Backup",
                icon="🔋",
                description="Backup-focused solution for night usage and power outage protection.",
                best_for="Backup power",
                price_range="PKR 350k - 600k",
                price_numeric=480000,
                inverter_spec="Pure Sine Wave 3.5kVA / 5kVA Inverter / Charger",
                panels_spec="Optional 2-4 auxiliary solar panels",
                daily_units="Seamless 10ms transfer time",
                battery_support="100Ah - 200Ah Lithium LiFePO4 battery",
                net_metering=False,
                appliance_load="Essential home loads, lights, fans, routers & medical devices"
            )
        ]
        db.add_all(initial_products)
        db.commit()

    # Seed initial leads if empty
    if db.query(Lead).count() == 0:
        initial_leads = [
            Lead(
                id="lead-1",
                name="Zubair Ahmed",
                phone="0300-1234567",
                email="zubair@gmail.com",
                product_interest="10kW Hybrid System",
                status="Hot",
                city="Lahore",
                conversation_note="Wants to install next week, talking about installment plan.",
                estimated_value="PKR 2.6M"
            ),
            Lead(
                id="lead-2",
                name="Kamran Khan",
                phone="0321-7654321",
                email="kamran@yahoo.com",
                product_interest="5kW On-Grid System",
                status="Warm",
                city="Karachi",
                conversation_note="Asked about net metering process and solar plates brand.",
                estimated_value="PKR 1.35M"
            ),
            Lead(
                id="lead-3",
                name="Ayesha Siddiqua",
                phone="0333-9876543",
                email="ayesha@outlook.com",
                product_interest="7kW Inverter System",
                status="New",
                city="Islamabad",
                conversation_note="Left contact details via voice assistant, requested a call back.",
                estimated_value="PKR 1.85M"
            )
        ]
        db.add_all(initial_leads)
        db.commit()

    db.close()
