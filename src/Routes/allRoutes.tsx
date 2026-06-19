import React from "react";
import { Navigate } from "react-router-dom";

//Dashboard
//Starter
import Starter from "../pages/Starter";

import Basic404 from '../pages/AuthenticationInner/Errors/Basic404';
import Cover404 from '../pages/AuthenticationInner/Errors/Cover404';
import Alt404 from '../pages/AuthenticationInner/Errors/Alt404';
import Error500 from '../pages/AuthenticationInner/Errors/Error500';
import Offlinepage from "../pages/AuthenticationInner/Errors/Offlinepage";

// //login
import Login from "../pages/Authentication/Login";
import ForgetPasswordPage from "../pages/Authentication/ForgetPassword";
import Logout from "../pages/Authentication/Logout";
import Register from "../pages/Authentication/Register";

import UserProfile from "../pages/Authentication/user-profile";

// Scrum pages
import Projects from "../pages/Projects";
import Planning from "../pages/Planning";
import Kanban from "../pages/Kanban";
import Analytics from "../pages/Analytics";
import UserManagement from "../pages/Users";


const authProtectedRoutes = [
  { path: "/home", component: <Starter /> },
  { path: "/projects", component: <Projects /> },
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