import React, { useEffect, useState, useRef } from 'react';
import {
    Offcanvas,
    OffcanvasHeader,
    OffcanvasBody,
    Collapse,
} from "reactstrap";
import withRouter from './withRouter';

//redux
import {
    changeLayout,
    changeSidebarTheme,
    changeLayoutMode,
    changeLayoutWidth,
    changeLayoutPosition,
    changeTopbarTheme,
    changeLeftsidebarSizeType,
    changeLeftsidebarViewType,
    changeSidebarImageType,
    changePreLoader,
    changeSidebarVisibility,
    changeLayoutTheme,
    changeLayoutThemeColor
    // resetValue
} from "../../slices/thunks";

import { useSelector, useDispatch } from "react-redux";

//import Constant
import {
    LAYOUT_THEME,
    LAYOUT_TYPES,
    LAYOUT_SIDEBAR_TYPES,
    LAYOUT_MODE_TYPES,
    LAYOUT_WIDTH_TYPES,
    LAYOUT_POSITION_TYPES,
    LAYOUT_TOPBAR_THEME_TYPES,
    LEFT_SIDEBAR_SIZE_TYPES,
    LEFT_SIDEBAR_VIEW_TYPES,
    LEFT_SIDEBAR_IMAGE_TYPES,
    PERLOADER_TYPES,
    SIDEBAR_VISIBILITY_TYPES,
    LAYOUT_THEME_COLOR
} from "../constants/layout";

//SimpleBar
import SimpleBar from "simplebar-react";
import classnames from "classnames";

//import Images
import img01 from "../../assets/images/sidebar/img-1.jpg";
import img02 from "../../assets/images/sidebar/img-2.jpg";
import img03 from "../../assets/images/sidebar/img-3.jpg";
import img04 from "../../assets/images/sidebar/img-4.jpg";
import { createSelector } from 'reselect';

import { getLumaTheme, saveLumaTheme, LumaThemeConfig } from '../../helpers/luma_theme_helper';

const RightSidebar = (props: any) => {
    const dispatch: any = useDispatch();
    const colorInputRef = useRef<HTMLInputElement>(null);

    const [lumaTheme, setLumaTheme] = useState<LumaThemeConfig>(getLumaTheme());

    const updateLumaTheme = (updates: Partial<LumaThemeConfig>) => {
        const newTheme = { ...lumaTheme, ...updates };
        setLumaTheme(newTheme);
        saveLumaTheme(newTheme);

        if (updates.background) {
            const darkBg = ['aurora-glow', 'solid-indigo', 'cyberpunk-grid', 'midnight-gradient'];
            const lightBg = ['pastel-mesh', 'clean-white-glass'];
            
            if (darkBg.includes(updates.background)) {
                dispatch(changeLayoutMode(LAYOUT_MODE_TYPES.DARKMODE));
                dispatch(changeTopbarTheme(LAYOUT_TOPBAR_THEME_TYPES.DARK));
                dispatch(changeSidebarTheme(LAYOUT_SIDEBAR_TYPES.DARK));
            } else if (lightBg.includes(updates.background)) {
                dispatch(changeLayoutMode(LAYOUT_MODE_TYPES.LIGHTMODE));
                dispatch(changeTopbarTheme(LAYOUT_TOPBAR_THEME_TYPES.LIGHT));
                dispatch(changeSidebarTheme(LAYOUT_SIDEBAR_TYPES.LIGHT));
            }
        }

        if (updates.accentPreset) {
            if (updates.accentPreset === 'nordic-slate') {
                dispatch(changeTopbarTheme(LAYOUT_TOPBAR_THEME_TYPES.DARK));
                dispatch(changeSidebarTheme(LAYOUT_SIDEBAR_TYPES.DARK));
            } else if (updates.accentPreset === 'default') {
                dispatch(changeTopbarTheme(LAYOUT_TOPBAR_THEME_TYPES.LIGHT));
                dispatch(changeSidebarTheme(LAYOUT_SIDEBAR_TYPES.DARK));
            }
        }
    };

    const [show, setShow] = useState<boolean>(false);

    function tog_show() {
        setShow(!show);
        dispatch(changeSidebarTheme("gradient"));
    }

    useEffect(() => {
        const sidebarColorDark = document.getElementById("sidebar-color-dark") as HTMLInputElement;
        const sidebarColorLight = document.getElementById("sidebar-color-light") as HTMLInputElement;

        if (show && sidebarColorDark && sidebarColorLight) {
            sidebarColorDark.checked = false;
            sidebarColorLight.checked = false;
        }
    }, [show]);

    useEffect(() => {
        const handleThemeReset = () => setLumaTheme(getLumaTheme());
        window.addEventListener('luma-theme-reset', handleThemeReset);
        return () => window.removeEventListener('luma-theme-reset', handleThemeReset);
    }, []);

    const selectLayoutState = (state: any) => state.Layout;
    const selectLayoutProperties = createSelector(
        selectLayoutState,
        (layout) => ({
            layoutThemeType: layout.layoutThemeType,
            layoutType: layout.layoutType,
            leftSidebarType: layout.leftSidebarType,
            layoutModeType: layout.layoutModeType,
            layoutWidthType: layout.layoutWidthType,
            layoutPositionType: layout.layoutPositionType,
            topbarThemeType: layout.topbarThemeType,
            leftsidbarSizeType: layout.leftsidbarSizeType,
            leftSidebarViewType: layout.leftSidebarViewType,
            leftSidebarImageType: layout.leftSidebarImageType,
            preloader: layout.preloader,
            sidebarVisibilitytype: layout.sidebarVisibilitytype,
            layoutThemeColorType: layout.layoutThemeColorType,
        })
    );
    // Inside your component
    const {
        layoutThemeType,
        layoutType,
        leftSidebarType,
        layoutModeType,
        layoutWidthType,
        layoutPositionType,
        topbarThemeType,
        leftsidbarSizeType,
        leftSidebarViewType,
        leftSidebarImageType,
        preloader,
        sidebarVisibilitytype,
        layoutThemeColorType,
    } = useSelector(selectLayoutProperties);

    // open offcanvas
    const open = props.show;
    const toggleLeftCanvas = props.toggleCanvas;

    window.onscroll = function () {
        scrollFunction();
    };

    const scrollFunction = () => {
        const element = document.getElementById("back-to-top");
        if (element) {
            if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
                element.style.display = "block";
            } else {
                element.style.display = "none";
            }
        }
    };

    const toTop = () => {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    };

    const pathName = props.router.location.pathname;

    useEffect(() => {
        const preloader = document.getElementById("preloader") as HTMLElement;

        if (preloader) {
            preloader.style.opacity = "1";
            preloader.style.visibility = "visible";

            setTimeout(function () {
                preloader.style.opacity = "0";
                preloader.style.visibility = "hidden";
            }, 1000);
        }
    }, [pathName]);

    //Sidebar User Profile Avatar
    const [sidebarAvatar, setSidebarAvatar] = useState<boolean>(false);

    useEffect(() => {
        handleChangeSidebarAvatar(sidebarAvatar);
    }, [sidebarAvatar]);

    const handleChangeSidebarAvatar = (value: boolean) => {
        setSidebarAvatar(value);

        if (value) {
            document.documentElement.setAttribute("data-sidebar-user-show", "");
        } else {
            document.documentElement.removeAttribute("data-sidebar-user-show");
        }
    };

    return (
        <React.Fragment>
            <button
                onClick={() => toTop()}
                className="btn btn-danger btn-icon" id="back-to-top">
                <i className="ri-arrow-up-line"></i>
            </button>

            {preloader === "enable" && <div id="preloader">
                <div id="status">
                    <div className="spinner-border text-primary avatar-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>}

            <div>
                <Offcanvas isOpen={open} toggle={toggleLeftCanvas} direction='end' className='offcanvas-end border-0'>
                    <OffcanvasHeader className="d-flex align-items-center bg-primary bg-gradient p-3 offcanvas-header-dark" toggle={toggleLeftCanvas}>
                        <span className="m-0 me-2 text-white">Theme Customizer</span>
                    </OffcanvasHeader>
                    <OffcanvasBody className="p-0">
                        <SimpleBar className="h-100">
                            <div className="p-4">
                                <h6 className="mb-0 fw-semibold text-uppercase">Layout</h6>
                                <p className="text-muted">Choose your layout</p>

                                <div className="row gy-3">
                                    <div className="col-4">
                                        <div className="form-check card-radio">
                                            <input
                                                id="customizer-layout01"
                                                name="data-layout"
                                                type="radio"
                                                value={LAYOUT_TYPES.VERTICAL}
                                                checked={layoutType === LAYOUT_TYPES.VERTICAL}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        dispatch(changeLayout(e.target.value));
                                                    }
                                                }}
                                                className="form-check-input"
                                            />
                                            <label className="form-check-label p-0 avatar-md w-100" htmlFor="customizer-layout01">
                                                <span className="d-flex gap-1 h-100">
                                                    <span className="flex-shrink-0">
                                                        <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                                            <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2"></span>
                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                        </span>
                                                    </span>
                                                    <span className="flex-grow-1">
                                                        <span className="d-flex h-100 flex-column">
                                                            <span className="bg-light d-block p-1"></span>
                                                            <span className="bg-light d-block p-1 mt-auto"></span>
                                                        </span>
                                                    </span>
                                                </span>
                                            </label>
                                        </div>
                                        <h5 className="fs-13 text-center mt-2">Vertical</h5>
                                    </div>
                                    <div className="col-4">
                                        <div className="form-check card-radio">
                                            <input
                                                id="customizer-layout02"
                                                name="data-layout"
                                                type="radio"
                                                value={LAYOUT_TYPES.HORIZONTAL}
                                                checked={layoutType === LAYOUT_TYPES.HORIZONTAL}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        dispatch(changeLayout(e.target.value));
                                                    }
                                                }}
                                                className="form-check-input" />
                                            <label className="form-check-label p-0 avatar-md w-100" htmlFor="customizer-layout02">
                                                <span className="d-flex h-100 flex-column gap-1">
                                                    <span className="bg-light d-flex p-1 gap-1 align-items-center">
                                                        <span className="d-block p-1 bg-primary-subtle rounded me-1"></span>
                                                        <span className="d-block p-1 pb-0 px-2 bg-primary-subtle ms-auto"></span>
                                                        <span className="d-block p-1 pb-0 px-2 bg-primary-subtle"></span>
                                                    </span>
                                                    <span className="bg-light d-block p-1"></span>
                                                    <span className="bg-light d-block p-1 mt-auto"></span>
                                                </span>
                                            </label>
                                        </div>
                                        <h5 className="fs-13 text-center mt-2">Horizontal</h5>
                                    </div>
                                </div>


                                {layoutType !== "horizontal" && layoutType !== "twocolumn" && (
                                    <div className="form-check form-switch form-switch-md mb-3 mt-4">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="sidebarUserProfile"
                                            checked={sidebarAvatar}
                                            onChange={(e) => handleChangeSidebarAvatar(e.target.checked)}
                                        />
                                        <label className="form-check-label" htmlFor="sidebarUserProfile">Sidebar User Profile Avatar</label>
                                    </div>
                                )}

                                {/* Theme selector removed per user request */}

                                <h6 className="mt-4 mb-0 fw-semibold text-uppercase">Color Scheme</h6>
                                <p className="text-muted">Choose Light or Dark Scheme.</p>

                                <div className="colorscheme-cardradio">
                                    <div className="row">
                                        <div className="col-4">
                                            <div className="form-check card-radio">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="data-bs-theme"
                                                    id="layout-mode-light"
                                                    value={LAYOUT_MODE_TYPES.LIGHTMODE}
                                                    checked={layoutModeType === LAYOUT_MODE_TYPES.LIGHTMODE}
                                                    onChange={e => {
                                                        if (e.target.checked) {
                                                            dispatch(changeLayoutMode(e.target.value));
                                                        }
                                                    }}
                                                />
                                                <label className="form-check-label p-0 avatar-md w-100" htmlFor="layout-mode-light">
                                                    <span className="d-flex gap-1 h-100">
                                                        <span className="flex-shrink-0">
                                                            <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                                                <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2"></span>
                                                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                            </span>
                                                        </span>
                                                        <span className="flex-grow-1">
                                                            <span className="d-flex h-100 flex-column">
                                                                <span className="bg-light d-block p-1"></span>
                                                                <span className="bg-light d-block p-1 mt-auto"></span>
                                                            </span>
                                                        </span>
                                                    </span>
                                                </label>
                                            </div>
                                            <h5 className="fs-13 text-center mt-2">Light</h5>
                                        </div>

                                        <div className="col-4">
                                            <div className="form-check card-radio dark">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="data-bs-theme"
                                                    id="layout-mode-dark"
                                                    value={LAYOUT_MODE_TYPES.DARKMODE}
                                                    checked={layoutModeType === LAYOUT_MODE_TYPES.DARKMODE}
                                                    onChange={e => {
                                                        if (e.target.checked) {
                                                            dispatch(changeLayoutMode(e.target.value));
                                                        }
                                                    }}
                                                />
                                                <label className="form-check-label p-0 avatar-md w-100 bg-dark" htmlFor="layout-mode-dark">
                                                    <span className="d-flex gap-1 h-100">
                                                        <span className="flex-shrink-0">
                                                            <span className="bg-white bg-opacity-10 d-flex h-100 flex-column gap-1 p-1">
                                                                <span className="d-block p-1 px-2 bg-white bg-opacity-10 rounded mb-2"></span>
                                                                <span className="d-block p-1 px-2 pb-0 bg-white bg-opacity-10"></span>
                                                                <span className="d-block p-1 px-2 pb-0 bg-white bg-opacity-10"></span>
                                                                <span className="d-block p-1 px-2 pb-0 bg-white bg-opacity-10"></span>
                                                            </span>
                                                        </span>
                                                        <span className="flex-grow-1">
                                                            <span className="d-flex h-100 flex-column">
                                                                <span className="bg-white bg-opacity-10 d-block p-1"></span>
                                                                <span className="bg-white bg-opacity-10 d-block p-1 mt-auto"></span>
                                                            </span>
                                                        </span>
                                                    </span>
                                                </label>
                                            </div>
                                            <h5 className="fs-13 text-center mt-2">Dark</h5>
                                        </div>
                                    </div>
                                </div>
                                <React.Fragment>
                                        {(layoutType === LAYOUT_TYPES.VERTICAL || layoutType === LAYOUT_TYPES.HORIZONTAL) && (<div id="layout-width">
                                            <h6 className="mt-4 mb-0 fw-semibold text-uppercase">Layout Width</h6>
                                            <p className="text-muted">Choose Fluid or Boxed layout.</p>

                                            <div className="row">
                                                <div className="col-4">
                                                    <div className="form-check card-radio">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="data-layout-width"
                                                            id="layout-width-fluid"
                                                            value={LAYOUT_WIDTH_TYPES.FLUID}
                                                            checked={layoutWidthType === LAYOUT_WIDTH_TYPES.FLUID}
                                                            onChange={e => {
                                                                if (e.target.checked) {
                                                                    dispatch(changeLayoutWidth(e.target.value));
                                                                    dispatch(changeLeftsidebarSizeType("lg"));
                                                                }
                                                            }}
                                                        />
                                                        <label className="form-check-label p-0 avatar-md w-100" htmlFor="layout-width-fluid">
                                                            <span className="d-flex gap-1 h-100">
                                                                <span className="flex-shrink-0">
                                                                    <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                                                        <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                    </span>
                                                                </span>
                                                                <span className="flex-grow-1">
                                                                    <span className="d-flex h-100 flex-column">
                                                                        <span className="bg-light d-block p-1"></span>
                                                                        <span className="bg-light d-block p-1 mt-auto"></span>
                                                                    </span>
                                                                </span>
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <h5 className="fs-13 text-center mt-2">Fluid</h5>
                                                </div>
                                                <div className="col-4">
                                                    <div className="form-check card-radio">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="data-layout-width"
                                                            id="layout-width-boxed"
                                                            value={LAYOUT_WIDTH_TYPES.BOXED}
                                                            checked={layoutWidthType === LAYOUT_WIDTH_TYPES.BOXED}
                                                            onChange={e => {
                                                                if (e.target.checked) {
                                                                    dispatch(changeLayoutWidth(e.target.value));
                                                                    dispatch(changeLeftsidebarSizeType("sm-hover"));
                                                                }
                                                            }}
                                                        />
                                                        <label className="form-check-label p-0 avatar-md w-100 px-2" htmlFor="layout-width-boxed">
                                                            <span className="d-flex gap-1 h-100 border-start border-end">
                                                                <span className="flex-shrink-0">
                                                                    <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                                                        <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                    </span>
                                                                </span>
                                                                <span className="flex-grow-1">
                                                                    <span className="d-flex h-100 flex-column">
                                                                        <span className="bg-light d-block p-1"></span>
                                                                        <span className="bg-light d-block p-1 mt-auto"></span>
                                                                    </span>
                                                                </span>
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <h5 className="fs-13 text-center mt-2">Boxed</h5>
                                                </div>
                                            </div>
                                        </div>)}

                                        <div id="layout-position">
                                            <h6 className="mt-4 mb-0 fw-semibold text-uppercase">Layout Position</h6>
                                            <p className="text-muted">Choose Fixed or Scrollable Layout Position.</p>

                                            <div className="btn-group radio" role="group">
                                                <input
                                                    type="radio"
                                                    className="btn-check"
                                                    name="data-layout-position"
                                                    id="layout-position-fixed"
                                                    value={LAYOUT_POSITION_TYPES.FIXED}
                                                    checked={layoutPositionType === LAYOUT_POSITION_TYPES.FIXED}
                                                    onChange={e => {
                                                        if (e.target.checked) {
                                                            dispatch(changeLayoutPosition(e.target.value));
                                                        }
                                                    }}
                                                />
                                                <label className="btn btn-light w-sm" htmlFor="layout-position-fixed">Fixed</label>

                                                <input
                                                    type="radio"
                                                    className="btn-check"
                                                    name="data-layout-position"
                                                    id="layout-position-scrollable"
                                                    value={LAYOUT_POSITION_TYPES.SCROLLABLE}
                                                    checked={layoutPositionType === LAYOUT_POSITION_TYPES.SCROLLABLE}
                                                    onChange={e => {
                                                        if (e.target.checked) {
                                                            dispatch(changeLayoutPosition(e.target.value));
                                                        }
                                                    }}
                                                />
                                                <label className="btn btn-light w-sm ms-0" htmlFor="layout-position-scrollable">Scrollable</label>
                                            </div>
                                        </div>
                                    </React.Fragment>

                                <h6 className="mt-4 mb-0 fw-semibold text-uppercase">Topbar Color</h6>
                                <p className="text-muted">Choose Light or Dark Topbar Color.</p>

                                <div className="row">
                                    <div className="col-4">
                                        <div className="form-check card-radio">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="data-topbar"
                                                id="topbar-color-light"
                                                value={LAYOUT_TOPBAR_THEME_TYPES.LIGHT}
                                                checked={topbarThemeType === LAYOUT_TOPBAR_THEME_TYPES.LIGHT}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        dispatch(changeTopbarTheme(e.target.value));
                                                    }
                                                }}
                                            />
                                            <label className="form-check-label p-0 avatar-md w-100" htmlFor="topbar-color-light">
                                                <span className="d-flex gap-1 h-100">
                                                    <span className="flex-shrink-0">
                                                        <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                                            <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2"></span>
                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                        </span>
                                                    </span>
                                                    <span className="flex-grow-1">
                                                        <span className="d-flex h-100 flex-column">
                                                            <span className="bg-light d-block p-1"></span>
                                                            <span className="bg-light d-block p-1 mt-auto"></span>
                                                        </span>
                                                    </span>
                                                </span>
                                            </label>
                                        </div>
                                        <h5 className="fs-13 text-center mt-2">Light</h5>
                                    </div>
                                    <div className="col-4">
                                        <div className="form-check card-radio">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="data-topbar"
                                                id="topbar-color-dark"
                                                value={LAYOUT_TOPBAR_THEME_TYPES.DARK}
                                                checked={topbarThemeType === LAYOUT_TOPBAR_THEME_TYPES.DARK}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        dispatch(changeTopbarTheme(e.target.value));
                                                    }
                                                }}
                                            />
                                            <label className="form-check-label p-0 avatar-md w-100" htmlFor="topbar-color-dark">
                                                <span className="d-flex gap-1 h-100">
                                                    <span className="flex-shrink-0">
                                                        <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                                            <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2"></span>
                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                        </span>
                                                    </span>
                                                    <span className="flex-grow-1">
                                                        <span className="d-flex h-100 flex-column">
                                                            <span className="bg-primary d-block p-1"></span>
                                                            <span className="bg-light d-block p-1 mt-auto"></span>
                                                        </span>
                                                    </span>
                                                </span>
                                            </label>
                                        </div>
                                        <h5 className="fs-13 text-center mt-2">Dark</h5>
                                    </div>
                                </div>

                                {layoutType === "vertical" && (
                                    <React.Fragment>

                                        <div id="sidebar-size">
                                            <h6 className="mt-4 mb-0 fw-semibold text-uppercase">Sidebar Size</h6>
                                            <p className="text-muted">Choose a size of Sidebar.</p>

                                            <div className="row">
                                                <div className="col-4">
                                                    <div className="form-check sidebar-setting card-radio">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="data-sidebar-size"
                                                            id="sidebar-size-default"
                                                            value={LEFT_SIDEBAR_SIZE_TYPES.DEFAULT}
                                                            checked={leftsidbarSizeType === LEFT_SIDEBAR_SIZE_TYPES.DEFAULT}
                                                            onChange={e => {
                                                                if (e.target.checked) {
                                                                    dispatch(changeLeftsidebarSizeType(e.target.value));
                                                                }
                                                            }}
                                                        />
                                                        <label className="form-check-label p-0 avatar-md w-100" htmlFor="sidebar-size-default">
                                                            <span className="d-flex gap-1 h-100">
                                                                <span className="flex-shrink-0">
                                                                    <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                                                        <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                    </span>
                                                                </span>
                                                                <span className="flex-grow-1">
                                                                    <span className="d-flex h-100 flex-column">
                                                                        <span className="bg-light d-block p-1"></span>
                                                                        <span className="bg-light d-block p-1 mt-auto"></span>
                                                                    </span>
                                                                </span>
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <h5 className="fs-13 text-center mt-2">Default</h5>
                                                </div>

                                                <div className="col-4">
                                                    <div className="form-check sidebar-setting card-radio">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="data-sidebar-size"
                                                            id="sidebar-size-compact"
                                                            value={LEFT_SIDEBAR_SIZE_TYPES.COMPACT}
                                                            checked={leftsidbarSizeType === LEFT_SIDEBAR_SIZE_TYPES.COMPACT}
                                                            onChange={e => {
                                                                if (e.target.checked) {
                                                                    dispatch(changeLeftsidebarSizeType(e.target.value));
                                                                }
                                                            }}
                                                        />
                                                        <label className="form-check-label p-0 avatar-md w-100" htmlFor="sidebar-size-compact">
                                                            <span className="d-flex gap-1 h-100">
                                                                <span className="flex-shrink-0">
                                                                    <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                                                        <span className="d-block p-1 bg-primary-subtle rounded mb-2"></span>
                                                                        <span className="d-block p-1 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 pb-0 bg-primary-subtle"></span>
                                                                    </span>
                                                                </span>
                                                                <span className="flex-grow-1">
                                                                    <span className="d-flex h-100 flex-column">
                                                                        <span className="bg-light d-block p-1"></span>
                                                                        <span className="bg-light d-block p-1 mt-auto"></span>
                                                                    </span>
                                                                </span>
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <h5 className="fs-13 text-center mt-2">Compact</h5>
                                                </div>

                                                <div className="col-4">
                                                    <div className="form-check sidebar-setting card-radio">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="data-sidebar-size"
                                                            id="sidebar-size-small"
                                                            value={LEFT_SIDEBAR_SIZE_TYPES.SMALLICON}
                                                            checked={leftsidbarSizeType === LEFT_SIDEBAR_SIZE_TYPES.SMALLICON}
                                                            onChange={e => {
                                                                if (e.target.checked) {
                                                                    dispatch(changeLeftsidebarSizeType(e.target.value));
                                                                }
                                                            }}
                                                        />
                                                        <label className="form-check-label p-0 avatar-md w-100" htmlFor="sidebar-size-small">
                                                            <span className="d-flex gap-1 h-100">
                                                                <span className="flex-shrink-0">
                                                                    <span className="bg-light d-flex h-100 flex-column gap-1">
                                                                        <span className="d-block p-1 bg-primary-subtle mb-2"></span>
                                                                        <span className="d-block p-1 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 pb-0 bg-primary-subtle"></span>
                                                                    </span>
                                                                </span>
                                                                <span className="flex-grow-1">
                                                                    <span className="d-flex h-100 flex-column">
                                                                        <span className="bg-light d-block p-1"></span>
                                                                        <span className="bg-light d-block p-1 mt-auto"></span>
                                                                    </span>
                                                                </span>
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <h5 className="fs-13 text-center mt-2">Small (Icon View)</h5>
                                                </div>

                                                <div className="col-4">
                                                    <div className="form-check sidebar-setting card-radio">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="data-sidebar-size"
                                                            id="sidebar-size-small-hover"
                                                            value={LEFT_SIDEBAR_SIZE_TYPES.SMALLHOVER}
                                                            checked={leftsidbarSizeType === LEFT_SIDEBAR_SIZE_TYPES.SMALLHOVER}
                                                            onChange={e => {
                                                                if (e.target.checked) {
                                                                    dispatch(changeLeftsidebarSizeType(e.target.value));
                                                                }
                                                            }}

                                                        />
                                                        <label className="form-check-label p-0 avatar-md w-100" htmlFor="sidebar-size-small-hover">
                                                            <span className="d-flex gap-1 h-100">
                                                                <span className="flex-shrink-0">
                                                                    <span className="bg-light d-flex h-100 flex-column gap-1">
                                                                        <span className="d-block p-1 bg-primary-subtle mb-2"></span>
                                                                        <span className="d-block p-1 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 pb-0 bg-primary-subtle"></span>
                                                                    </span>
                                                                </span>
                                                                <span className="flex-grow-1">
                                                                    <span className="d-flex h-100 flex-column">
                                                                        <span className="bg-light d-block p-1"></span>
                                                                        <span className="bg-light d-block p-1 mt-auto"></span>
                                                                    </span>
                                                                </span>
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <h5 className="fs-13 text-center mt-2">Small Hover View</h5>
                                                </div>
                                            </div>
                                        </div>

                                        {layoutType !== "semibox" && (<div id="sidebar-view">
                                            <h6 className="mt-4 mb-0 fw-semibold text-uppercase">Sidebar View</h6>
                                            <p className="text-muted">Choose Default or Detached Sidebar view.</p>

                                            <div className="row">
                                                <div className="col-4">
                                                    <div className="form-check sidebar-setting card-radio">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="data-layout-style"
                                                            id="sidebar-view-default"
                                                            value={LEFT_SIDEBAR_VIEW_TYPES.DEFAULT}
                                                            checked={leftSidebarViewType === LEFT_SIDEBAR_VIEW_TYPES.DEFAULT}
                                                            onChange={e => {
                                                                if (e.target.checked) {
                                                                    dispatch(changeLeftsidebarViewType(e.target.value));
                                                                }
                                                            }}

                                                        />
                                                        <label className="form-check-label p-0 avatar-md w-100" htmlFor="sidebar-view-default">
                                                            <span className="d-flex gap-1 h-100">
                                                                <span className="flex-shrink-0">
                                                                    <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                                                        <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                    </span>
                                                                </span>
                                                                <span className="flex-grow-1">
                                                                    <span className="d-flex h-100 flex-column">
                                                                        <span className="bg-light d-block p-1"></span>
                                                                        <span className="bg-light d-block p-1 mt-auto"></span>
                                                                    </span>
                                                                </span>
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <h5 className="fs-13 text-center mt-2">Default</h5>
                                                </div>
                                                <div className="col-4">
                                                    <div className="form-check sidebar-setting card-radio">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="data-layout-style"
                                                            id="sidebar-view-detached"
                                                            value={LEFT_SIDEBAR_VIEW_TYPES.DETACHED}
                                                            checked={leftSidebarViewType === LEFT_SIDEBAR_VIEW_TYPES.DETACHED}
                                                            onChange={e => {
                                                                if (e.target.checked) {
                                                                    dispatch(changeLeftsidebarViewType(e.target.value));
                                                                }
                                                            }}
                                                        />
                                                        <label className="form-check-label p-0 avatar-md w-100" htmlFor="sidebar-view-detached">
                                                            <span className="d-flex h-100 flex-column">
                                                                <span className="bg-light d-flex p-1 gap-1 align-items-center px-2">
                                                                    <span className="d-block p-1 bg-primary-subtle rounded me-1"></span>
                                                                    <span className="d-block p-1 pb-0 px-2 bg-primary-subtle ms-auto"></span>
                                                                    <span className="d-block p-1 pb-0 px-2 bg-primary-subtle"></span>
                                                                </span>
                                                                <span className="d-flex gap-1 h-100 p-1 px-2">
                                                                    <span className="flex-shrink-0">
                                                                        <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                        </span>
                                                                    </span>
                                                                </span>
                                                                <span className="bg-light d-block p-1 mt-auto px-2"></span>
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <h5 className="fs-13 text-center mt-2">Detached</h5>
                                                </div>
                                            </div>
                                        </div>)}
                                </React.Fragment>
                            )}

                                {(layoutType === "vertical") && (
                                    <React.Fragment>
                                        <div id="sidebar-color">
                                            <h6 className="mt-4 mb-0 fw-semibold text-uppercase">Sidebar Color</h6>
                                            <p className="text-muted">Choose Ligth or Dark Sidebar Color.</p>

                                            <div className="row">
                                                <div className="col-4">
                                                    <div className="form-check sidebar-setting card-radio">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="data-sidebar"
                                                            id="sidebar-color-light"
                                                            value={LAYOUT_SIDEBAR_TYPES.LIGHT}
                                                            checked={leftSidebarType === LAYOUT_SIDEBAR_TYPES.LIGHT}
                                                            onChange={e => {
                                                                setShow(false);
                                                                if (e.target.checked) {
                                                                    dispatch(changeSidebarTheme(e.target.value));
                                                                }
                                                            }}
                                                        />
                                                        <label className="form-check-label p-0 avatar-md w-100" htmlFor="sidebar-color-light">
                                                            <span className="d-flex gap-1 h-100">
                                                                <span className="flex-shrink-0">
                                                                    <span className="bg-white border-end d-flex h-100 flex-column gap-1 p-1">
                                                                        <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                    </span>
                                                                </span>
                                                                <span className="flex-grow-1">
                                                                    <span className="d-flex h-100 flex-column">
                                                                        <span className="bg-light d-block p-1"></span>
                                                                        <span className="bg-light d-block p-1 mt-auto"></span>
                                                                    </span>
                                                                </span>
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <h5 className="fs-13 text-center mt-2">Light</h5>
                                                </div>
                                                <div className="col-4">
                                                    <div className="form-check sidebar-setting card-radio">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="data-sidebar"
                                                            id="sidebar-color-dark"
                                                            value={LAYOUT_SIDEBAR_TYPES.DARK}
                                                            checked={leftSidebarType === LAYOUT_SIDEBAR_TYPES.DARK}
                                                            onChange={e => {
                                                                setShow(false);
                                                                if (e.target.checked) {
                                                                    dispatch(changeSidebarTheme(e.target.value));
                                                                }
                                                            }}
                                                        />
                                                        <label className="form-check-label p-0 avatar-md w-100" htmlFor="sidebar-color-dark">
                                                            <span className="d-flex gap-1 h-100">
                                                                <span className="flex-shrink-0">
                                                                    <span className="bg-primary d-flex h-100 flex-column gap-1 p-1">
                                                                        <span className="d-block p-1 px-2 bg-white bg-opacity-10 rounded mb-2"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-white bg-opacity-10"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-white bg-opacity-10"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-white bg-opacity-10"></span>
                                                                    </span>
                                                                </span>
                                                                <span className="flex-grow-1">
                                                                    <span className="d-flex h-100 flex-column">
                                                                        <span className="bg-light d-block p-1"></span>
                                                                        <span className="bg-light d-block p-1 mt-auto"></span>
                                                                    </span>
                                                                </span>
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <h5 className="fs-13 text-center mt-2">Dark</h5>
                                                </div>

                                                <div className="col-4">
                                                    <button
                                                        className={classnames(
                                                            "btn btn-link avatar-md w-100 p-0 overflow-hidden border ",
                                                            { collapsed: !show, active: show === true }
                                                        )}
                                                        type="button"
                                                        data-bs-target="#collapseBgGradient"
                                                        data-bs-toggle="collapse"
                                                        aria-controls="collapseBgGradient"
                                                        onClick={tog_show}
                                                    >
                                                        <span className="d-flex gap-1 h-100">
                                                            <span className="flex-shrink-0">
                                                                <span className="bg-vertical-gradient d-flex h-100 flex-column gap-1 p-1">
                                                                    <span className="d-block p-1 px-2 bg-white bg-opacity-10 rounded mb-2"></span>
                                                                    <span className="d-block p-1 px-2 pb-0 bg-white bg-opacity-10"></span>
                                                                    <span className="d-block p-1 px-2 pb-0 bg-white bg-opacity-10"></span>
                                                                    <span className="d-block p-1 px-2 pb-0 bg-white bg-opacity-10"></span>
                                                                </span>
                                                            </span>
                                                            <span className="flex-grow-1">
                                                                <span className="d-flex h-100 flex-column">
                                                                    <span className="bg-light d-block p-1"></span>
                                                                    <span className="bg-light d-block p-1 mt-auto"></span>
                                                                </span>
                                                            </span>
                                                        </span>
                                                    </button>
                                                    <h5 className="fs-13 text-center mt-2">Gradient</h5>
                                                </div>
                                            </div>
                                            <Collapse
                                                isOpen={show}
                                                className="collapse"
                                                id="collapseBgGradient"
                                            >
                                                <div className="d-flex gap-2 flex-wrap img-switch p-2 px-3 bg-light rounded">
                                                    <div className="form-check sidebar-setting card-radio">
                                                        <input className="form-check-input"
                                                            type="radio"
                                                            name="data-sidebar"
                                                            id="sidebar-color-gradient"
                                                            value={LAYOUT_SIDEBAR_TYPES.GRADIENT}
                                                            checked={leftSidebarType === LAYOUT_SIDEBAR_TYPES.GRADIENT}
                                                            onChange={e => {
                                                                if (e.target.checked) {
                                                                    dispatch(changeSidebarTheme(e.target.value));
                                                                }
                                                            }}
                                                        />
                                                        <label className="form-check-label p-0 avatar-xs rounded-circle" htmlFor="sidebar-color-gradient">
                                                            <span className="avatar-title rounded-circle bg-vertical-gradient"></span>
                                                        </label>
                                                    </div>
                                                    <div className="form-check sidebar-setting card-radio">
                                                        <input className="form-check-input"
                                                            type="radio"
                                                            name="data-sidebar"
                                                            id="sidebar-color-gradient-2"
                                                            value={LAYOUT_SIDEBAR_TYPES.GRADIENT_2}
                                                            checked={leftSidebarType === LAYOUT_SIDEBAR_TYPES.GRADIENT_2}
                                                            onChange={e => {
                                                                if (e.target.checked) {
                                                                    dispatch(changeSidebarTheme(e.target.value));
                                                                }
                                                            }}
                                                        />
                                                        <label className="form-check-label p-0 avatar-xs rounded-circle" htmlFor="sidebar-color-gradient-2">
                                                            <span className="avatar-title rounded-circle bg-vertical-gradient-2"></span>
                                                        </label>
                                                    </div>
                                                    <div className="form-check sidebar-setting card-radio">
                                                        <input className="form-check-input"
                                                            type="radio"
                                                            name="data-sidebar"
                                                            id="sidebar-color-gradient-3"
                                                            value={LAYOUT_SIDEBAR_TYPES.GRADIENT_3}
                                                            checked={leftSidebarType === LAYOUT_SIDEBAR_TYPES.GRADIENT_3}
                                                            onChange={e => {
                                                                if (e.target.checked) {
                                                                    dispatch(changeSidebarTheme(e.target.value));
                                                                }
                                                            }}
                                                        />
                                                        <label className="form-check-label p-0 avatar-xs rounded-circle" htmlFor="sidebar-color-gradient-3">
                                                            <span className="avatar-title rounded-circle bg-vertical-gradient-3"></span>
                                                        </label>
                                                    </div>
                                                    <div className="form-check sidebar-setting card-radio">
                                                        <input className="form-check-input"
                                                            type="radio"
                                                            name="data-sidebar"
                                                            id="sidebar-color-gradient-4"
                                                            value={LAYOUT_SIDEBAR_TYPES.GRADIENT_4}
                                                            checked={leftSidebarType === LAYOUT_SIDEBAR_TYPES.GRADIENT_4}
                                                            onChange={e => {
                                                                if (e.target.checked) {
                                                                    dispatch(changeSidebarTheme(e.target.value));
                                                                }
                                                            }}
                                                        />
                                                        <label className="form-check-label p-0 avatar-xs rounded-circle" htmlFor="sidebar-color-gradient-4">
                                                            <span className="avatar-title rounded-circle bg-vertical-gradient-4"></span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </Collapse>
                                        </div>
                                        <div id="sidebar-img">
                                            <h6 className="mt-4 mb-0 fw-semibold text-uppercase">Sidebar Images</h6>
                                            <p className="text-muted">Choose a image of Sidebar.</p>

                                            <div className="d-flex gap-2 flex-wrap img-switch">
                                                <div className="form-check sidebar-setting card-radio">
                                                    <input className="form-check-input"
                                                        type="radio"
                                                        name="data-sidebar-image"
                                                        id="sidebarimg-none"
                                                        value={LEFT_SIDEBAR_IMAGE_TYPES.NONE}
                                                        checked={leftSidebarImageType === LEFT_SIDEBAR_IMAGE_TYPES.NONE}
                                                        onChange={e => {
                                                            if (e.target.checked) {
                                                                dispatch(changeSidebarImageType(e.target.value));
                                                            }
                                                        }}
                                                    />
                                                    <label className="form-check-label p-0 avatar-sm h-auto" htmlFor="sidebarimg-none">
                                                        <span className="avatar-md w-auto bg-light d-flex align-items-center justify-content-center">
                                                            <i className="ri-close-fill fs-20"></i>
                                                        </span>
                                                    </label>
                                                </div>

                                                <div className="form-check sidebar-setting card-radio">
                                                    <input className="form-check-input"
                                                        type="radio"
                                                        name="data-sidebar-image"
                                                        id="sidebarimg-01"
                                                        value={LEFT_SIDEBAR_IMAGE_TYPES.IMG1}
                                                        checked={leftSidebarImageType === LEFT_SIDEBAR_IMAGE_TYPES.IMG1}
                                                        onChange={e => {
                                                            if (e.target.checked) {
                                                                dispatch(changeSidebarImageType(e.target.value));
                                                            }
                                                        }}
                                                    />
                                                    <label className="form-check-label p-0 avatar-sm h-auto" htmlFor="sidebarimg-01">
                                                        <img src={img01} alt="" className="avatar-md w-auto object-fit-cover" />
                                                    </label>

                                                </div>

                                                <div className="form-check sidebar-setting card-radio">
                                                    <input className="form-check-input"
                                                        type="radio"
                                                        name="data-sidebar-image"
                                                        id="sidebarimg-02"
                                                        value={LEFT_SIDEBAR_IMAGE_TYPES.IMG2}
                                                        checked={leftSidebarImageType === LEFT_SIDEBAR_IMAGE_TYPES.IMG2}
                                                        onChange={e => {
                                                            if (e.target.checked) {
                                                                dispatch(changeSidebarImageType(e.target.value));
                                                            }
                                                        }}
                                                    />
                                                    <label className="form-check-label p-0 avatar-sm h-auto" htmlFor="sidebarimg-02">
                                                        <img src={img02} alt="" className="avatar-md w-auto object-fit-cover" />
                                                    </label>
                                                </div>
                                                <div className="form-check sidebar-setting card-radio">
                                                    <input className="form-check-input"
                                                        type="radio"
                                                        name="data-sidebar-image"
                                                        id="sidebarimg-03"
                                                        value={LEFT_SIDEBAR_IMAGE_TYPES.IMG3}
                                                        checked={leftSidebarImageType === LEFT_SIDEBAR_IMAGE_TYPES.IMG3}
                                                        onChange={e => {
                                                            if (e.target.checked) {
                                                                dispatch(changeSidebarImageType(e.target.value));
                                                            }
                                                        }}
                                                    />
                                                    <label className="form-check-label p-0 avatar-sm h-auto" htmlFor="sidebarimg-03">
                                                        <img src={img03} alt="" className="avatar-md w-auto object-fit-cover" />
                                                    </label>
                                                </div>
                                                <div className="form-check sidebar-setting card-radio">
                                                    <input className="form-check-input"
                                                        type="radio"
                                                        name="data-sidebar-image"
                                                        id="sidebarimg-04"
                                                        value={LEFT_SIDEBAR_IMAGE_TYPES.IMG4}
                                                        checked={leftSidebarImageType === LEFT_SIDEBAR_IMAGE_TYPES.IMG4}
                                                        onChange={e => {
                                                            if (e.target.checked) {
                                                                dispatch(changeSidebarImageType(e.target.value));
                                                            }
                                                        }}
                                                    />
                                                    <label className="form-check-label p-0 avatar-sm h-auto" htmlFor="sidebarimg-04">
                                                        <img src={img04} alt="" className="avatar-md w-auto object-fit-cover" />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                )}


                                <div id="sidebar-color">
                                    <h6 className="mt-4 mb-0 fw-semibold text-uppercase">Color del Tema Principal</h6>
                                    <p className="text-muted">Elige el color principal (afecta la barra cuando está oscura).</p>
                                    <div className="d-flex flex-wrap gap-2">
                                        {/* Default (Indigo) */}
                                        <div className="form-check sidebar-setting card-radio">
                                            <input className="form-check-input" type="radio" name="data-theme-colors" id="themeColor-01"
                                                value={LAYOUT_THEME_COLOR.DEFAULT}
                                                checked={layoutThemeColorType === LAYOUT_THEME_COLOR.DEFAULT}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        dispatch(changeLayoutThemeColor(e.target.value));
                                                    }
                                                }} />
                                            <label className="form-check-label avatar-xs p-0 rounded-circle" style={{ backgroundColor: '#405189' }} htmlFor="themeColor-01" title="Azul Predeterminado"></label>
                                        </div>
                                        {/* Green */}
                                        <div className="form-check sidebar-setting card-radio">
                                            <input className="form-check-input" type="radio" name="data-theme-colors" id="themeColor-02"
                                                value={LAYOUT_THEME_COLOR.GREEN}
                                                checked={layoutThemeColorType === LAYOUT_THEME_COLOR.GREEN}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        dispatch(changeLayoutThemeColor(e.target.value));
                                                    }
                                                }} />
                                            <label className="form-check-label avatar-xs p-0 rounded-circle" style={{ backgroundColor: '#0ab39c' }} htmlFor="themeColor-02" title="Verde Esmeralda"></label>
                                        </div>
                                        {/* Purple */}
                                        <div className="form-check sidebar-setting card-radio">
                                            <input className="form-check-input" type="radio" name="data-theme-colors" id="themeColor-03"
                                                value={LAYOUT_THEME_COLOR.PURPLE}
                                                checked={layoutThemeColorType === LAYOUT_THEME_COLOR.PURPLE}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        dispatch(changeLayoutThemeColor(e.target.value));
                                                    }
                                                }} />
                                            <label className="form-check-label avatar-xs p-0 rounded-circle" style={{ backgroundColor: '#6559cc' }} htmlFor="themeColor-03" title="Morado"></label>
                                        </div>
                                        {/* Blue */}
                                        <div className="form-check sidebar-setting card-radio">
                                            <input className="form-check-input" type="radio" name="data-theme-colors" id="themeColor-04"
                                                value={LAYOUT_THEME_COLOR.BLUE}
                                                checked={layoutThemeColorType === LAYOUT_THEME_COLOR.BLUE}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        dispatch(changeLayoutThemeColor(e.target.value));
                                                    }
                                                }} />
                                            <label className="form-check-label avatar-xs p-0 rounded-circle" style={{ backgroundColor: '#3577f1' }} htmlFor="themeColor-04" title="Azul"></label>
                                        </div>
                                        {/* Red */}
                                        <div className="form-check sidebar-setting card-radio">
                                            <input className="form-check-input" type="radio" name="data-theme-colors" id="themeColor-red"
                                                value={LAYOUT_THEME_COLOR.RED}
                                                checked={layoutThemeColorType === LAYOUT_THEME_COLOR.RED}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        dispatch(changeLayoutThemeColor(e.target.value));
                                                    }
                                                }} />
                                            <label className="form-check-label avatar-xs p-0 rounded-circle" style={{ backgroundColor: '#ee6352' }} htmlFor="themeColor-red" title="Rojo Carmes├¡"></label>
                                        </div>
                                        {/* Orange */}
                                        <div className="form-check sidebar-setting card-radio">
                                            <input className="form-check-input" type="radio" name="data-theme-colors" id="themeColor-orange"
                                                value={LAYOUT_THEME_COLOR.ORANGE}
                                                checked={layoutThemeColorType === LAYOUT_THEME_COLOR.ORANGE}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        dispatch(changeLayoutThemeColor(e.target.value));
                                                    }
                                                }} />
                                            <label className="form-check-label avatar-xs p-0 rounded-circle" style={{ backgroundColor: '#ff7043' }} htmlFor="themeColor-orange" title="Naranja Atardecer"></label>
                                        </div>
                                        {/* Cyan */}
                                        <div className="form-check sidebar-setting card-radio">
                                            <input className="form-check-input" type="radio" name="data-theme-colors" id="themeColor-cyan"
                                                value={LAYOUT_THEME_COLOR.CYAN}
                                                checked={layoutThemeColorType === LAYOUT_THEME_COLOR.CYAN}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        dispatch(changeLayoutThemeColor(e.target.value));
                                                    }
                                                }} />
                                            <label className="form-check-label avatar-xs p-0 rounded-circle" style={{ backgroundColor: '#06b6d4' }} htmlFor="themeColor-cyan" title="Azul Turquesa"></label>
                                        </div>
                                        {/* Pink */}
                                        <div className="form-check sidebar-setting card-radio">
                                            <input className="form-check-input" type="radio" name="data-theme-colors" id="themeColor-pink"
                                                value={LAYOUT_THEME_COLOR.PINK}
                                                checked={layoutThemeColorType === LAYOUT_THEME_COLOR.PINK}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        dispatch(changeLayoutThemeColor(e.target.value));
                                                    }
                                                }} />
                                            <label className="form-check-label avatar-xs p-0 rounded-circle" style={{ backgroundColor: '#ec4899' }} htmlFor="themeColor-pink" title="Rosa"></label>
                                        </div>
                                        {/* Yellow */}
                                        <div className="form-check sidebar-setting card-radio">
                                            <input className="form-check-input" type="radio" name="data-theme-colors" id="themeColor-yellow"
                                                value={LAYOUT_THEME_COLOR.YELLOW}
                                                checked={layoutThemeColorType === LAYOUT_THEME_COLOR.YELLOW}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        dispatch(changeLayoutThemeColor(e.target.value));
                                                    }
                                                }} />
                                            <label className="form-check-label avatar-xs p-0 rounded-circle" style={{ backgroundColor: '#f59e0b' }} htmlFor="themeColor-yellow" title="Amarillo Oro"></label>
                                        </div>
                                        {/* Dark */}
                                        <div className="form-check sidebar-setting card-radio">
                                            <input className="form-check-input" type="radio" name="data-theme-colors" id="themeColor-dark"
                                                value={LAYOUT_THEME_COLOR.DARK}
                                                checked={layoutThemeColorType === LAYOUT_THEME_COLOR.DARK}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        dispatch(changeLayoutThemeColor(e.target.value));
                                                    }
                                                }} />
                                            <label className="form-check-label avatar-xs p-0 rounded-circle" style={{ backgroundColor: '#374151' }} htmlFor="themeColor-dark" title="Gris Oscuro / Pizarra"></label>
                                        </div>
                                        {/* Custom Picker */}
                                        <div className="form-check sidebar-setting card-radio">
                                            <input className="form-check-input" type="radio" name="data-theme-colors" id="themeColor-custom"
                                                value={layoutThemeColorType && layoutThemeColorType.startsWith('#') ? layoutThemeColorType : '#4f46e5'}
                                                checked={layoutThemeColorType !== null && layoutThemeColorType.startsWith('#')}
                                                onChange={e => {
                                                    dispatch(changeLayoutThemeColor(e.target.value));
                                                }} />
                                            <label 
                                                className="form-check-label avatar-xs p-0 rounded-circle d-flex align-items-center justify-content-center" 
                                                htmlFor="themeColor-custom" 
                                                title="Color Personalizado"
                                                style={{
                                                    background: layoutThemeColorType && layoutThemeColorType.startsWith('#') 
                                                        ? layoutThemeColorType 
                                                        : 'linear-gradient(135deg, #ff0055, #00ffcc, #9900ff)',
                                                    border: '1px solid rgba(0,0,0,0.1)',
                                                    cursor: 'pointer',
                                                    position: 'relative'
                                                }}
                                                onClick={() => {
                                                    colorInputRef.current?.click();
                                                }}
                                            >
                                                <i className="ri-palette-line text-white fs-12" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}></i>
                                            </label>
                                            <input 
                                                type="color" 
                                                ref={colorInputRef} 
                                                style={{ display: 'none' }} 
                                                value={layoutThemeColorType && layoutThemeColorType.startsWith('#') ? layoutThemeColorType : '#4f46e5'}
                                                onChange={e => {
                                                    dispatch(changeLayoutThemeColor(e.target.value));
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div id="preloader-menu">
                                    <h6 className="mt-4 mb-0 fw-semibold text-uppercase">Preloader</h6>
                                    <p className="text-muted">Choose a preloader.</p>

                                    <div className="row">
                                        <div className="col-4">
                                            <div className="form-check sidebar-setting card-radio">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="data-preloader"
                                                    id="preloader-view-custom"
                                                    value={PERLOADER_TYPES.ENABLE}
                                                    checked={preloader === PERLOADER_TYPES.ENABLE}
                                                    onChange={e => {
                                                        if (e.target.checked) {
                                                            dispatch(changePreLoader(e.target.value));
                                                        }
                                                    }}
                                                />

                                                <label className="form-check-label p-0 avatar-md w-100" htmlFor="preloader-view-custom">
                                                    <span className="d-flex gap-1 h-100">
                                                        <span className="flex-shrink-0">
                                                            <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                                                <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2"></span>
                                                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                            </span>
                                                        </span>
                                                        <span className="flex-grow-1">
                                                            <span className="d-flex h-100 flex-column">
                                                                <span className="bg-light d-block p-1"></span>
                                                                <span className="bg-light d-block p-1 mt-auto"></span>
                                                            </span>
                                                        </span>
                                                    </span>
                                                    {/* <!-- <div id="preloader"> --> */}
                                                    <div id="status" className="d-flex align-items-center justify-content-center">
                                                        <div className="spinner-border text-primary avatar-xxs m-auto" role="status">
                                                            <span className="visually-hidden">Loading...</span>
                                                        </div>
                                                    </div>
                                                    {/* <!-- </div> --> */}
                                                </label>
                                            </div>
                                            <h5 className="fs-13 text-center mt-2">Enable</h5>
                                        </div>
                                        <div className="col-4">
                                            <div className="form-check sidebar-setting card-radio">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="data-preloader"
                                                    id="preloader-view-none"
                                                    value={PERLOADER_TYPES.DISABLE}
                                                    checked={preloader === PERLOADER_TYPES.DISABLE}
                                                    onChange={e => {
                                                        if (e.target.checked) {
                                                            dispatch(changePreLoader(e.target.value));
                                                        }
                                                    }}
                                                />
                                                <label className="form-check-label p-0 avatar-md w-100" htmlFor="preloader-view-none">
                                                    <span className="d-flex gap-1 h-100">
                                                        <span className="flex-shrink-0">
                                                            <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                                                <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2"></span>
                                                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                            </span>
                                                        </span>
                                                        <span className="flex-grow-1">
                                                            <span className="d-flex h-100 flex-column">
                                                                <span className="bg-light d-block p-1"></span>
                                                                <span className="bg-light d-block p-1 mt-auto"></span>
                                                            </span>
                                                        </span>
                                                    </span>
                                                </label>
                                            </div>
                                            <h5 className="fs-13 text-center mt-2">Disable</h5>
                                        </div>
                                    </div>
                                </div>

                                {/* Luma Premium Customization Panel */}
                                <div className="mt-4 pt-4 border-top border-top-dashed border-primary">
                                    <h5 className="fw-semibold text-primary d-flex align-items-center mb-3">
                                        <i className="ri-vip-crown-2-line me-2 fs-20"></i> Luma Premium
                                    </h5>
                                    
                                    <div className="mb-4">
                                        <h6 className="fw-semibold text-uppercase mb-2">Estilo de Fondo</h6>
                                        <p className="text-muted mb-2">Fondo interactivo y moderno.</p>
                                        <select 
                                            className="form-select" 
                                            value={lumaTheme.background} 
                                            onChange={(e) => updateLumaTheme({ background: e.target.value as any })}
                                        >
                                            <option value="default">Predeterminado (Luma)</option>
                                            <option value="aurora-glow">Aurora de Medianoche (Premium)</option>
                                            <option value="solid-indigo">Azul Índigo Profundo</option>
                                            <option value="cyberpunk-grid">Rejilla Cyberpunk</option>
                                            <option value="pastel-mesh">Niebla Pastel (Claro)</option>
                                            <option value="clean-white-glass">Cristal Limpio (Claro)</option>
                                        </select>
                                    </div>

                                    <div className="mb-4">
                                        <h6 className="fw-semibold text-uppercase mb-2">Tipografía</h6>
                                        <p className="text-muted mb-2">Cambia la fuente de la app.</p>
                                        <select 
                                            className="form-select" 
                                            value={lumaTheme.fontFamily} 
                                            onChange={(e) => updateLumaTheme({ fontFamily: e.target.value as any })}
                                        >
                                            <option value="Outfit">Outfit (Moderna/Redonda)</option>
                                            <option value="Inter">Inter (Limpia/Técnica)</option>
                                            <option value="Space Grotesk">Space Grotesk (Tech)</option>
                                            <option value="Poppins">Poppins (Amigable)</option>
                                            <option value="Montserrat">Montserrat (Elegante)</option>
                                        </select>
                                    </div>

                                    <div className="mb-4">
                                        <h6 className="fw-semibold text-uppercase mb-2">Bordes de Tarjetas</h6>
                                        <p className="text-muted mb-2">Redondez de los bordes.</p>
                                        <select 
                                            className="form-select" 
                                            value={lumaTheme.borderRadius} 
                                            onChange={(e) => updateLumaTheme({ borderRadius: e.target.value as any })}
                                        >
                                            <option value="0px">Brutalista (0px)</option>
                                            <option value="6px">Elegante (6px)</option>
                                            <option value="12px">Estándar Luma (12px)</option>
                                            <option value="18px">Premium Rounded (18px)</option>
                                            <option value="26px">Orgánico (26px)</option>
                                        </select>
                                    </div>

                                    <div className="mb-4">
                                        <h6 className="fw-semibold text-uppercase mb-2">Estilo de Bordes</h6>
                                        <select 
                                            className="form-select" 
                                            value={lumaTheme.borderStyle} 
                                            onChange={(e) => updateLumaTheme({ borderStyle: e.target.value as any })}
                                        >
                                            <option value="thin">Borde Fino (Clásico)</option>
                                            <option value="shadow-only">Solo Sombra (Sin Bordes)</option>
                                            <option value="neon-glow">Brillo Neón</option>
                                            <option value="glass-border">Borde de Cristal</option>
                                        </select>
                                    </div>

                                    <div className="mb-4">
                                        <h6 className="fw-semibold text-uppercase mb-2">Colores de Acento</h6>
                                        <p className="text-muted mb-2">Tonos premium Luma.</p>
                                        <select 
                                            className="form-select" 
                                            value={lumaTheme.accentPreset} 
                                            onChange={(e) => updateLumaTheme({ accentPreset: e.target.value as any })}
                                        >
                                            <option value="default">Predeterminado de Luma</option>
                                            <option value="nordic-slate">Pizarra Minimalista</option>
                                        </select>
                                    </div>

                                    <div className="mb-4">
                                        <h6 className="fw-semibold text-uppercase mb-2">Transparencia (Glassmorphism)</h6>
                                        <label className="form-label text-muted">Opacidad de Tarjetas: {Math.round(lumaTheme.glassOpacity * 100)}%</label>
                                        <input 
                                            type="range" 
                                            className="form-range" 
                                            min="0.4" 
                                            max="1.0" 
                                            step="0.05"
                                            value={lumaTheme.glassOpacity}
                                            onChange={(e) => updateLumaTheme({ glassOpacity: parseFloat(e.target.value) })}
                                        />
                                        
                                        <label className="form-label text-muted mt-2">Desenfoque (Blur): {lumaTheme.glassBlur}px</label>
                                        <input 
                                            type="range" 
                                            className="form-range" 
                                            min="0" 
                                            max="25" 
                                            step="1"
                                            value={lumaTheme.glassBlur}
                                            onChange={(e) => updateLumaTheme({ glassBlur: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </SimpleBar>

                    </OffcanvasBody>

                </Offcanvas>
            </div>
        </React.Fragment>
    );
};

export default withRouter(RightSidebar);