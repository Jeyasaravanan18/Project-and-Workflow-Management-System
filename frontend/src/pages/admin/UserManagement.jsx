import { useEffect, useState } from "react";
import api from "../../services/api";
import Avatar from "../../components/Avatar";
import Badge from "../../components/Badge";
import Modal from "../../components/Modal";
import InviteUserForm from "../../components/forms/InviteUserForm";
import {
  UserPlus,
  Trash2,
  Mail,
  Shield,
  Users,
  Search,
  Clock,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
} from "lucide-react";
import styled, { keyframes } from "styled-components";

const ITEMS_PER_PAGE = 8;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("card"); // 'card' or 'list'
  const [sortBy, setSortBy] = useState("online"); // 'online', 'name', 'recent'
  const [expandedSections, setExpandedSections] = useState({
    admins: true,
    managers: true,
    members: true,
  });
  const [pagination, setPagination] = useState({
    admins: 0,
    managers: 0,
    members: 0,
  });

  useEffect(() => {
    fetchUsers();
    const userData = JSON.parse(localStorage.getItem("user"));
    setCurrentUser(userData);

    // Refresh online status periodically
    const statusInterval = setInterval(() => {
      fetchUsers();
    }, 30000); // Every 30 seconds

    return () => clearInterval(statusInterval);
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      const usersData = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];
      setUsers(usersData);
    } catch (error) {
      console.error(error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId, userName) => {
    if (!window.confirm(`Remove ${userName}? This cannot be undone.`)) return;

    try {
      await api.delete(`/users/${userId}`);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to remove user");
    }
  };

  const isUserOnline = (user) => {
    if (!user.lastActive) return false;
    const lastActiveTime = new Date(user.lastActive);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastActiveTime > fiveMinutesAgo;
  };

  const formatLastActive = (timestamp) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const sortUsers = (userList) => {
    const sorted = [...userList];
    if (sortBy === "online") {
      return sorted.sort((a, b) => (isUserOnline(b) ? 1 : -1));
    } else if (sortBy === "name") {
      return sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortBy === "recent") {
      return sorted.sort(
        (a, b) => new Date(b.lastActive || 0) - new Date(a.lastActive || 0),
      );
    }
    return sorted;
  };

  const filterUsers = (userList) => {
    return userList.filter(
      (user) =>
        (user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || "").toLowerCase().includes(searchTerm.toLowerCase()),
    );
  };

  const usersArray = Array.isArray(users) ? users : [];
  const adminUsers = usersArray.filter((u) => u.role === "admin");
  const managerUsers = usersArray.filter(
    (u) => u.role === "manager" && u.status === "active",
  );
  const memberUsers = usersArray.filter(
    (u) => u.role === "member" && u.status === "active",
  );

  const filteredAdmins = filterUsers(sortUsers(adminUsers));
  const filteredManagers = filterUsers(sortUsers(managerUsers));
  const filteredMembers = filterUsers(sortUsers(memberUsers));

  // Pagination helpers
  const paginateUsers = (userList, page) => {
    const start = page * ITEMS_PER_PAGE;
    return userList.slice(start, start + ITEMS_PER_PAGE);
  };

  const getTotalPages = (userList) =>
    Math.ceil(userList.length / ITEMS_PER_PAGE);

  if (loading) {
    return (
      <Container>
        <Loading>
          <Spinner />
          <p>Loading users...</p>
        </Loading>
      </Container>
    );
  }

  const totalUsers = usersArray.length;

  // Helper to render section with pagination
  const renderSection = (title, titleIcon, users, sectionKey) => {
    if (users.length === 0) return null;

    const isExpanded = expandedSections[sectionKey];
    const currentPage = pagination[sectionKey];
    const paginatedUsers = paginateUsers(users, currentPage);
    const totalPages = getTotalPages(users);

    return (
      <SectionContainer key={sectionKey}>
        <SectionHeaderClickable
          onClick={() =>
            setExpandedSections({
              ...expandedSections,
              [sectionKey]: !isExpanded,
            })
          }
        >
          <SectionTitleGroup>
            <SectionTitle>
              {titleIcon && (
                <span style={{ display: "flex", alignItems: "center" }}>
                  {titleIcon}
                </span>
              )}
              {title}
            </SectionTitle>
            <SectionCount>{users.length}</SectionCount>
          </SectionTitleGroup>
          <ChevronIcon $expanded={isExpanded}>
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </ChevronIcon>
        </SectionHeaderClickable>

        {isExpanded && (
          <>
            {viewMode === "card" ? (
              <UserGrid>
                {paginatedUsers.map((user, index) => (
                  <UserCard key={user._id} $delay={index * 0.05}>
                    <CardHeader>
                      <UserInfo>
                        <Avatar name={user.name} size="md" />
                        <div>
                          <CardUserName>{user.name}</CardUserName>
                          <CardEmail>{user.email}</CardEmail>
                        </div>
                      </UserInfo>
                      {currentUser && currentUser._id !== user._id && (
                        <DeleteButton
                          onClick={() => handleRemoveUser(user._id, user.name)}
                        >
                          <Trash2 size={16} />
                        </DeleteButton>
                      )}
                    </CardHeader>
                    <CardBody>
                      <StatusSection>
                        <StatusIndicator $online={isUserOnline(user)} />
                        <div>
                          <StatusLabel>
                            {isUserOnline(user)
                              ? "Active"
                              : `Active before ${formatLastActive(user.lastActive)}`}
                          </StatusLabel>
                          <StatusTime>
                            {user.lastActive
                              ? formatLastActive(user.lastActive)
                              : "Never connected"}
                          </StatusTime>
                        </div>
                      </StatusSection>
                    </CardBody>
                  </UserCard>
                ))}
              </UserGrid>
            ) : (
              <UserListTable>
                <ListTableBody>
                  {paginatedUsers.map((user) => (
                    <UserListRow key={user._id}>
                      <UserListCell>
                        <UserListInfo>
                          <Avatar name={user.name} size="sm" />
                          <div>
                            <UserListName>{user.name}</UserListName>
                            <UserListEmail>{user.email}</UserListEmail>
                          </div>
                        </UserListInfo>
                      </UserListCell>
                      <UserListCell>
                        <StatusSection $row>
                          <StatusIndicator $online={isUserOnline(user)} />
                          <div>
                            <StatusLabel>
                              {isUserOnline(user)
                                ? "Active"
                                : `Active before ${formatLastActive(user.lastActive)}`}
                            </StatusLabel>
                          </div>
                        </StatusSection>
                      </UserListCell>
                      <UserListCell $align="right">
                        {currentUser && currentUser._id !== user._id && (
                          <DeleteButton
                            onClick={() =>
                              handleRemoveUser(user._id, user.name)
                            }
                          >
                            <Trash2 size={16} />
                          </DeleteButton>
                        )}
                      </UserListCell>
                    </UserListRow>
                  ))}
                </ListTableBody>
              </UserListTable>
            )}

            {totalPages > 1 && (
              <PaginationBar>
                <PaginationInfo>
                  Page {currentPage + 1} of {totalPages}
                </PaginationInfo>
                <PaginationControls>
                  <PaginationButton
                    onClick={() =>
                      setPagination({
                        ...pagination,
                        [sectionKey]: Math.max(0, currentPage - 1),
                      })
                    }
                    disabled={currentPage === 0}
                  >
                    ← Previous
                  </PaginationButton>
                  <PaginationButton
                    onClick={() =>
                      setPagination({
                        ...pagination,
                        [sectionKey]: Math.min(totalPages - 1, currentPage + 1),
                      })
                    }
                    disabled={currentPage === totalPages - 1}
                  >
                    Next →
                  </PaginationButton>
                </PaginationControls>
              </PaginationBar>
            )}
          </>
        )}
      </SectionContainer>
    );
  };

  return (
    <Container>
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Team Member"
      >
        <InviteUserForm
          onSuccess={() => {
            setIsInviteModalOpen(false);
            fetchUsers();
          }}
          onCancel={() => setIsInviteModalOpen(false)}
        />
      </Modal>

      {/* Header */}
      <Header>
        <HeaderLeft>
          <Title>Team Management</Title>
          <Subtitle>{totalUsers} team members</Subtitle>
        </HeaderLeft>
        <HeaderRight>
          <SearchBar>
            <SearchIcon>
              <Search size={18} />
            </SearchIcon>
            <SearchInput
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchBar>
          <ControlsBar>
            <SortSelect
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="online">Sort by: Online First</option>
              <option value="name">Sort by: Name</option>
              <option value="recent">Sort by: Recent Activity</option>
            </SortSelect>
            <ViewToggle>
              <ViewButton
                $active={viewMode === "card"}
                onClick={() => setViewMode("card")}
                title="Grid View"
              >
                <LayoutGrid size={18} />
              </ViewButton>
              <ViewButton
                $active={viewMode === "list"}
                onClick={() => setViewMode("list")}
                title="List View"
              >
                <List size={18} />
              </ViewButton>
            </ViewToggle>
            <InviteButton onClick={() => setIsInviteModalOpen(true)}>
              <UserPlus size={18} />
              Invite User
            </InviteButton>
          </ControlsBar>
        </HeaderRight>
      </Header>

      {/* Admin Section */}
      {renderSection(
        "Administrators",
        <Shield size={20} />,
        filteredAdmins,
        "admins",
      )}

      {/* Managers Section */}
      {renderSection(
        "Managers",
        <Users size={20} />,
        filteredManagers,
        "managers",
      )}

      {/* Members Section */}
      {renderSection(
        "Team Members",
        <Users size={20} />,
        filteredMembers,
        "members",
      )}

      {filteredAdmins.length === 0 &&
        filteredManagers.length === 0 &&
        filteredMembers.length === 0 && (
          <EmptyState>
            <Users size={48} />
            <p>No users found{searchTerm && ` matching "${searchTerm}"`}</p>
          </EmptyState>
        )}
    </Container>
  );
};

const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
`;

const rotate = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

const Container = styled.div`
  padding: 32px;
  background: ${(props) => props.theme.bg.primary};
  min-height: 100vh;
  max-width: 1400px;
  margin: 0 auto;
`;

const Loading = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70vh;
  color: ${(props) => props.theme.text.secondary};
  p {
    margin-top: 20px;
  }
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid ${(props) => props.theme.border};
  border-top-color: ${(props) => props.theme.text.secondary};
  border-radius: 50%;
  animation: ${rotate} 1s linear infinite;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  animation: ${fadeIn} 0.5s ease-out;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
    align-items: flex-start;
  }
`;

const HeaderLeft = styled.div``;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;

  @media (max-width: 768px) {
    width: 100%;
    flex-wrap: wrap;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: ${(props) => props.theme.text.primary};
  margin-bottom: 4px;
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: ${(props) => props.theme.text.secondary};
`;

const SearchBar = styled.div`
  position: relative;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: ${(props) => props.theme.text.tertiary};
`;

const SearchInput = styled.input`
  width: 280px;
  padding: 10px 14px 10px 42px;
  background: ${(props) => props.theme.bg.card};
  border: 2px solid ${(props) => props.theme.border};
  border-radius: 10px;
  font-size: 0.875rem;
  color: ${(props) => props.theme.text.primary};
  outline: none;
  transition: all 0.3s ease;

  &::placeholder {
    color: ${(props) => props.theme.text.tertiary};
  }

  &:focus {
    border-color: ${(props) => props.theme.text.secondary};
    box-shadow: 0 0 0 3px
      ${(props) =>
        props.theme.mode === "dark"
          ? "rgba(255, 255, 255, 0.1)"
          : "rgba(71, 85, 105, 0.1)"};
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const InviteButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: ${(props) =>
    props.theme.mode === "dark" ? "#f8fafc" : "#475569"};
  color: ${(props) => (props.theme.mode === "dark" ? "#0f172a" : "white")};
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(71, 85, 105, 0.2);
  white-space: nowrap;

  &:hover {
    background: ${(props) =>
      props.theme.mode === "dark" ? "#e2e8f0" : "#334155"};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(71, 85, 105, 0.3);
  }
`;

/* Section Styles */
const SectionContainer = styled.div`
  margin-bottom: 48px;
  animation: ${fadeIn} 0.5s ease-out;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid ${(props) => props.theme.border};
`;

const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.375rem;
  font-weight: 700;
  color: ${(props) => props.theme.text.primary};

  svg {
    color: ${(props) => props.theme.text.secondary};
  }
`;

const SectionCount = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: ${(props) => props.theme.bg.tertiary};
  border-radius: 50%;
  font-size: 0.875rem;
  font-weight: 700;
  color: ${(props) => props.theme.text.secondary};
`;

/* User Grid & Card Styles */
const UserGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const UserCard = styled.div`
  background: ${(props) => props.theme.bg.card};
  border: 1px solid ${(props) => props.theme.border};
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.3s ease;
  animation: ${fadeIn} 0.3s ease-out;
  animation-delay: ${(props) => props.$delay}s;
  opacity: 0;
  animation-fill-mode: forwards;
  box-shadow: ${(props) => props.theme.shadow.xs};

  &:hover {
    border-color: ${(props) =>
      props.theme.mode === "dark" ? "#475569" : "#cbd5e1"};
    box-shadow: ${(props) => props.theme.shadow.md};
    transform: translateY(-4px);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid ${(props) => props.theme.border};
`;

const CardBody = styled.div`
  padding: 20px;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
`;

const CardUserName = styled.div`
  font-weight: 700;
  font-size: 0.9375rem;
  color: ${(props) => props.theme.text.primary};
  word-break: break-word;
`;

const CardEmail = styled.div`
  font-size: 0.8125rem;
  color: ${(props) => props.theme.text.tertiary};
  word-break: break-word;
  margin-top: 2px;
`;

const StatusSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-direction: ${(props) => (props.$row ? "row" : "column")};
  min-width: 0;
`;

const StatusIndicator = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${(props) => (props.$online ? "#22c55e" : "#f59e0b")};
  flex-shrink: 0;
  animation: ${(props) => (props.$online ? pulse : "none")} 2s ease-in-out
    infinite;
`;

const StatusLabel = styled.div`
  font-weight: 600;
  font-size: 0.875rem;
  color: ${(props) => props.theme.text.primary};
`;

const StatusTime = styled.div`
  font-size: 0.75rem;
  color: ${(props) => props.theme.text.tertiary};
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const DeleteButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: ${(props) =>
      props.theme.mode === "dark" ? "rgba(254, 242, 242, 0.1)" : "#fef2f2"};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 80px 24px;
  color: ${(props) => props.theme.text.tertiary};
  background: ${(props) => props.theme.bg.card};
  border-radius: 14px;
  border: 1px dashed ${(props) => props.theme.border};

  svg {
    color: ${(props) => props.theme.text.tertiary};
    margin-bottom: 16px;
  }

  p {
    font-size: 0.875rem;
  }
`;

/* Controls & Filters */
const ControlsBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  @media (max-width: 1024px) {
    width: 100%;
    justify-content: flex-end;
  }
`;

const SortSelect = styled.select`
  padding: 10px 14px;
  background: ${(props) => props.theme.bg.card};
  border: 2px solid ${(props) => props.theme.border};
  border-radius: 10px;
  color: ${(props) => props.theme.text.primary};
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;

  &:hover {
    border-color: ${(props) => props.theme.text.secondary};
  }

  &:focus {
    border-color: ${(props) => props.theme.text.secondary};
    box-shadow: 0 0 0 3px
      ${(props) =>
        props.theme.mode === "dark"
          ? "rgba(255, 255, 255, 0.1)"
          : "rgba(71, 85, 105, 0.1)"};
  }
`;

const ViewToggle = styled.div`
  display: flex;
  background: ${(props) => props.theme.bg.card};
  border: 2px solid ${(props) => props.theme.border};
  border-radius: 10px;
  padding: 4px;
  gap: 4px;
`;

const ViewButton = styled.button`
  padding: 8px 12px;
  background: ${(props) =>
    props.$active ? props.theme.text.secondary : "transparent"};
  color: ${(props) =>
    props.$active
      ? props.theme.mode === "dark"
        ? "#0f172a"
        : "white"
      : props.theme.text.tertiary};
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${(props) =>
      props.theme.mode === "dark"
        ? "rgba(148, 163, 184, 0.2)"
        : "rgba(71, 85, 105, 0.1)"};
  }
`;

/* Section Header */
const SectionHeaderClickable = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  background: none;
  border: none;
  border-bottom: 2px solid ${(props) => props.theme.border};
  cursor: pointer;
  transition: all 0.2s ease;
  padding-bottom: 16px;
  margin-bottom: 16px;

  &:hover {
    opacity: 0.8;
  }
`;

const SectionTitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const ChevronIcon = styled.div`
  display: flex;
  align-items: center;
  color: ${(props) => props.theme.text.secondary};
  transform: ${(props) => (props.$expanded ? "rotate(0)" : "rotate(0)")};
  transition: transform 0.3s ease;
`;

/* List View Styles */
const UserListTable = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid ${(props) => props.theme.border};
  border-radius: 10px;
  background: ${(props) => props.theme.bg.card};
  overflow: hidden;
  margin-bottom: 20px;
`;

const ListTableBody = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  max-height: 600px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${(props) => props.theme.bg.tertiary};
  }

  &::-webkit-scrollbar-thumb {
    background: ${(props) => props.theme.border};
    border-radius: 3px;

    &:hover {
      background: ${(props) => props.theme.text.tertiary};
    }
  }
`;

const UserListRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px 100px;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid ${(props) => props.theme.border};
  align-items: center;
  transition: background 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${(props) => props.theme.bg.hover};
  }

  @media (max-width: 1024px) {
    grid-template-columns: 1fr 200px 50px;
  }
`;

const UserListCell = styled.div`
  text-align: ${(props) => props.$align || "left"};
  overflow: hidden;
`;

const UserListInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
`;

const UserListName = styled.div`
  font-weight: 700;
  font-size: 0.9375rem;
  color: ${(props) => props.theme.text.primary};
  word-break: break-word;
`;

const UserListEmail = styled.div`
  font-size: 0.8125rem;
  color: ${(props) => props.theme.text.tertiary};
  margin-top: 2px;
  word-break: break-word;
`;

/* Pagination */
const PaginationBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-top: 1px solid ${(props) => props.theme.border};
  background: ${(props) => props.theme.bg.tertiary};
  border-radius: 0 0 10px 10px;
`;

const PaginationInfo = styled.div`
  font-size: 0.875rem;
  color: ${(props) => props.theme.text.secondary};
  font-weight: 600;
`;

const PaginationControls = styled.div`
  display: flex;
  gap: 8px;
`;

const PaginationButton = styled.button`
  padding: 8px 16px;
  background: ${(props) => props.theme.bg.card};
  border: 1px solid ${(props) => props.theme.border};
  border-radius: 8px;
  color: ${(props) => props.theme.text.primary};
  font-size: 0.875rem;
  font-weight: 600;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: all 0.2s ease;
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};

  &:hover:not(:disabled) {
    background: ${(props) => props.theme.text.secondary};
    color: ${(props) => (props.theme.mode === "dark" ? "#0f172a" : "white")};
    transform: translateY(-2px);
  }
`;

export default UserManagement;
