import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Container, Row, Col, Card, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Button, Spinner, Alert } from 'reactstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BreadCrumb from '../../Components/Common/BreadCrumb';
import { APIClient } from '../../helpers/api_helper';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TableContainer from '../../Components/Common/TableContainer';

const api = APIClient;

const UserCard = React.memo(({ user, onEdit, onDelete }: { user: any, onEdit: (u: any) => void, onDelete: (u: any) => void }) => {
    return (
        <Col xl={3} lg={4} md={6} className="mb-4">
            <Card id={`user-${user.id}`} className="shadow-sm border-0 ribbon-box ribbon-fill right h-100">
                {user.rol_global === 'Administrador' ? (
                    <div className="ribbon ribbon-danger"><i className="ri-shield-star-line"></i> Admin</div>
                ) : (
                    <div className="ribbon ribbon-primary"><i className="ri-user-settings-line"></i> Miembro</div>
                )}
                <CardBody className="p-4 text-center d-flex flex-column">
                    <div className="mx-auto avatar-md mb-3 mt-3">
                        <div className="avatar-title bg-light text-primary rounded-circle fs-24">
                            {user.nombre_completo ? user.nombre_completo.charAt(0).toUpperCase() : 'U'}
                        </div>
                    </div>
                    <h5 className="fs-16 mb-1 text-truncate">
                        <span className="text-body fw-semibold">{user.nombre_completo}</span>
                    </h5>
                    <p className="text-muted mb-2 text-truncate">{user.email}</p>
                    <div className="mt-auto pt-3">
                        <div className="d-flex justify-content-center gap-2">
                            <Button color="light" size="sm" onClick={() => onEdit(user)} title="Editar"><i className="ri-pencil-line"></i></Button>
                            <Button color="danger" outline size="sm" onClick={() => onDelete(user)} title="Eliminar"><i className="ri-delete-bin-line"></i></Button>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </Col>
    );
});

const UserManagement = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [submitting, setSubmitting] = useState<boolean>(false);

    const [createModal, setCreateModal] = useState<boolean>(false);
    const [editModal, setEditModal] = useState<boolean>(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [deleteModal, setDeleteModal] = useState<boolean>(false);
    const [userToDelete, setUserToDelete] = useState<any | null>(null);

    const [usersViewMode, setUsersViewMode] = useState<'grid' | 'table'>(
        (localStorage.getItem("usersViewMode") as 'grid' | 'table') || 'grid'
    );
    const [searchQuery, setSearchQuery] = useState("");

    const handleUsersViewModeChange = (mode: 'grid' | 'table') => {
        setUsersViewMode(mode);
        localStorage.setItem("usersViewMode", mode);
    };

    const checkAdminAccess = () => {
        const authUserStr = (sessionStorage.getItem("authUser") || localStorage.getItem("authUser"));
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

    const { data: users = [], isLoading, error } = useQuery({
        queryKey: ['users'],
        queryFn: () => {
            if (!checkAdminAccess()) return Promise.resolve([]);
            return api.get("/users");
        },
        select: (data: any) => data || [],
    });

    const filteredUsers = useMemo(() => {
        if (!searchQuery) return users;
        const q = searchQuery.toLowerCase();
        return users.filter((u: any) => 
            u.nombre_completo?.toLowerCase().includes(q) || 
            u.email?.toLowerCase().includes(q) ||
            u.id?.toLowerCase().includes(q)
        );
    }, [users, searchQuery]);

    const location = useLocation();

    const applyHighlight = useCallback((targetId: string) => {
        let attempts = 0;
        const tryHighlight = () => {
            const el = document.getElementById(targetId);
            if (!el) {
                if (attempts < 3) {
                    attempts++;
                    setTimeout(tryHighlight, 500);
                }
                return;
            }
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('highlight-pulse');
            // Inline styles as bulletproof fallback (Bootstrap !important blocks CSS animation properties)
            el.style.outline = '3px solid #0ab39c';
            el.style.outlineOffset = '2px';
            el.style.zIndex = '5';
            el.style.position = 'relative';
            setTimeout(() => {
                el.classList.remove('highlight-pulse');
                el.style.outline = '';
                el.style.outlineOffset = '';
                el.style.zIndex = '';
                el.style.position = '';
            }, 3000);
        };
        setTimeout(tryHighlight, 500);
    }, []);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const highlight = searchParams.get('highlight');
        if (highlight && users.length > 0) {
            const [type, ...idParts] = highlight.split('-');
            if (type === 'user' || type === 'users') {
                const targetId = type === 'users' ? 'users-list' : `user-${idParts.join('-')}`;
                applyHighlight(targetId);
                // Clean up the URL param after applying highlight
                window.history.replaceState({}, '', location.pathname);
            }
        }
    }, [location.search, users, applyHighlight]);

    const invalidateUsers = useCallback(() => queryClient.invalidateQueries({ queryKey: ['users'] }), [queryClient]);

    const createUserMutation = useMutation({
        mutationFn: (values: any) => api.create("/register", values),
        onError: (err: any) => {
            toast.error(err || "Error al registrar el usuario.", { position: "top-right" });
        },
        onSettled: () => invalidateUsers(),
    });

    const editUserMutation = useMutation({
        mutationFn: (payload: any) => api.put(`/users/${payload.id}`, payload),
        onError: (err: any) => {
            toast.error(err || "Error al actualizar el usuario.", { position: "top-right" });
        },
        onSettled: () => invalidateUsers(),
    });

    const deleteUserMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/users/${id}`),
        onMutate: async (id: string) => {
            await queryClient.cancelQueries({ queryKey: ['users'] });
            const previous = queryClient.getQueryData(['users']);
            queryClient.setQueryData(['users'], (old: any) =>
                Array.isArray(old) ? old.filter((u: any) => u.id !== id) : []
            );
            return { previous };
        },
        onError: (err: any, _id: string, context: any) => {
            if (context?.previous) {
                queryClient.setQueryData(['users'], context.previous);
            }
            toast.error(err || "Error al eliminar el usuario.", { position: "top-right" });
        },
        onSettled: () => invalidateUsers(),
    });

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
            createUserMutation.mutate(values, {
                onSettled: () => { toggleCreateModal(); setSubmitting(false); }
            });
        }
    });

    const editValidation = useFormik({
        enableReinitialize: true,
        initialValues: {
            nombre_completo: selectedUser ? selectedUser.nombre_completo : '',
            email: selectedUser ? selectedUser.email : '',
            password: '',
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
            const payload: any = {
                nombre_completo: values.nombre_completo,
                email: values.email,
                rol_global: values.rol_global
            };
            if (values.password && values.password.trim() !== '') {
                payload.password = values.password;
            }
            editUserMutation.mutate({ id: selectedUser.id, ...payload }, {
                onSettled: () => { toggleEditModal(); setSubmitting(false); }
            });
        }
    });

    const toggleCreateModal = useCallback(() => {
        setCreateModal(prev => !prev);
        createValidation.resetForm();
    }, []);

    const toggleEditModal = useCallback(() => {
        setEditModal(prev => !prev);
        editValidation.resetForm();
    }, []);

    const toggleDeleteModal = useCallback(() => {
        setDeleteModal(prev => !prev);
    }, []);

    const handleDeleteUser = useCallback((user: any) => {
        const authUser = JSON.parse((sessionStorage.getItem("authUser") || localStorage.getItem("authUser")) || "{}");
        if (authUser.usuario_id === user.id) {
            toast.error("No puedes eliminar tu propia cuenta de administrador en sesión.", { position: "top-right" });
            return;
        }
        setUserToDelete(user);
        toggleDeleteModal();
    }, [toggleDeleteModal]);

    const handleEditClick = useCallback((user: any) => {
        setSelectedUser(user);
        toggleEditModal();
    }, [toggleEditModal]);

    const confirmDeleteUser = useCallback(() => {
        if (!userToDelete) return;
        toggleDeleteModal();
        deleteUserMutation.mutate(userToDelete.id);
    }, [userToDelete, toggleDeleteModal, deleteUserMutation]);

    const columns = useMemo(() => [
        {
            header: "ID",
            accessorKey: "id",
            enableColumnFilter: false,
            cell: (cell: any) => (
                <span className="text-muted fs-12 fw-semibold" style={{ fontFamily: "monospace" }}>
                    {cell.getValue()}
                </span>
            )
        },
        {
            header: "Nombre Completo",
            accessorKey: "nombre_completo",
            enableColumnFilter: false,
            cell: (cell: any) => (
                <span className="fw-semibold">{cell.getValue()}</span>
            )
        },
        {
            header: "Email",
            accessorKey: "email",
            enableColumnFilter: false
        },
        {
            header: "Contraseña",
            accessorKey: "password_plain",
            enableColumnFilter: false,
            cell: (cell: any) => (
                <span className="badge bg-soft-warning text-warning fs-13" style={{ fontFamily: "monospace" }}>
                    {cell.getValue() || "••••••••"}
                </span>
            )
        },
        {
            header: "Rol Global",
            accessorKey: "rol_global",
            enableColumnFilter: false,
            cell: (cell: any) => {
                const role = cell.getValue();
                return (
                    <span className={`badge ${role === 'Administrador' ? 'bg-soft-danger text-danger' : 'bg-soft-primary text-primary'
                        } fs-12`}>
                        <span>{role}</span>
                    </span>
                );
            }
        },
        {
            header: "Acciones",
            id: "actions",
            enableColumnFilter: false,
            cell: (cell: any) => {
                const user = cell.row.original;
                return (
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
                );
            }
        }
    ], [handleEditClick, handleDeleteUser]);

    document.title = "Gestión de Usuarios | Luma - Admin";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Gestión de Usuarios" />

                    <div className="d-flex align-items-center justify-content-between mb-4 mt-3">
                        <div>
                            <h5 className="fs-16 mb-0">Usuarios Registrados</h5>
                            <p className="text-muted mb-0">Administra los accesos y roles globales de la plataforma.</p>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <div className="search-box me-2 d-none d-md-block">
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="Buscar usuario..." 
                                    value={searchQuery} 
                                    onChange={(e) => setSearchQuery(e.target.value)} 
                                />
                                <i className="ri-search-line search-icon"></i>
                            </div>
                            <div className="btn-group" role="group">
                                <Button 
                                    color={usersViewMode === 'grid' ? "primary" : "light"}
                                    onClick={() => handleUsersViewModeChange('grid')}
                                    title="Vista de Tarjetas"
                                >
                                    <i className="ri-grid-fill"></i>
                                </Button>
                                <Button 
                                    color={usersViewMode === 'table' ? "primary" : "light"}
                                    onClick={() => handleUsersViewModeChange('table')}
                                    title="Vista de Tabla"
                                >
                                    <i className="ri-list-unordered"></i>
                                </Button>
                            </div>
                            <Button color="success" className="btn btn-success" onClick={toggleCreateModal}>
                                <i className="ri-user-add-line align-bottom me-1"></i> <span>Registrar</span>
                            </Button>
                        </div>
                    </div>

                    <Row className="mb-4">
                        <Col lg={12}>
                            {isLoading ? (
                                <div className="text-center my-5">
                                    <Spinner color="primary" />
                                    <p className="text-muted mt-2"><span>Cargando usuarios...</span></p>
                                </div>
                            ) : error ? (
                                <Alert color="danger" className="text-center">{error?.message || String(error)}</Alert>
                            ) : filteredUsers.length === 0 ? (
                                <div className="text-center py-5 my-5">
                                    <div className="avatar-xl mx-auto mb-4">
                                        <div className="avatar-title bg-light text-primary rounded-circle display-4">
                                            <i className="ri-user-search-line"></i>
                                        </div>
                                    </div>
                                    <h4>No se encontraron usuarios</h4>
                                </div>
                            ) : usersViewMode === 'table' ? (
                                <Card className="shadow-sm border-0" id="users-list">
                                    <CardBody>
                                        <TableContainer
                                            columns={columns}
                                            data={filteredUsers}
                                            isGlobalFilter={false}
                                            customPageSize={10}
                                            tableClass="align-middle table-nowrap table-hover mb-0"
                                            theadClass="table-light text-muted text-uppercase fw-semibold"
                                            divClass="table-responsive table-card mt-3 mb-1"
                                            rowIdPrefix="user"
                                        />
                                    </CardBody>
                                </Card>
                            ) : (
                                <Row id="users-list">
                                    {filteredUsers.map((user: any) => (
                                        <UserCard
                                            key={user.id}
                                            user={user}
                                            onEdit={handleEditClick}
                                            onDelete={handleDeleteUser}
                                        />
                                    ))}
                                </Row>
                            )}
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Modal de Registro de Usuario */}
            <Modal isOpen={createModal} toggle={toggleCreateModal} centered>
                <ModalHeader toggle={toggleCreateModal} className="bg-soft-primary p-3 border-bottom-0">
                    Registrar Nuevo Usuario
                </ModalHeader>
                <Form onSubmit={(e) => {
                    e.preventDefault();
                    createValidation.handleSubmit();
                    return false;
                }}>
                    <ModalBody className="p-4">
                        <div className="mb-3">
                            <Label htmlFor="nombre_completo-field" className="form-label">Nombre Completo</Label>
                            <Input
                                id="nombre_completo-field"
                                name="nombre_completo"
                                className="form-control"
                                placeholder="Ej: Juan Pérez"
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
                                placeholder="Ej: usuario@ejemplo.com"
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
                                placeholder="Ej: ********"
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
                    <ModalFooter className="bg-light p-3 border-top-0 d-flex justify-content-end gap-2">
                        <Button type="button" color="light" onClick={toggleCreateModal} disabled={submitting}>Cancelar</Button>
                        <Button type="submit" color="success" disabled={submitting}>
                            <span className="d-flex align-items-center gap-1">
                                {submitting && <Spinner size="sm" />}
                                <span>Registrar</span>
                            </span>
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* Modal de Edición de Usuario */}
            <Modal isOpen={editModal} toggle={toggleEditModal} centered>
                <ModalHeader toggle={toggleEditModal} className="bg-soft-primary p-3 border-bottom-0">
                    Editar Detalles de Usuario
                </ModalHeader>
                <Form onSubmit={(e) => {
                    e.preventDefault();
                    editValidation.handleSubmit();
                    return false;
                }}>
                    <ModalBody className="p-4">
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
                    <ModalFooter className="bg-light p-3 border-top-0 d-flex justify-content-end gap-2">
                        <Button type="button" color="light" onClick={toggleEditModal} disabled={submitting}>Cancelar</Button>
                        <Button type="submit" color="primary" disabled={submitting}>
                            <span className="d-flex align-items-center gap-1">
                                {submitting && <Spinner size="sm" />}
                                <span>Guardar Cambios</span>
                            </span>
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* Modal de Confirmación de Eliminación de Usuario */}
            <Modal isOpen={deleteModal} toggle={toggleDeleteModal} centered>
                <ModalHeader toggle={toggleDeleteModal} className="bg-soft-danger p-3 border-bottom-0">
                    Confirmar Eliminación de Usuario
                </ModalHeader>
                <ModalBody className="p-4 text-center">
                    <div className="text-danger mb-3">
                        <i className="ri-delete-bin-5-line display-4"></i>
                    </div>
                    <h5>¿Estás seguro de que deseas eliminar al usuario "{userToDelete?.nombre_completo}"?</h5>
                    <p className="text-muted mb-0">Esta acción limpiará sus asignaciones de forma definitiva en todos los proyectos.</p>
                </ModalBody>
                <ModalFooter className="bg-light p-3 border-top-0 d-flex justify-content-end gap-2">
                    <Button color="light" onClick={toggleDeleteModal}>Cancelar</Button>
                    <Button color="danger" onClick={confirmDeleteUser}>Eliminar</Button>
                </ModalFooter>
            </Modal>

            
        </React.Fragment>
    );
};

export default UserManagement;
