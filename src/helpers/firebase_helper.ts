// Firebase helper stub - Firebase is not used in this project (using JWT auth).
// This file exports the required functions as no-ops to prevent import errors.

class FirebaseAuthBackend {
  constructor(_firebaseConfig: any) {}
  registerUser = (_email: any, _password: any) => Promise.reject("Firebase not configured");
  editProfileAPI = (_username: any, _idx: any) => Promise.reject("Firebase not configured");
  loginUser = (_email: any, _password: any) => Promise.reject("Firebase not configured");
  forgetPassword = (_email: any): Promise<boolean> => Promise.reject("Firebase not configured");
  logout = (): Promise<boolean> => Promise.reject("Firebase not configured");
  socialLoginUser = async (_type: any) => { throw new Error("Firebase not configured"); };
  setLoggeedInUser = (_user: any) => {};
  getAuthenticatedUser = () => null;
}

let _fireBaseBackend: FirebaseAuthBackend | null = null;

const initFirebaseBackend = (config: any): FirebaseAuthBackend => {
  if (!_fireBaseBackend) {
    _fireBaseBackend = new FirebaseAuthBackend(config);
  }
  return _fireBaseBackend;
};

const getFirebaseBackend = (): FirebaseAuthBackend | null => {
  return _fireBaseBackend;
};

export { initFirebaseBackend, getFirebaseBackend };
