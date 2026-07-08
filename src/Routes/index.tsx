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
    const location = useLocation();

    return (
        <React.Fragment>
            <Suspense fallback={<div className="d-flex justify-content-center mx-2 mt-2"><Spinner color="primary">Cargando...</Spinner></div>}>
            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    <Route>
                        {publicRoutes.map((route, idx) => (
                            <Route
                                path={route.path}
                                element={
                                    <PageTransition>
                                        <NonAuthLayout>
                                            {route.component}
                                        </NonAuthLayout>
                                    </PageTransition>
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
                                        <PageTransition>
                                            <VerticalLayout>{route.component}</VerticalLayout>
                                        </PageTransition>
                                    </AuthProtected>
                                }
                                key={idx}
                            />
                        ))}
                    </Route>
                </Routes>
            </AnimatePresence>
            </Suspense>
        </React.Fragment>
    );
};

export default Index;