import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { Input, Button, Spinner } from 'reactstrap';
import { APIClient } from '../../helpers/api_helper';
import { getLoggedinUser } from '../../helpers/api_helper';
import { useNavigate } from 'react-router-dom';

const api = APIClient;

const Onboarding = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state: any) => state.Account);
    
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const currentUser = getLoggedinUser();
        // Trigger onboarding only if the user has the default name
        if (currentUser && currentUser.nombre_completo === 'Nuevo Usuario') {
            setIsOpen(true);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 500);
        }
    }, [user]);

    const handleSave = async () => {
        if (!name.trim()) return;
        setLoading(true);
        try {
            await api.put('/me/profile', { nombre_completo: name });
            
            // Update local storage user data
            const currentUser = getLoggedinUser();
            if (currentUser) {
                currentUser.nombre_completo = name;
                sessionStorage.setItem("authUser", JSON.stringify(currentUser));
                localStorage.setItem("authUser", JSON.stringify(currentUser));
            }
            
            setIsOpen(false);
            // Quick reload to refresh the state across the app if needed, or just navigate to dashboard
            setTimeout(() => {
                navigate('/');
                window.location.reload();
            }, 500);

        } catch (error) {
            console.error("Error updating profile", error);
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div 
                className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                style={{ zIndex: 9999, backgroundColor: 'rgba(9, 9, 11, 0.85)', backdropFilter: 'blur(8px)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div 
                    className="card p-5 border-0 shadow-lg"
                    style={{ backgroundColor: 'rgba(24, 24, 27, 0.95)', maxWidth: '450px', width: '100%', borderRadius: '1rem', borderTop: '2px solid #3b82f6' }}
                    initial={{ y: 50, scale: 0.9, opacity: 0 }}
                    animate={{ y: 0, scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                    <div className="text-center mb-4">
                        <div className="avatar-md mx-auto mb-3">
                            <div className="avatar-title bg-primary rounded-circle display-4">
                                👋
                            </div>
                        </div>
                        <h2 className="text-white fw-bold mb-2">¡Hola!</h2>
                        <p className="text-muted fs-15">Bienvenido a Luma. Para personalizar tu experiencia, dinos ¿cómo te gustaría que te llamemos?</p>
                    </div>

                    <div className="mb-4">
                        <Input 
                            innerRef={inputRef}
                            type="text" 
                            className="form-control form-control-lg bg-dark border-dark text-white text-center fs-18 py-3" 
                            placeholder="Tu nombre completo o apodo"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        />
                    </div>

                    <Button 
                        color="primary" 
                        size="lg" 
                        className="w-100 btn-submit-premium rounded-pill"
                        onClick={handleSave}
                        disabled={loading || !name.trim()}
                    >
                        {loading ? <Spinner size="sm" /> : "Comenzar mi aventura ✨"}
                    </Button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default Onboarding;
