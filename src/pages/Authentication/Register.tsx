import React, { useEffect, useState, useRef } from "react";
import { Alert, Input, Label, Form, FormFeedback, Button, Spinner } from "reactstrap";
import { AnimatePresence, motion } from "framer-motion";
import * as Yup from "yup";
import { useFormik } from "formik";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { registerUser, resetRegisterFlag, loginUser } from "../../slices/thunks";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import CoverAuth from "../AuthenticationInner/CoverAuth";
import { createSelector } from "reselect";

const Register = () => {
    const history = useNavigate();
    const dispatch: any = useDispatch();
    const [loader, setLoader] = useState<boolean>(false);
    const [step, setStep] = useState<number>(1);
    
    // Auto-login logic tracker
    const [justRegistered, setJustRegistered] = useState(false);
    const [registeredCredentials, setRegisteredCredentials] = useState<any>(null);

    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const confirmPasswordRef = useRef<HTMLInputElement>(null);

    // Auto focus when step changes
    useEffect(() => {
        if (step === 1) setTimeout(() => emailRef.current?.focus(), 100);
        if (step === 2) setTimeout(() => passwordRef.current?.focus(), 100);
        if (step === 3) setTimeout(() => confirmPasswordRef.current?.focus(), 100);
    }, [step]);

    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            email: '',
            first_name: 'Nuevo Usuario',
            password: '',
            confirm_password: ''
        },
        validationSchema: Yup.object({
            email: Yup.string().email("Debe ser un correo válido").required("Por favor ingresa tu correo electrónico"),
            password: Yup.string().min(6, "Debe tener al menos 6 caracteres").required("Por favor ingresa tu contraseña"),
            confirm_password: Yup.string()
                .oneOf([Yup.ref('password'), ""], "Las contraseñas deben coincidir")
                .required('Por favor confirma tu contraseña')
        }),
        onSubmit: (values) => {
            setRegisteredCredentials(values);
            setJustRegistered(true);
            setLoader(true);
            dispatch(registerUser(values));
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
    const { error, success, errorMsg } = useSelector(registerdatatype);

    useEffect(() => {
        if (success && justRegistered && registeredCredentials) {
            // Auto login!
            toast.success("Registro exitoso. Iniciando sesión...", { position: "top-right" });
            setJustRegistered(false);
            // Delay to allow toast to show, then login
            setTimeout(() => {
                dispatch(loginUser(registeredCredentials, history, true));
            }, 1000);
        }
        if (error) {
            setLoader(false);
            setJustRegistered(false);
        }
        setTimeout(() => { dispatch(resetRegisterFlag()); }, 3000);
    }, [dispatch, success, error, history, justRegistered, registeredCredentials]);

    document.title = "Registrarse | Luma - Gestión de Proyectos";

    const nextStep = () => {
        if (step === 1) {
            if (!validation.values.email || validation.errors.email) {
                validation.setFieldTouched('email', true);
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!validation.values.password || validation.errors.password) {
                validation.setFieldTouched('password', true);
                return;
            }
            setStep(3);
        }
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    const slideVariants = {
        enter: (direction: number) => ({ x: direction > 0 ? 30 : -30, opacity: 0 }),
        center: { zIndex: 1, x: 0, opacity: 1 },
        exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 30 : -30, opacity: 0 })
    };

    return (
        <React.Fragment>
            <CoverAuth title="Crear Cuenta Nueva" subtitle="Crea tu cuenta en 3 sencillos pasos">
                <ToastContainer autoClose={2000} limit={1} />
                
                {error && error ? (
                    <Alert color="danger"><div>
                        {typeof errorMsg === 'string' ? errorMsg : (errorMsg?.error || "El registro falló. Por favor, verifica tus datos.")} </div></Alert>
                ) : null}

                <div className="p-2 mt-4 overflow-hidden">
                    <div className="d-flex justify-content-between mb-4">
                        <div className={`fw-bold ${step >= 1 ? 'text-primary' : 'text-muted'}`}>1. Correo</div>
                        <div className={`fw-bold ${step >= 2 ? 'text-primary' : 'text-muted'}`}>2. Contraseña</div>
                        <div className={`fw-bold ${step >= 3 ? 'text-primary' : 'text-muted'}`}>3. Confirmar</div>
                    </div>

                    <Form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (step === 3) validation.handleSubmit();
                            else nextStep();
                            return false;
                        }}
                        className="needs-validation position-relative" style={{ minHeight: '180px' }} action="#">
                        
                        <AnimatePresence mode="wait" custom={1}>
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    custom={1}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="mb-3">
                                        <Label htmlFor="useremail" className="form-label">Correo Electrónico <span className="text-danger">*</span></Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            innerRef={emailRef}
                                            className="form-control"
                                            placeholder="Ingresa tu dirección de correo"
                                            type="email"
                                            onChange={validation.handleChange}
                                            onBlur={validation.handleBlur}
                                            value={validation.values.email || ""}
                                            invalid={validation.touched.email && validation.errors.email ? true : false}
                                        />
                                        {validation.touched.email && validation.errors.email ? (
                                            <FormFeedback type="invalid"><div>{validation.errors.email as string}</div></FormFeedback>
                                        ) : null}
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    custom={1}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="mb-3">
                                        <Label htmlFor="userpassword" className="form-label">Contraseña <span className="text-danger">*</span></Label>
                                        <Input
                                            name="password"
                                            innerRef={passwordRef}
                                            type="password"
                                            placeholder="Ingresa tu contraseña"
                                            onChange={validation.handleChange}
                                            onBlur={validation.handleBlur}
                                            value={validation.values.password || ""}
                                            invalid={validation.touched.password && validation.errors.password ? true : false}
                                        />
                                        {validation.touched.password && validation.errors.password ? (
                                            <FormFeedback type="invalid"><div>{validation.errors.password as string}</div></FormFeedback>
                                        ) : null}
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    custom={1}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="mb-2">
                                        <Label htmlFor="confirmPassword" className="form-label">Confirmar Contraseña <span className="text-danger">*</span></Label>
                                        <Input
                                            name="confirm_password"
                                            innerRef={confirmPasswordRef}
                                            type="password"
                                            placeholder="Confirmar Contraseña"
                                            onChange={validation.handleChange}
                                            onBlur={validation.handleBlur}
                                            value={validation.values.confirm_password || ""}
                                            invalid={validation.touched.confirm_password && validation.errors.confirm_password ? true : false}
                                        />
                                        {validation.touched.confirm_password && validation.errors.confirm_password ? (
                                            <FormFeedback type="invalid"><div>{validation.errors.confirm_password as string}</div></FormFeedback>
                                        ) : null}
                                    </div>
                                    <div className="mb-4">
                                        <p className="mb-0 fs-12 text-muted fst-italic">Al registrarte aceptas las <Link to="#" className="text-primary text-decoration-underline fst-normal fw-medium">Condiciones de Uso</Link></p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="d-flex justify-content-between mt-4">
                            {step > 1 ? (
                                <Button type="button" color="light" onClick={prevStep} disabled={loader}>
                                    <i className="ri-arrow-left-line align-middle me-1"></i> Atrás
                                </Button>
                            ) : <div></div>}
                            
                            {step < 3 ? (
                                <Button type="button" className="btn-submit-premium" onClick={nextStep}>
                                    Siguiente <i className="ri-arrow-right-line align-middle ms-1"></i>
                                </Button>
                            ) : (
                                <Button disabled={loader} className="btn-submit-premium" type="submit">
                                    {loader ? (
                                        <span className="d-flex align-items-center justify-content-center">
                                            <Spinner size="sm" className='me-2'> Cargando... </Spinner>
                                            <span>Registrando...</span>
                                        </span>
                                    ) : (
                                        <span>Crear Cuenta <i className="ri-check-line align-middle ms-1"></i></span>
                                    )}
                                </Button>
                            )}
                        </div>
                    </Form>
                </div>

                <div className="mt-4 text-center">
                    <p className="mb-0">¿Ya tienes una cuenta? <Link to="/login" className="fw-semibold text-primary text-decoration-underline"> Iniciar Sesión </Link> </p>
                </div>
            </CoverAuth>
        </React.Fragment>
    );
};

export default Register;
