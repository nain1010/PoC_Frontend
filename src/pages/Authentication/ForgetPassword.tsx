import PropTypes from "prop-types";
import React from "react";
import { Alert, FormFeedback, Input, Label, Form } from "reactstrap";

//redux
import { useSelector, useDispatch } from "react-redux";

import { Link } from "react-router-dom";
import withRouter from "../../Components/Common/withRouter";

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

// action
import { userForgetPassword } from "../../slices/thunks";

// import images
// import profile from "../../assets/images/bg.png";

import CoverAuth from "../AuthenticationInner/CoverAuth";
import { createSelector } from "reselect";

const ForgetPasswordPage = (props : any) => {
  const dispatch : any = useDispatch();

  const validation : any = useFormik({
    // enableReinitialize : use this flag when initial values needs to be changed
    enableReinitialize: true,

    initialValues: {
      email: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().required("Por favor ingresa tu correo electrónico"),
    }),
    onSubmit: (values) => {
      dispatch(userForgetPassword(values, props.router.navigate));
    }
  });


  const selectLayoutState = (state : any) => state.ForgetPassword;
  const selectLayoutProperties = createSelector(
    selectLayoutState,
    (state) => ({
      forgetError: state.forgetError,
      forgetSuccessMsg: state.forgetSuccessMsg,
    })
  );
  // Inside your component
  const {
    forgetError, forgetSuccessMsg
  } = useSelector(selectLayoutProperties);

  document.title = "Restablecer Contraseña | Luma - Gestión de Proyectos";
  return (
    <CoverAuth title="¿Olvidaste tu contraseña?" subtitle="Restablece tu contraseña con Luma">
      <div className="text-center">
        <i className="ri-mail-send-line display-5 text-success mb-3 d-inline-block"></i>
      </div>

      <Alert className="border-0 alert-warning text-center mb-2 mx-2" role="alert">
        ¡Ingresa tu correo y te enviaremos las instrucciones de restablecimiento!
      </Alert>
      <div className="p-2">
        {forgetError && forgetError ? (
          <Alert color="danger" style={{ marginTop: "13px" }}>
            {forgetError}
          </Alert>
        ) : null}
        {forgetSuccessMsg ? (
          <Alert color="success" style={{ marginTop: "13px" }}>
            {forgetSuccessMsg}
          </Alert>
        ) : null}
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            validation.handleSubmit();
            return false;
          }}
        >
          <div className="mb-4">
            <Label className="form-label">Correo Electrónico</Label>
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
              <FormFeedback type="invalid"><div>{validation.errors.email}</div></FormFeedback>
            ) : null}
          </div>

          <div className="text-center mt-4">
            <button className="btn-submit-premium w-100" type="submit">Enviar enlace de restablecimiento</button>
          </div>
        </Form>
      </div>

      <div className="mt-4 text-center">
        <p className="mb-0">Espera, ya recuerdo mi contraseña... <Link to="/login" className="fw-semibold text-primary text-decoration-underline"> Inicia sesión </Link> </p>
      </div>
    </CoverAuth>
  );
};

ForgetPasswordPage.propTypes = {
  history: PropTypes.object,
};

export default withRouter(ForgetPasswordPage);
