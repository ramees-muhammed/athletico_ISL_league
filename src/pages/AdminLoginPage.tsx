// src/pages/AdminLoginPage.tsx
// src/pages/AdminLoginPage.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'; // <-- Import icons

import { pageTransition } from '../utils/motion';
import Input from '../components/ui/Input/Input';
import Button from '../components/ui/Button/Button';
import './AdminLoginPage.scss';
import Toast from '../components/ui/Toaster/Toast';
import { useAdmin } from '../context/AdminContext';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAdmin();
  
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  // Add state for password visibility
  const [showPassword, setShowPassword] = useState(false); 
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false,
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type, isVisible: true });
  };

  const validationSchema = Yup.object({
    idNumber: Yup.string().required("Admin ID is required"),
    password: Yup.string().required("Password is required"),
  });

  const formik = useFormik({
    initialValues: { idNumber: '', password: '' },
    validationSchema,
    onSubmit: async (values) => {
      setIsLoggingIn(true);
      
      try {
        const success = await login(values.idNumber, values.password);
        
        if (success) {
          showToast("Login Successful! Welcome, Admin.", "success");
          setTimeout(() => {
            navigate('/players');
          }, 1500);
        } else {
          showToast("Access Denied: Invalid Credentials", "error");
          setIsLoggingIn(false);
        }
      } catch (error) {
        showToast("Server Error: Please try again later.", "error");
        setIsLoggingIn(false);
      }
    },
  });

  return (
    <motion.div {...pageTransition} className="admin-login-container">
      <Toast 
        isVisible={toast.isVisible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, isVisible: false })} 
      />

      <div className="login-card">
       <header>
          <div className="logo-shield">
             {/* 2. Replace the image with the Lucide Icon */}
             <ShieldCheck size={44} strokeWidth={1.5} className="admin-icon" />
          </div>
          <h2>ADMIN <span>PORTAL</span></h2>
          <p>Please enter your authorized credentials</p>
        </header>

        <form onSubmit={formik.handleSubmit} noValidate>
          <Input 
            label="Admin ID Number" 
            placeholder="Enter ID number"
            {...formik.getFieldProps('idNumber')}
            error={formik.errors.idNumber}
            touched={formik.touched.idNumber}
          />

          {/* Password Input Wrapper */}
          <div className="password-input-wrapper">
            <Input 
              label="Password" 
              type={showPassword ? "text" : "password"} // <-- Toggle Type
              placeholder="Enter password"
              {...formik.getFieldProps('password')}
              error={formik.errors.password}
              touched={formik.touched.password}
            />
            {/* Toggle Button */}
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={showPassword ? 'eye-off' : 'eye'}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  {showPassword ? (
                    <EyeOff size={20} strokeWidth={1.5} />
                  ) : (
                    <Eye size={20} strokeWidth={1.5} />
                  )}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>

          <Button 
            type="submit" 
            isLoading={isLoggingIn} 
            variant="primary"
          >
            Authorize Access
          </Button>
        </form>
      </div>
    </motion.div>
  );
};

export default AdminLoginPage;