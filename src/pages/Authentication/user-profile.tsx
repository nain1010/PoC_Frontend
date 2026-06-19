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

const UserProfile = () => {
  const api = new APIClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Password change modal
  const [passwordModal, setPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

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
    fileInputRef.current?.click();
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
      toast.success("¡Foto de perfil actualizada!", { position: "top-right" });

      // Update sessionStorage
      const authUser = sessionStorage.getItem("authUser");
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
      toast.success("¡Contraseña actualizada exitosamente!", { position: "top-right" });
      togglePasswordModal();
      fetchProfile();
    } catch (err: any) {
      toast.error(err || "Error al cambiar la contraseña.", { position: "top-right" });
    } finally {
      setChangingPassword(false);
    }
  };

  document.title = "Mi Perfil | Gestión de Proyectos";

  const avatarSrc = userData?.avatar_url || defaultAvatar;

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Mi Perfil" pageTitle=" " />

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
                        <img
                          src={avatarSrc}
                          alt="Perfil"
                          className="rounded-circle border border-4 border-white shadow"
                          style={{ width: "90px", height: "90px", objectFit: "cover" }}
                        />
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
                      <h4 className="fw-bold text-dark mb-1">{userData.nombre_completo || "Usuario"}</h4>
                      <p className="text-muted fs-14 mb-1">{userData.email || ""}</p>
                      <span className="badge bg-soft-success text-success fs-12">{userData.rol_global || "Miembro"}</span>
                    </div>

                    <div className="border-top pt-4">
                      <Row className="g-3">
                        {/* Nombre */}
                        <Col xs={12}>
                          <div className="d-flex align-items-center p-3 bg-light rounded">
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

      <ToastContainer />
    </React.Fragment>
  );
};

export default UserProfile;
