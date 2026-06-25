import React from "react";
import { Navigate } from "react-router-dom";

const Starter = React.lazy(() => import("../pages/Starter"));
const Basic404 = React.lazy(() => import('../pages/AuthenticationInner/Errors/Basic404'));
const Cover404 = React.lazy(() => import('../pages/AuthenticationInner/Errors/Cover404'));
const Alt404 = React.lazy(() => import('../pages/AuthenticationInner/Errors/Alt404'));
const Error500 = React.lazy(() => import('../pages/AuthenticationInner/Errors/Error500'));
const Offlinepage = React.lazy(() => import("../pages/AuthenticationInner/Errors/Offlinepage"));
const Login = React.lazy(() => import("../pages/Authentication/Login"));
const ForgetPasswordPage = React.lazy(() => import("../pages/Authentication/ForgetPassword"));
const Logout = React.lazy(() => import("../pages/Authentication/Logout"));
const Register = React.lazy(() => import("../pages/Authentication/Register"));
const UserProfile = React.lazy(() => import("../pages/Authentication/user-profile"));
const Projects = React.lazy(() => import("../pages/Projects"));
const Planning = React.lazy(() => import("../pages/Planning"));
const Kanban = React.lazy(() => import("../pages/Kanban"));
const Analytics = React.lazy(() => import("../pages/Analytics"));
const UserManagement = React.lazy(() => import("../pages/Users"));
const Chat = React.lazy(() => import("../pages/Chat"));


const authProtectedRoutes = [
  { path: "/home", component: <Starter /> },
  { path: "/projects", component: <Projects /> },
  { path: "/chat", component: <Chat /> },
  { path: "/planning", component: <Planning /> },
  { path: "/kanban", component: <Kanban /> },
  { path: "/analytics", component: <Analytics /> },
  { path: "/users", component: <UserManagement /> },

  //User Profile
  { path: "/profile", component: <UserProfile /> },


  // this route should be at the end of all other routes
  // eslint-disable-next-line react/display-name
  {
    path: "/",
    exact: true,
    component: <Navigate to="/home" />,
  },
  { path: "*", component: <Navigate to="/home" /> },
];

const publicRoutes = [
  // Authentication Page
  { path: "/logout", component: <Logout /> },
  { path: "/login", component: <Login /> },
  { path: "/forgot-password", component: <ForgetPasswordPage /> },
  { path: "/register", component: <Register /> },

  { path: "/auth-404-basic", component: <Basic404 /> },
  { path: "/auth-404-cover", component: <Cover404 /> },
  { path: "/auth-404-alt", component: <Alt404 /> },
  { path: "/auth-500", component: <Error500 /> },
  { path: "/auth-offline", component: <Offlinepage /> },

];

export { authProtectedRoutes, publicRoutes };