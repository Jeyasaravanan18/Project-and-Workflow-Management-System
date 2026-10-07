import React from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import { useAuth } from '../context/AuthContext';
import { useTheme } from 'styled-components';

const TOUR_STEPS = [
    {
        target: 'body',
        content: 'Welcome to ProjectFlow! Let\'s take a quick tour to get you started.',
        placement: 'center',
        disableBeacon: true,
    },
    {
        target: '[data-tour="sidebar-projects"]',
        content: 'Here you can access all your projects. Create new ones or manage existing workflows.',
    },
    {
        target: '[data-tour="sidebar-my-work"]',
        content: 'Your personal dashboard. See tasks assigned to you, track time, and view your activity.',
    },
    {
        target: '[data-tour="theme-toggle"]',
        content: 'Prefer Dark Mode? Toggle your theme here anytime.',
    },
    {
        target: '[data-tour="create-project-btn"]',
        content: 'Ready to start? Click here to create your first project.',
        // This step might only appear on specific pages, handled via logic
    }
];

export const OnboardingTour = () => {
    const { user } = useAuth();
    const theme = useTheme();
    const [run, setRun] = React.useState(false);

    React.useEffect(() => {
        // Check if user has already seen the tour
        const hasSeenTour = localStorage.getItem('projectflow_tour_seen');
        if (!hasSeenTour && user) {
            setRun(true);
        }
    }, [user]);

    const handleJoyrideCallback = (data) => {
        const { status } = data;
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
            setRun(false);
            localStorage.setItem('projectflow_tour_seen', 'true');
        }
    };

    return (
        <Joyride
            steps={TOUR_STEPS}
            run={run}
            continuous
            showSkipButton
            showProgress
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    primaryColor: '#f97316',
                    textColor: theme.text.primary,
                    backgroundColor: theme.bg.card,
                    arrowColor: theme.bg.card,
                    overlayColor: 'rgba(0, 0, 0, 0.5)',
                },
                buttonNext: {
                    backgroundColor: '#f97316',
                    color: '#fff',
                    fontWeight: 'bold',
                },
                tooltipContainer: {
                    textAlign: 'left'
                }
            }}
        />
    );
};
