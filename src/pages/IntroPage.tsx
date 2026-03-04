import { motion, AnimatePresence, useInView, useScroll, useMotionValueEvent } from 'framer-motion'; // Added missing imports
import { useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPlayersAxios } from '../hooks/usePlayers';
import Modal from '../components/ui/Modal/Modal';
import { Languages, ChevronDown } from 'lucide-react'; // Added ChevronDown for the scroll indicator
import { MATCH_RULES, PLAYING_RULES } from '../utils/constants';
import { pageTransition, staggerContainer, staggerItem } from '../utils/motion';
import "./IntroPage.scss";

const IntroPage = () => {
  const navigate = useNavigate();
  const [showFullModal, setShowFullModal] = useState(false);
  const [lang, setLang] = useState<'en' | 'ml'>('en');

  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  
  // 1. Setup the scroll tracker
  const rulesEndRef = useRef<HTMLDivElement>(null);
  const isRulesVisible = useInView(rulesEndRef, { once: true, margin: "0px 0px -100px 0px" });

  useMotionValueEvent(scrollY, "change", (latest) => {
    // If they scroll past 50px, hide it. If they scroll back to top, show it.
    if (latest > 50 && !isScrolled) {
      setIsScrolled(true);
    } else if (latest <= 50 && isScrolled) {
      setIsScrolled(false);
    }
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => fetchPlayersAxios(), 
  });

  const gkCount = players.filter(p => p.position === 'GK').length;
  const outfieldCount = players.length - gkCount;
  const isFull = players.length >= 48;

  const handleRegisterClick = () => {
    if (isFull) {
      setShowFullModal(true);
    } else {
      navigate('/register');
    }
  };

  return (
    <motion.div 
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="intro-container"
    >
      {/* --- HERO SECTION --- */}
      <section className="hero">
        <motion.div 
          className="logo-wrapper"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <img src="/images/home_page_img.jpeg" alt="Athletico Logo" />
        </motion.div>
        
        <motion.h1 
          initial={{ letterSpacing: "10px", opacity: 0 }}
          animate={{ letterSpacing: "2px", opacity: 1 }}
          transition={{ duration: 1 }}
        >
          Irumbuzhi <span>Soccer League</span>
        </motion.h1>

        <div className="counter-overlay">
          <div className={`count-box ${gkCount >= 7 ? 'full' : ''}`}>
            <span className="label">Goalkeepers</span>
            <span className="number">{gkCount}<span>/7</span></span>
          </div>
          <div className={`count-box highlight ${outfieldCount >= 41 ? 'full' : ''}`}>
            <span className="label">Outfield Players</span>
            <span className="number">{outfieldCount}<span>/41</span></span>
          </div>
        </div>

        {/* 2. Professional Scroll Indicator */}
       {!isScrolled && (
            <motion.div 
              className="scroll-indicator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, transition: { duration: 0.3 } }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              <p>Scroll to Rules</p>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="icon-bounce"
              >
                <ChevronDown size={20} />
              </motion.div>
            </motion.div>
          )}
      </section>

      {/* --- RULES SECTION --- */}
      <motion.section 
        className="rules-section"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="section-header">
          <h2>League <span>Guidelines</span></h2>
          <div className="language-toggle">
            <Languages size={16} className="lang-icon" />
            <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>ENG</button>
            <button className={lang === 'ml' ? 'active' : ''} onClick={() => setLang('ml')}>മലയാളം</button>
          </div>
        </div>

        <motion.div variants={staggerItem} className="rule-card premium">
          <div className="card-accent"></div>
          <h3>{lang === 'en' ? 'Registration & Match Rules' : 'Registration & Match Rules'}</h3>
          <div className="rule-list">
            {MATCH_RULES[lang].map((rule, index) => {
              const Icon = rule.icon;
              return (
                <div className="rule-item" key={`match-${index}`}>
                  <div className="icon-wrapper">
                    <Icon size={18} />
                  </div>
                  <p>{rule.text}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* 3. ATTACH THE REF HERE */}
        <motion.div 
          ref={rulesEndRef} 
          variants={staggerItem} 
          className="rule-card premium"
        >
          <div className="card-accent playing-accent"></div>
          <h3>{lang === 'en' ? 'Playing Regulations' : 'Playing Rules'}</h3>
          <div className="rule-list">
            {PLAYING_RULES[lang].map((rule, index) => {
              const Icon = rule.icon;
              return (
                <div className="rule-item" key={`play-${index}`}>
                  <div className="icon-wrapper playing-icon">
                    <Icon size={18} />
                  </div>
                  <p>{rule.text}</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.section>

      {/* --- 4. ANIMATED STICKY FOOTER --- */}
      <AnimatePresence>
        {isRulesVisible && (
          <motion.div 
            className="sticky-footer"
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <button 
              className={`btn-register-fixed ${isFull ? 'btn-closed' : ''}`} 
              onClick={handleRegisterClick}
            >
              {isFull ? 'REGISTRATION CLOSED' : 'JOIN THE LEAGUE'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal 
        isOpen={showFullModal}
        onClose={() => setShowFullModal(false)}
        onConfirm={() => setShowFullModal(false)} 
        title="Registration Closed"
        message="The Irumbuzhi Soccer League has reached its maximum capacity of 48 players. Stay tuned for future updates!"
        confirmText="Got it"
      />
    </motion.div>
  );
};

export default IntroPage;