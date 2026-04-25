import { Tooltip } from 'react-tooltip';
import { ActivityCalendar } from 'react-activity-calendar';
import styled from 'styled-components';

const ActivityHeatmap = ({ data = [] }) => {
    // Expected efficient data structure: { "2023-10-01": 5, "2023-10-02": 2 }
    // Or array: [{ date: '2023-01-01', count: 4, level: 3 }]

    // Simulate empty year if no data
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    const defaultData = [];
    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        // Find actual data or default to 0
        const found = data.find(item => item.date === dateStr);
        defaultData.push({
            date: dateStr,
            count: found ? found.count : 0,
            level: found ? Math.min(found.count, 4) : 0 // Level 0-4
        });
    }

    const theme = {
        light: ['#f1f5f9', '#ffedd5', '#fdba74', '#f97316', '#ea580c'],
        dark: ['#1e293b', '#431407', '#7c2d12', '#c2410c', '#ea580c'],
    };

    return (
        <Container>
            <ActivityCalendar
                data={defaultData}
                theme={theme}
                blockSize={12}
                blockMargin={4}
                fontSize={12}
                showWeekdayLabels
                renderBlock={(block, activity) => (
                    <div
                        data-tooltip-id="activity-tooltip"
                        data-tooltip-content={`${activity.count} tasks completed on ${activity.date}`}
                    >
                        {block}
                    </div>
                )}
            />
            <Tooltip id="activity-tooltip" />
        </Container>
    );
};

const Container = styled.div`
    display: flex;
    justify-content: center;
    padding: 20px;
    width: 100%;
    overflow-x: auto;
    background: white;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);

    /* Hide scrollbar */
    &::-webkit-scrollbar {
        height: 6px;
    }
    &::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
    }
`;

export default ActivityHeatmap;
