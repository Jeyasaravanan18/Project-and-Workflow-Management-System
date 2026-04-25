import React, { useState } from "react";
import AuditTrailDashboard from "../../components/AuditTrailDashboard";
import ChangeDetailsModal from "../../components/ChangeDetailsModal";

const ActivityLogs = () => {
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDetails = (activity) => {
    setSelectedActivity(activity);
    setIsModalOpen(true);
  };

  return (
    <>
      <AuditTrailDashboard onViewDetails={handleViewDetails} />
      <ChangeDetailsModal
        activity={selectedActivity}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default ActivityLogs;
