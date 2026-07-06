import React from 'react';
import { getLumaTheme, saveLumaTheme } from '../../helpers/luma_theme_helper';

//constants
import { LAYOUT_MODE_TYPES } from "../../Components/constants/layout";

interface LightDarkProps {
    layoutMode : string;
    onChangeLayoutMode: (mode: string) => void;
}
const LightDark = ({ layoutMode, onChangeLayoutMode } : LightDarkProps) => {

    const mode = layoutMode === LAYOUT_MODE_TYPES['DARKMODE'] ? LAYOUT_MODE_TYPES['LIGHTMODE'] : LAYOUT_MODE_TYPES['DARKMODE'];

    const handleToggle = () => {
        onChangeLayoutMode(mode);
        // Reset custom background if they manually toggle light/dark so it doesn't look ugly
        const currentTheme = getLumaTheme();
        if (currentTheme.background !== 'default') {
            saveLumaTheme({ ...currentTheme, background: 'default' });
            
            // We need to reload or let React state catch up. Wait, RightSidebar has its own state.
            // Dispatch a custom event to notify RightSidebar of the theme reset
            window.dispatchEvent(new CustomEvent('luma-theme-reset'));
        }
    };

    return (
        <div className="ms-1 header-item d-flex">
            <button
                onClick={handleToggle}
                type="button" className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle light-dark-mode">
                <i className='bx bx-moon fs-22'></i>
            </button>
        </div>
    );
};

export default LightDark;