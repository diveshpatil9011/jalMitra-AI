/**
 * JalMitra AI - Internationalization Dictionary (English, Hindi, Marathi)
 * Multi-language dictionary for agricultural technology governance.
 */

export const translations = {
  en: {
    app_title: "JalMitra AI",
    marathi_sub: "जलमित्र AI",
    tagline: "Every Drop Counts. Every Farmer Matters.",
    principle: "AI recommends. Humans govern.",
    demo_badge: "DEMO PROTOTYPE",
    demo_disclaimer: "Demonstration prototype for agricultural water decision-support. Unofficial independent platform.",
    role_farmer: "Farmer Portal",
    role_officer: "Officer Portal",
    role_public: "Public Overview",
    role_demo_guide: "Hackathon Demo Walkthrough",
    
    // Navigation
    nav_home: "Overview",
    nav_dashboard: "Dashboard",
    nav_my_farm: "My Farm",
    nav_water_ledger: "Water Ledger",
    nav_request_water: "Request Water",
    nav_calculator: "Crop Water Calculator",
    nav_my_requests: "My Requests",
    nav_complaint: "Grievance Form",
    nav_voice: "Voice Grievance",
    nav_my_complaints: "My Grievances",
    nav_disputes: "Disputes & Appeals",
    nav_water_intel: "Water Intelligence",
    nav_approvals: "Review & Approvals",
    nav_mediation: "Mediation Centre",
    nav_simulator: "What-If Simulator",
    nav_canal_map: "Canal Distribution Map",
    nav_conflicts: "Conflict Detector",
    nav_sla_monitor: "SLA Monitor",
    nav_anomalies: "Anomaly Monitor",
    nav_analytics: "Analytics",
    nav_reports: "Reports & Export",
    nav_audit: "Audit Log (SHA-256)",
    nav_scheduler: "Irrigation Scheduler",
    nav_agents: "10-Agent Studio",
    nav_rules: "8-Rule Matrix",
    
    // Actions & Common
    btn_submit: "Submit Request",
    btn_approve: "Approve Allocation",
    btn_reject: "Reject",
    btn_modify: "Modify & Propose",
    btn_verify: "Verify Integrity",
    btn_export_csv: "Export CSV",
    btn_print: "Print / Save PDF",
    btn_reset_demo: "Reset Demo State",
    btn_switch_farmer: "Switch Demo Farmer",
    
    // Statuses
    status_submitted: "Submitted",
    status_under_review: "Under Review",
    status_proposed: "Proposed",
    status_approved: "Approved",
    status_partially_approved: "Partially Approved",
    status_deferred: "Deferred",
    status_rejected: "Rejected",
    status_resolved: "Resolved",
    status_in_mediation: "In Mediation",
    
    // Farmer Dashboard
    welcome_farmer: "Welcome, Farmer Friend",
    farm_id: "Farmer ID",
    village: "Village",
    gat_no: "Gat / Survey No.",
    land_area: "Total Land Area",
    primary_crop: "Primary Crop",
    growth_stage: "Growth Stage",
    assigned_gate: "Assigned Canal Gate",
    next_turn: "Next Irrigation Turn",
    water_allocated_cycle: "Cycle Allocation",
    water_received: "Delivered So Far",
    water_deficit: "Current Moisture Deficit",
    
    // Water Ledger
    canal_flow: "Available Canal Flow",
    reservoir_storage: "Reservoir Live Storage",
    transit_loss: "Transit Loss Allowance",
    emergency_reserve: "Mandatory Emergency Reserve",
    net_available: "Net Allocatable Pool",
    
    // Grievance
    grievance_title: "Submit Irrigation Grievance",
    complaint_category: "Complaint Category",
    incident_time: "Time of Occurrence",
    urgency_level: "Urgency Level",
    describe_problem: "Describe the Issue",
    voice_mic_prompt: "Click mic to speak in Marathi, Hindi, or English",
    listening: "Listening... Speak now",
    start_speaking: "Record Grievance",
    stop_speaking: "Stop & Extract Info",
    extracted_crop: "Extracted Crop",
    extracted_gate: "Extracted Gate",
    extracted_urgency: "Extracted Urgency",

    // Mediation & Simulator
    mediation_heading: "Autonomous Multi-Farmer Dispute Mediation",
    competing_demands: "Stage 1: Competing Demands Analysis",
    initial_proposal: "Stage 2: Algorithmic Allocation Proposals",
    farmer_objections: "Stage 3: Hearing Farmer Objections",
    accord_decision: "Stage 4: Consensus Accord & Officer Sign-off",
    strategy_proportional: "Proportional Cut",
    strategy_agronomic: "Agronomic Criticality Priority",
    strategy_rotational: "Rotational Time-Shift (Warabandi)"
  },
  
  hi: {
    app_title: "जलमित्र AI",
    marathi_sub: "कृषि जल-साझेदारी विवाद समाधान एवं डिजिटल सिंचाई शासन प्रणाली",
    tagline: "हर बूंद कीमती है। हर किसान महत्वपूर्ण है।",
    principle: "AI सिफारिश करता है। मानव अधिकारी शासन करते हैं।",
    demo_badge: "डेमो प्रोटोटाइप",
    demo_disclaimer: "कृषि सिंचाई निर्णय-समर्थन हेतु एक स्वतंत्र प्रायोगिक मंच। यह कोई आधिकारिक सरकारी प्रणाली नहीं है।",
    role_farmer: "किसान पोर्टल",
    role_officer: "सिंचाई अधिकारी पोर्टल",
    role_public: "परियोजना अवलोकन",
    role_demo_guide: "हैकाथॉन डेमो वॉकथ्रू",
    
    // Navigation
    nav_home: "अवलोकन",
    nav_dashboard: "मेरा डैशबोर्ड",
    nav_my_farm: "मेरा खेत",
    nav_water_ledger: "जल अधिकार व बहीखाता",
    nav_request_water: "जल मांग आवेदन",
    nav_calculator: "फसल जल-मांग कैलकुलेटर",
    nav_my_requests: "मेरे आवेदन",
    nav_complaint: "शिकायत दर्ज करें",
    nav_voice: "ध्वनि शिकायत",
    nav_my_complaints: "मेरी शिकायतें",
    nav_disputes: "विवाद व अपील",
    nav_water_intel: "जल उपलब्धता व आपूर्ति",
    nav_approvals: "समीक्षा व मंजूरी",
    nav_mediation: "विवाद मध्यस्थता कक्ष",
    nav_simulator: "जल आवंटन सिम्युलेटर",
    nav_canal_map: "नहर वितरण मानचित्र",
    nav_conflicts: "विवाद पहचान प्रणाली",
    nav_sla_monitor: "निवारण समय सीमा (SLA)",
    nav_anomalies: "विसंगति निगरानी",
    nav_analytics: "विश्लेषण व सांख्यिकी",
    nav_reports: "रिपोर्ट व निर्यात",
    nav_audit: "ऑडिट लॉग (SHA-256)",
    nav_scheduler: "सिंचाई रोटेशन शेड्यूलर",
    nav_agents: "10-एजेंट स्टूडियो",
    nav_rules: "8-नियम अनुपालन मैट्रिक्स",
    
    // Actions & Common
    btn_submit: "आवेदन जमा करें",
    btn_approve: "आवंटन स्वीकृत करें",
    btn_reject: "अस्वीकृत करें",
    btn_modify: "संशोधित व प्रस्तावित करें",
    btn_verify: "सत्यता की पुष्टि करें",
    btn_export_csv: "CSV डाउनलोड करें",
    btn_print: "प्रिंट / PDF सहेजें",
    btn_reset_demo: "डेमो रीसेट करें",
    btn_switch_farmer: "किसान बदलें",
    
    // Statuses
    status_submitted: "प्रस्तुत किया गया",
    status_under_review: "समीक्षाधीन",
    status_proposed: "प्रस्तावित",
    status_approved: "स्वीकृत",
    status_partially_approved: "आंशिक स्वीकृत",
    status_deferred: "स्थगित",
    status_rejected: "अस्वीकृत",
    status_resolved: "समाधान संपन्न",
    status_in_mediation: "मध्यस्थता जारी",
    
    // Farmer Dashboard
    welcome_farmer: "स्वागत है, किसान साथी",
    farm_id: "किसान पहचान संख्या",
    village: "गाँव",
    gat_no: "गट / खसरा संख्या",
    land_area: "कुल रकबा",
    primary_crop: "प्रमुख फसल",
    growth_stage: "विकास अवस्था",
    assigned_gate: "आवंटित नहर गेट",
    next_turn: "अगली सिंचाई बारी",
    water_allocated_cycle: "चक्र आवंटन",
    water_received: "अब तक प्राप्त जल",
    water_deficit: "वर्तमान नमी घाटा",
    
    // Water Ledger
    canal_flow: "उपलब्ध नहर प्रवाह",
    reservoir_storage: "जलाशय भंडारण",
    transit_loss: "पारगमन हानि छूट",
    emergency_reserve: "अनिवार्य आपातकालीन आरक्षित",
    net_available: "शुद्ध आवंटन योग्य जल",
    
    // Grievance
    grievance_title: "सिंचाई शिकायत दर्ज करें",
    complaint_category: "शिकायत की श्रेणी",
    incident_time: "घटना का समय",
    urgency_level: "प्राथमिकता / तात्कालिकता",
    describe_problem: "समस्या का विवरण दें",
    voice_mic_prompt: "हिंदी, मराठी या अंग्रेजी में बोलने के लिए माइक दबाएं",
    listening: "सुन रहे हैं... बोलिए",
    start_speaking: "शिकायत रिकॉर्ड करें",
    stop_speaking: "रोकें और जानकारी निकालें",
    extracted_crop: "पहचानी गई फसल",
    extracted_gate: "पहचाना गया गेट",
    extracted_urgency: "पहचानी गई तात्कालिकता",

    // Mediation & Simulator
    mediation_heading: "एआई-संचालित बहु-किसान विवाद मध्यस्थता कक्ष",
    competing_demands: "चरण 1: प्रतिस्पर्धी मांगों का विश्लेषण",
    initial_proposal: "चरण 2: एल्गोरिद्मिक वैकल्पिक समझौते",
    farmer_objections: "चरण 3: किसानों की आपत्तियां व प्रतिक्रिया",
    accord_decision: "चरण 4: आम सहमति समझौता व अधिकारी मुहर",
    strategy_proportional: "समानुपातिक कटौती (Proportional Cut)",
    strategy_agronomic: "फसल संवेदनशीलता प्राथमिकता (Agronomic Priority)",
    strategy_rotational: "रोटेशनल बारी विभाजन (Warabandi Time-Shift)"
  },

  mr: {
    app_title: "जलमित्र AI",
    marathi_sub: "स्वायत्त कालवा पाणी वाटप व तंटा निवारण प्रणाली",
    tagline: "प्रत्येक थेंब मोलाचा. प्रत्येक शेतकरी महत्त्वाचा.",
    principle: "AI शिफारस करतो. मानवी अधिकारी निर्णय घेतात.",
    demo_badge: "प्रात्यक्षिक (डेमो)",
    demo_disclaimer: "कृषी सिंचन निर्णय सहाय्यासाठी प्रात्यक्षिक व्यासपीठ. ही अनधिकृत स्वतंत्र प्रणाली आहे.",
    role_farmer: "शेतकरी दालन",
    role_officer: "सिंचन अधिकारी दालन",
    role_public: "प्रकल्प माहिती",
    role_demo_guide: "हॅकाथॉन थेट प्रात्यक्षिक",
    
    // Navigation
    nav_home: "माहिती",
    nav_dashboard: "माझे डॅशबोर्ड",
    nav_my_farm: "माझी शेती",
    nav_water_ledger: "पाणी हक्क व लेजर",
    nav_request_water: "पाणी मागणी अर्ज",
    nav_calculator: "पीक पाणी गणक",
    nav_my_requests: "माझे अर्ज",
    nav_complaint: "तक्रार नोंदणी",
    nav_voice: "आवाज तक्रार",
    nav_my_complaints: "माझ्या तक्रारी",
    nav_disputes: "तंटा व अपील",
    nav_water_intel: "पाणी पुरवठा माहिती",
    nav_approvals: "अर्जांची छाननी व मंजुरी",
    nav_mediation: "तंटा मध्यस्थी केंद्र",
    nav_simulator: "पाणी वाटप सिम्युलेटर",
    nav_canal_map: "कालवा वितरण नकाशा",
    nav_conflicts: "तंटे शोध प्रणाली",
    nav_sla_monitor: "तक्रार निवारण मुदत",
    nav_anomalies: "अनियमितता देखरेख",
    nav_analytics: "तपशीलवार विश्लेषण",
    nav_reports: "अहवाल व निर्यात",
    nav_audit: "ऑडिट नोंद (SHA-256)",
    nav_scheduler: "सिंचन वेळापत्रक",
    nav_agents: "१०-एजंट कार्यप्रणाली",
    nav_rules: "८-नियम अनुपालन तक्ता",
    
    // Actions & Common
    btn_submit: "अर्ज सादर करा",
    btn_approve: "पाणी वाटप मंजूर करा",
    btn_reject: "नाकारा",
    btn_modify: "फेरबदल व शिफारस",
    btn_verify: "अखंडता तपासा",
    btn_export_csv: "CSV डाऊनलोड",
    btn_print: "प्रिंट / PDF जतन करा",
    btn_reset_demo: "डेमो रीसेट",
    btn_switch_farmer: "शेतकरी बदला",
    
    // Statuses
    status_submitted: "दाखल केला",
    status_under_review: "छाननी सुरू",
    status_proposed: "प्रस्तावित",
    status_approved: "मंजूर",
    status_partially_approved: "अंशतः मंजूर",
    status_deferred: "स्थगित",
    status_rejected: "नाकारले",
    status_resolved: "तंटा मिटला",
    status_in_mediation: "मध्यस्थी सुरू",
    
    // Farmer Dashboard
    welcome_farmer: "स्वागत आहे, शेतकरी मित्र",
    farm_id: "शेतकरी ओळख क्रमांक",
    village: "गाव",
    gat_no: "गट / सर्व्हे क्रमांक",
    land_area: "एकूण क्षेत्र",
    primary_crop: "मुख्य पीक",
    growth_stage: "वाढीची अवस्था",
    assigned_gate: "नेमून दिलेले गेट",
    next_turn: "पुढील पाळी वेळ",
    water_allocated_cycle: "आवर्तन वाटप",
    water_received: "मिळालेले पाणी",
    water_deficit: "पाण्याची कमतरता",
    
    // Water Ledger
    canal_flow: "उपलब्ध कालवा प्रवाह",
    reservoir_storage: "धरण साठा",
    transit_loss: "वहन गळती सूट",
    emergency_reserve: "राखीव पाणी साठा",
    net_available: "वाटपयोग्य शुद्ध पाणी",
    
    // Grievance
    grievance_title: "सिंचन तक्रार नोंदवा",
    complaint_category: "तक्रारीचा प्रकार",
    incident_time: "घटनेची वेळ",
    urgency_level: "तातडीचा स्तर",
    describe_problem: "तक्रारीचे सविस्तर वर्णन",
    voice_mic_prompt: "मराठी, हिंदी किंवा इंग्रजीत बोलण्यासाठी माईक दाबा",
    listening: "ऐकत आहे... बोला",
    start_speaking: "तक्रार रेकॉर्ड करा",
    stop_speaking: "थांबवा व माहिती काढा",
    extracted_crop: "ओळखलेले पीक",
    extracted_gate: "ओळखलेले गेट",
    extracted_urgency: "ओळखलेली तीव्रता",

    // Mediation & Simulator
    mediation_heading: "स्वायत्त बहु-शेतकरी तंटा मध्यस्थी केंद्र",
    competing_demands: "टप्पा १: परस्परविरोधी मागण्यांचे विश्लेषण",
    initial_proposal: "टप्पा २: नियमाधारित पर्यायी वाटप शिफारसी",
    farmer_objections: "टप्पा ३: शेतकऱ्यांचे आक्षेप व गाऱ्हाणी",
    accord_decision: "टप्पा ४: सहमती करार व अधिकारी स्वाक्षरी",
    strategy_proportional: "प्रमाणबद्ध कपात (Proportional Cut)",
    strategy_agronomic: "कृषी संवेदनशीलतेनुसार प्राधान्य (Agronomic Priority)",
    strategy_rotational: "पाळीनुसार वाटप (Warabandi Shift)"
  }
};

let currentLang = localStorage.getItem("jalmitra_lang") || "en";

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (lang === "en" || lang === "hi" || lang === "mr") {
    currentLang = lang;
    localStorage.setItem("jalmitra_lang", lang);
    window.dispatchEvent(new CustomEvent("jalmitra:lang_changed", { detail: { lang } }));
  }
}

export function t(key) {
  return translations[currentLang]?.[key] || translations["en"]?.[key] || key;
}
