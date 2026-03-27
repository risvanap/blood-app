import { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import "./App.css";

function App() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [blood, setBlood] = useState("");
  const [searchBlood, setSearchBlood] = useState("");
  const [donors, setDonors] = useState([]);

  const handleSubmit = async () => {
    await addDoc(collection(db, "donors"), {
      name,
      phone,
      blood,
    });
    alert("Saved ✅");
  };

  const handleSearch = async () => {
    const querySnapshot = await getDocs(collection(db, "donors"));
    const list = [];
    querySnapshot.forEach((doc) => {
      if (doc.data().blood === searchBlood) {
        list.push(doc.data());
      }
    });
    setDonors(list);
  };

return (
  <div className="container">
    <h2>🩸 Blood Donor App</h2>

    {/* Input section to add new donors */}
    <input placeholder="Name" onChange={(e) => setName(e.target.value)} /><br /><br />
    <input placeholder="Phone" onChange={(e) => setPhone(e.target.value)} /><br /><br />

    <select onChange={(e) => setBlood(e.target.value)}>
      <option>Select Blood Group</option>
      <option>A+</option>
      <option>A-</option>
      <option>A1+</option>
      <option>A1-</option>
      <option>A1B+</option>
      <option>A1B-</option>
      <option>A2+</option>
      <option>A2-</option>
      <option>A2B+</option>
      <option>A2B-</option>
      <option>AB+</option>
      <option>AB-</option>
      <option>B+</option>
      <option>B-</option>
      <option>Bombay Blood Group</option>
      <option>INRA</option>
      <option>O+</option>
      <option>O-</option>
    </select><br /><br />

    <button onClick={handleSubmit}>Save</button>

    <hr />

    {/* Search section */}
    <h3>🔍 Search Donor</h3>

    <select onChange={(e) => setSearchBlood(e.target.value)}>
      <option>Select Blood Group</option>
      <option>A+</option>
      <option>A-</option>
      <option>A1+</option>
      <option>A1-</option>
      <option>A1B+</option>
      <option>A1B-</option>
      <option>A2+</option>
      <option>A2-</option>
      <option>A2B+</option>
      <option>A2B-</option>
      <option>AB+</option>
      <option>AB-</option>
      <option>B+</option>
      <option>B-</option>
      <option>Bombay Blood Group</option>
      <option>INRA</option>
      <option>O+</option>
      <option>O-</option>
    </select><br /><br />

    <button onClick={handleSearch}>Search</button>

    {/* Displaying the list of donors */}
    <ul>
      {donors.map((d, i) => (
        <li key={i}>
          <div className="card">
            <strong>{d.name}</strong> - {d.phone} ({d.blood})
            <br />

            {/* Call Button */}
            <a href={`tel:${d.phone}`}>
              <button>📞 Call</button>
            </a>

            {/* Map Button - Corrected the URL syntax */}
            <a 
              href={`https://www.google.com/maps?q=${d.lat},${d.lng}`} 
              target="_blank" 
              rel="noreferrer"
            >
              <button>📍 Map</button>
            </a>
          </div>
        </li>
      ))}
    </ul>
  </div>
);

}

export default App;