import React, { Suspense } from 'react';
import { Routes, Route, useLocation } from "react-router-dom";
import { Spinner } from 'reactstrap';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '../Components/Common/PageTransition';

//Layouts
import NonAuthLayout from "../Layouts/NonAuthLayout";
import VerticalLayout from "../Layouts/index";

//routes
import { authProtectedRoutes, publicRoutes } from "./allRoutes";
import AuthProtected  from './AuthProtected';

const Index = () => {
    return (
        <React.Fragment>
            <Routes>
                <Route>
                    {publicRoutes.map((route, idx) => (
                        <Route
                            path={route.path}
                            element={
                                <NonAuthLayout>
                                    <PageTransition key={route.path}>
                                        <Suspense fallback={<div className="d-flex justify-content-center mx-2 mt-2"><Spinner color="primary">Cargando...</Spinner></div>}>
                                            {route.component}
                                        </Suspense>
                                    </PageTransition>
                                </NonAuthLayout>
                            }
                            key={idx}
                        />
                    ))}
                </Route>

                <Route>
                    {authProtectedRoutes.map((route, idx) => (
                        <Route
                            path={route.path}
                            element={
                                <AuthProtected>
                                    <VerticalLayout>
                                        <PageTransition key={route.path}>
                                            <Suspense fallback={<div className="page-content d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}><Spinner color="primary" /></div>}>
                                                {route.component}
                                            </Suspense>
                                        </PageTransition>
                                    </VerticalLayout>
                                </AuthProtected>
                            }
                            key={idx}
                        />
                    ))}
                </Route>
            </Routes>
        </React.Fragment>
    );
};

export default Index;