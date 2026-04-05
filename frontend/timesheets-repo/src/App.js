import { useState } from "react";
import "./App.css";
import CalculatePay from "./components/CalculatePay";
import Login from "./components/Login";

function App() {
  const [activePage, setActivePage] = useState("login");

  if (activePage === "calculate-pay") {
    return <CalculatePay onBack={() => setActivePage("login")} />;
  }

  return <Login onOpenCalculatePay={() => setActivePage("calculate-pay")} />;
}

export default App;
