import React, { Suspense } from 'react';
import { Routes, Route } from "react-router-dom";
import { Spinner } from 'reactstrap';

//Layouts
import NonAuthLayout from "../Layouts/NonAuthLayout";
import VerticalLayout from "../Layouts/index";

//routes
import { authProtectedRoutes, publicRoutes } from "./allRoutes";
import AuthProtected  from './AuthProtected';

const Index = () => {
    return (
        <React.Fragment>
            <Suspense fallback={<div className="d-flex justify-content-center mx-2 mt-2"><Spinner color="primary">Cargando...</Spinner></div>}>
            <Routes>
                <Route>
                    {publicRoutes.map((route, idx) => (
                        <Route
                            path={route.path}
                            element={
                                <NonAuthLayout>
                                    {route.component}
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
                                    <VerticalLayout>{route.component}</VerticalLayout>
                                </AuthProtected>}
                            key={idx}
                        />
                    ))}
                </Route>
            </Routes>
            </Suspense>
        </React.Fragment>
    );
};

export default Index;