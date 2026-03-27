import { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import "./App.css";

function App() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [blood, setBlood] = useState("");
  const [place, setPlace] = useState(""); 
  const [searchBlood, setSearchBlood] = useState("");
  const [donors, setDonors] = useState([]);

  // Function to save donor details
  const handleSubmit = async () => {
    if (!name || !phone || !blood || !place) {
      alert("Please fill all fields!");
      return;
    }

    try {
      await addDoc(collection(db, "donors"), {
        name,
        phone,
        blood,
        place,
      });
      alert("Donor details saved successfully! ✅");
      
      // Clear input fields after saving
      setName("");
      setPhone("");
      setPlace("");
      setBlood("");
    } catch (error) {
      console.error("Error adding donor: ", error);
      alert("Failed to save data.");
    }
  };

  // Optimized Search function using Firebase query
  const handleSearch = async () => {
    if (!searchBlood) {
      alert("Please select a blood group to search.");
      return;
    }

    try {
      const q = query(collection(db, "donors"), where("blood", "==", searchBlood));
      const querySnapshot = await getDocs(q);
      const list = [];
      querySnapshot.forEach((doc) => {
        list.push(doc.data());
      });
      setDonors(list);
    } catch (error) {
      console.error("Search error: ", error);
    }
  };

  return (
    <div className="container">
      <h2 className="header">🩸 Blood Donor App</h2>

      <div className="input-section">
        <h3>Register as a Donor</h3>
        <input 
          placeholder="Full Name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
        /><br />
        <input 
          placeholder="Phone Number" 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)} 
        /><br />
        <input 
          placeholder="Location / Place" 
          value={place} 
          onChange={(e) => setPlace(e.target.value)} 
        /><br />

        <select value={blood} onChange={(e) => setBlood(e.target.value)}>
          <option value="">Select Blood Group</option>
          <option>A+</option><option>A-</option>
          <option>A1+</option><option>A1-</option>
          <option>A1B+</option><option>A1B-</option>
          <option>A2+</option><option>A2-</option>
          <option>A2B+</option><option>A2B-</option>
          <option>AB+</option><option>AB-</option>
          <option>B+</option><option>B-</option>
          <option>Bombay Blood Group</option>
          <option>INRA</option>
          <option>O+</option><option>O-</option>
        </select><br />

        <button onClick={handleSubmit} className="btn-save">Save Details</button>
      </div>

      <hr />

      <div className="search-section">
        <h3>🔍 Find a Donor</h3>
        <select onChange={(e) => setSearchBlood(e.target.value)}>
          <option value="">Select Blood Group</option>
          <option>A+</option><option>A-</option>
          <option>A1+</option><option>A1-</option>
          <option>A1B+</option><option>A1B-</option>
          <option>A2+</option><option>A2-</option>
          <option>A2B+</option><option>A2B-</option>
          <option>AB+</option><option>AB-</option>
          <option>B+</option><option>B-</option>
          <option>Bombay Blood Group</option>
          <option>INRA</option>
          <option>O+</option><option>O-</option>
        </select><br />

        <button onClick={handleSearch} className="btn-search">Search Now</button>
      </div>

      <div className="results">
        {donors.length > 0 ? donors.map((d, i) => (
          <div key={i} className="card">
            <div className="card-info">
              <strong>{d.name}</strong><br />
              <span>📍 {d.place}</span><br />
              <span className="blood-tag">🩸 {d.blood}</span>
            </div>
            
            <div className="card-actions">
              <a href={`tel:${d.phone}`}>
                <button className="btn-call">📞 Call</button>
              </a>

              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${d.place}`} 
                target="_blank" 
                rel="noreferrer"
              >
                <button className="btn-map">📍 Map</button>
              </a>
            </div>
          </div>
        )) : <p className="no-results">No donors found for this group.</p>}
      </div>
    </div>
  );
}

export default App;