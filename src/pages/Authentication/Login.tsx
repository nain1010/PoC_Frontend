import React, { useEffect, useState } from 'react';
import { Input, Label, Button, Form, FormFeedback, Alert, Spinner } from 'reactstrap';
import CoverAuth from "../AuthenticationInner/CoverAuth";
import "./LoginVelzon.css";

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

    document.title = "Iniciar Sesión Gestión de Proyectos";
    return (
        <React.Fragment>
            <CoverAuth title="¡Bienvenido de nuevo!" subtitle="Inicia sesión para continuar.">
                {error && error ? (<Alert color="danger"> {error} </Alert>) : null}
                <div className="p-2 mt-4">
                    <Form
                        onSubmit={(e) => {
                            e.preventDefault();
                            validation.handleSubmit();
                            return false;
                        }}
                        action="#">

                        <div className="mb-3">
                            <Label htmlFor="email" className="form-label">Correo Electrónico</Label>
                            <Input
                                name="email"
                                className="form-control"
                                placeholder="Ingresa tu correo"
                                type="email"
                                onChange={validation.handleChange}
                                onBlur={validation.handleBlur}
                                value={validation.values.email || ""}
                                invalid={
                                    validation.touched.email && validation.errors.email ? true : false
                                }
                            />
                            {validation.touched.email && validation.errors.email ? (
                                <FormFeedback type="invalid">{validation.errors.email}</FormFeedback>
                            ) : null}
                        </div>

                        <div className="mb-3">
                            <div className="float-end">
                                <Link to="/forgot-password" className="text-muted">¿Olvidaste tu contraseña?</Link>
                            </div>
                            <Label className="form-label" htmlFor="password-input">Contraseña</Label>
                            <div className="position-relative auth-pass-inputgroup mb-3">
                                <Input
                                    name="password"
                                    value={validation.values.password || ""}
                                    type={passwordShow ? "text" : "password"}
                                    className="form-control pe-5"
                                    placeholder="Ingresa tu contraseña"
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    invalid={
                                        validation.touched.password && validation.errors.password ? true : false
                                    }
                                />
                                {validation.touched.password && validation.errors.password ? (
                                    <FormFeedback type="invalid">{validation.errors.password}</FormFeedback>
                                ) : null}
                                <button className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted" type="button" id="password-addon" onClick={() => setPasswordShow(!passwordShow)}><i className="ri-eye-fill align-middle"></i></button>
                            </div>
                        </div>

                        <div className="form-check">
                            <Input className="form-check-input" type="checkbox" value="" id="auth-remember-check" />
                            <Label className="form-check-label" htmlFor="auth-remember-check">Recordarme</Label>
                        </div>

                        <div className="mt-4">
                            <Button
                                disabled={loader}
                                className="btn-submit-premium w-100" type="submit">
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


                    </Form>
                </div>

                <div className="mt-4 text-center">
                    <p className="mb-0">¿No tienes una cuenta? <Link to="/register" className="fw-semibold text-primary text-decoration-underline"> Regístrate </Link> </p>
                </div>
            </CoverAuth>
        </React.Fragment>
    );
};

export default withRouter(Login);