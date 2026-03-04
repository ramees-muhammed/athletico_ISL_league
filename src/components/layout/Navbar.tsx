import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import './Navbar.scss';
import Modal from '../ui/Modal/Modal';
import { LayoutDashboard, LogOut, Users } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAdmin, logout } = useAdmin();
  
  // State to control the Logout Confirmation Modal
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogoutConfirm = () => {
    logout();
    setIsLogoutModalOpen(false);
    navigate('/'); // Optional: Redirect to home after logout
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-logo" onClick={() => navigate('/')}>
          <img src="/isl_official_logo.jpeg" alt="Athletico" />
          {/* <span className="logo-text">ATHLETICO <span>VPM</span></span> */}
        </div>
        
     <div className="nav-actions">
  {/* Modern Icon Button for Player List */}
  <button 
    className="icon-nav-btn" 
    onClick={() => navigate('/players')}
    title="Player Lists"
  >
    <Users size={22} strokeWidth={1.5} /> 
    <span className="icon-label">PLAYERS</span>
  </button>

  {isAdmin ? (
    <div className="admin-group">
      <div className="admin-badge">
        <LayoutDashboard size={14} />
        <span>ADMIN</span>
      </div>
<button
          onClick={() => setIsLogoutModalOpen(true)}
          className="logout-btn"
          title="End Session"
        >
          <LogOut size={16} strokeWidth={2.5} />
        </button>
    </div>
  ) : (
    <button onClick={() => navigate('/admin-login')} className="btn-auth login">
      ADMIN LOGIN
    </button>
  )}
</div>
      </div>

      {/* Logout Confirmation Modal */}
<Modal 
  isOpen={isLogoutModalOpen}
  onClose={() => setIsLogoutModalOpen(false)}
  onConfirm={handleLogoutConfirm}
  title="Confirm Logout"
  message="Are you sure you want to end your admin session?"
  confirmText="Logout" // Pass the specific text here
/>
    </nav>
  );
};

export default Navbar;