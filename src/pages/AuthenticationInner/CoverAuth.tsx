import React from 'react';
import { Card, Col, Container, Row } from 'reactstrap';
import { Link } from 'react-router-dom';
import withRouter from '../../Components/Common/withRouter';
import logoLight from "../../assets/images/logo-light.png";
import "../Authentication/LoginVelzon.css";

const CoverAuth = ({ children, title, subtitle }: any) => {
    return (
        <React.Fragment>
            <div className="auth-page-wrapper auth-bg-cover py-5 d-flex justify-content-center align-items-center min-vh-100">
                <div className="bg-overlay"></div>
                <div className="auth-page-content overflow-hidden p-0">
                    <Container>
                        <Row className="justify-content-center">
                            <Col lg={11}>
                                <Card className="overflow-hidden card-bg-fill border-0 shadow-lg m-0">
                                    <Row className="g-0">
                                        <Col lg={6} className="d-none d-lg-block">
                                            <div className="p-lg-5 p-4 auth-one-bg h-100 d-flex flex-column justify-content-between" style={{ minHeight: "500px" }}>
                                                <div className="bg-overlay"></div>
                                                <div className="position-relative h-100 d-flex flex-column justify-content-between">
                                                    <div className="mb-4">
                                                        <Link to="/" className="d-block">
                                                            <img src={logoLight} alt="Luma Logo" height="24" />
                                                        </Link>
                                                    </div>
                                                    <div className="my-auto text-white">
                                                        <h2 className="text-white fw-bold mb-3 lh-base">
                                                            Gestión ágil e inteligente <br /> para tus proyectos
                                                        </h2>
                                                        <p className="fs-15 text-white-75 mb-0">
                                                            Planifica sprints, haz seguimiento de tareas y visualiza el progreso en tiempo real con una interfaz moderna y eficiente.
                                                        </p>
                                                    </div>
                                                    <div className="mt-4">
                                                        <p className="mb-0 text-white-50">&copy; {new Date().getFullYear()} Luma. Crafted with <i className="mdi mdi-heart text-danger"></i></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>
                                        <Col lg={6}>
                                            <div className="p-lg-5 p-4 h-100 d-flex flex-column justify-content-center">
                                                <div className="text-center mb-4">
                                                    <Link to="/" className="d-inline-block auth-logo mb-3 d-lg-none">
                                                        <img src={logoLight} alt="Luma Logo" height="20" />
                                                    </Link>
                                                    <h4 className="text-primary">{title}</h4>
                                                    <p className="text-muted">{subtitle}</p>
                                                </div>
                                                {children}
                                            </div>
                                        </Col>
                                    </Row>
                                </Card>
                            </Col>
                        </Row>
                    </Container>
                </div>
            </div>
        </React.Fragment>
    );
};

export default withRouter(CoverAuth);
