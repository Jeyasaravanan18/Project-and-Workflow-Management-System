import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Search, X, Folder, CheckSquare, User, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const GlobalSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            if (query.length >= 2) {
                performSearch();
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(delaySearch);
    }, [query]);

    const performSearch = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/search?query=${query}`);
            setResults(res.data.data);
            setIsOpen(true);
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (item) => {
        setIsOpen(false);
        setQuery('');

        switch (item.type) {
            case 'project':
                navigate(`/projects/${item._id}`);
                break;
            case 'task':
                // Ideally open task modal, but context is tricky.
                // For now navigate to project board? Or task specific page?
                // Let's assume we can navigate to project with task context if supported
                // or just log for now as navigating to task detail page isn't fully set up globally.
                // We'll navigate to project.
                // navigate(`/projects/${item.projectId}`); // Assuming taskId resolves to project
                // For MVP: Navigate to projects list or specific project if we had projectId in search result.
                // The search controller didn't populate projectId for tasks. Let's fix that later.
                // Navigation to generic projects for now.
                navigate('/projects');
                break;
            case 'user':
                navigate(`/users/${item._id}`);
                break;
            default:
                break;
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'project': return <Folder size={16} className="icon project" />;
            case 'task': return <CheckSquare size={16} className="icon task" />;
            case 'user': return <User size={16} className="icon user" />;
            default: return <Search size={16} />;
        }
    };

    return (
        <SearchContainer ref={searchRef}>
            <SearchInputWrapper>
                <Search size={18} className="search-icon" />
                <Input
                    type="text"
                    placeholder="Search tasks, projects, people..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                />
                {query && (
                    <ClearButton onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }}>
                        <X size={14} />
                    </ClearButton>
                )}
            </SearchInputWrapper>

            {isOpen && (results.length > 0 || loading) && (
                <ResultsDropdown>
                    {loading ? (
                        <LoadingItem>Searching...</LoadingItem>
                    ) : (
                        results.map((item, index) => (
                            <ResultItem key={index} onClick={() => handleSelect(item)}>
                                <ResultIcon>{getIcon(item.type)}</ResultIcon>
                                <ResultInfo>
                                    <ResultTitle>{item.name || item.title}</ResultTitle>
                                    <ResultMeta>
                                        {item.type} • {item.status || item.role || item.key || item.taskKey}
                                    </ResultMeta>
                                </ResultInfo>
                                <ArrowRight size={14} className="arrow" />
                            </ResultItem>
                        ))
                    )}
                    {!loading && results.length === 0 && query.length >= 2 && (
                        <NoResults>No results found for "{query}"</NoResults>
                    )}
                </ResultsDropdown>
            )}
        </SearchContainer>
    );
};

const SearchContainer = styled.div`
    position: relative;
    width: 100%;
    max-width: 400px;
`;

const SearchInputWrapper = styled.div`
    position: relative;
    display: flex;
    align-items: center;

    .search-icon {
        position: absolute;
        left: 12px;
        color: #94a3b8;
    }
`;

const Input = styled.input`
    width: 100%;
    height: 40px;
    padding: 0 36px;
    border-radius: 20px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    color: #1e293b;
    font-size: 14px;
    transition: all 0.2s;

    &:focus {
        outline: none;
        background: white;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    &::placeholder {
        color: #94a3b8;
    }
`;

const ClearButton = styled.button`
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
        color: #64748b;
    }
`;

const ResultsDropdown = styled.div`
    position: absolute;
    top: 48px;
    left: 0;
    width: 100%;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0;
    overflow: hidden;
    z-index: 100;
    max-height: 300px;
    overflow-y: auto;
`;

const ResultItem = styled.div`
    display: flex;
    align-items: center;
    padding: 10px 16px;
    cursor: pointer;
    transition: background 0.1s;
    border-bottom: 1px solid #f1f5f9;

    &:last-child {
        border-bottom: none;
    }

    &:hover {
        background: #f8fafc;
        
        .arrow {
            opacity: 1;
            transform: translateX(0);
        }
    }

    .arrow {
        color: #cbd5e1;
        opacity: 0;
        transform: translateX(-5px);
        transition: all 0.2s;
    }
`;

const ResultIcon = styled.div`
    margin-right: 12px;
    color: #64748b;
    
    .project { color: #667eea; }
    .task { color: #10b981; }
    .user { color: #f59e0b; }
`;

const ResultInfo = styled.div`
    flex: 1;
`;

const ResultTitle = styled.div`
    font-size: 14px;
    font-weight: 500;
    color: #1e293b;
`;

const ResultMeta = styled.div`
    font-size: 12px;
    color: #94a3b8;
    text-transform: capitalize;
`;

const LoadingItem = styled.div`
    padding: 16px;
    text-align: center;
    color: #94a3b8;
    font-size: 13px;
`;

const NoResults = styled.div`
    padding: 16px;
    text-align: center;
    color: #94a3b8;
    font-size: 13px;
`;

export default GlobalSearch;
