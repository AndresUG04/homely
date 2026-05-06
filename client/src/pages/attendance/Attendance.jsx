import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../config/api";
import ContractList from "./ContractList";
import AttendanceDetail from "./AttendanceDetail";
import EmployerContractList from "./EmployerContractList";
import EmployerAttendanceDetail from "./EmployerAttendanceDetail";

export default function Attendance() {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  console.log("USER COMPLETO:", user);
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [loading, setLoading] = useState(true);

  const isEmployer = user?.role === "employer";

  useEffect(() => {
    const fetchContracts = async () => {
      setLoading(true);
      const data = await api.get("/api/contracts", token);
      if (!data.error) {
        setContracts(data || []);
        if (contractId) {
          const found = (data || []).find(c => c.id === contractId);
          if (found) setSelectedContract(found);
        }
      }
      setLoading(false);
    };
    fetchContracts();
  }, [contractId]);

  const handleSelect = (contract) => {
    setSelectedContract(contract);
    navigate(`/attendance/${contract.id}`, { replace: true });
  };

  const handleBack = () => {
    setSelectedContract(null);
    navigate("/attendance", { replace: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 rounded-full border-2 border-[#D06224] border-t-transparent animate-spin" />
      </div>
    );
  }

  // — EMPLEADOR —
  if (isEmployer) {
    if (selectedContract) {
      return (
        <EmployerAttendanceDetail
          contract={selectedContract}
          workerName={`Trabajadora #${selectedContract.employee_user_id}`}
          onBack={handleBack}
        />
      );
    }
    return <EmployerContractList contracts={contracts} onSelect={handleSelect} />;
  }

  // — EMPLEADA —
  if (selectedContract) {
    return <AttendanceDetail contract={selectedContract} onBack={handleBack} />;
  }

  return <ContractList contracts={contracts} onSelect={handleSelect} />;
}