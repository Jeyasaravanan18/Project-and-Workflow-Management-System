import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import styled from 'styled-components';
import { Zap, Sparkles, TrendingUp, Filter } from 'lucide-react';

const AutomationTemplates = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const res = await api.get('/automations/templates');
            setTemplates(res.data.templates || []);
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const useTemplate = async (templateId) => {
        try {
            const res = await api.post(`/automations/from-template/${templateId}`, {
                customizations: {}
            });
            navigate(`/admin/automations/${res.data.automation._id}`);
        } catch (error) {
            console.error('Error using template:', error);
            alert('Error creating automation from template');
        }
    };

    const categories = [
        { id: 'all', label: 'All Templates' },
        { id: 'task_management', label: 'Task Management' },
        { id: 'notifications', label: 'Notifications' },
        { id: 'reporting', label: 'Reporting' },
        { id: 'project_management', label: 'Projects' }
    ];

    const filteredTemplates = selectedCategory === 'all'
        ? templates
        : templates.filter(t => t.category === selectedCategory);

    const featuredTemplates = templates.filter(t => t.featured);

    if (loading) {
        return (
            <Container>
                <Header>
                    <h1>Automation Templates</h1>
                </Header>
                <LoadingState>Loading templates...</LoadingState>
            </Container>
        );
    }

    return (
        <Container>
            <Header>
                <div>
                    <h1><Sparkles size={32} /> Automation Templates</h1>
                    <Subtitle>Start with pre-built workflows and customize to your needs</Subtitle>
                </div>
            </Header>

            {featuredTemplates.length > 0 && (
                <FeaturedSection>
                    <SectionTitle>
                        <TrendingUp size={20} />
                        Featured Templates
                    </SectionTitle>
                    <TemplateGrid>
                        {featuredTemplates.map(template => (
                            <TemplateCard key={template._id} featured>
                                <FeaturedBadge>⭐ Featured</FeaturedBadge>
                                <TemplateIcon>{template.icon || '⚡'}</TemplateIcon>
                                <TemplateName>{template.name}</TemplateName>
                                <TemplateDescription>{template.description}</TemplateDescription>
                                <TemplateFooter>
                                    <CategoryBadge>{template.category.replace(/_/g, ' ')}</CategoryBadge>
                                    <UsageCount>{template.usageCount || 0} uses</UsageCount>
                                </TemplateFooter>
                                <UseButton onClick={() => useTemplate(template._id)}>
                                    Use Template
                                </UseButton>
                            </TemplateCard>
                        ))}
                    </TemplateGrid>
                </FeaturedSection>
            )}

            <CategoryFilter>
                <Filter size={18} />
                {categories.map(cat => (
                    <CategoryButton
                        key={cat.id}
                        active={selectedCategory === cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                    >
                        {cat.label}
                    </CategoryButton>
                ))}
            </CategoryFilter>

            <TemplateGrid>
                {filteredTemplates.filter(t => !t.featured).map(template => (
                    <TemplateCard key={template._id}>
                        <TemplateIcon>{template.icon || '⚡'}</TemplateIcon>
                        <TemplateName>{template.name}</TemplateName>
                        <TemplateDescription>{template.description}</TemplateDescription>
                        <TemplateFooter>
                            <CategoryBadge>{template.category.replace(/_/g, ' ')}</CategoryBadge>
                            <UsageCount>{template.usageCount || 0} uses</UsageCount>
                        </TemplateFooter>
                        <UseButton onClick={() => useTemplate(template._id)}>
                            Use Template
                        </UseButton>
                    </TemplateCard>
                ))}
            </TemplateGrid>

            {filteredTemplates.length === 0 && (
                <EmptyState>
                    <p>No templates found in this category</p>
                </EmptyState>
            )}
        </Container>
    );
};

// Styled Components
const Container = styled.div`
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
`;

const Header = styled.div`
    margin-bottom: 2rem;

    h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #1e293b;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin: 0;
    }
`;

const Subtitle = styled.p`
    color: #64748b;
    margin-top: 0.5rem;
    font-size: 0.95rem;
`;

const FeaturedSection = styled.div`
    margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
`;

const CategoryFilter = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 8px;
    flex-wrap: wrap;
`;

const CategoryButton = styled.button`
    padding: 0.5rem 1rem;
    background: ${props => props.active ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'white'};
    color: ${props => props.active ? 'white' : '#64748b'};
    border: 2px solid ${props => props.active ? 'transparent' : '#e2e8f0'};
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: capitalize;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
`;

const TemplateGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
`;

const TemplateCard = styled.div`
    background: white;
    border: 2px solid ${props => props.featured ? '#fbbf24' : '#e2e8f0'};
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 0.2s;
    position: relative;

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        border-color: ${props => props.featured ? '#f59e0b' : '#6366f1'};
    }
`;

const FeaturedBadge = styled.div`
    position: absolute;
    top: -10px;
    right: 1rem;
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 700;
    box-shadow: 0 4px 8px rgba(245, 158, 11, 0.3);
`;

const TemplateIcon = styled.div`
    font-size: 2.5rem;
    margin-bottom: 1rem;
`;

const TemplateName = styled.h3`
    font-size: 1.1rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 0.75rem 0;
`;

const TemplateDescription = styled.p`
    color: #64748b;
    font-size: 0.9rem;
    line-height: 1.5;
    margin-bottom: 1rem;
`;

const TemplateFooter = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
`;

const CategoryBadge = styled.span`
    padding: 0.25rem 0.75rem;
    background: #f0f0ff;
    color: #6366f1;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: capitalize;
`;

const UsageCount = styled.span`
    font-size: 0.85rem;
    color: #64748b;
`;

const UseButton = styled.button`
    width: 100%;
    padding: 0.75rem;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(99, 102, 241, 0.3);
    }
`;

const LoadingState = styled.div`
    text-align: center;
    padding: 4rem 2rem;
    color: #64748b;
    font-size: 1.1rem;
`;

const EmptyState = styled.div`
    text-align: center;
    padding: 3rem 2rem;
    color: #64748b;
`;

export default AutomationTemplates;
