
import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import styled from 'styled-components';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const CalendarView = ({ projectId }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await api.get(`/tasks?projectId=${projectId}`);
                const mappedEvents = res.data
                    .filter(task => task.dueDate) // Only map tasks with due dates
                    .map(task => ({
                        id: task._id,
                        title: task.title,
                        start: new Date(task.dueDate),
                        end: new Date(task.dueDate), // All day event effectively for due date
                        allDay: true,
                        resource: task,
                        priority: task.priority
                    }));
                setEvents(mappedEvents);
            } catch (error) {
                console.error("Failed to fetch tasks for calendar", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, [projectId]);

    const handleSelectEvent = (event) => {
        // Navigate to task detail or open modal?
        // ProjectDashboard uses local state for modal. 
        // Ideally we should pass a handler, but for now let's just log or maybe navigate if we had a route.
        // Since we are inside ProjectDashboard tabs, we can't easily open the modal from here without prop drilling.
        // But for now, let's just do nothing or maybe show a tooltip.
        // Or better, trigger the same modal if we can receive `onTaskClick` prop.
    };

    const eventStyleGetter = (event, start, end, isSelected) => {
        let backgroundColor = '#3b82f6';
        switch (event.priority) {
            case 'critical': backgroundColor = '#dc2626'; break;
            case 'high': backgroundColor = '#ea580c'; break;
            case 'medium': backgroundColor = '#d97706'; break;
            case 'low': backgroundColor = '#22c55e'; break;
        }

        return {
            style: {
                backgroundColor,
                borderRadius: '4px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    if (loading) return <Container>Loading calendar...</Container>;

    return (
        <Container>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 600 }}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={handleSelectEvent}
                views={['month', 'week', 'day']}
                defaultView='month'
            />
        </Container>
    );
};

const Container = styled.div`
    height: 700px;
    background: white;
    padding: 20px;
    border-radius: 16px;
    border: 1px solid #e2e8f0;

    /* Override standard calendar styles for cleaner look */
    .rbc-calendar {
        font-family: 'Outfit', sans-serif;
    }
    .rbc-toolbar {
        margin-bottom: 20px;
    }
    .rbc-header {
        padding: 10px;
        font-weight: 600;
        color: #64748b;
    }
    .rbc-month-view {
        border-radius: 12px;
        overflow: hidden;
    }
`;

export default CalendarView;
