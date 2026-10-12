import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import styled from 'styled-components';
import { Sparkles, TrendingUp, Filter, ArrowLeft, ArrowRight } from 'lucide-react';

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
                <LoadingState>Loading automation templates...</LoadingState>
            </Container>
        );
    }

    return (
        <Container>
            <BackNav onClick={() => navigate('/admin/automations')}>
                <ArrowLeft size={16} /> Back to Automations
            </BackNav>

            <Header>
                <div>
                    <Badge><Sparkles size={12} /> Ready-to-use workflows</Badge>
                    <Title>Automation Templates</Title>
                    <Subtitle>Choose from curated automation recipes to speed up your team's workflow</Subtitle>
                </div>
            </Header>

            {featuredTemplates.length > 0 && (
                <FeaturedSection>
                    <SectionTitle>
                        <TrendingUp size={18} color="#1E40AF" />
                        Featured Templates
                    </SectionTitle>
                    <TemplateGrid>
                        {featuredTemplates.map(template => (
                            <TemplateCard key={template._id} $featured>
                                <FeaturedBadge>⭐ Featured</FeaturedBadge>
                                <TemplateIcon>{template.icon || '⚡'}</TemplateIcon>
                                <TemplateName>{template.name}</TemplateName>
                                <TemplateDescription>{template.description}</TemplateDescription>
                                <TemplateFooter>
                                    <CategoryBadge>{template.category.replace(/_/g, ' ')}</CategoryBadge>
                                    <UsageCount>{template.usageCount || 0} uses</UsageCount>
                                </TemplateFooter>
                                <UseButton onClick={() => useTemplate(template._id)}>
                                    Use Template <ArrowRight size={14} />
                                </UseButton>
                            </TemplateCard>
                        ))}
                    </TemplateGrid>
                </FeaturedSection>
            )}

            <FilterBar>
                <FilterLabel>
                    <Filter size={15} /> Filter:
                </FilterLabel>
                <CategoryGroup>
                    {categories.map(cat => (
                        <CategoryButton
                            key={cat.id}
                            $active={selectedCategory === cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                        >
                            {cat.label}
                        </CategoryButton>
                    ))}
                </CategoryGroup>
            </FilterBar>

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
                            Use Template <ArrowRight size={14} />
                        </UseButton>
                    </TemplateCard>
                ))}
            </TemplateGrid>

            {filteredTemplates.length === 0 && (
                <EmptyState>
                    <p>No templates found in this category.</p>
                </EmptyState>
            )}
        </Container>
    );
};

// Styled Components
const Container = styled.div`
    padding: 32px;
    max-width: 1300px;
    margin: 0 auto;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const BackNav = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: none;
    color: #64748b;
    font-size: 0.84rem;
    font-weight: 500;
    cursor: pointer;
    margin-bottom: 18px;
    padding: 0;
    transition: color 0.15s;

    &:hover {
        color: #111827;
    }
`;

const Header = styled.div`
    margin-bottom: 28px;
`;

const Badge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #EFF6FF;
    color: #1E40AF;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid #a7f3d0;
    margin-bottom: 8px;
`;

const Title = styled.h1`
    font-size: 1.875rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
    letter-spacing: -0.02em;
`;

const Subtitle = styled.p`
    color: #64748b;
    margin-top: 4px;
    font-size: 0.875rem;
`;

const FeaturedSection = styled.div`
    margin-bottom: 32px;
`;

const SectionTitle = styled.h2`
    font-size: 1.1rem;
    font-weight: 700;
    color: #111827;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
`;

const FilterBar = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
    flex-wrap: wrap;
`;

const FilterLabel = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #64748b;
`;

const CategoryGroup = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
`;

const CategoryButton = styled.button`
    padding: 6px 14px;
    background: ${props => props.$active ? '#1E40AF' : '#ffffff'};
    color: ${props => props.$active ? '#ffffff' : '#374151'};
    border: 1px solid ${props => props.$active ? '#1E40AF' : '#e5e7eb'};
    border-radius: 9999px;
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
        background: ${props => props.$active ? '#1E40AF' : '#f8fafc'};
        border-color: ${props => props.$active ? '#1E40AF' : '#d1d5db'};
    }
`;

const TemplateGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 18px;
`;

const TemplateCard = styled.div`
    background: #ffffff;
    border: 1px solid ${props => props.$featured ? '#a7f3d0' : '#e5e7eb'};
    border-radius: 14px;
    padding: 22px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    transition: all 0.15s ease;
    position: relative;
    display: flex;
    flex-direction: column;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        border-color: ${props => props.$featured ? '#1E40AF' : '#cbd5e1'};
    }
`;

const FeaturedBadge = styled.div`
    position: absolute;
    top: 14px;
    right: 14px;
    background: #EFF6FF;
    color: #1E40AF;
    border: 1px solid #a7f3d0;
    padding: 2px 8px;
    border-radius: 9999px;
    font-size: 0.7rem;
    font-weight: 600;
`;

const TemplateIcon = styled.div`
    font-size: 2rem;
    margin-bottom: 12px;
`;

const TemplateName = styled.h3`
    font-size: 1rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 8px 0;
`;

const TemplateDescription = styled.p`
    color: #64748b;
    font-size: 0.84rem;
    line-height: 1.5;
    margin: 0 0 16px 0;
    flex: 1;
`;

const TemplateFooter = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
    padding-top: 12px;
    border-top: 1px solid #f1f5f9;
`;

const CategoryBadge = styled.span`
    padding: 3px 8px;
    background: #f8fafc;
    color: #475569;
    border-radius: 6px;
    font-size: 0.72rem;
    font-weight: 500;
    text-transform: capitalize;
    border: 1px solid #e2e8f0;
`;

const UsageCount = styled.span`
    font-size: 0.78rem;
    color: #94a3b8;
`;

const UseButton = styled.button`
    width: 100%;
    padding: 10px 16px;
    background: #111827;
    color: #ffffff;
    border: none;
    border-radius: 9999px;
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all 0.15s ease;

    &:hover {
        background: #1E40AF;
    }
`;

const LoadingState = styled.div`
    text-align: center;
    padding: 4rem 2rem;
    color: #64748b;
    font-size: 0.95rem;
`;

const EmptyState = styled.div`
    text-align: center;
    padding: 3rem 2rem;
    color: #64748b;
    background: #ffffff;
    border-radius: 14px;
    border: 1px solid #e5e7eb;
    margin-top: 20px;
`;

export default AutomationTemplates;
