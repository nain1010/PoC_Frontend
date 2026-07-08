import React, { useEffect, useState } from "react";
import { Alert, Input, Label, Form, FormFeedback, Button, Spinner } from "reactstrap";

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// action
import { registerUser, resetRegisterFlag } from "../../slices/thunks";

//redux
import { useSelector, useDispatch } from "react-redux";

import { Link, useNavigate } from "react-router-dom";

//import images 

import CoverAuth from "../AuthenticationInner/CoverAuth";
import { createSelector } from "reselect";

const Register = () => {
    const history = useNavigate();
    const dispatch: any = useDispatch();
    const [loader, setLoader] = useState<boolean>(false);

    const validation = useFormik({
        // enableReinitialize : use this flag when initial values needs to be changed
        enableReinitialize: true,

        initialValues: {
            email: '',
            first_name: '',
            password: '',
            confirm_password: ''
        },
        validationSchema: Yup.object({
            email: Yup.string().required("Por favor ingresa tu correo electrónico"),
            first_name: Yup.string().required("Por favor ingresa tu nombre de usuario"),
            password: Yup.string().required("Por favor ingresa tu contraseña"),
            confirm_password: Yup.string()
                .oneOf([Yup.ref('password'), ""], "Las contraseñas deben coincidir")
                .required('Por favor confirma tu contraseña')
        }),
        onSubmit: (values) => {
            dispatch(registerUser(values));
            setLoader(true)
        }
    });

    const selectLayoutState = (state: any) => state.Account;
    const registerdatatype = createSelector(
        selectLayoutState,
        (account) => ({
            success: account.success,
            error: account.error,
            errorMsg: account.registrationError
        })
    );
    // Inside your component
    const {
        error, success, errorMsg
    } = useSelector(registerdatatype);

    useEffect(() => {
        if (success) {
            setLoader(false);
            setTimeout(() => history("/login"), 3000);
        }
        if (error) {
            setLoader(false);
        }

        setTimeout(() => {
            dispatch(resetRegisterFlag());
        }, 3000);

    }, [dispatch, success, error, history]);

    document.title = "Registrarse | Luma - Gestión de Proyectos";

    return (
        <React.Fragment>
            <CoverAuth title="Crear Cuenta Nueva" subtitle="Crea tu cuenta de Luma ahora">
                {success && success ? (
                    <>
                        {toast("Redirigiendo a la página de inicio de sesión...", { position: "top-right", hideProgressBar: false, className: 'bg-success text-white', progress: undefined, toastId: "" })}
                        <ToastContainer autoClose={2000} limit={1} />
                        <Alert color="success">
                            Usuario registrado con éxito. Redirigiendo a la página de inicio de sesión...
                        </Alert>
                    </>
                ) : null}

                {error && error ? (
                    <Alert color="danger"><div>
                        {typeof errorMsg === 'string' ? errorMsg : (errorMsg?.error || "El registro falló. Por favor, verifica tus datos.")} </div></Alert>
                ) : null}

                <div className="p-2 mt-4">
                    <Form
                        onSubmit={(e) => {
                            e.preventDefault();
                            validation.handleSubmit();
                            return false;
                        }}
                        className="needs-validation" action="#">

                        <div className="mb-3 animate-fade-in-up delay-100">
                            <Label htmlFor="useremail" className="form-label">Correo Electrónico <span className="text-danger">*</span></Label>
                            <Input
                                id="email"
                                name="email"
                                className="form-control"
                                placeholder="Ingresa tu dirección de correo"
                                type="email"
                                onChange={validation.handleChange}
                                onBlur={validation.handleBlur}
                                value={validation.values.email || ""}
                                invalid={
                                    validation.touched.email && validation.errors.email ? true : false
                                }
                            />
                            {validation.touched.email && validation.errors.email ? (
                                <FormFeedback type="invalid"><div>{validation.errors.email}</div></FormFeedback>
                            ) : null}

                        </div>
                        <div className="mb-3 animate-fade-in-up delay-200">
                            <Label htmlFor="username" className="form-label">Nombre de usuario <span className="text-danger">*</span></Label>
                            <Input
                                name="first_name"
                                type="text"
                                placeholder="Ingresa tu nombre de usuario"
                                onChange={validation.handleChange}
                                onBlur={validation.handleBlur}
                                value={validation.values.first_name || ""}
                                invalid={
                                    validation.touched.first_name && validation.errors.first_name ? true : false
                                }
                            />
                            {validation.touched.first_name && validation.errors.first_name ? (
                                <FormFeedback type="invalid"><div>{validation.errors.first_name}</div></FormFeedback>
                            ) : null}

                        </div>

                        <div className="mb-3 animate-fade-in-up delay-300">
                            <Label htmlFor="userpassword" className="form-label">Contraseña <span className="text-danger">*</span></Label>
                            <Input
                                name="password"
                                type="password"
                                placeholder="Ingresa tu contraseña"
                                onChange={validation.handleChange}
                                onBlur={validation.handleBlur}
                                value={validation.values.password || ""}
                                invalid={
                                    validation.touched.password && validation.errors.password ? true : false
                                }
                            />
                            {validation.touched.password && validation.errors.password ? (
                                <FormFeedback type="invalid"><div>{validation.errors.password}</div></FormFeedback>
                            ) : null}

                        </div>

                        <div className="mb-2 animate-fade-in-up delay-400">
                            <Label htmlFor="confirmPassword" className="form-label">Confirmar Contraseña <span className="text-danger">*</span></Label>
                            <Input
                                name="confirm_password"
                                type="password"
                                placeholder="Confirmar Contraseña"
                                onChange={validation.handleChange}
                                onBlur={validation.handleBlur}
                                value={validation.values.confirm_password || ""}
                                invalid={
                                    validation.touched.confirm_password && validation.errors.confirm_password ? true : false
                                }
                            />
                            {validation.touched.confirm_password && validation.errors.confirm_password ? (
                                <FormFeedback type="invalid"><div>{validation.errors.confirm_password}</div></FormFeedback>
                            ) : null}

                        </div>

                        <div className="mb-4 animate-fade-in-up delay-400">
                            <p className="mb-0 fs-12 text-muted fst-italic">Al registrarte aceptas las <Link to="#" className="text-primary text-decoration-underline fst-normal fw-medium">Condiciones de Uso</Link></p>
                        </div>

                        <div className="mt-4 animate-fade-in-up delay-400">
                            <Button disabled={loader} className="btn-submit-premium w-100" type="submit">
                                {loader ? (
                                    <span className="d-flex align-items-center justify-content-center">
                                        <Spinner size="sm" className='me-2'> Cargando... </Spinner>
                                        <span>Cargando...</span>
                                    </span>
                                ) : (
                                    <span>Registrarse</span>
                                )}
                            </Button>
                        </div>
                    </Form>
                </div>

                <div className="mt-4 text-center animate-fade-in-up delay-400">
                    <p className="mb-0">¿Ya tienes una cuenta? <Link to="/login" className="fw-semibold text-primary text-decoration-underline"> Iniciar Sesión </Link> </p>
                </div>
            </CoverAuth>
        </React.Fragment>
    );
};

export default Register;
