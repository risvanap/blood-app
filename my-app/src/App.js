import { useState, useEffect, useMemo } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot
} from "firebase/firestore";
import "./App.css";

// Modern Lucide/Feather & FontAwesome Icons
import {
  FiSearch,
  FiUserPlus,
  FiPhone,
  FiMapPin,
  FiTrash2,
  FiMoon,
  FiSun,
  FiShare2,
  FiCopy,
  FiCheck,
  FiUsers,
  FiInfo,
  FiDroplet,
  FiAlertCircle,
  FiCheckCircle,
  FiX,
  FiShield,
  FiHeart,
  FiClock,
  FiNavigation,
  FiMessageSquare,
  FiCompass,
  FiAlertTriangle
} from "react-icons/fi";
import { FaWhatsapp, FaHeartbeat, FaHospital, FaBroadcastTower } from "react-icons/fa";

// Major City Coordinates for Distance Calculations (Kerala & Nearby Hubs)
const CITY_COORDINATES = {
  kozhikode: { lat: 11.2588, lng: 75.7804 },
  calicut: { lat: 11.2588, lng: 75.7804 },
  kochi: { lat: 9.9312, lng: 76.2673 },
  ernakulam: { lat: 9.9816, lng: 76.2999 },
  trivandrum: { lat: 8.5241, lng: 76.9366 },
  thiruvananthapuram: { lat: 8.5241, lng: 76.9366 },
  kannur: { lat: 11.8745, lng: 75.3704 },
  thrissur: { lat: 10.5276, lng: 76.2144 },
  malappuram: { lat: 11.0735, lng: 76.0740 },
  manjeri: { lat: 11.1214, lng: 76.1214 },
  palakkad: { lat: 10.7867, lng: 76.6548 },
  kollam: { lat: 8.8932, lng: 76.6141 },
  kottayam: { lat: 9.5916, lng: 76.5222 },
  alappuzha: { lat: 9.4981, lng: 76.3388 },
  wayanad: { lat: 11.6854, lng: 76.1320 },
  kasaragod: { lat: 12.5102, lng: 74.9852 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  coimbatore: { lat: 11.0168, lng: 76.9558 }
};

// Haversine Great-Circle Distance Calculator (in km)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function getCoordsForPlace(placeStr) {
  if (!placeStr) return null;
  const p = placeStr.toLowerCase().trim();
  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    if (p.includes(key)) return coords;
  }
  return null;
}

// Supported Standard Blood Groups
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

// Blood Compatibility Reference Table
const COMPATIBILITY_DATA = [
  { group: "O-", canGive: "Everyone (Universal Donor)", canReceive: "O-", highlight: "universal-donor" },
  { group: "O+", canGive: "O+, A+, B+, AB+", canReceive: "O+, O-", highlight: "common" },
  { group: "A-", canGive: "A-, A+, AB-, AB+", canReceive: "A-, O-", highlight: "" },
  { group: "A+", canGive: "A+, AB+", canReceive: "A+, A-, O+, O-", highlight: "" },
  { group: "B-", canGive: "B-, B+, AB-, AB+", canReceive: "B-, O-", highlight: "" },
  { group: "B+", canGive: "B+, AB+", canReceive: "B+, B-, O+, O-", highlight: "" },
  { group: "AB-", canGive: "AB-, AB+", canReceive: "AB-, A-, B-, O-", highlight: "" },
  { group: "AB+", canGive: "AB+ only", canReceive: "Everyone (Universal Recipient)", highlight: "universal-recipient" }
];

const POPULAR_LOCATIONS = ["Kochi", "Calicut", "Trivandrum", "Kannur", "Malappuram", "Thrissur", "Palakkad", "Bangalore"];

const DISTRICTS = [
  "All Districts",
  "Kozhikode",
  "Ernakulam",
  "Thiruvananthapuram",
  "Kannur",
  "Thrissur",
  "Malappuram",
  "Palakkad",
  "National"
];

// Verified Certified Blood Banks & Hospital Centers
const HOSPITALS_DATA = [
  {
    id: "gmc-clt",
    name: "Govt. Medical College Blood Bank, Kozhikode",
    district: "Kozhikode",
    category: "Govt. Medical College",
    phone: "04952350216",
    timing: "Open 24/7",
    components: ["Whole Blood", "PRBC", "Platelets (RDP)", "FFP"],
    address: "Medical College Junction, Kozhikode, Kerala 673008"
  },
  {
    id: "mims-clt",
    name: "Aster MIMS Hospital Blood Centre",
    district: "Kozhikode",
    category: "NABH Accredited Blood Centre",
    phone: "04952488000",
    timing: "Open 24/7",
    components: ["Whole Blood", "Single Donor Platelets (SDP)", "PRBC", "FFP"],
    address: "Mini Bypass Road, Govindapuram, Kozhikode 673016"
  },
  {
    id: "bmh-clt",
    name: "Baby Memorial Hospital Blood Bank",
    district: "Kozhikode",
    category: "Super-Specialty Hospital",
    phone: "04952723272",
    timing: "Open 24/7",
    components: ["Whole Blood", "Platelets", "PRBC", "Cryoprecipitate"],
    address: "Indira Gandhi Road, Arayidathupalam, Kozhikode 673004"
  },
  {
    id: "aims-ekm",
    name: "Amrita Institute of Medical Sciences (AIMS)",
    district: "Ernakulam",
    category: "Apex Medical Research Centre",
    phone: "04842851234",
    timing: "Open 24/7",
    components: ["Whole Blood", "SDP (Apheresis)", "PRBC", "FFP", "Cryo"],
    address: "AIMS Ponekkara P.O., Edappally, Kochi 682041"
  },
  {
    id: "lisie-ekm",
    name: "Lisie Hospital Blood Centre",
    district: "Ernakulam",
    category: "Multi-Specialty Hospital",
    phone: "04842402044",
    timing: "Open 24/7",
    components: ["Whole Blood", "Platelets", "PRBC", "FFP"],
    address: "Lisie Hospital Road, Kaloor, Kochi 682018"
  },
  {
    id: "aster-ekm",
    name: "Aster Medcity Blood Centre",
    district: "Ernakulam",
    category: "Advanced Quaternary Care",
    phone: "04846699999",
    timing: "Open 24/7",
    components: ["Whole Blood", "SDP (Apheresis)", "PRBC", "FFP"],
    address: "Kuttisahib Road, Cheranalloor, South Chittoor, Kochi 682027"
  },
  {
    id: "rcc-tvm",
    name: "Regional Cancer Centre (RCC) Blood Bank",
    district: "Thiruvananthapuram",
    category: "Regional Cancer Institute",
    phone: "04712442541",
    timing: "Open 24/7",
    components: ["Platelets (SDP & RDP)", "PRBC", "FFP", "Whole Blood"],
    address: "Medical College Campus, Thiruvananthapuram 695011"
  },
  {
    id: "gmch-tvm",
    name: "Govt. Medical College Hospital Blood Bank",
    district: "Thiruvananthapuram",
    category: "Govt. Medical College",
    phone: "04712528300",
    timing: "Open 24/7",
    components: ["Whole Blood", "PRBC", "Platelets", "FFP"],
    address: "Medical College PO, Thiruvananthapuram 695011"
  },
  {
    id: "kims-tvm",
    name: "KIMSHEALTH Blood Centre",
    district: "Thiruvananthapuram",
    category: "Super-Specialty Blood Centre",
    phone: "04713041000",
    timing: "Open 24/7",
    components: ["Whole Blood", "Platelets", "PRBC", "FFP"],
    address: "P.B. No. 1, Anayara P.O., Thiruvananthapuram 695029"
  },
  {
    id: "gmc-knr",
    name: "Govt. Medical College Blood Bank, Kannur",
    district: "Kannur",
    category: "Govt. Medical College",
    phone: "04972808080",
    timing: "Open 24/7",
    components: ["Whole Blood", "PRBC", "Platelets", "FFP"],
    address: "Pariyaram, Kannur, Kerala 670503"
  },
  {
    id: "gmc-tsr",
    name: "Govt. Medical College Blood Bank, Thrissur",
    district: "Thrissur",
    category: "Govt. Medical College",
    phone: "04872200310",
    timing: "Open 24/7",
    components: ["Whole Blood", "PRBC", "Platelets", "FFP"],
    address: "Medical College Road, Mulankunnathukavu, Thrissur 680596"
  },
  {
    id: "jubilee-tsr",
    name: "Jubilee Mission Medical College Hospital",
    district: "Thrissur",
    category: "Medical College Hospital",
    phone: "04872432200",
    timing: "Open 24/7",
    components: ["Whole Blood", "SDP", "PRBC", "FFP"],
    address: "PB No. 737, Jubilee Mission PO, Thrissur 680005"
  },
  {
    id: "gmc-mlp",
    name: "Govt. Medical College Blood Bank, Manjeri",
    district: "Malappuram",
    category: "Govt. Medical College",
    phone: "04832766056",
    timing: "Open 24/7",
    components: ["Whole Blood", "PRBC", "FFP"],
    address: "Vettekode, Manjeri, Malappuram 676121"
  },
  {
    id: "dh-pkd",
    name: "District Hospital Blood Bank, Palakkad",
    district: "Palakkad",
    category: "District Hospital Blood Centre",
    phone: "04912534524",
    timing: "Open 24/7",
    components: ["Whole Blood", "PRBC", "FFP"],
    address: "TB Road, Sultanpet, Palakkad 678001"
  },
  {
    id: "redcross-nat",
    name: "Indian Red Cross Society Blood Centre",
    district: "National",
    category: "Humanitarian Blood Services",
    phone: "1910",
    timing: "24/7 Emergency",
    components: ["All Blood Components", "Rare Blood Bank Support"],
    address: "Red Cross Bhawan, State & National Centres"
  }
];

function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("blood_theme") === "dark";
  });

  // Active navigation tab: 'find' | 'register' | 'compatibility' | 'guide'
  const [activeTab, setActiveTab] = useState("find");

  // Donors & live database state
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & filter state
  const [selectedBlood, setSelectedBlood] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Hospital and blood bank filter state
  const [selectedDistrict, setSelectedDistrict] = useState("All Districts");
  const [bankSearchQuery, setBankSearchQuery] = useState("");

  // Geolocation & distance sorting state
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [sortBy, setSortBy] = useState("default");

  // Emergency SOS Broadcast state
  const [urgentRequests, setUrgentRequests] = useState([]);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [isSubmittingSos, setIsSubmittingSos] = useState(false);
  const [sosForm, setSosForm] = useState({
    patientName: "",
    bloodGroup: "O+",
    units: "1",
    hospital: "",
    city: "",
    contactPhone: "",
    urgency: "Critical (Immediate)"
  });

  // Registration form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [blood, setBlood] = useState("");
  const [place, setPlace] = useState("");
  const [consent, setConsent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // In-App Toast notification system
  const [toasts, setToasts] = useState([]);

  // Delete confirmation dialog modal state
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, donor: null });

  // 1-Click Copy feedback state
  const [copiedId, setCopiedId] = useState(null);

  // Apply theme to document element and sync with localStorage
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDarkMode ? "dark" : "light");
    localStorage.setItem("blood_theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // Toast generator helper
  const showToast = (type, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Real-time Firestore sync for instant updates across users
  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, "donors"),
      (snapshot) => {
        const list = [];
        snapshot.forEach((docSnapshot) => {
          list.push({ ...docSnapshot.data(), id: docSnapshot.id });
        });
        setDonors(list);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error:", error);
        showToast("error", "Unable to connect to live donor database.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Real-time Emergency SOS Requests listener
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "urgent_requests"),
      (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id });
        });
        setUrgentRequests(list);
      },
      (err) => {
        console.warn("Could not sync urgent requests:", err);
      }
    );
    return () => unsub();
  }, []);

  // Compute live SOS alerts (with realistic fallback alerts if collection is newly created)
  const displaySosRequests = useMemo(() => {
    if (urgentRequests.length > 0) return urgentRequests;
    return [
      {
        id: "demo-sos-1",
        patientName: "Emergency ICU Patient",
        bloodGroup: "O-",
        units: "2",
        hospital: "Baby Memorial Hospital",
        city: "Kozhikode",
        contactPhone: "8086380373",
        urgency: "Critical (Immediate)",
        createdAt: new Date().toISOString()
      },
      {
        id: "demo-sos-2",
        patientName: "Cardiac Surgery Case",
        bloodGroup: "B+",
        units: "3",
        hospital: "Aster Medcity",
        city: "Kochi",
        contactPhone: "9847123456",
        urgency: "Needed within 2 hours",
        createdAt: new Date().toISOString()
      }
    ];
  }, [urgentRequests]);

  // Geolocation detector
  const detectLocation = () => {
    if (!navigator.geolocation) {
      showToast("error", "Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          name: "Your GPS Location"
        });
        setSortBy("nearest");
        setIsLocating(false);
        showToast("success", "Location detected! Sorting donors by nearest distance.");
      },
      (err) => {
        console.warn("Geolocation fallback:", err);
        // Central hub fallback (Kozhikode / Calicut)
        setUserLocation({ lat: 11.2588, lng: 75.7804, name: "Calicut Center" });
        setSortBy("nearest");
        setIsLocating(false);
        showToast("info", "Using Central Calicut for nearest distance sorting.");
      },
      { timeout: 7000 }
    );
  };

  // Submit Emergency SOS Request
  const handlePostSos = async (e) => {
    e?.preventDefault();
    if (!sosForm.patientName || !sosForm.hospital || !sosForm.contactPhone) {
      showToast("error", "Please fill all required SOS fields.");
      return;
    }
    setIsSubmittingSos(true);
    try {
      await addDoc(collection(db, "urgent_requests"), {
        patientName: sosForm.patientName.trim(),
        bloodGroup: sosForm.bloodGroup,
        units: sosForm.units,
        hospital: sosForm.hospital.trim(),
        city: sosForm.city.trim() || "Kerala",
        contactPhone: sosForm.contactPhone.replace(/\D/g, ""),
        urgency: sosForm.urgency,
        createdAt: new Date().toISOString()
      });
      showToast("success", "🚨 Urgent SOS Blood Request broadcasted live!");
      setIsSosModalOpen(false);
      setSosForm({
        patientName: "",
        bloodGroup: "O+",
        units: "1",
        hospital: "",
        city: "",
        contactPhone: "",
        urgency: "Critical (Immediate)"
      });
    } catch (err) {
      console.error("SOS submission error:", err);
      showToast("error", "Failed to broadcast SOS. Check connection.");
    } finally {
      setIsSubmittingSos(false);
    }
  };

  // Compute counts per blood group dynamically for the filter chips
  const bloodCounts = useMemo(() => {
    const counts = {};
    BLOOD_GROUPS.forEach((bg) => (counts[bg] = 0));
    donors.forEach((d) => {
      if (d.blood && counts[d.blood] !== undefined) {
        counts[d.blood]++;
      }
    });
    return counts;
  }, [donors]);

  // Filter and sort donors (with distance and search matching)
  const filteredDonors = useMemo(() => {
    let result = donors.filter((d) => {
      const matchesBlood =
        selectedBlood === "ALL" ||
        (d.blood && d.blood.toUpperCase() === selectedBlood.toUpperCase());
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        (d.place && d.place.toLowerCase().includes(query)) ||
        (d.name && d.name.toLowerCase().includes(query)) ||
        (d.phone && d.phone.includes(query));
      return matchesBlood && matchesQuery;
    });

    // Compute distance if user location is available
    result = result.map((d) => {
      let distance = null;
      if (userLocation) {
        const coords = getCoordsForPlace(d.place);
        if (coords) {
          distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            coords.lat,
            coords.lng
          );
        }
      }
      return { ...d, distance };
    });

    // Apply sorting
    if (sortBy === "nearest") {
      result.sort((a, b) => {
        if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
        if (a.distance !== null) return -1;
        if (b.distance !== null) return 1;
        return 0;
      });
    } else if (sortBy === "name") {
      result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return result;
  }, [donors, selectedBlood, searchQuery, userLocation, sortBy]);

  // Filter hospitals and certified blood banks
  const filteredHospitals = useMemo(() => {
    return HOSPITALS_DATA.filter((h) => {
      const matchesDistrict =
        selectedDistrict === "All Districts" ||
        h.district.toLowerCase() === selectedDistrict.toLowerCase();
      const query = bankSearchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        h.name.toLowerCase().includes(query) ||
        h.address.toLowerCase().includes(query) ||
        h.district.toLowerCase().includes(query) ||
        h.components.some((c) => c.toLowerCase().includes(query));
      return matchesDistrict && matchesQuery;
    });
  }, [selectedDistrict, bankSearchQuery]);

  // Handle donor registration
  const handleRegister = async (e) => {
    e?.preventDefault();

    if (!name.trim()) {
      showToast("error", "Please enter the donor's full name.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      showToast("error", "Please enter a valid 10-digit phone number.");
      return;
    }
    if (!blood) {
      showToast("error", "Please select your blood group.");
      return;
    }
    if (!place.trim()) {
      showToast("error", "Please enter your city / location.");
      return;
    }
    if (!consent) {
      showToast("error", "Please accept the consent to be contacted in emergencies.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "donors"), {
        name: name.trim(),
        phone: cleanPhone,
        blood: blood.trim(),
        place: place.trim(),
        createdAt: new Date().toISOString()
      });

      showToast("success", `Thank you! ${name.trim()} is now registered as a ${blood} donor. 🩸`);
      setName("");
      setPhone("");
      setBlood("");
      setPlace("");
      setActiveTab("find");
      setSelectedBlood(blood.trim());
    } catch (error) {
      console.error("Error adding donor:", error);
      showToast("error", "Failed to register donor. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open confirmation modal for safe donor deletion
  const requestDelete = (donor) => {
    setDeleteModal({ isOpen: true, donor });
  };

  // Confirm delete execution
  const confirmDelete = async () => {
    if (!deleteModal.donor) return;
    const { id, name } = deleteModal.donor;
    try {
      await deleteDoc(doc(db, "donors", id));
      showToast("info", `Donor record for ${name || "User"} removed.`);
    } catch (error) {
      console.error("Error deleting donor:", error);
      showToast("error", "Failed to remove donor record.");
    } finally {
      setDeleteModal({ isOpen: false, donor: null });
    }
  };

  // Copy phone number to clipboard
  const handleCopyPhone = (id, phoneNumber) => {
    navigator.clipboard.writeText(phoneNumber);
    setCopiedId(id);
    showToast("info", `Phone number ${phoneNumber} copied to clipboard.`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Share donor info via Web Share API or copy message fallback
  const handleShare = async (donor) => {
    const shareText = `🚨 Urgent Blood Requirement / Available Donor:
🩸 Blood Group: ${donor.blood}
👤 Name: ${donor.name}
📍 Location: ${donor.place}
📞 Contact: ${donor.phone}
Shared via BloodBridge App.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Blood Donor: ${donor.name} (${donor.blood})`,
          text: shareText
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(shareText);
      showToast("info", "Donor details copied! Paste in your WhatsApp group.");
    }
  };

  return (
    <div className="app-wrapper">
      {/* --- Top Navigation Header --- */}
      <header className="app-header">
        <div className="header-inner">
          <div className="brand-section" onClick={() => setActiveTab("find")}>
            <div className="brand-logo-wrap">
              <FaHeartbeat className="pulse-heart" />
            </div>
            <div className="brand-info">
              <h1 className="brand-title">
                Blood<span>Bridge</span>
              </h1>
              <div className="brand-subtitle">
                <span className="live-dot"></span> Live Donor Network
              </div>
            </div>
          </div>

          <div className="header-actions">
            <div className="stats-pill" title="Total registered life savers">
              <FiUsers />
              <span>
                Donors: <strong>{donors.length}</strong>
              </span>
            </div>

            <button
              className="theme-toggle-btn"
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <FiSun /> : <FiMoon />}
            </button>
          </div>
        </div>
      </header>

      {/* --- Main Application Body --- */}
      <main className="main-container">
        {/* --- Hero Emergency Banner --- */}
        <section className="hero-banner">
          <div className="hero-text">
            <div className="hero-tag">
              <FiDroplet /> Emergency Blood Lifeline
            </div>
            <h2 className="hero-title">Connecting Lives, One Drop at a Time</h2>
            <p className="hero-desc">
              Find verified voluntary blood donors nearby or register today to save lives in critical medical
              emergencies.
            </p>
          </div>

          <div className="hero-stats-group">
            <div className="hero-stat-card">
              <div className="hero-stat-number">{donors.length}</div>
              <div className="hero-stat-label">Active Donors</div>
            </div>
            <div className="hero-stat-card">
              <div className="hero-stat-number">{BLOOD_GROUPS.length}</div>
              <div className="hero-stat-label">Blood Groups</div>
            </div>
            <div className="hero-stat-card">
              <div className="hero-stat-number">24/7</div>
              <div className="hero-stat-label">Quick Connect</div>
            </div>
          </div>
        </section>

        {/* --- Live Emergency SOS Alert Strip --- */}
        <div className="sos-alert-strip">
          <div className="sos-strip-left">
            <div className="sos-beacon-wrap">
              <span className="sos-beacon-dot"></span>
              <span className="sos-beacon-pulse"></span>
            </div>
            <div className="sos-strip-text">
              <h4>
                <FiAlertTriangle /> Live Emergency Need ({displaySosRequests.length})
              </h4>
              <p>
                {displaySosRequests[0]?.units} units of {displaySosRequests[0]?.bloodGroup} blood needed at{" "}
                {displaySosRequests[0]?.hospital} ({displaySosRequests[0]?.city}) • Urgent
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <a
              href={`tel:${displaySosRequests[0]?.contactPhone}`}
              className="btn-open-sos"
              style={{ background: "#10b981", boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)" }}
            >
              <FiPhone /> Call Attendant
            </a>
            <button className="btn-open-sos" onClick={() => setIsSosModalOpen(true)}>
              <FaBroadcastTower /> Post SOS Alert
            </button>
          </div>
        </div>

        {/* --- Segmented Navigation Tab Bar --- */}
        <nav className="tab-navigation">
          <button
            className={`nav-tab-btn ${activeTab === "find" ? "active" : ""}`}
            onClick={() => setActiveTab("find")}
          >
            <FiSearch /> Find Donors
            <span className="tab-badge">{filteredDonors.length}</span>
          </button>

          <button
            className={`nav-tab-btn ${activeTab === "register" ? "active" : ""}`}
            onClick={() => setActiveTab("register")}
          >
            <FiUserPlus /> Register as Donor
          </button>

          <button
            className={`nav-tab-btn ${activeTab === "blood-banks" ? "active" : ""}`}
            onClick={() => setActiveTab("blood-banks")}
          >
            <FaHospital /> Blood Banks & Hospitals
            <span className="tab-badge">{filteredHospitals.length}</span>
          </button>

          <button
            className={`nav-tab-btn ${activeTab === "compatibility" ? "active" : ""}`}
            onClick={() => setActiveTab("compatibility")}
          >
            <FiDroplet /> Compatibility Matrix
          </button>

          <button
            className={`nav-tab-btn ${activeTab === "guide" ? "active" : ""}`}
            onClick={() => setActiveTab("guide")}
          >
            <FiInfo /> Donor Checklist
          </button>
        </nav>

        {/* =========================================================
            TAB 1: FIND DONORS (SEARCH & FILTER)
            ========================================================= */}
        {activeTab === "find" && (
          <section>
            {/* Filter Panel */}
            <div className="filter-panel">
              {/* Search input field */}
              <div className="search-input-row">
                <div className="search-box-wrap">
                  <FiSearch className="search-icon-inside" />
                  <input
                    type="text"
                    className="search-input-field"
                    placeholder="Search by city, place or donor name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="clear-search-btn"
                      onClick={() => setSearchQuery("")}
                      title="Clear Search"
                    >
                      <FiX />
                    </button>
                  )}
                </div>
              </div>

              {/* 1-Tap Blood Group Filter Chips */}
              <div className="blood-chips-row">
                <span className="chips-label">
                  <FiDroplet /> Blood Group:
                </span>

                <button
                  className={`blood-chip-btn ${selectedBlood === "ALL" ? "active" : ""}`}
                  onClick={() => setSelectedBlood("ALL")}
                >
                  All Types <span className="chip-count">{donors.length}</span>
                </button>

                {BLOOD_GROUPS.map((bg) => (
                  <button
                    key={bg}
                    className={`blood-chip-btn ${selectedBlood === bg ? "active" : ""}`}
                    onClick={() => setSelectedBlood(bg)}
                  >
                    {bg} <span className="chip-count">{bloodCounts[bg] || 0}</span>
                  </button>
                ))}
              </div>

              {/* Location & Distance Sorting Bar */}
              <div className="location-sort-bar">
                <div className="location-detect-group">
                  <button
                    type="button"
                    className={`btn-detect-loc ${userLocation ? "active" : ""}`}
                    onClick={detectLocation}
                    disabled={isLocating}
                    title="Detect device GPS to sort nearest donors first"
                  >
                    <FiCompass className={isLocating ? "pulse-heart" : ""} />
                    {isLocating
                      ? "Locating GPS..."
                      : userLocation
                      ? `📍 Near ${userLocation.name}`
                      : "Sort by Distance (Detect GPS)"}
                  </button>
                  {userLocation && (
                    <span className="user-loc-text">
                      <FiCheckCircle style={{ color: "var(--accent-success)" }} /> Nearest sorted
                    </span>
                  )}
                </div>

                <div className="sort-select-wrap">
                  <label className="sort-select-label">Sort Order:</label>
                  <select
                    className="sort-dropdown"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="default">Default Order</option>
                    <option value="nearest">Nearest Distance First</option>
                    <option value="newest">Newest First</option>
                    <option value="name">Donor Name (A-Z)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results Status Header */}
            <div className="results-status-bar">
              <span className="results-count-text">
                Showing <strong>{filteredDonors.length}</strong> available donor{filteredDonors.length === 1 ? "" : "s"}
                {selectedBlood !== "ALL" && ` for blood group ${selectedBlood}`}
                {searchQuery && ` matching "${searchQuery}"`}
                {sortBy === "nearest" && " • Sorted nearest first"}
              </span>

              {(selectedBlood !== "ALL" || searchQuery || sortBy !== "default") && (
                <button
                  className="reset-filter-link"
                  onClick={() => {
                    setSelectedBlood("ALL");
                    setSearchQuery("");
                    setSortBy("default");
                  }}
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Donor Cards Grid */}
            <div className="donors-grid">
              {filteredDonors.map((d) => (
                <article key={d.id} className="donor-card">
                  <div className="donor-card-top">
                    <div className="donor-blood-badge">{d.blood}</div>

                    <div className="donor-profile-info">
                      <div className="donor-name-row">
                        <h3 className="donor-name" title={d.name}>
                          {d.name}
                        </h3>
                        <FiCheckCircle className="verified-icon" title="Voluntary Donor" />
                      </div>

                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.place)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="donor-location-tag"
                        title="View on Google Maps"
                      >
                        <FiMapPin className="icon-pin" />
                        <span>{d.place}</span>
                      </a>

                      {d.distance !== null && (
                        <div>
                          <span className="distance-badge" title="Calculated distance from your location">
                            <FiCompass /> ~{d.distance} km away
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      className="donor-card-menu-btn"
                      onClick={() => requestDelete(d)}
                      title="Remove Donor Record"
                    >
                      <FiTrash2 />
                    </button>
                  </div>

                  {/* Contact display box */}
                  <div className="donor-contact-box">
                    <span className="phone-display">
                      <FiPhone /> +91 {d.phone}
                    </span>
                    <button
                      className={`copy-phone-btn ${copiedId === d.id ? "copied" : ""}`}
                      onClick={() => handleCopyPhone(d.id, d.phone)}
                      title="Copy Number"
                    >
                      {copiedId === d.id ? (
                        <>
                          <FiCheck /> Copied
                        </>
                      ) : (
                        <>
                          <FiCopy /> Copy
                        </>
                      )}
                    </button>
                  </div>

                  {/* Action Buttons: Direct Call, WhatsApp, SMS & Share */}
                  <div className="donor-action-buttons">
                    <a href={`tel:${d.phone}`} className="btn-action-call" title="Call Donor Directly">
                      <FiPhone /> Call
                    </a>

                    <a
                      href={`https://wa.me/91${d.phone
                        .toString()
                        .replace(/\D/g, "")}?text=Hello%20${encodeURIComponent(
                        d.name
                      )},%20we%20found%20your%20contact%20on%20BloodBridge.%20There%20is%20an%20urgent%20need%20for%20${encodeURIComponent(
                        d.blood
                      )}%20blood%20in%20${encodeURIComponent(
                        d.place
                      )}.%20Could%20you%20please%20help?`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-action-wa"
                      title="Chat on WhatsApp"
                    >
                      <FaWhatsapp /> WhatsApp
                    </a>

                    <a
                      href={`sms:${d.phone.toString().replace(/\D/g, "")}?body=URGENT%20BLOOD%20REQUEST:%20Need%20${encodeURIComponent(
                        d.blood
                      )}%20blood%20in%20${encodeURIComponent(
                        d.place
                      )}.%20Patient%20in%20critical%20need.%20Can%20you%20please%20help?`}
                      className="btn-action-sms"
                      title="Send Instant SMS Alert"
                    >
                      <FiMessageSquare /> SMS
                    </a>

                    <button
                      className="btn-action-share"
                      onClick={() => handleShare(d)}
                      title="Share Donor Contact"
                    >
                      <FiShare2 />
                    </button>
                  </div>
                </article>
              ))}

              {/* Empty state if no donors match current filters */}
              {!loading && filteredDonors.length === 0 && (
                <div className="empty-state-card">
                  <div className="empty-icon-wrap">
                    <FiDroplet />
                  </div>
                  <h3 className="empty-title">
                    {selectedBlood !== "ALL"
                      ? `No donors currently found for ${selectedBlood}`
                      : "No matching donors found"}
                  </h3>
                  <p className="empty-subtitle">
                    {selectedBlood !== "ALL"
                      ? `Be the first life saver to register under blood group ${selectedBlood} in our community network.`
                      : "Try searching with a different city name or reset the search filter."}
                  </p>
                  <button className="btn-empty-action" onClick={() => setActiveTab("register")}>
                    <FiUserPlus /> Register as a {selectedBlood !== "ALL" ? selectedBlood : ""} Donor
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* =========================================================
            TAB 2: REGISTER NEW DONOR
            ========================================================= */}
        {activeTab === "register" && (
          <section className="register-card-container">
            <div className="register-main-card">
              <div className="register-card-header">
                <div className="reg-icon-badge">
                  <FiUserPlus />
                </div>
                <h2 className="reg-title">Register as a Life Saver</h2>
                <p className="reg-subtitle">
                  Your registration can help save a life in medical emergencies. Fill in your details below.
                </p>
              </div>

              <form onSubmit={handleRegister} className="form-body">
                {/* Visual Blood Group Selector Grid */}
                <div>
                  <label className="form-group-label">
                    Select Your Blood Group <span>*</span>
                  </label>
                  <div className="blood-selector-grid">
                    {BLOOD_GROUPS.map((bg) => (
                      <button
                        type="button"
                        key={bg}
                        className={`blood-select-tile ${blood === bg ? "selected" : ""}`}
                        onClick={() => setBlood(bg)}
                      >
                        <span>{bg}</span>
                        <span className="tile-sub">
                          {bg === "O-" ? "Universal" : bg === "AB+" ? "Recipient" : "Group"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Input Fields Grid */}
                <div className="form-inputs-grid">
                  <div className="input-field-wrap">
                    <label className="form-group-label">
                      Full Name <span>*</span>
                    </label>
                    <div className="input-with-icon">
                      <FiUsers className="field-icon" />
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="input-field-wrap">
                    <label className="form-group-label">
                      Phone Number <span>*</span>
                    </label>
                    <div className="input-with-icon">
                      <FiPhone className="field-icon" />
                      <input
                        type="tel"
                        placeholder="e.g. 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        maxLength={10}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* City / Place Input */}
                <div className="input-field-wrap">
                  <label className="form-group-label">
                    City / Location <span>*</span>
                  </label>
                  <div className="input-with-icon">
                    <FiMapPin className="field-icon" />
                    <input
                      type="text"
                      placeholder="e.g. Calicut / Kochi"
                      value={place}
                      onChange={(e) => setPlace(e.target.value)}
                      required
                    />
                  </div>

                  {/* Popular Location Quick Tags */}
                  <div className="quick-places-row">
                    <span className="quick-places-label">Quick select:</span>
                    {POPULAR_LOCATIONS.map((loc) => (
                      <button
                        type="button"
                        key={loc}
                        className="quick-place-tag"
                        onClick={() => setPlace(loc)}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Consent Checkbox */}
                <label className="consent-checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  <span className="consent-text">
                    I agree to be listed in the public directory and contacted by patients or hospitals in
                    emergencies.
                  </span>
                </label>

                {/* Submit Button */}
                <button type="submit" className="btn-submit-register" disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Registering Donor..."
                  ) : (
                    <>
                      <FiShield /> Complete Registration
                    </>
                  )}
                </button>
              </form>
            </div>
          </section>
        )}

        {/* =========================================================
            TAB 3: BLOOD COMPATIBILITY MATRIX
            ========================================================= */}
        {activeTab === "compatibility" && (
          <section>
            <div className="guide-card">
              <h3 className="guide-card-title">
                <FiDroplet style={{ color: "var(--primary)" }} /> Blood Type Compatibility Guide
              </h3>
              <p className="guide-card-desc">
                Understanding which blood groups are compatible is critical during emergency transfusions.
              </p>

              <div className="matrix-table-wrap">
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th>Blood Group</th>
                      <th>Can Donate To (Give)</th>
                      <th>Can Receive Blood From</th>
                      <th>Special Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPATIBILITY_DATA.map((row) => (
                      <tr key={row.group}>
                        <td>
                          <span
                            className={`pill-type ${
                              row.group === "O-" || row.group === "AB+" ? "universal" : ""
                            }`}
                          >
                            {row.group}
                          </span>
                        </td>
                        <td>
                          {row.canGive.split(", ").map((item, i) => (
                            <span key={i} className="compat-pill">
                              {item}
                            </span>
                          ))}
                        </td>
                        <td>
                          {row.canReceive.split(", ").map((item, i) => (
                            <span key={i} className="compat-pill">
                              {item}
                            </span>
                          ))}
                        </td>
                        <td>
                          {row.group === "O-" && <strong>🌟 Universal Donor</strong>}
                          {row.group === "AB+" && <strong>🎯 Universal Recipient</strong>}
                          {row.group !== "O-" && row.group !== "AB+" && "Standard Match"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================
            TAB 4: DONATION CHECKLIST & ELIGIBILITY
            ========================================================= */}
        {activeTab === "guide" && (
          <section>
            <div className="guide-card">
              <h3 className="guide-card-title">
                <FiCheckCircle style={{ color: "var(--accent-success)" }} /> Blood Donation Eligibility Criteria
              </h3>
              <p className="guide-card-desc">
                Before donating blood, please review the standard medical checklist below to ensure safety for both
                the donor and recipient.
              </p>

              <div className="checklist-grid">
                <div className="checklist-item-card">
                  <div className="checklist-icon">
                    <FiUsers />
                  </div>
                  <div className="checklist-content">
                    <h4>Age & Weight</h4>
                    <p>Must be between 18 to 65 years old and have a minimum body weight of 50 kg (110 lbs).</p>
                  </div>
                </div>

                <div className="checklist-item-card">
                  <div className="checklist-icon">
                    <FiHeart />
                  </div>
                  <div className="checklist-content">
                    <h4>Health & Vitals</h4>
                    <p>
                      Hemoglobin level should be at least 12.5 g/dL. Normal blood pressure and temperature required.
                    </p>
                  </div>
                </div>

                <div className="checklist-item-card">
                  <div className="checklist-icon">
                    <FiShield />
                  </div>
                  <div className="checklist-content">
                    <h4>Interval Between Donations</h4>
                    <p>
                      At least 3 months (90 days) for men and 4 months (120 days) for women between whole blood
                      donations.
                    </p>
                  </div>
                </div>

                <div className="checklist-item-card">
                  <div className="checklist-icon">
                    <FiDroplet />
                  </div>
                  <div className="checklist-content">
                    <h4>Pre-Donation Care</h4>
                    <p>
                      Drink plenty of fluids (500ml of water), eat a wholesome low-fat meal, and avoid smoking/alcohol
                      24 hours prior.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================
            TAB 5: BLOOD BANKS & HOSPITALS DIRECTORY
            ========================================================= */}
        {activeTab === "blood-banks" && (
          <section>
            {/* Emergency Helplines Card */}
            <div className="emergency-helplines-card">
              <div className="helplines-header">
                <FaHeartbeat className="icon-emergency pulse-heart" />
                <h3>24/7 Emergency Blood Helplines</h3>
              </div>
              <div className="helplines-grid">
                <div className="helpline-item">
                  <div className="helpline-info">
                    <h4>National Blood Helpline</h4>
                    <p>Government of India (Toll-Free)</p>
                  </div>
                  <a href="tel:104" className="btn-helpline-call">
                    <FiPhone /> Call 104
                  </a>
                </div>

                <div className="helpline-item">
                  <div className="helpline-info">
                    <h4>Red Cross Blood Centre</h4>
                    <p>Emergency Blood & Rare Groups</p>
                  </div>
                  <a href="tel:1910" className="btn-helpline-call">
                    <FiPhone /> Call 1910
                  </a>
                </div>

                <div className="helpline-item">
                  <div className="helpline-info">
                    <h4>Emergency Ambulance</h4>
                    <p>National Emergency Medical Care</p>
                  </div>
                  <a href="tel:108" className="btn-helpline-call">
                    <FiPhone /> Call 108
                  </a>
                </div>
              </div>
            </div>

            {/* Filter Panel for Blood Banks */}
            <div className="filter-panel">
              <div className="search-input-row">
                <div className="search-box-wrap">
                  <FiSearch className="search-icon-inside" />
                  <input
                    type="text"
                    className="search-input-field"
                    placeholder="Search blood banks by hospital name, city, or component (e.g. Platelets, SDP)..."
                    value={bankSearchQuery}
                    onChange={(e) => setBankSearchQuery(e.target.value)}
                  />
                  {bankSearchQuery && (
                    <button
                      className="clear-search-btn"
                      onClick={() => setBankSearchQuery("")}
                      title="Clear Search"
                    >
                      <FiX />
                    </button>
                  )}
                </div>
              </div>

              {/* District Filter Chips */}
              <div className="blood-chips-row">
                <span className="chips-label">
                  <FiMapPin /> District:
                </span>
                {DISTRICTS.map((d) => (
                  <button
                    key={d}
                    className={`blood-chip-btn ${selectedDistrict === d ? "active" : ""}`}
                    onClick={() => setSelectedDistrict(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Status Bar */}
            <div className="results-status-bar">
              <span className="results-count-text">
                Showing <strong>{filteredHospitals.length}</strong> certified blood centre{filteredHospitals.length === 1 ? "" : "s"}
                {selectedDistrict !== "All Districts" && ` in ${selectedDistrict}`}
                {bankSearchQuery && ` matching "${bankSearchQuery}"`}
              </span>

              {(selectedDistrict !== "All Districts" || bankSearchQuery) && (
                <button
                  className="reset-filter-link"
                  onClick={() => {
                    setSelectedDistrict("All Districts");
                    setBankSearchQuery("");
                  }}
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Blood Banks Grid */}
            <div className="blood-banks-grid">
              {filteredHospitals.map((h) => (
                <article key={h.id} className="bank-card">
                  <div>
                    <div className="bank-card-header">
                      <div className="bank-title-area">
                        <span className="bank-category-badge">{h.category}</span>
                        <h4 className="bank-name">{h.name}</h4>
                      </div>
                      <div className="bank-icon-wrap">
                        <FaHospital />
                      </div>
                    </div>

                    <div className="bank-status-row">
                      <span className="bank-timing">
                        <FiClock /> {h.timing}
                      </span>
                      <span className="bank-district-tag">{h.district}</span>
                    </div>

                    <div style={{ margin: "12px 0" }}>
                      <p className="bank-address-text">
                        <FiMapPin className="icon-pin" />
                        <span>{h.address}</span>
                      </p>
                    </div>

                    <div>
                      <div className="components-label">Components Available:</div>
                      <div className="components-list">
                        {h.components.map((comp, i) => (
                          <span key={i} className="component-chip">
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bank-actions-row">
                    <a href={`tel:${h.phone}`} className="btn-bank-call">
                      <FiPhone /> Call {h.phone}
                    </a>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name + " " + h.address)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-bank-map"
                      title="Open in Google Maps"
                    >
                      <FiNavigation /> Directions
                    </a>
                  </div>
                </article>
              ))}

              {filteredHospitals.length === 0 && (
                <div className="empty-state-card">
                  <div className="empty-icon-wrap">
                    <FaHospital />
                  </div>
                  <h3 className="empty-title">No Blood Banks Found</h3>
                  <p className="empty-subtitle">
                    No hospitals or blood banks match your current search criteria. Try selecting "All Districts" or clearing the search keyword.
                  </p>
                  <button
                    className="btn-empty-action"
                    onClick={() => {
                      setSelectedDistrict("All Districts");
                      setBankSearchQuery("");
                    }}
                  >
                    Reset Directory Filters
                  </button>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* --- Emergency SOS Request Broadcast Modal --- */}
      {isSosModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSosModalOpen(false)}>
          <div
            className="modal-dialog"
            style={{ maxWidth: "520px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="modal-icon-wrap"
              style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}
            >
              <FaBroadcastTower />
            </div>
            <h3 className="modal-title">Broadcast Emergency SOS Blood Need</h3>
            <p className="modal-desc">
              Post an urgent blood requirement. This alert will be broadcasted to all users and donors live.
            </p>

            <form onSubmit={handlePostSos} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label className="form-group-label">Blood Group Needed *</label>
                  <select
                    className="sort-dropdown"
                    style={{ width: "100%", padding: "11px", fontWeight: "700" }}
                    value={sosForm.bloodGroup}
                    onChange={(e) => setSosForm({ ...sosForm, bloodGroup: e.target.value })}
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-group-label">Units Needed *</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    className="search-input-field"
                    style={{ padding: "11px 14px" }}
                    value={sosForm.units}
                    onChange={(e) => setSosForm({ ...sosForm, units: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-group-label">Patient / Attendant Name *</label>
                <input
                  type="text"
                  className="search-input-field"
                  placeholder="e.g. Sreejith (Attendant: Rahul)"
                  value={sosForm.patientName}
                  onChange={(e) => setSosForm({ ...sosForm, patientName: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label className="form-group-label">Hospital Name *</label>
                  <input
                    type="text"
                    className="search-input-field"
                    placeholder="e.g. Baby Memorial Hospital"
                    value={sosForm.hospital}
                    onChange={(e) => setSosForm({ ...sosForm, hospital: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-group-label">City / District *</label>
                  <input
                    type="text"
                    className="search-input-field"
                    placeholder="e.g. Kozhikode"
                    value={sosForm.city}
                    onChange={(e) => setSosForm({ ...sosForm, city: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-group-label">Attendant Contact Phone *</label>
                <input
                  type="tel"
                  className="search-input-field"
                  placeholder="e.g. 9876543210"
                  value={sosForm.contactPhone}
                  onChange={(e) => setSosForm({ ...sosForm, contactPhone: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-group-label">Urgency Level</label>
                <select
                  className="sort-dropdown"
                  style={{ width: "100%", padding: "11px" }}
                  value={sosForm.urgency}
                  onChange={(e) => setSosForm({ ...sosForm, urgency: e.target.value })}
                >
                  <option value="Critical (Immediate)">🚨 Critical (Immediate Need)</option>
                  <option value="Needed within 2 hours">⏱️ Needed within 2-4 hours</option>
                  <option value="Needed Today">📅 Needed Today</option>
                </select>
              </div>

              <div className="modal-actions" style={{ marginTop: "10px" }}>
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsSosModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-delete"
                  style={{ background: "#ef4444" }}
                  disabled={isSubmittingSos}
                >
                  {isSubmittingSos ? "Broadcasting..." : "🚨 Broadcast SOS Alert"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Custom Delete Confirmation Modal --- */}
      {deleteModal.isOpen && (
        <div className="modal-overlay" onClick={() => setDeleteModal({ isOpen: false, donor: null })}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-wrap">
              <FiAlertCircle />
            </div>
            <h3 className="modal-title">Remove Donor?</h3>
            <p className="modal-desc">
              Are you sure you want to remove this donor from the public network? This action cannot be undone.
            </p>
            {deleteModal.donor && (
              <div className="modal-highlight-box">
                {deleteModal.donor.name} • {deleteModal.donor.blood} ({deleteModal.donor.place})
              </div>
            )}
            <div className="modal-actions">
              <button
                className="btn-modal-cancel"
                onClick={() => setDeleteModal({ isOpen: false, donor: null })}
              >
                Cancel
              </button>
              <button className="btn-modal-delete" onClick={confirmDelete}>
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Custom In-App Toast Alert System --- */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-item ${t.type}`}>
            <div className="toast-icon">
              {t.type === "success" && <FiCheckCircle />}
              {t.type === "error" && <FiAlertCircle />}
              {t.type === "info" && <FiInfo />}
            </div>
            <div className="toast-msg">{t.message}</div>
          </div>
        ))}
      </div>

      {/* --- Modern App Footer --- */}
      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="footer-brand-title">BloodBridge</div>
            <div className="footer-copy">
              Developed with dedication by <strong>Rishvan A P</strong> • Saving Lives Every Day
            </div>
          </div>

          <div className="footer-links-group">
            <a
              href="https://wa.me/+918086380373"
              target="_blank"
              rel="noreferrer"
              className="btn-footer-wa"
              title="Message Developer on WhatsApp"
            >
              <FaWhatsapp /> Contact Developer
            </a>

            <span className="footer-badge">v2.0 • 2026 Edition</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;