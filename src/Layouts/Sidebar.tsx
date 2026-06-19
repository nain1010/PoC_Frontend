import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SimpleBar from "simplebar-react";
//import logo
import logoSm from "../assets/images/logo-sm.png";
import logoDark from "../assets/images/logo-dark.png";
import logoLight from "../assets/images/logo-light.png";
import avatar1 from "../assets/images/users/avatar-1.jpg";

//Import Components
import VerticalLayout from "./VerticalLayouts";
import TwoColumnLayout from "./TwoColumnLayout";
import { Container,  DropdownMenu, DropdownToggle, UncontrolledDropdown } from "reactstrap";
import HorizontalLayout from "./HorizontalLayout";

const Sidebar = ({ layoutType }: any) => {
  const [userName, setUserName] = useState("Usuario");
  const [avatarSrc, setAvatarSrc] = useState(avatar1);

  useEffect(() => {
    const authUser: any = sessionStorage.getItem("authUser");
    if (authUser) {
      const obj: any = JSON.parse(authUser);
      setUserName(obj.nombre_completo || obj.email || "Usuario");
      if (obj.avatar_url) {
        setAvatarSrc(obj.avatar_url);
      }
    }
  }, []);

  // Listen for avatar updates
  useEffect(() => {
    const handleStorageChange = () => {
      const authUser: any = sessionStorage.getItem("authUser");
      if (authUser) {
        const obj = JSON.parse(authUser);
        if (obj.avatar_url) {
          setAvatarSrc(obj.avatar_url);
        }
        setUserName(obj.nombre_completo || obj.email || "Usuario");
      }
    };
    window.addEventListener("avatarUpdated", handleStorageChange);
    return () => window.removeEventListener("avatarUpdated", handleStorageChange);
  }, []);

  useEffect(() => {
    var verticalOverlay = document.getElementsByClassName("vertical-overlay");
    if (verticalOverlay) {
      verticalOverlay[0].addEventListener("click", function () {
        document.body.classList.remove("vertical-sidebar-enable");
      });
    }
  });

  const addEventListenerOnSmHoverMenu = () => {
    // add listener Sidebar Hover icon on change layout from setting
    if (document.documentElement.getAttribute('data-sidebar-size') === 'sm-hover') {
      document.documentElement.setAttribute('data-sidebar-size', 'sm-hover-active');
    } else if (document.documentElement.getAttribute('data-sidebar-size') === 'sm-hover-active') {
      document.documentElement.setAttribute('data-sidebar-size', 'sm-hover');
    } else {
      document.documentElement.setAttribute('data-sidebar-size', 'sm-hover');
    }
  };

  return (
    <React.Fragment>
      <div className="app-menu navbar-menu">
        <div className="navbar-brand-box">
          <Link to="/" className="logo logo-dark">
            <span className="logo-sm">
              <img src={logoSm} alt="Luma" height="22" />
            </span>
            <span className="logo-lg">
              <img src={logoDark} alt="Luma" height="17" />
            </span>
          </Link>

          <Link to="/" className="logo logo-light">
            <span className="logo-sm">
              <img src={logoSm} alt="Luma" height="22" />
            </span>
            <span className="logo-lg">
              <img src={logoLight} alt="Luma" height="17" />
            </span>
          </Link>
          <button
            onClick={addEventListenerOnSmHoverMenu}
            type="button"
            className="btn btn-sm p-0 fs-20 header-item float-end btn-vertical-sm-hover"
            id="vertical-hover"
          >
            <i className="ri-record-circle-line"></i>
          </button>
        </div>

        <UncontrolledDropdown className="sidebar-user m-1 rounded">
          <DropdownToggle tag="button" type="button" className="btn d-flex w-100 align-items-center border-0 bg-transparent shadow-none" id="page-header-user-dropdown" style={{ padding: "8px 12px" }}>
            <span className="d-flex align-items-center gap-2">
              <img className="rounded-circle header-profile-user" src={avatarSrc} alt="Header Avatar" style={{ objectFit: "cover", width: "40px", height: "40px" }} />
                <span className="text-start">
                  <span className="d-block fw-medium sidebar-user-name-text">{userName}</span>
                  <span className="d-block fs-14 sidebar-user-name-sub-text"><i className="ri ri-circle-fill fs-10 text-success align-baseline"></i> <span className="align-middle">Online</span></span>
                </span>
            </span>
          </DropdownToggle>
          <DropdownMenu className="dropdown-menu-end">
            <h6 className="dropdown-header">¡Hola, <span>{userName}</span>!</h6>
            <Link className="dropdown-item" to="/profile"><i className="mdi mdi-account-circle text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Mi Perfil</span></Link>
            <div className="dropdown-divider"></div>
            <Link className="dropdown-item" to="/logout"><i className="mdi mdi-logout text-muted fs-16 align-middle me-1"></i> <span className="align-middle" data-key="t-logout">Cerrar Sesión</span></Link>
          </DropdownMenu>
        </UncontrolledDropdown>
        {layoutType === "horizontal" ? (
          <div id="scrollbar">
            <Container fluid>
              <div id="two-column-menu"></div>
              <ul className="navbar-nav" id="navbar-nav">
                <HorizontalLayout />
              </ul>
            </Container>
          </div>
        ) : layoutType === 'twocolumn' ? (
          <React.Fragment>
            <TwoColumnLayout layoutType={layoutType} />
            <div className="sidebar-background"></div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <SimpleBar id="scrollbar" className="h-100">
              <Container fluid>
                <div id="two-column-menu"></div>
                <ul className="navbar-nav" id="navbar-nav">
                  <VerticalLayout layoutType={layoutType} />
                </ul>
              </Container>
            </SimpleBar>
            <div className="sidebar-background"></div>
          </React.Fragment>
        )}
      </div>
      <div className="vertical-overlay"></div>
    </React.Fragment>
  );
};

export default Sidebar;
