import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';

//import images
import defaultAvatar from "../../assets/images/users/avatar-1.jpg";

const ProfileDropdown = () => {

    const [userName, setUserName] = useState("Usuario");
    const [userEmail, setUserEmail] = useState("");
    const [avatarSrc, setAvatarSrc] = useState<string | null>(null);

    useEffect(() => {
        const authUser: any = (sessionStorage.getItem("authUser") || localStorage.getItem("authUser"));
        if (authUser) {
            const obj: any = JSON.parse(authUser);
            setUserName(obj.nombre_completo || obj.email || "Usuario");
            setUserEmail(obj.email || "");
            if (obj.avatar_url) {
                setAvatarSrc(obj.avatar_url);
            }
        }
    }, []);

    // Listen for avatar updates
    useEffect(() => {
        const handleStorageChange = () => {
            const authUser: any = (sessionStorage.getItem("authUser") || localStorage.getItem("authUser"));
            if (authUser) {
                const obj = JSON.parse(authUser);
                if (obj.avatar_url) {
                    setAvatarSrc(obj.avatar_url);
                } else {
                    setAvatarSrc(null);
                }
                setUserName(obj.nombre_completo || obj.email || "Usuario");
            }
        };
        window.addEventListener("avatarUpdated", handleStorageChange);
        return () => window.removeEventListener("avatarUpdated", handleStorageChange);
    }, []);

    //Dropdown Toggle
    const [isProfileDropdown, setIsProfileDropdown] = useState(false);
    const toggleProfileDropdown = () => {
        setIsProfileDropdown(!isProfileDropdown);
    };

    const names = userName.split(" ");
    const initials = names.map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

    return (
        <React.Fragment>
            <Dropdown isOpen={isProfileDropdown} toggle={toggleProfileDropdown} className="ms-sm-3 header-item topbar-user">
                <DropdownToggle tag="button" type="button" className="btn">
                    <span className="d-flex align-items-center">
                        {avatarSrc ? (
                            <img className="rounded-circle header-profile-user" src={avatarSrc}
                                alt="Header Avatar" style={{ objectFit: "cover", width: "32px", height: "32px" }} />
                        ) : (
                            <div className="rounded-circle bg-soft-primary text-primary d-flex align-items-center justify-content-center fw-semibold fs-13" style={{ width: "32px", height: "32px", minWidth: "32px" }}>
                                {initials}
                            </div>
                        )}
                        <span className="text-start ms-xl-2">
                            <span className="d-none d-xl-inline-block ms-1 fw-medium user-name-text">
                                <span> {userName}</span>
                            </span>
                            <span className="d-none d-xl-block ms-1 fs-12 text-muted user-name-sub-text">
                                <span>{userEmail}</span>
                            </span>
                        </span>
                    </span>
                </DropdownToggle>
                <DropdownMenu className="dropdown-menu-end">
                    <h6 className="dropdown-header">¡Hola, <span>{userName}</span>!</h6>
                    <DropdownItem className='p-0'>
                        <Link to="/profile" className="dropdown-item">
                            <i className="mdi mdi-account-circle text-muted fs-16 align-middle me-1"></i>
                            <span className="align-middle">Mi Perfil</span>
                        </Link>
                    </DropdownItem>
                    <div className="dropdown-divider"></div>
                    <DropdownItem className='p-0'>
                        <Link to="/logout" className="dropdown-item">
                            <i
                                className="mdi mdi-logout text-muted fs-16 align-middle me-1"></i> <span
                                    className="align-middle" data-key="t-logout">Cerrar Sesión</span>
                        </Link>
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </React.Fragment>
    );
};

export default ProfileDropdown;