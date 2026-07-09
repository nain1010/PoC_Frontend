import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dropdown, DropdownMenu, DropdownToggle, DropdownItem, Form } from 'reactstrap';
import { useQuery } from '@tanstack/react-query';
import { APIClient } from '../helpers/api_helper';

//import images
import logoSm from "../assets/images/logo-sm.png";
import logoDark from "../assets/images/logo-dark.png";
import logoLight from "../assets/images/logo-light.png";

//import Components
import FullScreenDropdown from '../Components/Common/FullScreenDropdown';
import NotificationDropdown from '../Components/Common/NotificationDropdown';
import ProfileDropdown from '../Components/Common/ProfileDropdown';
import LightDark from '../Components/Common/LightDark';

import { changeSidebarVisibility } from '../slices/thunks';
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from 'reselect';

const api = APIClient;

const Header = ({ onChangeLayoutMode, layoutModeType, headerClass, toggleRightSidebar }: any) => {
    const dispatch: any = useDispatch();
    const navigate = useNavigate();

    const [activeProjectName, setActiveProjectName] = useState<string | null>(localStorage.getItem("activeProjectName"));
    const [activeProjectRole, setActiveProjectRole] = useState<string | null>(localStorage.getItem("activeProjectRole"));
    const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
    const toggleProjectDropdown = () => setProjectDropdownOpen(!projectDropdownOpen);

    const { data: projects = [], isSuccess } = useQuery({
        queryKey: ['projects'],
        queryFn: () => api.get("/projects") as any,
        enabled: !!(sessionStorage.getItem("authUser") || localStorage.getItem("authUser")),
    });

    const handleSelectProject = (project: any) => {
        localStorage.setItem("activeProjectId", project.id);
        localStorage.setItem("activeProjectName", project.nombre);
        localStorage.setItem("activeProjectRole", project.mi_rol || "Sin rol");
        window.dispatchEvent(new Event("activeProjectUpdated"));
        window.location.reload();
    };

    useEffect(() => {
        const storedProjectId = localStorage.getItem("activeProjectId");
        if (storedProjectId && isSuccess) {
            const hasAccess = projects.some((p: any) => p.id === storedProjectId);
            if (!hasAccess) {
                // El usuario actual no es miembro de este proyecto — limpiar datos heredados
                localStorage.removeItem("activeProjectId");
                localStorage.removeItem("activeProjectName");
                localStorage.removeItem("activeProjectRole");
                setActiveProjectName(null);
                setActiveProjectRole(null);
                window.dispatchEvent(new Event("activeProjectUpdated"));
            }
        }
    }, [projects, isSuccess]);

    useEffect(() => {
        const updateActiveProject = () => {
            setActiveProjectName(localStorage.getItem("activeProjectName"));
            setActiveProjectRole(localStorage.getItem("activeProjectRole"));
        };
        window.addEventListener("activeProjectUpdated", updateActiveProject);
        window.addEventListener("storage", updateActiveProject);
        return () => {
            window.removeEventListener("activeProjectUpdated", updateActiveProject);
            window.removeEventListener("storage", updateActiveProject);
        };
    }, []);

    const selectDashboardData = createSelector(
        (state) => state.Layout,
        (sidebarVisibilitytype) => sidebarVisibilitytype.sidebarVisibilitytype
    );
    // Inside your component
    const sidebarVisibilitytype = useSelector(selectDashboardData);

    const toogleMenuBtn = () => {
        var windowSize = document.documentElement.clientWidth;
        dispatch(changeSidebarVisibility("show"));

        //For collapse horizontal menu
        if (document.documentElement.getAttribute('data-layout') === "horizontal") {
            document.body.classList.contains("menu") ? document.body.classList.remove("menu") : document.body.classList.add("menu");
        }

        //For collapse vertical and semibox menu
        if (sidebarVisibilitytype === "show" && (document.documentElement.getAttribute('data-layout') === "vertical" || document.documentElement.getAttribute('data-layout') === "semibox")) {
            if (windowSize < 1025 && windowSize > 767) {
                document.body.classList.remove('vertical-sidebar-enable');
                (document.documentElement.getAttribute('data-sidebar-size') === 'sm') ? document.documentElement.setAttribute('data-sidebar-size', '') : document.documentElement.setAttribute('data-sidebar-size', 'sm');
            } else if (windowSize > 1025) {
                document.body.classList.remove('vertical-sidebar-enable');
                (document.documentElement.getAttribute('data-sidebar-size') === 'lg') ? document.documentElement.setAttribute('data-sidebar-size', 'sm') : document.documentElement.setAttribute('data-sidebar-size', 'lg');
            } else if (windowSize <= 767) {
                document.body.classList.add('vertical-sidebar-enable');
                document.documentElement.setAttribute('data-sidebar-size', 'lg');
            }
        }


        //Two column menu
        if (document.documentElement.getAttribute('data-layout') === "twocolumn") {
            document.body.classList.contains('twocolumn-panel') ? document.body.classList.remove('twocolumn-panel') : document.body.classList.add('twocolumn-panel');
        }
    };

    return (
        <React.Fragment>
            <header id="page-topbar" className={headerClass}>
                <div className="layout-width">
                    <div className="navbar-header">
                        <div className="d-flex">

                            <div className="navbar-brand-box horizontal-logo">
                                <Link to="/" className="logo logo-dark">
                                    <span className="logo-sm">
                                        <img src={logoSm} alt="Luma" height="22" />
                                    </span>
                                    <span className="logo-lg">
                                        <img src={logoDark} alt="Luma" height="30" />
                                    </span>
                                </Link>

                                <Link to="/" className="logo logo-light">
                                    <span className="logo-sm">
                                        <img src={logoSm} alt="Luma" height="22" />
                                    </span>
                                    <span className="logo-lg">
                                        <img src={logoLight} alt="Luma" height="30" />
                                    </span>
                                </Link>
                            </div>

                            <button
                                onClick={toogleMenuBtn}
                                type="button"
                                className="btn btn-sm px-3 fs-16 header-item vertical-menu-btn topnav-hamburger"
                                id="topnav-hamburger-icon">
                                <i className="ri-menu-2-line fs-22"></i>
                            </button>
                        </div>

                        <div className="d-flex align-items-center">

                            {/* Search Button for CmdK */}
                            <div className="ms-1 header-item d-none d-sm-flex">
                                <button 
                                    onClick={() => window.dispatchEvent(new Event('open-cmdk'))}
                                    type="button" 
                                    className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
                                    title="Buscar... (Ctrl+K)"
                                >
                                    <i className="bx bx-search fs-22"></i>
                                </button>
                            </div>

                            {activeProjectName && (
                                <Dropdown isOpen={projectDropdownOpen} toggle={toggleProjectDropdown} className="d-none d-md-flex me-3 border-end pe-3 align-items-center">
                                    <DropdownToggle tag="div" className="d-flex align-items-center" role="button" style={{ cursor: 'pointer', userSelect: 'none', minWidth: 0 }}>
                                        <div className="text-end me-2" style={{ minWidth: 0 }}>
                                            <span className="text-muted fs-10 d-block text-uppercase fw-semibold tracking-wider text-truncate">
                                                Proyecto Activo <i className="ri-arrow-down-s-line align-middle ms-1"></i>
                                            </span>
                                            <span className="fw-bold fs-13 text-truncate d-block" style={{ maxWidth: "150px" }}>{activeProjectName}</span>
                                        </div>
                                        <span className={`badge ${activeProjectRole === 'Product Owner' ? 'bg-primary' :
                                                activeProjectRole === 'Scrum Master' ? 'bg-success' :
                                                    activeProjectRole === 'Developer' ? 'bg-info' :
                                                        'bg-secondary'
                                            } fs-11 py-1 px-2 border border-opacity-10 rounded-pill flex-shrink-0`}>
                                            <span>{activeProjectRole || 'Sin rol'}</span>
                                        </span>
                                    </DropdownToggle>
                                    <DropdownMenu className="dropdown-menu-md dropdown-menu-end p-2 shadow-lg" style={{ minWidth: "240px" }}>
                                        <DropdownItem header className="text-uppercase fs-11 tracking-wider text-muted border-bottom pb-2 mb-2">
                                            <span>Cambiar de Proyecto</span>
                                        </DropdownItem>
                                        <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                                            {projects.map((proj: any) => (
                                                <DropdownItem
                                                    key={proj.id}
                                                    onClick={() => handleSelectProject(proj)}
                                                    active={proj.id === localStorage.getItem("activeProjectId")}
                                                    className="d-flex justify-content-between align-items-center py-2 px-3 rounded mb-1"
                                                >
                                                    <div className="text-truncate me-2" style={{ maxWidth: "160px" }}>
                                                        <div className="fw-semibold text-body fs-13 text-truncate">{proj.nombre}</div>
                                                        <small className="text-muted fs-11">{proj.mi_rol || 'Sin rol'}</small>
                                                    </div>
                                                    {proj.id === localStorage.getItem("activeProjectId") && (
                                                        <i className="ri-check-line text-success fs-15"></i>
                                                    )}
                                                </DropdownItem>
                                            ))}
                                        </div>
                                        <DropdownItem divider />
                                        <DropdownItem onClick={() => navigate("/projects")} className="text-center text-primary fw-medium fs-12 py-1.5">
                                            <i className="ri-folders-line align-middle me-1"></i> Ver Todos los Proyectos
                                        </DropdownItem>
                                    </DropdownMenu>
                                </Dropdown>
                            )}

                            {/* FullScreenDropdown */}
                            <FullScreenDropdown />

                            {/* Dark/Light Mode set */}
                            <LightDark
                                layoutMode={layoutModeType}
                                onChangeLayoutMode={onChangeLayoutMode}
                            />

                            <div className="ms-1 header-item d-flex">
                                <button
                                    onClick={toggleRightSidebar}
                                    type="button"
                                    className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
                                >
                                    <i className='mdi mdi-cog-outline fs-22'></i>
                                </button>
                            </div>

                            {/* NotificationDropdown */}
                            {/* <NotificationDropdown /> */}

                            {/* ProfileDropdown */}
                            <ProfileDropdown />
                        </div>
                    </div>
                </div>
            </header>
        </React.Fragment>
    );
};

export default Header;