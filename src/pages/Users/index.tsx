import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Button, Spinner, Alert, Table } from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import BreadCrumb from '../../Components/Common/BreadCrumb';
import { APIClient } from '../../helpers/api_helper';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UserManagement = () => {
    const navigate = useNavigate();
    const api = new APIClient();

    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);

    // Modals state
    const [createModal, setCreateModal] = useState<boolean>(false);
    const [editModal, setEditModal] = useState<boolean>(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    const toggleCreateModal = () => {
        setCreateModal(!createModal);
        createValidation.resetForm();
    };

    const toggleEditModal = () => {
        setEditModal(!editModal);
        editValidation.resetForm();
    };

    const checkAdminAccess = () => {
        const authUserStr = sessionStorage.getItem("authUser");
        if (!authUserStr) {
            navigate("/login");
            return false;
        }
        try {
            const authUser = JSON.parse(authUserStr);
            if (authUser.rol_global !== "Administrador") {
                navigate("/home");
                return false;
            }
        } catch (e) {
            navigate("/login");
            return false;
        }
        return true;
    };

    const fetchUsers = async () => {
        if (!checkAdminAccess()) return;
        setLoading(true);
        setError(null);
        try {
            const data: any = await api.get("/users");
            setUsers(data || []);
        } catch (err: any) {
            setError(err || "Error al cargar la lista de usuarios.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Validation for User Creation
    const createValidation = useFormik({
        initialValues: {
            nombre_completo: '',
            email: '',
            password: '',
            rol_global: 'Miembro'
        },
        validationSchema: Yup.object({
            nombre_completo: Yup.string().required("El nombre completo es requerido"),
            email: Yup.string().email("Ingresa un email válido").required("El email es requerido"),
            password: Yup.string().min(4, "Mínimo 4 caracteres").required("La contraseña es requerida"),
            rol_global: Yup.string().required("El rol global es requerido")
        }),
        onSubmit: async (values) => {
            setSubmitting(true);
            try {
                // Register via register endpoint (public)
                await api.create("/register", values);
                toast.success("¡Usuario registrado con éxito!", { position: "top-right" });
                toggleCreateModal();
                fetchUsers();
            } catch (err: any) {
                toast.error(err || "Error al registrar el usuario.", { position: "top-right" });
            } finally {
                setSubmitting(false);
            }
        }
    });

    // Validation for User Edition
    const editValidation = useFormik({
        enableReinitialize: true,
        initialValues: {
            nombre_completo: selectedUser ? selectedUser.nombre_completo : '',
            email: selectedUser ? selectedUser.email : '',
            password: '', // blank by default, only updated if entered
            rol_global: selectedUser ? selectedUser.rol_global : 'Miembro'
        },
        validationSchema: Yup.object({
            nombre_completo: Yup.string().required("El nombre completo es requerido"),
            email: Yup.string().email("Ingresa un email válido").required("El email es requerido"),
            password: Yup.string().min(4, "Mínimo 4 caracteres"),
            rol_global: Yup.string().required("El rol global es requerido")
        }),
        onSubmit: async (values) => {
            if (!selectedUser) return;
            setSubmitting(true);
            try {
                const payload: any = {
                    nombre_completo: values.nombre_completo,
                    email: values.email,
                    rol_global: values.rol_global
                };
                if (values.password && values.password.trim() !== '') {
                    payload.password = values.password;
                }
                
                await api.put(`/users/${selectedUser.id}`, payload);
                toast.success("¡Usuario actualizado con éxito!", { position: "top-right" });
                toggleEditModal();
                fetchUsers();
            } catch (err: any) {
                toast.error(err || "Error al actualizar el usuario.", { position: "top-right" });
            } finally {
                setSubmitting(false);
            }
        }
    });

    const handleDeleteUser = async (user: any) => {
        const authUser = JSON.parse(sessionStorage.getItem("authUser") || "{}");
        if (authUser.usuario_id === user.id) {
            toast.error("No puedes eliminar tu propia cuenta de administrador en sesión.", { position: "top-right" });
            return;
        }

        if (!window.confirm(`¿Estás seguro de que deseas eliminar al usuario "${user.nombre_completo}"? Esta acción limpiará sus asignaciones de forma definitiva.`)) {
            return;
        }

        try {
            await api.delete(`/users/${user.id}`);
            toast.success(`Usuario "${user.nombre_completo}" eliminado.`, { position: "top-right" });
            fetchUsers();
        } catch (err: any) {
            toast.error(err || "Error al eliminar el usuario.", { position: "top-right" });
        }
    };

    const handleEditClick = (user: any) => {
        setSelectedUser(user);
        toggleEditModal();
    };

    const filteredUsers = users.filter((u: any) => {
        const query = searchTerm.toLowerCase();
        return (
            (u.nombre_completo || '').toLowerCase().includes(query) ||
            (u.email || '').toLowerCase().includes(query) ||
            (u.id || '').toLowerCase().includes(query)
        );
    });

    document.title = "Gestión de Usuarios | Luma - Admin";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Gestión de Usuarios">
                        <Button color="success" className="btn btn-success" onClick={toggleCreateModal}>
                            <i className="ri-user-add-line align-bottom me-1"></i> <span>Registrar Usuario</span>
                        </Button>
                    </BreadCrumb>

                    <Row className="mb-4">
                        <Col lg={12}>
                            <Card className="shadow-sm border-0">
                                <CardBody>
                                    <div className="search-box mb-3 col-md-4">
                                        <div className="position-relative">
                                            <Input
                                                type="text"
                                                className="form-control bg-light border-light"
                                                placeholder="Buscar por nombre, email o ID..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                            <i className="ri-search-line search-icon position-absolute text-muted fs-16" style={{ top: "10px", right: "12px" }}></i>
                                        </div>
                                    </div>

                                    {loading ? (
                                        <div className="text-center my-5">
                                            <Spinner color="primary" />
                                            <p className="text-muted mt-2"><span>Cargando usuarios...</span></p>
                                        </div>
                                    ) : error ? (
                                        <Alert color="danger" className="text-center">{error}</Alert>
                                    ) : filteredUsers.length === 0 ? (
                                        <div className="text-center py-4">
                                            <p className="text-muted fs-16">No se encontraron usuarios que coincidan con la búsqueda.</p>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <Table className="table-centered table-nowrap mb-0 align-middle">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th scope="col"><span>ID</span></th>
                                                        <th scope="col"><span>Nombre Completo</span></th>
                                                        <th scope="col"><span>Email</span></th>
                                                        <th scope="col"><span>Contraseña (Plana)</span></th>
                                                        <th scope="col"><span>Rol Global</span></th>
                                                        <th scope="col" className="text-center"><span>Acciones</span></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredUsers.map((user: any) => (
                                                        <tr key={user.id}>
                                                            <td>
                                                                <span className="text-muted fs-12 fw-semibold" style={{ fontFamily: "monospace" }}>
                                                                    {user.id}
                                                                </span>
                                                            </td>
                                                            <td className="fw-semibold">
                                                                <span>{user.nombre_completo}</span>
                                                            </td>
                                                            <td>
                                                                <span>{user.email}</span>
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-soft-warning text-warning fs-13" style={{ fontFamily: "monospace" }}>
                                                                    {user.password_plain || "••••••••"}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${
                                                                    user.rol_global === 'Administrador' ? 'bg-soft-danger text-danger' : 'bg-soft-primary text-primary'
                                                                } fs-12`}>
                                                                    <span>{user.rol_global}</span>
                                                                </span>
                                                            </td>
                                                            <td className="text-center">
                                                                <div className="d-flex justify-content-center gap-2">
                                                                    <Button
                                                                        color="light"
                                                                        className="btn btn-sm btn-soft-primary"
                                                                        onClick={() => handleEditClick(user)}
                                                                        title="Editar Usuario"
                                                                    >
                                                                        <i className="ri-pencil-line"></i>
                                                                    </Button>
                                                                    <Button
                                                                        color="light"
                                                                        className="btn btn-sm btn-soft-danger"
                                                                        onClick={() => handleDeleteUser(user)}
                                                                        title="Eliminar Usuario"
                                                                    >
                                                                        <i className="ri-delete-bin-line"></i>
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Modal de Registro de Usuario */}
            <Modal isOpen={createModal} toggle={toggleCreateModal} centered>
                <ModalHeader toggle={toggleCreateModal} className="bg-light p-3">
                    Registrar Nuevo Usuario
                </ModalHeader>
                <Form onSubmit={(e) => {
                    e.preventDefault();
                    createValidation.handleSubmit();
                    return false;
                }}>
                    <ModalBody>
                        <div className="mb-3">
                            <Label htmlFor="nombre_completo-field" className="form-label">Nombre Completo</Label>
                            <Input
                                id="nombre_completo-field"
                                name="nombre_completo"
                                className="form-control"
                                placeholder="Ej: Nain Luna Hernandez"
                                type="text"
                                onChange={createValidation.handleChange}
                                onBlur={createValidation.handleBlur}
                                value={createValidation.values.nombre_completo}
                                invalid={
                                    createValidation.touched.nombre_completo && createValidation.errors.nombre_completo ? true : false
                                }
                            />
                            {createValidation.touched.nombre_completo && createValidation.errors.nombre_completo ? (
                                <FormFeedback type="invalid">{String(createValidation.errors.nombre_completo)}</FormFeedback>
                            ) : null}
                        </div>

                        <div className="mb-3">
                            <Label htmlFor="email-field" className="form-label">Email</Label>
                            <Input
                                id="email-field"
                                name="email"
                                className="form-control"
                                placeholder="Ej: nain@gmail.com"
                                type="email"
                                onChange={createValidation.handleChange}
                                onBlur={createValidation.handleBlur}
                                value={createValidation.values.email}
                                invalid={
                                    createValidation.touched.email && createValidation.errors.email ? true : false
                                }
                            />
                            {createValidation.touched.email && createValidation.errors.email ? (
                                <FormFeedback type="invalid">{String(createValidation.errors.email)}</FormFeedback>
                            ) : null}
                        </div>

                        <div className="mb-3">
                            <Label htmlFor="password-field" className="form-label">Contraseña</Label>
                            <Input
                                id="password-field"
                                name="password"
                                className="form-control"
                                placeholder="Ej: 151090"
                                type="password"
                                onChange={createValidation.handleChange}
                                onBlur={createValidation.handleBlur}
                                value={createValidation.values.password}
                                invalid={
                                    createValidation.touched.password && createValidation.errors.password ? true : false
                                }
                            />
                            {createValidation.touched.password && createValidation.errors.password ? (
                                <FormFeedback type="invalid">{String(createValidation.errors.password)}</FormFeedback>
                            ) : null}
                        </div>


                        <div className="mb-3">
                            <Label htmlFor="rol_global-field" className="form-label">Rol Global</Label>
                            <Input
                                id="rol_global-field"
                                name="rol_global"
                                type="select"
                                className="form-select"
                                onChange={createValidation.handleChange}
                                onBlur={createValidation.handleBlur}
                                value={createValidation.values.rol_global}
                            >
                                <option value="Miembro">Miembro</option>
                                <option value="Administrador">Administrador</option>
                            </Input>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <div className="hstack gap-2 justify-content-end">
                            <Button type="button" color="light" onClick={toggleCreateModal}>Cancelar</Button>
                            <Button type="submit" color="success" disabled={submitting}>
                                {submitting ? <Spinner size="sm" className="me-1" /> : null} Registrar
                            </Button>
                        </div>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* Modal de Edición de Usuario */}
            <Modal isOpen={editModal} toggle={toggleEditModal} centered>
                <ModalHeader toggle={toggleEditModal} className="bg-light p-3">
                    Editar Detalles de Usuario
                </ModalHeader>
                <Form onSubmit={(e) => {
                    e.preventDefault();
                    editValidation.handleSubmit();
                    return false;
                }}>
                    <ModalBody>
                        <div className="mb-3">
                            <Label htmlFor="edit-nombre_completo-field" className="form-label">Nombre Completo</Label>
                            <Input
                                id="edit-nombre_completo-field"
                                name="nombre_completo"
                                className="form-control"
                                type="text"
                                onChange={editValidation.handleChange}
                                onBlur={editValidation.handleBlur}
                                value={editValidation.values.nombre_completo}
                                invalid={
                                    editValidation.touched.nombre_completo && editValidation.errors.nombre_completo ? true : false
                                }
                            />
                            {editValidation.touched.nombre_completo && editValidation.errors.nombre_completo ? (
                                <FormFeedback type="invalid">{String(editValidation.errors.nombre_completo)}</FormFeedback>
                            ) : null}
                        </div>

                        <div className="mb-3">
                            <Label htmlFor="edit-email-field" className="form-label">Email</Label>
                            <Input
                                id="edit-email-field"
                                name="email"
                                className="form-control"
                                type="email"
                                onChange={editValidation.handleChange}
                                onBlur={editValidation.handleBlur}
                                value={editValidation.values.email}
                                invalid={
                                    editValidation.touched.email && editValidation.errors.email ? true : false
                                }
                            />
                            {editValidation.touched.email && editValidation.errors.email ? (
                                <FormFeedback type="invalid">{String(editValidation.errors.email)}</FormFeedback>
                            ) : null}
                        </div>

                        <div className="mb-3">
                            <Label htmlFor="edit-password-field" className="form-label">Nueva Contraseña (dejar en blanco para mantener actual)</Label>
                            <Input
                                id="edit-password-field"
                                name="password"
                                className="form-control"
                                placeholder="••••••••"
                                type="password"
                                onChange={editValidation.handleChange}
                                onBlur={editValidation.handleBlur}
                                value={editValidation.values.password}
                                invalid={
                                    editValidation.touched.password && editValidation.errors.password ? true : false
                                }
                            />
                            {editValidation.touched.password && editValidation.errors.password ? (
                                <FormFeedback type="invalid">{String(editValidation.errors.password)}</FormFeedback>
                            ) : null}
                        </div>


                        <div className="mb-3">
                            <Label htmlFor="edit-rol_global-field" className="form-label">Rol Global</Label>
                            <Input
                                id="edit-rol_global-field"
                                name="rol_global"
                                type="select"
                                className="form-select"
                                onChange={editValidation.handleChange}
                                onBlur={editValidation.handleBlur}
                                value={editValidation.values.rol_global}
                            >
                                <option value="Miembro">Miembro</option>
                                <option value="Administrador">Administrador</option>
                            </Input>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <div className="hstack gap-2 justify-content-end">
                            <Button type="button" color="light" onClick={toggleEditModal}>Cancelar</Button>
                            <Button type="submit" color="primary" disabled={submitting}>
                                {submitting ? <Spinner size="sm" className="me-1" /> : null} Guardar Cambios
                            </Button>
                        </div>
                    </ModalFooter>
                </Form>
            </Modal>
            <ToastContainer />
        </React.Fragment>
    );
};

export default UserManagement;
