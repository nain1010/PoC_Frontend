import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Spinner,
  Alert,
  Button,
  Input,
  Label,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";

import defaultAvatar from "../../assets/images/users/avatar-1.jpg";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import AvatarCropper from "../../Components/Common/AvatarCropper";
import { APIClient } from "../../helpers/api_helper";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ILLUSTRATIONS = [
  {
    name: "Cohete Espacial",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%"><defs><linearGradient id="illg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f093fb"/><stop offset="100%" stop-color="#f5576c"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#illg1)"/><path d="M50 20 C50 20 62 38 62 55 C62 65 58 70 50 70 C42 70 38 65 38 55 C38 38 50 20 50 20 Z" fill="#ffffff"/><path d="M50 70 L50 80 L46 76 Z" fill="#ffdde1"/><path d="M50 70 L50 80 L54 76 Z" fill="#ffdde1"/><circle cx="50" cy="42" r="5" fill="#f093fb"/><path d="M38 60 C32 64 34 74 34 74 C34 74 44 72 40 64" fill="#ffffff" opacity="0.8"/><path d="M62 60 C68 64 66 74 66 74 C66 74 56 72 60 64" fill="#ffffff" opacity="0.8"/></svg>`
  },
  {
    name: "Montaña",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%"><defs><linearGradient id="illg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#5ee7df"/><stop offset="100%" stop-color="#b490ca"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#illg2)"/><circle cx="65" cy="35" r="8" fill="#ffffff" opacity="0.9"/><path d="M20 75 L45 35 L60 58 L75 42 L90 75 Z" fill="#ffffff"/><path d="M45 35 L50 43 L42 47 L38 42 Z" fill="#b490ca" opacity="0.3"/><path d="M75 42 L79 50 L71 54 L68 49 Z" fill="#b490ca" opacity="0.3"/></svg>`
  },
  {
    name: "Código",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%"><defs><linearGradient id="illg3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f6d365"/><stop offset="100%" stop-color="#fda085"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#illg3)"/><path d="M35 38 L20 50 L35 62 M65 38 L80 50 L65 62 M55 30 L45 70" stroke="#ffffff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`
  },
  {
    name: "Planeta",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%"><defs><linearGradient id="illg4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#a1c4fd"/><stop offset="100%" stop-color="#c2e9fb"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#illg4)"/><circle cx="50" cy="50" r="20" fill="#ffffff"/><ellipse cx="50" cy="50" rx="32" ry="7" fill="none" stroke="#ffffff" stroke-width="4" transform="rotate(-15 50 50)"/><circle cx="32" cy="30" r="3" fill="#ffffff" opacity="0.6"/><circle cx="70" cy="65" r="2" fill="#ffffff" opacity="0.8"/></svg>`
  },
  {
    name: "Bombilla",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%"><defs><linearGradient id="illg5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#84fab0"/><stop offset="100%" stop-color="#8fd3f4"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#illg5)"/><path d="M50 22 C37 22 32 32 32 45 C32 54 39 58 41 64 L59 64 C61 58 68 54 68 45 C68 32 63 22 50 22 Z" fill="#ffffff"/><path d="M42 68 L58 68 M44 73 L56 73 M47 78 L53 78" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/><line x1="50" y1="12" x2="50" y2="16" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/><line x1="22" y1="35" x2="26" y2="37" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/><line x1="78" y1="35" x2="74" y2="37" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/></svg>`
  },
  {
    name: "Café",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%"><defs><linearGradient id="illg6" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#a8c0ff"/><stop offset="100%" stop-color="#3f2b96"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#illg6)"/><path d="M30 45 L70 45 C70 62 58 68 50 68 C42 68 30 62 30 45 Z" fill="#ffffff"/><path d="M70 50 C76 50 78 58 70 60" stroke="#ffffff" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M40 35 Q44 25 40 18 M50 35 Q54 25 50 18 M60 35 Q64 25 60 18" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round"/><line x1="25" y1="74" x2="75" y2="74" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/></svg>`
  },
  {
    name: "Libro",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%"><defs><linearGradient id="illg7" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fa709a"/><stop offset="100%" stop-color="#fee140"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#illg7)"/><path d="M18 64 C28 58 45 60 50 68 C55 60 72 58 82 64 L82 36 C72 30 55 32 50 40 C45 32 28 30 18 36 Z" fill="#ffffff"/><line x1="50" y1="40" x2="50" y2="68" stroke="#fee140" stroke-width="3"/></svg>`
  },
  {
    name: "Arte",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%"><defs><linearGradient id="illg8" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4facfe"/><stop offset="100%" stop-color="#00f2fe"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#illg8)"/><path d="M50 20 C32 20 20 30 20 48 C20 65 34 76 52 76 C65 76 80 66 80 48 C80 32 68 20 50 20 Z" fill="#ffffff"/><circle cx="38" cy="35" r="4" fill="#ff4b5c"/><circle cx="50" cy="32" r="4" fill="#ffcd3c"/><circle cx="62" cy="38" r="4" fill="#3ddc97"/><circle cx="64" cy="52" r="4" fill="#00d2fc"/><circle cx="34" cy="52" r="6" fill="#4facfe"/></svg>`
  },
  {
    name: "Scrum",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%"><defs><linearGradient id="illg9" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#30cfd0"/><stop offset="100%" stop-color="#330867"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#illg9)"/><path d="M30 50 C20 40 20 30 30 30 C40 30 45 42 50 50 C55 58 60 70 70 70 C80 70 80 60 70 50 C60 40 55 30 45 30" stroke="#ffffff" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="50" cy="50" r="3" fill="#ffffff"/></svg>`
  }
];

const UserProfile = () => {
  const api = APIClient;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Photo Option Modal
  const [photoOptionModal, setPhotoOptionModal] = useState<boolean>(false);
  const togglePhotoOptionModal = () => setPhotoOptionModal(!photoOptionModal);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Password change modal
  const [passwordModal, setPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Name edit modal
  const [nameModal, setNameModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [updatingName, setUpdatingName] = useState(false);

  const toggleNameModal = () => {
    setNameModal(!nameModal);
    setNewName(userData?.nombre_completo || "");
  };

  const handleChangeName = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error("El nombre completo no puede estar vacío.", { position: "top-right" });
      return;
    }
    setUpdatingName(true);
    try {
      await api.put("/me/profile", { nombre_completo: trimmed });
      
      const authUser = (sessionStorage.getItem("authUser") || localStorage.getItem("authUser"));
      if (authUser) {
        const obj = JSON.parse(authUser);
        obj.nombre_completo = trimmed;
        sessionStorage.setItem("authUser", JSON.stringify(obj));
        window.dispatchEvent(new Event("activeProjectUpdated"));
      }
      
      toggleNameModal();
      fetchProfile();
      toast.success("Nombre actualizado exitosamente.", { position: "top-right" });
    } catch (err: any) {
      toast.error(err || "Error al actualizar el nombre.", { position: "top-right" });
    } finally {
      setUpdatingName(false);
    }
  };

  // Avatar cropper
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState("");

  const togglePasswordModal = () => {
    setPasswordModal(!passwordModal);
    setNewPassword("");
    setConfirmPassword("");
  };

  const fetchProfile = async () => {
    try {
      const data: any = await api.get("/me");
      setUserData(data);
    } catch (err: any) {
      setError(err || "Error al cargar el perfil.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleAvatarClick = () => {
    togglePhotoOptionModal();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten archivos de imagen.", { position: "top-right" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede ser mayor a 5MB.", { position: "top-right" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be selected again
    e.target.value = "";
  };

  const handleCroppedSave = async (croppedBase64: string) => {
    setCropperOpen(false);
    try {
      await api.put("/me/avatar", { avatar_url: croppedBase64 });

      // Update sessionStorage
      const authUser = (sessionStorage.getItem("authUser") || localStorage.getItem("authUser"));
      if (authUser) {
        const obj = JSON.parse(authUser);
        obj.avatar_url = croppedBase64;
        sessionStorage.setItem("authUser", JSON.stringify(obj));
        window.dispatchEvent(new Event("avatarUpdated"));
      }

      setUserData((prev: any) => ({ ...prev, avatar_url: croppedBase64 }));
    } catch (err: any) {
      toast.error(err || "Error al subir la foto.", { position: "top-right" });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 4) {
      toast.error("La contraseña debe tener al menos 4 caracteres.", { position: "top-right" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.", { position: "top-right" });
      return;
    }
    setChangingPassword(true);
    try {
      await api.put("/me/password", { new_password: newPassword });
      togglePasswordModal();
      fetchProfile();
    } catch (err: any) {
      toast.error(err || "Error al cambiar la contraseña.", { position: "top-right" });
    } finally {
      setChangingPassword(false);
    }
  };

  document.title = "Mi Perfil | Gestión de Proyectos";

  const userName = userData?.nombre_completo || "Usuario";
  const names = userName.split(" ");
  const initials = names.map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Mi Perfil" />

          {loading ? (
            <div className="text-center my-5">
              <Spinner color="primary" />
              <p className="text-muted mt-2">Cargando perfil...</p>
            </div>
          ) : error ? (
            <Alert color="danger" className="text-center">{error}</Alert>
          ) : userData ? (
            <Row className="justify-content-center">
              <Col lg={8} xl={6}>
                <Card className="border-0 shadow-sm overflow-hidden">
                  {/* Header gradient */}
                  <div className="position-relative" style={{ height: "120px", background: "linear-gradient(135deg, #405189 0%, #0ab39c 100%)" }}>
                    <div className="position-absolute bottom-0 start-50 translate-middle-x" style={{ marginBottom: "-45px" }}>
                      <div className="position-relative" style={{ cursor: "pointer" }} onClick={handleAvatarClick}>
                        {userData?.avatar_url ? (
                          <img
                            src={userData.avatar_url}
                            alt="Perfil"
                            className="rounded-circle border border-4 border-white shadow"
                            style={{ width: "90px", height: "90px", objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            className="rounded-circle border border-4 border-white shadow bg-soft-primary text-primary d-flex align-items-center justify-content-center fw-bold fs-24"
                            style={{ width: "90px", height: "90px" }}
                          >
                            {initials}
                          </div>
                        )}
                        <div
                          className="position-absolute bottom-0 end-0 bg-primary rounded-circle d-flex align-items-center justify-content-center shadow"
                          style={{ width: "28px", height: "28px" }}
                        >
                          <i className="ri-camera-line text-white fs-14"></i>
                        </div>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="d-none"
                        onChange={handleFileSelect}
                      />
                    </div>
                  </div>

                  <CardBody className="pt-5 mt-3">
                    <div className="text-center mb-4">
                      <h4 className="fw-bold text-body mb-1">{userData.nombre_completo || "Usuario"}</h4>
                      <p className="text-muted fs-14 mb-1">{userData.email || ""}</p>
                      <span className="badge bg-soft-success text-success fs-12">{userData.rol_global || "Miembro"}</span>
                    </div>

                    <div className="border-top pt-4">
                      <Row className="g-3">
                        {/* Nombre */}
                        <Col xs={12}>
                          <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded">
                            <div className="d-flex align-items-center">
                              <div className="avatar-xs me-3">
                                <span className="avatar-title bg-soft-primary text-primary rounded-circle fs-16">
                                  <i className="ri-user-3-line"></i>
                                </span>
                              </div>
                              <div>
                                <p className="text-muted mb-0 fs-12">Nombre Completo</p>
                                <h6 className="mb-0 fw-semibold">{userData.nombre_completo || "—"}</h6>
                              </div>
                            </div>
                            <Button
                              color="light"
                              className="btn btn-sm btn-soft-primary ms-2"
                              onClick={toggleNameModal}
                              title="Editar Nombre"
                            >
                              <i className="ri-pencil-line fs-14"></i>
                            </Button>
                          </div>
                        </Col>

                        {/* Email */}
                        <Col xs={12}>
                          <div className="d-flex align-items-center p-3 bg-light rounded">
                            <div className="avatar-xs me-3">
                              <span className="avatar-title bg-soft-info text-info rounded-circle fs-16">
                                <i className="ri-mail-line"></i>
                              </span>
                            </div>
                            <div>
                              <p className="text-muted mb-0 fs-12">Correo Electrónico</p>
                              <h6 className="mb-0 fw-semibold">{userData.email || "—"}</h6>
                            </div>
                          </div>
                        </Col>

                        {/* Contraseña */}
                        <Col xs={12}>
                          <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded">
                            <div className="d-flex align-items-center">
                              <div className="avatar-xs me-3">
                                <span className="avatar-title bg-soft-danger text-danger rounded-circle fs-16">
                                  <i className="ri-lock-line"></i>
                                </span>
                              </div>
                              <div>
                                <p className="text-muted mb-0 fs-12">Contraseña</p>
                                <h6 className="mb-0 fw-semibold font-monospace">
                                  {showPassword ? userData.password : "••••••••"}
                                </h6>
                              </div>
                            </div>
                            <div className="d-flex gap-2">
                              <Button
                                color="soft-secondary"
                                size="sm"
                                className="px-2 py-1"
                                onClick={() => setShowPassword(!showPassword)}
                                title={showPassword ? "Ocultar" : "Mostrar"}
                              >
                                <i className={`ri-${showPassword ? 'eye-off' : 'eye'}-line fs-14`}></i>
                              </Button>
                              <Button
                                color="soft-primary"
                                size="sm"
                                className="px-2 py-1"
                                onClick={togglePasswordModal}
                                title="Cambiar contraseña"
                              >
                                <i className="ri-edit-line fs-14"></i>
                              </Button>
                            </div>
                          </div>
                        </Col>

                        {/* User ID */}
                        <Col xs={12}>
                          <div className="d-flex align-items-center p-3 bg-light rounded">
                            <div className="avatar-xs me-3">
                              <span className="avatar-title bg-soft-warning text-warning rounded-circle fs-16">
                                <i className="ri-fingerprint-line"></i>
                              </span>
                            </div>
                            <div>
                              <p className="text-muted mb-0 fs-12">ID de Usuario</p>
                              <h6 className="mb-0 fw-semibold font-monospace fs-12">{userData.id || "—"}</h6>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          ) : null}
        </Container>
      </div>

      {/* Avatar Cropper */}
      <AvatarCropper
        isOpen={cropperOpen}
        toggle={() => setCropperOpen(false)}
        imageSrc={rawImageSrc}
        onSave={handleCroppedSave}
      />

      {/* Change Password Modal */}
      <Modal isOpen={passwordModal} toggle={togglePasswordModal} centered>
        <ModalHeader toggle={togglePasswordModal} className="bg-light p-3">
          Cambiar Contraseña
        </ModalHeader>
        <ModalBody className="p-4">
          <div className="mb-3">
            <Label className="form-label">Nueva Contraseña <span className="text-danger">*</span></Label>
            <Input
              type="password"
              className="form-control"
              placeholder="Ingresa la nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <Label className="form-label">Confirmar Contraseña <span className="text-danger">*</span></Label>
            <Input
              type="password"
              className="form-control"
              placeholder="Repite la nueva contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <small className="text-danger">Las contraseñas no coinciden.</small>
            )}
          </div>
        </ModalBody>
        <ModalFooter className="bg-light">
          <Button color="light" onClick={togglePasswordModal} disabled={changingPassword}>Cancelar</Button>
          <Button
            color="primary"
            onClick={handleChangePassword}
            disabled={changingPassword || !newPassword || newPassword !== confirmPassword}
          >
            <span className="d-flex align-items-center gap-1">
                {changingPassword && <Spinner size="sm" />}
                <span>Guardar Contraseña</span>
            </span>
          </Button>
        </ModalFooter>
      </Modal>

      {/* Change Name Modal */}
      <Modal isOpen={nameModal} toggle={toggleNameModal} centered>
        <ModalHeader toggle={toggleNameModal} className="bg-light p-3">
          Editar Nombre Completo
        </ModalHeader>
        <ModalBody className="p-4">
          <div className="mb-3">
            <Label className="form-label">Nombre Completo <span className="text-danger">*</span></Label>
            <Input
              type="text"
              className="form-control"
              placeholder="Ingresa tu nombre completo"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
        </ModalBody>
        <ModalFooter className="bg-light">
          <Button color="light" onClick={toggleNameModal} disabled={updatingName}>Cancelar</Button>
          <Button
            color="primary"
            onClick={handleChangeName}
            disabled={updatingName || !newName.trim()}
          >
            <span className="d-flex align-items-center gap-1">
                {updatingName && <Spinner size="sm" />}
                <span>Guardar Nombre</span>
            </span>
          </Button>
        </ModalFooter>
      </Modal>

      {/* Photo configuration option modal */}
      <Modal isOpen={photoOptionModal} toggle={togglePhotoOptionModal} centered>
        <ModalHeader toggle={togglePhotoOptionModal} className="bg-light p-3">
          Configurar Foto de Perfil
        </ModalHeader>
        <ModalBody className="p-4 text-center">
          <div className="d-grid gap-2 mb-4">
            <Button 
              color="primary" 
              className="d-flex align-items-center justify-content-center gap-2 p-2.5"
              onClick={() => { togglePhotoOptionModal(); fileInputRef.current?.click(); }}
            >
              <i className="ri-upload-2-line fs-16"></i> <span>Subir Foto desde mi PC</span>
            </Button>
            <Button 
              color="soft-danger" 
              className="d-flex align-items-center justify-content-center gap-2 p-2.5"
              onClick={() => { togglePhotoOptionModal(); handleCroppedSave(""); }}
              disabled={!userData?.avatar_url}
            >
              <i className="ri-delete-bin-line fs-16"></i> <span>Quitar Foto (Usar Iniciales)</span>
            </Button>
          </div>

          <div className="border-top pt-3">
            <h6 className="fw-semibold text-muted text-uppercase fs-12 mb-3 text-start">O selecciona una ilustración premium:</h6>
            <Row className="g-3">
              {ILLUSTRATIONS.map((ill, idx) => (
                <Col xs={4} key={idx}>
                  <div
                    onClick={() => {
                      togglePhotoOptionModal();
                      const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(ill.svg)}`;
                      handleCroppedSave(dataUrl);
                    }}
                    className="avatar-lg mx-auto rounded-circle border border-dashed border-light-subtle bg-light shadow-sm"
                    style={{ width: "70px", height: "70px", padding: "2px", cursor: "pointer", transition: "transform 0.2s" }}
                    title={ill.name}
                    onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.08)"; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                    dangerouslySetInnerHTML={{ __html: ill.svg }}
                  />
                </Col>
              ))}
            </Row>
          </div>
        </ModalBody>
        <ModalFooter className="bg-light">
          <Button color="light" onClick={togglePhotoOptionModal}>Cerrar</Button>
        </ModalFooter>
      </Modal>

      
    </React.Fragment>
  );
};

export default UserProfile;
