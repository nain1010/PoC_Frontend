import React, { useEffect, useState } from 'react';
import { Input, Label, Button, Form, FormFeedback, Alert, Spinner } from 'reactstrap';
import logoLight from "../../assets/images/logo-light.png";
import "./Login.css";

//redux
import { useSelector, useDispatch } from "react-redux";

import { Link } from "react-router-dom";
import withRouter from "../../Components/Common/withRouter";
// Formik validation
import * as Yup from "yup";
import { useFormik } from "formik";

// actions
import { loginUser, socialLogin, resetLoginFlag } from "../../slices/thunks";


import { createSelector } from 'reselect';
//import images

const Login = (props: any) => {
    const dispatch: any = useDispatch();

    const selectLayoutState = (state: any) => state;
    const loginpageData = createSelector(
        selectLayoutState,
        (state) => ({
            user: state.Account.user,
            error: state.Login.error,
            errorMsg: state.Login.errorMsg,
        })
    );
    // Inside your component
    const {
        user, error, errorMsg
    } = useSelector(loginpageData);

    const [userLogin, setUserLogin] = useState<any>([]);
    const [passwordShow, setPasswordShow] = useState<boolean>(false);

    const [loader, setLoader] = useState<boolean>(false);


    useEffect(() => {
        if (user && user) {
            const updatedUserData = process.env.REACT_APP_DEFAULTAUTH === "firebase" ? user.multiFactor.user.email : user.email;
            const updatedUserPassword = process.env.REACT_APP_DEFAULTAUTH === "firebase" ? "" : user.confirm_password;
            setUserLogin({
                email: updatedUserData,
                password: updatedUserPassword
            });
        }
    }, [user]);

    const validation: any = useFormik({
        // enableReinitialize : use this flag when initial values needs to be changed
        enableReinitialize: true,

        initialValues: {
            email: userLogin.email || "testuser@example.com" || '',
            password: userLogin.password || "1234567" || '',
        },
        validationSchema: Yup.object({
            email: Yup.string().required("Por favor ingresa tu correo electrónico"),
            password: Yup.string().required("Por favor ingresa tu contraseña"),
        }),
        onSubmit: (values) => {
            dispatch(loginUser(values, props.router.navigate));
            setLoader(true)
        }
    });

    const signIn = (type: any) => {
        dispatch(socialLogin(type, props.router.navigate));
    };


    //for facebook and google authentication
    const socialResponse = (type: any) => {
        signIn(type);
    };


    useEffect(() => {
        if (errorMsg) {
            setTimeout(() => {
                dispatch(resetLoginFlag());
                setLoader(false)
            }, 3000);
        }
    }, [dispatch, errorMsg]);

    document.title = "Iniciar Sesión | Luma - Gestión de Proyectos";
    return (
        <React.Fragment>
            <div className="login-page-container">
                <div className="login-card">
                    <div className="login-header">
                        <img src={logoLight} alt="Luma Logo" className="login-logo" />
                        <h4 className="login-title">¡Bienvenido de nuevo!</h4>
                        <p className="login-subtitle">Inicia sesión para continuar.</p>
                    </div>

                    {error && error ? (
                        <Alert color="danger" className="border-0 bg-soft-danger text-danger mb-4">
                            {error}
                        </Alert>
                    ) : null}

                    <Form
                        onSubmit={(e) => {
                            e.preventDefault();
                            validation.handleSubmit();
                            return false;
                        }}
                        action="#"
                        className="login-form-container"
                    >
                        <div>
                            <Label htmlFor="email" className="login-label">Correo Electrónico</Label>
                            <div className="login-input-group">
                                <Input
                                    name="email"
                                    className={`login-input ${validation.touched.email && validation.errors.email ? 'is-invalid' : ''}`}
                                    placeholder="Ingresa tu correo"
                                    type="email"
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    value={validation.values.email || ""}
                                    invalid={validation.touched.email && validation.errors.email ? true : false}
                                />
                                {validation.touched.email && validation.errors.email ? (
                                    <FormFeedback type="invalid">{validation.errors.email}</FormFeedback>
                                ) : null}
                            </div>
                        </div>

                        <div>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <Label className="login-label mb-0" htmlFor="password-input">Contraseña</Label>
                            </div>
                            <div className="login-input-group">
                                <Input
                                    id="password-input"
                                    name="password"
                                    value={validation.values.password || ""}
                                    type={passwordShow ? "text" : "password"}
                                    className={`login-input pe-5 ${validation.touched.password && validation.errors.password ? 'is-invalid' : ''}`}
                                    placeholder="Ingresa tu contraseña"
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    invalid={validation.touched.password && validation.errors.password ? true : false}
                                />
                                <button
                                    className="login-password-toggle"
                                    type="button"
                                    id="password-addon"
                                    onClick={() => setPasswordShow(!passwordShow)}
                                >
                                    <i className={passwordShow ? "ri-eye-off-fill" : "ri-eye-fill"}></i>
                                </button>
                                {validation.touched.password && validation.errors.password ? (
                                    <FormFeedback type="invalid">{validation.errors.password}</FormFeedback>
                                ) : null}
                            </div>
                        </div>

                        <div className="login-remember-forgot">
                            <div className="form-check d-flex align-items-center gap-2">
                                <Input className="form-check-input m-0" type="checkbox" value="" id="auth-remember-check" />
                                <Label className="login-checkbox-label m-0" htmlFor="auth-remember-check">Recordarme</Label>
                            </div>
                            <Link to="/forgot-password" style={{ fontSize: "0.8rem" }} className="login-link">¿Olvidaste tu contraseña?</Link>
                        </div>

                        <div className="mt-2">
                            <Button
                                disabled={loader}
                                className="login-button"
                                type="submit"
                            >
                                {loader ? (
                                    <span className="d-flex align-items-center justify-content-center">
                                        <Spinner size="sm" className='me-2'> Cargando... </Spinner>
                                        <span>Cargando...</span>
                                    </span>
                                ) : (
                                    <span>Iniciar Sesión</span>
                                )}
                            </Button>
                        </div>

                        <div className="login-social-divider">
                            <span className="login-social-divider-text">O inicia sesión con</span>
                        </div>

                        <div className="login-social-buttons">
                            <button
                                type="button"
                                className="login-social-btn"
                                onClick={e => {
                                    e.preventDefault();
                                    socialResponse("facebook");
                                }}
                            >
                                <i className="ri-facebook-fill" />
                            </button>
                            <button
                                type="button"
                                className="login-social-btn"
                                onClick={e => {
                                    e.preventDefault();
                                    socialResponse("google");
                                }}
                            >
                                <i className="ri-google-fill" />
                            </button>
                            <button
                                type="button"
                                className="login-social-btn"
                                onClick={e => {
                                    e.preventDefault();
                                    socialResponse("github");
                                }}
                            >
                                <i className="ri-github-fill"></i>
                            </button>
                            <button
                                type="button"
                                className="login-social-btn"
                                onClick={e => {
                                    e.preventDefault();
                                    socialResponse("twitter");
                                }}
                            >
                                <i className="ri-twitter-fill"></i>
                            </button>
                        </div>
                    </Form>

                    <div className="login-footer">
                        <p className="mb-0">
                            ¿No tienes una cuenta? <Link to="/register" className="login-link">Regístrate</Link>
                        </p>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
};

export default withRouter(Login);