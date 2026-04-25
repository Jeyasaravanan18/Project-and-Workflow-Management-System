// Enhanced AuditTrailDashboard with Change Details Modal
// Add this component to enhance ActivityLogs functionality

import React, { useState } from "react";
import styled from "styled-components";
import { ChevronDown, X } from "lucide-react";

const ChangeDetailsModal = ({ activity, onClose, isOpen }) => {
  if (!isOpen || !activity) return null;

  const getChangeLabel = (field) => {
    const labels = {
      title: "Title",
      description: "Description",
      status: "Status",
      priority: "Priority",
      assignee: "Assigned To",
      dueDate: "Due Date",
      tags: "Tags",
      estimatedHours: "Estimated Hours",
    };
    return labels[field] || field;
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return "(empty)";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2>Change Details</h2>
          <CloseBtn onClick={onClose}>
            <X size={24} />
          </CloseBtn>
        </ModalHeader>

        <ModalBody>
          <DetailGroup>
            <DetailLabel>Entity</DetailLabel>
            <DetailValue>
              {activity.entityType}: {activity.entityName}
            </DetailValue>
          </DetailGroup>

          <DetailGroup>
            <DetailLabel>Action</DetailLabel>
            <DetailValue>{activity.action}</DetailValue>
          </DetailGroup>

          <DetailGroup>
            <DetailLabel>Performed By</DetailLabel>
            <DetailValue>
              {activity.user?.name} ({activity.user?.email})
            </DetailValue>
          </DetailGroup>

          <DetailGroup>
            <DetailLabel>Time</DetailLabel>
            <DetailValue>
              {new Date(activity.timestamp).toLocaleString()}
            </DetailValue>
          </DetailGroup>

          {activity.changeDetails && activity.changeDetails.length > 0 && (
            <>
              <DividerLine />
              <h3 style={{ marginTop: "20px", marginBottom: "12px" }}>
                Field Changes
              </h3>

              {activity.changeDetails.map((change, idx) => (
                <ChangeItem
                  key={idx}
                  $critical={
                    change.oldValue !== change.newValue &&
                    change.field === "status"
                  }
                >
                  <ChangeField>{getChangeLabel(change.field)}</ChangeField>
                  <ChangeValues>
                    <OldValue>
                      <span className="label">Before:</span>
                      <span className="value">
                        {formatValue(change.oldValue)}
                      </span>
                    </OldValue>
                    <Arrow>→</Arrow>
                    <NewValue>
                      <span className="label">After:</span>
                      <span className="value">
                        {formatValue(change.newValue)}
                      </span>
                    </NewValue>
                  </ChangeValues>
                </ChangeItem>
              ))}
            </>
          )}

          {activity.affectedRecords > 1 && (
            <DetailGroup>
              <DetailLabel>Affected Records</DetailLabel>
              <DetailValue>
                {activity.affectedRecords} records updated
              </DetailValue>
            </DetailGroup>
          )}

          {activity.source && (
            <DetailGroup>
              <DetailLabel>Source</DetailLabel>
              <DetailValue>{activity.source}</DetailValue>
            </DetailGroup>
          )}
        </ModalBody>
      </ModalContainer>
    </ModalOverlay>
  );
};

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background: ${(props) => props.theme.bg.card};
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid ${(props) => props.theme.border};
  position: sticky;
  top: 0;
  background: ${(props) => props.theme.bg.card};

  h2 {
    margin: 0;
    font-size: 1.375rem;
    font-weight: 700;
    color: ${(props) => props.theme.text.primary};
  }
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: ${(props) => props.theme.text.secondary};
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;

  &:hover {
    color: ${(props) => props.theme.text.primary};
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const DetailGroup = styled.div`
  margin-bottom: 16px;
`;

const DetailLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 700;
  color: ${(props) => props.theme.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
`;

const DetailValue = styled.div`
  font-size: 0.9375rem;
  color: ${(props) => props.theme.text.primary};
  background: ${(props) => props.theme.bg.tertiary};
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid ${(props) => props.theme.border};
  word-break: break-word;
`;

const DividerLine = styled.div`
  height: 1px;
  background: ${(props) => props.theme.border};
  margin: 20px 0;
`;

const ChangeItem = styled.div`
  background: ${(props) =>
    props.$critical ? "#fee2e220" : props.theme.bg.tertiary};
  border-left: 3px solid
    ${(props) => (props.$critical ? "#ef4444" : props.theme.text.tertiary)};
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
`;

const ChangeField = styled.div`
  font-size: 0.875rem;
  font-weight: 700;
  color: ${(props) => props.theme.text.primary};
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const ChangeValues = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.8125rem;
`;

const OldValue = styled.div`
  flex: 1;
  background: ${(props) => props.theme.bg.card};
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #ef444440;

  .label {
    display: block;
    font-size: 0.7rem;
    color: ${(props) => props.theme.text.secondary};
    font-weight: 600;
    margin-bottom: 4px;
    text-transform: uppercase;
  }

  .value {
    color: #ef4444;
    word-break: break-word;
  }
`;

const Arrow = styled.div`
  color: ${(props) => props.theme.text.tertiary};
  font-weight: bold;
  flex-shrink: 0;
`;

const NewValue = styled.div`
  flex: 1;
  background: ${(props) => props.theme.bg.card};
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #22c55e40;

  .label {
    display: block;
    font-size: 0.7rem;
    color: ${(props) => props.theme.text.secondary};
    font-weight: 600;
    margin-bottom: 4px;
    text-transform: uppercase;
  }

  .value {
    color: #22c55e;
    word-break: break-word;
  }
`;

export default ChangeDetailsModal;
