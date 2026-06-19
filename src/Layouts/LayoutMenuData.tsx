import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Navdata = () => {
    const history = useNavigate();
    //state data
    const [isProjects, setIsProjects] = useState<boolean>(false);
    const [isPlanning, setIsPlanning] = useState<boolean>(false);
    const [isKanban, setIsKanban] = useState<boolean>(false);
    const [isAnalytics, setIsAnalytics] = useState<boolean>(false);
    const [isAuth, setIsAuth] = useState<boolean>(false);
    const [isPages, setIsPages] = useState<boolean>(false);
    const [isUsers, setIsUsers] = useState<boolean>(false);

    const [iscurrentState, setIscurrentState] = useState('Projects');

    function updateIconSidebar(e: any) {
        if (e && e.target && e.target.getAttribute("sub-items")) {
            const ul: any = document.getElementById("two-column-menu");
            const iconItems: any = ul.querySelectorAll(".nav-icon.active");
            let activeIconItems = [...iconItems];
            activeIconItems.forEach((item) => {
                item.classList.remove("active");
                var id = item.getAttribute("sub-items");
                const getID = document.getElementById(id) as HTMLElement;
                if (getID)
                    getID.classList.remove("show");
            });
        }
    }

    useEffect(() => {
        document.body.classList.remove('twocolumn-panel');
        if (iscurrentState !== 'Projects') setIsProjects(false);
        if (iscurrentState !== 'Planning') setIsPlanning(false);
        if (iscurrentState !== 'Kanban') setIsKanban(false);
        if (iscurrentState !== 'Analytics') setIsAnalytics(false);
        if (iscurrentState !== 'Auth') setIsAuth(false);
        if (iscurrentState !== 'Pages') setIsPages(false);
        if (iscurrentState !== 'Users') setIsUsers(false);
    }, [
        history,
        iscurrentState,
        isProjects,
        isPlanning,
        isKanban,
        isAnalytics,
        isAuth,
        isPages,
        isUsers,
    ]);

    const authUserStr = sessionStorage.getItem("authUser");
    const isAdmin = authUserStr ? JSON.parse(authUserStr).rol_global === "Administrador" : false;

    const menuItems: any = [
        {
            label: "Gestión Ágil",
            isHeader: true,
        },
        {
            id: "projects",
            label: "Proyectos",
            icon: "ri-folders-line",
            link: "/projects",
            stateVariables: isProjects,
            click: function (e: any) {
                e.preventDefault();
                setIsProjects(!isProjects);
                setIscurrentState('Projects');
                updateIconSidebar(e);
                history("/projects");
            },
        },
        {
            id: "planning",
            label: "Planificación / Backlog",
            icon: "ri-calendar-todo-line",
            link: "/planning",
            stateVariables: isPlanning,
            click: function (e: any) {
                e.preventDefault();
                setIsPlanning(!isPlanning);
                setIscurrentState('Planning');
                updateIconSidebar(e);
                history("/planning");
            },
        },
        {
            id: "kanban",
            label: "Sprint Activo",
            icon: "ri-task-line",
            link: "/kanban",
            stateVariables: isKanban,
            click: function (e: any) {
                e.preventDefault();
                setIsKanban(!isKanban);
                setIscurrentState('Kanban');
                updateIconSidebar(e);
                history("/kanban");
            },
        },
        {
            id: "analytics",
            label: "Analíticas",
            icon: "ri-bar-chart-line",
            link: "/analytics",
            stateVariables: isAnalytics,
            click: function (e: any) {
                e.preventDefault();
                setIsAnalytics(!isAnalytics);
                setIscurrentState('Analytics');
                updateIconSidebar(e);
                history("/analytics");
            },
        },
        ...(isAdmin ? [
            {
                label: "Administración",
                isHeader: true,
            },
            {
                id: "users",
                label: "Usuarios / Admin",
                icon: "ri-user-settings-line",
                link: "/users",
                stateVariables: isUsers,
                click: function (e: any) {
                    e.preventDefault();
                    setIsUsers(!isUsers);
                    setIscurrentState('Users');
                    updateIconSidebar(e);
                    history("/users");
                },
            }
        ] : []),
        {
            label: "Soporte",
            isHeader: true,
        },
        {
            id: "pages",
            label: "Mi Perfil",
            icon: "ri-pages-line",
            link: "/profile",
            stateVariables: isPages,
            click: function (e: any) {
                e.preventDefault();
                setIsPages(!isPages);
                setIscurrentState('Pages');
                updateIconSidebar(e);
                history("/profile");
            },
        },
        {
            id: "auth",
            label: "Autenticación",
            icon: "ri-account-circle-line",
            link: "#",
            click: function (e: any) {
                e.preventDefault();
                setIsAuth(!isAuth);
                setIscurrentState('Auth');
                updateIconSidebar(e);
            },
            stateVariables: isAuth,
            subItems: [
                { id: "logout", label: "Cerrar Sesión", link: "/logout", parentId: "auth" },
            ],
        },
    ];

    return <React.Fragment>{menuItems}</React.Fragment>;
};
export default Navdata;