// src/ChildWizard.js
import { useState } from "react";
import ChildDetails from "./ChildDetails";
import ChildSchedule from "./ChildSchedule";
import ParentDashboard from "./ParentDashboard";

export default function ChildWizard({ parentId }) {
  const [step, setStep] = useState("details"); // details | schedule | done
  const [childIds, setChildIds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Po dodaniu dzieci w ChildDetails
  const handleChildrenSaved = (ids) => {
    setChildIds(ids);
    if (ids.length > 0) {
      setStep("schedule");
      setCurrentIndex(0);
    } else {
      setStep("done");
    }
  };

  // Po zapisaniu harmonogramu jednego dziecka
  const handleScheduleSaved = () => {
    if (currentIndex < childIds.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setStep("done");
    }
  };

  if (step === "details") {
    return <ChildDetails parentId={parentId} onFinish={handleChildrenSaved} />;
  }

  if (step === "schedule") {
    const currentChildId = childIds[currentIndex];
    return (
      <ChildSchedule
        childId={currentChildId}
        onFinish={handleScheduleSaved}
      />
    );
  }

  if (step === "done") {
    return <ParentDashboard parentId={parentId} />;
  }

  return null;
}
