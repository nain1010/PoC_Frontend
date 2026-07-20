import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import config from "../config";
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

const { api } = config;

// default
axios.defaults.baseURL = api.API_URL;
// content type
axios.defaults.headers.post["Content-Type"] = "application/json";

// content type
const authUser: any = (sessionStorage.getItem("authUser") || localStorage.getItem("authUser"))
const token = JSON.parse(authUser) ? JSON.parse(authUser).token : null;
if (token)
  axios.defaults.headers.common["Authorization"] = "Bearer " + token;

// intercepting to capture errors
axios.interceptors.response.use(
  function (response) {
    return response.data ? response.data : response;
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    let message = "";

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      // Extract specific error details from the backend response body
      if (data && typeof data === 'object') {
        if (data.error) {
          message = data.error;
        } else if (data.detail) {
          if (Array.isArray(data.detail)) {
            message = data.detail.map((d: any) => typeof d === 'string' ? d : (d.message || JSON.stringify(d))).join(", ");
          } else {
            message = data.detail;
          }
        } else if (data.message) {
          message = data.message;
        } else if (data.extra && Array.isArray(data.extra)) {
          message = data.extra.map((e: any) => e.message || JSON.stringify(e)).join(", ");
        }
      } else if (typeof data === 'string') {
        message = data;
      }

      // Fallback if no specific message is extracted from backend payload
      if (!message) {
        switch (status) {
          case 400:
            message = "Solicitud incorrecta (Error 400).";
            break;
          case 401:
            message = "No autorizado o sesión expirada.";
            break;
          case 403:
            message = "No tienes permisos para realizar esta acción.";
            break;
          case 404:
            message = "Lo sentimos, el recurso solicitado no fue encontrado.";
            break;
          case 500:
            message = "Error interno del servidor. Inténtalo más tarde.";
            break;
          default:
            message = error.message || `Error del servidor (${status})`;
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      message = "No se recibió respuesta del servidor. Verifica tu conexión.";
    } else {
      // Something happened in setting up the request
      message = error.message || "Error al procesar la solicitud.";
    }

    // Si es un error 403 al intentar LEER un proyecto específico, limpiar el proyecto activo del localStorage
    // porque el usuario actual no tiene permisos (probablemente heredado de otra sesión).
    // NOTA: Restringido solo a GET /projects/{id} para evitar sacarlo de la vista si un desarrollador 
    // recibe 403 al intentar crear una historia o activar un sprint.
    if (
      error.response?.status === 403 && 
      error.config?.method === 'get' && 
      error.config?.url?.match(/^\/?projects\/[^\/]+$/)
    ) {
      localStorage.removeItem("luma-project-storage");
      localStorage.removeItem("activeProjectName");
      localStorage.removeItem("activeProjectRole");
      window.dispatchEvent(new Event("activeProjectUpdated"));
    }

    // Eliminar SweetAlerts gigantes
    if (error.response?.status === 401) {
      // Redirigir a login solo si no estamos ya en login/register
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register') {
        window.location.href = '/login';
      }
    } else if (message) {
      toast.error(message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
    }

    return Promise.reject(message);
  }
);
/**
 * Sets the default authorization
 * @param {*} token
 */
const setAuthorization = (token : string) => {
  axios.defaults.headers.common["Authorization"] = "Bearer " + token;
};

const apiClient = {
  get: (url: string, params?: any): Promise<any> => {
    let paramKeys: string[] = [];
    if (params) {
      Object.keys(params).map(key => {
        paramKeys.push(key + '=' + params[key]);
        return paramKeys;
      });
      const queryString = paramKeys.length ? paramKeys.join('&') : "";
      return axios.get(`${url}?${queryString}`, params);
    }
    return axios.get(`${url}`, params);
  },

  create: (url: string, data: any): Promise<any> => {
    return axios.post(url, data);
  },

  post: (url: string, data: any, config?: AxiosRequestConfig): Promise<any> => {
    return axios.post(url, data, config);
  },

  update: (url: string, data: any): Promise<any> => {
    return axios.patch(url, data);
  },

  put: (url: string, data: any): Promise<any> => {
    return axios.put(url, data);
  },

  delete: (url: string, config?: AxiosRequestConfig): Promise<any> => {
    return axios.delete(url, { ...config });
  },
};

const getLoggedinUser = () => {
  const user = (sessionStorage.getItem("authUser") || localStorage.getItem("authUser"));
  if (!user) {
    return null;
  } else {
    return JSON.parse(user);
  }
};

export { apiClient as APIClient, setAuthorization, getLoggedinUser };