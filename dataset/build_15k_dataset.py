import json
import csv
import os

categories_and_topics = [
    # Topic 1: 1kW to 3kW System Inquiries
    ("1kW Micro Solar Systems", "Can a 1kW solar system run a refrigerator and water pump?",
     "A 1kW solar system produces approximately 4 to 5 units of electricity per day and has a continuous inverter capacity of around 1,000 Watts. While it can run an energy-efficient inverter refrigerator (consuming 150-200W) alongside basic lighting and ceiling fans during clear sunny hours, it cannot support a water pump. A typical 0.5HP or 1HP water pump has an inrush starting surge of 1,500 to 2,500 Watts, which immediately overloads a 1kW inverter. For running water pumps alongside refrigerators, we strongly recommend a minimum of 3kW or 5kW capacity."),
    
    ("2kW Small Residential Setup", "What are the limitations of a 2kW solar package for a 3 marla house?",
     "A 2kW solar system generates between 8 to 10 units daily and accommodates essential household loads such as ceiling fans, LED lights, LED television, laptop chargers, and a medium-sized inverter refrigerator. The primary limitation of a 2kW package is that it cannot comfortably run an air conditioner or heavy heating appliances such as an electric iron or microwave oven while other appliances are operating. If you wish to operate even a single 1-ton inverter air conditioner during daytime, upgrading to our 3kW or 5kW system is essential."),

    ("3kW Sizing for Small Homes", "How much roof space and how many solar plates are needed for a 3kW package?",
     "A 3kW solar system requires approximately 180 to 220 square feet of unobstructed, shadow-free roof area. Our 3kW package utilizes 6 high-efficiency 550W Tier-1 Monocrystalline PERC half-cell panels. Each panel measures approximately 7.5 feet in height by 3.7 feet in width. We mount these panels on custom galvanized iron (GI) structures tilted at an optimal angle of 28 to 30 degrees facing due South, maximizing solar radiation throughout the entire year."),

    ("3kW ROI and Financial Savings", "What is the return on investment and monthly payback for a 3kW system in Pakistan?",
     "A 3kW system generates an average of 400 to 450 units per month. At an average grid electricity rate of 65 PKR per unit (including fuel price adjustment, surcharges, and taxes), your monthly savings will range between 26,000 and 29,250 PKR. With an initial investment cost of approximately 820,000 PKR, the complete system achieves payback in less than 2.5 to 2.8 years. After this payback milestone, all electricity produced for the remaining 22+ years of panel life is essentially 100% free."),

    # Topic 2: 5kW Hybrid Residential (Most Popular)
    ("5kW Household Appliance Sizing", "Can a 5kW hybrid solar system power two 1.5-ton inverter ACs simultaneously?",
     "Yes, a 5kW hybrid solar system is engineered to effortlessly run two 1.5-ton inverter air conditioners simultaneously during sunny daytime hours. Modern 1.5-ton inverter ACs draw roughly 1,400 Watts during initial cooling and drop to 800-1,000 Watts once room temperature stabilizes. Two units running steadily consume approximately 1,800 to 2,000 Watts, leaving 3,000 Watts of headroom for your refrigerator, ceiling fans, LED lighting, and internet router. A 5kW system delivers optimal comfort for medium-sized homes."),

    ("5kW Battery Sizing & Load-Shedding", "How much battery storage is recommended for a 5kW hybrid system for evening load shedding?",
     "For a 5kW hybrid system, we recommend a 48V 100Ah Lithium Iron Phosphate (LiFePO4) battery pack, providing 4.8 kWh (4,800 Watt-hours) of usable energy. This storage bank provides 4 to 6 hours of backup for essential loads (4 fans, LED lights, television, and refrigerator) or up to 2.5 to 3 hours if running one energy-efficient inverter AC during an outage. If you experience longer power outages, you can expand to a 48V 200Ah battery bank (9.6 kWh) with zero modification to your inverter."),

    ("5kW Net Metering Units Balance", "How many surplus units can a 5kW system export to the national grid each month?",
     "On average, a 5kW system generates 700 to 780 units per month across the year. In a typical household where daytime consumption is moderate (e.g. 350 to 400 units consumed on-site), the system exports 300 to 380 surplus units monthly to the grid via your bi-directional green meter. These exported units offset your evening and nighttime consumption, resulting in net electricity bills that approach zero PKR during spring, autumn, and winter seasons."),

    # Topic 3: 7kW & 8kW Premium Systems
    ("7kW Premium Home Sizing", "When should a customer choose a 7kW solar system instead of a 5kW system?",
     "You should choose a 7kW system if your home has more than three inverter air conditioners, a continuous water pumping requirement, or an average summer electricity bill between 55,000 and 75,000 PKR. While a 5kW system tops out at 26 units daily, a 7kW system generates 32 to 38 units daily (960 to 1,140 units monthly). This provides the necessary buffer to handle multiple simultaneous heavy appliances like deep freezers, washing machines, and electric irons without drawing expensive grid electricity."),

    ("7kW Dual MPPT Inverter Setup", "Why does a 7kW system require dual MPPT trackers on the inverter?",
     "A dual Maximum Power Point Tracker (MPPT) inverter is vital for 7kW systems because large homes often distribute panels across different roof sections (for example, 8 panels on a southern roof and 6 panels on an eastern or western roof). Each roof section receives sunlight at different angles and intensities. Dual MPPT allows each string to operate independently at its peak efficiency. Without dual MPPT, shade or reduced sunlight on one roof string would pull down the performance of the entire system."),

    # Topic 4: 10kW Commercial & Business
    ("10kW Commercial Office Package", "Can a 10kW three-phase system support a corporate office with 15 computers and central AC?",
     "Yes! Our 10kW Business Solar System produces 45 to 55 units per day and provides a continuous three-phase power output of 10,000 Watts. It easily powers an office facility comprising 15 to 20 computer workstations, servers, LED office troffer lighting, water dispenser, and two 2-ton commercial inverter split air conditioners. By eliminating expensive peak-hour commercial tariff units, the system drastically cuts corporate operating overhead and provides an audited payback within 2.4 years."),

    ("10kW Three-Phase Load Balancing", "Why is three-phase balance critical for 10kW solar systems?",
     "Three-phase balance is critical because commercial and large residential properties are wired with three separate 230V electrical phases (L1, L2, L3) with 400V phase-to-phase. A 10kW three-phase inverter divides solar power evenly across all three phases (approximately 3.3kW per phase). This prevents phase overloading, maintains neutral wire stability, eliminates voltage fluctuations that damage sensitive electronics, and complies strictly with DISCO three-phase net metering connection criteria."),

    # Topic 5: 20kW & Industrial Commercial
    ("20kW Industrial Scale Solar", "What are the technical components and structure requirements of a 20kW system?",
     "A 20kW commercial installation comprises 36 high-output 580W Tier-1 Bifacial N-Type panels, an industrial IP65 three-phase European-certified grid-tied inverter, dual DC combiner boxes with high-voltage DC fuses, Type-2 surge protection devices, and AC distribution boards. It requires roughly 1,200 to 1,400 square feet of roof space. We install custom elevated framing with anti-corrosive primer and hot-dipped galvanization, designed to withstand coastal and high-humidity climates with an engineered wind load capacity of 130 km/h."),

    ("20kW Zero Export Device Integration", "What is zero-export control and when is it required on a 20kW commercial system?",
     "Zero-export control uses an intelligent smart energy meter and communication dongle connected to the inverter. It dynamically modulates the solar generation to exactly match the facility's instantaneous electrical demand, ensuring zero electricity leaks into the utility grid. This is essential during the interim period before the utility company completes green meter net metering installation, allowing you to turn on your solar system immediately without incurring reverse-power penalties from the utility."),

    # Topic 6: Inverter Technologies & Comparisons
    ("On-Grid vs Hybrid Comparison", "Which is better between an on-grid and a hybrid inverter?",
     "Neither is universally 'better'—the choice depends on your electrical priorities. If you live in an area with reliable grid electricity and zero load-shedding, an On-Grid inverter offers the highest return on investment because it costs 30% less and maximizes net metering savings. However, if your area experiences frequent load-shedding, an on-grid system shuts off during blackouts. A Hybrid inverter is the ideal choice for load-shedding zones because it combines net metering savings with seamless 10-millisecond battery backup during power cuts."),

    ("Microinverters vs String Inverters", "Are microinverters worth the extra cost compared to string inverters?",
     "Microinverters convert DC to AC electricity directly on the back of each individual panel, providing individual panel monitoring and eliminating losses from partial roof shading. However, microinverters cost roughly 40% to 50% more than centralized string inverters. For most residential and commercial roofs with open, unshaded space, a high-efficiency string inverter with dual MPPT delivers 98% of the performance at half the maintenance complexity and significantly lower cost."),

    ("Inverter Efficiency & Cooling", "What is IP65 rating and fanless natural cooling in modern inverters?",
     "An IP65 rating certifies that the inverter enclosure is completely sealed against ingress of dust and protected against water jets from any angle, permitting outdoor wall installation in harsh desert and monsoon environments. Fanless natural convection cooling uses deep aluminum heatsink fins instead of mechanical cooling fans. This design eliminates mechanical fan failure, reduces noise to virtually zero decibels, prevents internal dust accumulation, and extends inverter lifespan beyond 10 to 12 years."),

    # Topic 7: Solar Panels & Cell Engineering
    ("Monocrystalline vs Polycrystalline", "Why do you only install Monocrystalline panels instead of Polycrystalline?",
     "Polycrystalline panels are an obsolete technology with low efficiency (15-17%) and poor performance in hot temperatures. We exclusively install Monocrystalline PERC and N-Type TOPCon panels manufactured from single-crystal silicon. Monocrystalline panels deliver 21.5% to 23.2% efficiency, require 25% less roof area for the same wattage, perform significantly better in low-light and cloudy conditions, and degrade at less than half the rate of older polycrystalline modules."),

    ("Bifacial Solar Panels Advantage", "How do bifacial solar panels generate extra electricity from the back?",
     "Bifacial solar panels feature transparent tempered glass on both the front and rear faces instead of an opaque white backsheet. While the front face captures direct sunlight, the rear face captures albedo—sunlight reflected off your roof surface, ground, or surrounding walls. On light-colored concrete or white reflective roof tiles, bifacial panels generate an additional 10% to 25% electricity, effectively turning a 550W panel into the equivalent of a 620W to 680W energy producer with zero extra roof footprint."),

    ("Temperature Coefficient Effect", "How does hot summer weather affect solar panel electricity production?",
     "Contrary to popular belief, extreme heat slightly reduces solar panel voltage. Solar panels are rated at Standard Test Conditions (STC) of 25°C. For every 1°C increase in cell temperature above 25°C, panel power output drops by the Temperature Coefficient (typically -0.30% to -0.35%/°C). During 45°C summer days, cell temperatures can reach 65°C, causing an output drop of roughly 12-14%. We mitigate this by using N-Type TOPCon panels with industry-leading low temperature coefficients (-0.30%/°C) and elevating panels 12 inches above roof slabs for cooling airflow."),

    # Topic 8: Batteries & Energy Storage Systems
    ("Lithium LiFePO4 Cycle Life", "What does 6,000 cycles mean for a lithium solar battery?",
     "A battery cycle represents one complete discharge followed by one full recharge. At one cycle per day (discharging in the evening and recharging with solar during the day), 6,000 cycles corresponds to more than 16 years of daily operational service (6,000 divided by 365 days = 16.4 years). Even after 6,000 cycles, the battery does not fail—it simply retains roughly 70% to 80% of its original factory capacity. This longevity makes Lithium LiFePO4 vastly more cost-effective than lead-acid batteries, which fail after 700 to 1,200 cycles."),

    ("Battery Management System (BMS)", "What is the purpose of a Smart BMS inside a lithium solar battery?",
     "A Battery Management System (BMS) is the electronic brain inside a lithium battery bank. It monitors cell voltages, internal temperature, and current flow in real time. The BMS provides essential protection: 1) Overcharge and Over-discharge protection; 2) Active cell balancing ensuring every internal cell operates at identical voltage; 3) Thermal runaway cutoff if temperatures exceed 55°C; 4) Short-circuit protection; and 5) CAN/RS485 communication with your hybrid inverter, ensuring the inverter adjusts charging algorithms dynamically based on real-time battery health."),

    ("Tubular Battery Maintenance Guide", "If I choose tubular batteries to save initial cost, how must I maintain them?",
     "If you select heavy-duty tubular batteries, proper maintenance is critical: 1) Electrolyte Check: Inspect the floating acid indicators monthly and top up exclusively with demineralized distilled water (never tap water or battery acid); 2) Terminal Cleaning: Clean terminals with warm water and apply petroleum jelly to prevent lead sulfate corrosion; 3) Depth of Discharge: Never discharge tubular batteries below 50% capacity, as deep discharge causes permanent plate sulfation; 4) Ventilation: Ensure the battery bank is located in a well-ventilated space to disperse hydrogen gas emitted during equalization charging."),

    # Topic 9: Net Metering & Utility Company Procedures
    ("Green Meter Billing Explanation", "How will I read my electricity bill after net metering is installed?",
     "Your monthly utility bill will include a dedicated 'Distributed Generation Net Metering' section showing three readings: 1) Import Units: Electricity you pulled from the grid during nights and cloudy days; 2) Export Units: Solar electricity you sent into the grid during daytime hours; 3) Net Units: Calculated by subtracting Export from Import. If Export exceeds Import, your bill shows zero energy charges and a financial credit rolls forward to offset future billing cycles. You only pay minor fixed meter rent charges."),

    ("Three Phase Sanctioned Load Criteria", "Why does the electric company require a three-phase connection for net metering?",
     "Electric distribution companies (DISCOs) require a three-phase connection for all net-metering systems above 3kW to protect the local low-voltage transformer from severe phase unbalance. Exporting 5kW or 10kW onto a single electrical phase would cause local voltage spikes, potentially damaging your neighbors' household appliances. Distributing export power across three phases ensures network stability, low harmonic distortion, and safe grid integration."),

    # Topic 10: System Sizing by Monthly Bill in PKR
    ("Bill Sizing 20,000 to 35,000 PKR", "My monthly electricity bill is 25,000 to 35,000 PKR. What system is recommended?",
     "A monthly bill between 25,000 and 35,000 PKR indicates monthly consumption of roughly 380 to 500 units. For this consumption level, our 3kW Home Solar System or 5kW Hybrid System is recommended. A 3kW system will eliminate roughly 80% of your bill, while a 5kW system will eliminate 100% of your bill and generate surplus credits for winter months. If you plan to add an air conditioner in the future, we strongly advise installing 5kW."),

    ("Bill Sizing 40,000 to 65,000 PKR", "My monthly bill is 50,000 to 65,000 PKR. What system capacity do I require?",
     "A bill between 50,000 and 65,000 PKR corresponds to approximately 750 to 950 units per month. For this requirement, our 5kW Hybrid or 7kW Premium Home Solar System is the precise match. A 5kW system offsets 750 units, bringing your bill down to baseline. A 7kW system provides 1,050 units monthly, giving you complete peace of mind to run multiple air conditioners freely throughout the summer months."),

    ("Bill Sizing 70,000 to 120,000 PKR", "Our monthly bill is 85,000 to 110,000 PKR. What size solar system is needed?",
     "A monthly bill in this range reflects heavy electrical consumption between 1,200 and 1,600 units. A 10kW Three-Phase Solar System is the benchmark requirement. Generating 1,350 to 1,650 units monthly, a 10kW system completely wipes out high-slab peak and off-peak tariff rates, reducing your 100,000 PKR monthly bill to near zero and delivering over 1.1 Million PKR in documented annual savings."),

    ("Bill Sizing Above 150,000 PKR", "Our commercial bill exceeds 180,000 PKR every month. What capacity should we install?",
     "A commercial bill exceeding 180,000 PKR indicates consumption of 2,400 to 2,800 units per month. We recommend installing our 15kW to 20kW Commercial System. Producing between 2,200 and 3,000 units monthly, this setup mitigates commercial punitive peak tariffs, provides substantial tax depreciation benefits, and pays for itself in approximately 2.3 years."),

    # Topic 11: Objections & Myth Busting
    ("Hailstorm & Impact Resistance", "Can solar panels survive severe hailstorms or heavy objects falling on them?",
     "Yes! Tier-1 solar panels are manufactured with 3.2mm tempered safety glass engineered specifically for extreme weather impact. Under international IEC 61215 certification testing, panels must withstand direct impacts from 25mm (1-inch) diameter ice hailstones striking at speeds exceeding 80 km/h (50 mph) without cracking. Unless struck by heavy debris or dropped tools during installation, tempered glass panels will comfortably withstand natural hailstorms, heavy downpours, and severe windstorms."),

    ("Panel Cleaning & Maintenance", "Do I need to wash solar panels every day and does dust stop electricity generation completely?",
     "No, panels do not require daily cleaning, and dust does not stop generation completely. A layer of regular atmospheric dust typically reduces generation by only 5% to 10%. Washing panels once every two weeks using plain tap water and a soft micro-fiber mop is more than sufficient to restore 100% peak output. Avoid washing panels under scorching afternoon sun to prevent thermal glass shock—early morning or late evening washing is ideal."),

    ("Will Solar Work at Night?", "How does a solar system work when there is no sun at night?",
     "Solar photovoltaic cells require light photons to generate electricity, so they do not produce power during darkness. Nighttime electricity is provided in one of two ways: 1) In an On-Grid Net Metering setup, you consume electricity from the grid at night, which is credited against the surplus units you generated during daytime; 2) In a Hybrid setup, excess daytime electricity charges a lithium battery bank, which powers your home appliances during nighttime blackouts."),

    # Topic 12: Sales Objection Handling
    ("Wait for Cheaper Prices Objection", "Should I wait for solar panel prices to drop further before buying?",
     "Waiting for marginal price drops is financially counterproductive. While solar technology prices have stabilized at historic lows, grid electricity tariffs continue to rise rapidly. If you delay installation by 6 months in hopes of saving 50,000 PKR on equipment, you will pay over 300,000 PKR to the utility company in electricity bills during those same 6 months! Delaying your installation costs you six times more in wasted electricity bills than any potential equipment price drop."),

    ("Rented House or Relocation Objection", "What happens if I move houses in 3 years? Can I take my solar system with me?",
     "Yes! A solar system is completely modular and demountable. If you relocate to a new house, our technical installation team can safely dismantle the panels, inverter, battery bank, and cabling in a single day and re-install them at your new residence. Your investment remains 100% protected and portable."),

    # Topic 13: Edge Cases, Error Handling & AI Conversational Intelligence
    ("Out of Domain Query Deflection", "Can you help me write an essay on history or give me a recipe for biryani?",
     "While I appreciate your curiosity, I am specialized exclusively as an AI Solar Energy Sales Consultant. I can help you with anything related to solar panel systems, hybrid inverters, battery backup sizing, net metering regulations, and quotation requests for your home or business. Feel free to ask about your electricity bill or solar options!"),

    ("Absurd Technical Request Handling", "Can I power my whole factory with 5 air conditioners using a 500 Watt solar panel?",
     "No, a 500 Watt solar panel cannot power an industrial facility or five air conditioners. Five air conditioners require between 8,000 and 12,000 Watts of continuous power, whereas a 500W panel only generates roughly 400 Watts under direct sunlight. To run five air conditioners and commercial equipment reliably, you need at least a 10kW to 15kW Three-Phase Solar System. May I share the specifications of our 10kW package?"),

    ("Incomplete Contact Details Handling", "Just send an engineer to my house.",
     "I would be delighted to dispatch our field engineer to conduct an on-site structural and electrical survey! However, I need your complete contact information first. Could you please share: 1) Your full name, 2) Your mobile phone number, and 3) Your city and neighborhood address? Once you provide these, I will confirm your booking immediately."),

    ("Lead Capture - Full Residential Customer", "My name is Zubair Ahmed, phone is 0300-1234567, email is zubair@gmail.com, living in DHA Lahore. I want a 10kW hybrid system with net metering.",
     "Thank you, Mr. Zubair Ahmed! I have registered your inquiry for our 10kW Hybrid Solar System in DHA Lahore with net metering filing. Our senior technical advisor will call you shortly at 0300-1234567 to coordinate a comprehensive roof survey and present your itemized quotation including Longi Tier-1 bifacial panels, European hybrid inverter, and NEPRA green meter paperwork."),

    ("Lead Capture - Commercial Client", "My name is Kamran Khan, phone 0321-7654321, email kamran@yahoo.com in Gulshan Karachi. Need a 5kW On-grid quote.",
     "Thank you, Mr. Kamran Khan! Your inquiry for our 5kW On-Grid Solar Package in Gulshan, Karachi has been successfully logged. Our Karachi field engineering team will contact you at 0321-7654321 within 2 hours to verify your distribution board setup and arrange a complimentary on-site visit.")
]

# Write formatted dataset
dataset_path = "dataset/solar_sales_dataset.csv"
fieldnames = ["category", "instruction", "input", "output"]

with open(dataset_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
    writer.writeheader()
    for cat, inp, outp in categories_and_topics:
        writer.writerow({
            "category": cat,
            "instruction": "You are an intelligent AI Sales Agent for a premier solar panel solutions company. Answer with high technical precision, professional sales advice, and qualify the customer for a quotation in English.",
            "input": inp,
            "output": outp
        })

# Copy to public
with open("public/solar_sales_dataset.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
    writer.writeheader()
    for cat, inp, outp in categories_and_topics:
        writer.writerow({
            "category": cat,
            "instruction": "You are an intelligent AI Sales Agent for a premier solar panel solutions company. Answer with high technical precision, professional sales advice, and qualify the customer for a quotation in English.",
            "input": inp,
            "output": outp
        })

# Write JSON training set
json_rows = []
for cat, inp, outp in categories_and_topics:
    json_rows.append({
        "category": cat,
        "instruction": "You are an intelligent AI Sales Agent for a premier solar panel solutions company. Answer with high technical precision, professional sales advice, and qualify the customer for a quotation in English.",
        "input": inp,
        "output": outp
    })

with open("dataset/solar_sales_train.json", "w", encoding="utf-8") as f:
    json.dump(json_rows, f, indent=2)

# Word count
total_words = 0
for r in json_rows:
    total_words += len(r["instruction"].split()) + len(r["input"].split()) + len(r["output"].split())

print(f"Successfully generated {len(json_rows)} dense dialogues.")
print(f"Total word count: {total_words} words.")
