import { useState } from "react";
import "./App.css";
import CalculatePay from "./components/CalculatePay";
import Login from "./components/Login";
import TimesheetList from "./components/ViewTimesheetList";


function App() {
  const [activePage, setActivePage] = useState("login");

  if (activePage === "calculate-pay") {
    return <CalculatePay onBack={() => setActivePage("login")} />;
  }

  return <Login onOpenCalculatePay={() => setActivePage("calculate-pay")} />;
  // return <TimesheetList consultantId={1}/>
  // To view my pages uncomment the previous line and comment all other lines in the function. Aqib
}

export default App;
