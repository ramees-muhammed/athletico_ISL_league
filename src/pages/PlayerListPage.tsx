import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2, Trash2, Undo2, ChevronLeft, ChevronRight, Filter, Download, Edit } from 'lucide-react'; 
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdmin } from '../context/AdminContext';
import { pageTransition } from '../utils/motion';
import Modal from '../components/ui/Modal/Modal';

import './PlayerListPage.scss';
import { fetchPlayersAxios } from '../hooks/usePlayers';
import { deletePlayerAxios, updatePlayerStatusAxios } from '../api/playerApi';
import { generatePlayerPdf } from '../utils/generatePlayerPdf';
import type { ToastType } from '../components/ui/Toaster/Toast';
import Toast from '../components/ui/Toaster/Toast';
import { useLocation, useNavigate } from 'react-router-dom';

const ITEMS_PER_PAGE = 10;
type FilterStatus = 'All' | 'Pending' | 'Success';

// Helper to fix .heic images and optimize loading speeds for the web
const getWebSafeImageUrl = (url?: string) => {
  if (!url) return '';
  // f_auto converts .heic to browser-friendly formats automatically
  // q_auto compresses the image without losing quality so mobile scrolling is fast
  return url.replace('/upload/', '/upload/f_auto,q_auto/');
};

const PlayerListPage = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const queryClient = useQueryClient();
  const [activeCard, setActiveCard] = useState<string | null>(null);
  
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const [toast, setToast] = useState<{ isVisible: boolean; message: string; type: ToastType }>({
    isVisible: false,
    message: '',
    type: 'success'
  });

  const location = useLocation();
  const memoryState = location.state as { currentPage?: number; currentFilter?: FilterStatus } | null;

  
  // --- PAGINATION STATES ---
const [currentPage, setCurrentPage] = useState(memoryState?.currentPage || 1);
  const [currentFilter, setCurrentFilter] = useState<FilterStatus>(memoryState?.currentFilter || 'All');
  const [mobileVisibleCount, setMobileVisibleCount] = useState(10);

  // const [currentFilter, setCurrentFilter] = useState<FilterStatus>('All');

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

const { data: players = [], isLoading, isError, error } = useQuery({
    queryKey: ['players'],
    queryFn: fetchPlayersAxios,
    staleTime: 1000 * 60 * 5, 
    // --- ADD THIS SELECT FUNCTION ---
    select: (data) => {
      // Create a copy of the array and sort it by createdAt (Oldest to Newest)
      return [...data].sort((a, b) => a.createdAt - b.createdAt);
    }
  });


// --- FILTERING LOGIC ---
  const filteredPlayers = useMemo(() => {
    if (currentFilter === 'All') return players;
    return players.filter(player => player.status === currentFilter);
  }, [players, currentFilter]);

  // --- DATA SLICING (Now uses filteredPlayers instead of players) ---
  const totalPages = Math.ceil(filteredPlayers.length / ITEMS_PER_PAGE);
  
  const desktopPlayers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPlayers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPlayers, currentPage]);

  const mobilePlayers = useMemo(() => {
    return filteredPlayers.slice(0, mobileVisibleCount);
  }, [filteredPlayers, mobileVisibleCount]);


  const handleFilterChange = (filter: FilterStatus) => {
setCurrentFilter(filter);
setCurrentPage(1);
setMobileVisibleCount(10);
  };

  const statusMutation = useMutation({
    mutationFn: updatePlayerStatusAxios,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['players'] }),
    onSettled: () => setUpdatingId(null)
  });

  const deleteMutation = useMutation({
    mutationFn: deletePlayerAxios,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setDeleteModal({ open: false, id: null });
    },
  });

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Pending' ? 'Success' : 'Pending';
    setUpdatingId(id);
    statusMutation.mutate({ id, newStatus });
  };

  const handleDeleteConfirm = () => {
    if (deleteModal.id) deleteMutation.mutate(deleteModal.id);
  };


  // --- PDF GENERATION LOGIC ---
  const handleDownloadPDF = async () => {
setIsGeneratingPDF(true);
    try {
await generatePlayerPdf(players);

// setAlertModal({
//   open: true,
//   title: "Download Complete",
// message: 'The Players List PDF has been successfully generated and downloaded.'
// })

setToast({
        isVisible: true,
        message: 'The Players List PDF has been successfully generated and downloaded.',
        type: 'success'
      });


      setIsPdfModalOpen(false);
    } catch (error) {
      console.error("PDF Generation Failed:", error);
 setToast({
        isVisible: true,
        message: 'There was a problem generating the PDF. Please try again.',
        type: 'error'
      });

         setIsPdfModalOpen(false);
    } finally {
      setIsGeneratingPDF(false);
    }
  };



 useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        // If the bottom div comes into view, and we aren't already loading, and there are more players to show
        if (target.isIntersecting && !isLoadingMore && mobileVisibleCount < filteredPlayers.length) {
          setIsLoadingMore(true);
          
          // Add a tiny artificial delay so the user sees the spinner (better UX)
          setTimeout(() => {
            setMobileVisibleCount((prev) => prev + 10);
            setIsLoadingMore(false);
          }, 600); 
        }
      },
      { threshold: 0.1 } // Triggers when 10% of the target is visible
    );

    const currentTarget = loadMoreRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [mobileVisibleCount, filteredPlayers.length, isLoadingMore]);


 if (isLoading) {
    return (
      <div className="player-list-wrapper">
        <header className="page-header">
          <h2>Loading <span>Players</span></h2>
        </header>



        {/* Desktop Skeleton Table */}
        <div className="desktop-container">
          <table className="premium-table skeleton-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Club</th>
                <th>Position</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {/* Generate 5 fake rows for the skeleton */}
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td><div className="skeleton skeleton-text short"></div></td>
                  <td className="player-cell">
                    <div className="skeleton skeleton-avatar"></div>
                    <div className="skeleton skeleton-text medium"></div>
                  </td>
                  <td><div className="skeleton skeleton-text medium"></div></td>
                  <td><div className="skeleton skeleton-tag"></div></td>
                  <td><div className="skeleton skeleton-badge"></div></td>
                  {isAdmin && (
                    <td className="action-cells">
                      <div className="skeleton skeleton-btn"></div>
                      <div className="skeleton skeleton-btn"></div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Skeleton Cards */}
        <div className="mobile-container">
          <div className="card-stack">
            {/* Generate 4 fake cards for mobile */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="expandable-card skeleton-card">
                <div className="card-header-small">
                  <div className="skeleton skeleton-avatar"></div>
                  <div className="header-info">
                    <div className="skeleton skeleton-text long"></div>
                    <div className="header-tags">
                      <div className="skeleton skeleton-badge mini"></div>
                      <div className="skeleton skeleton-text medium"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) return <div className="error">Error: {(error as any).message}</div>;

  return (
    <motion.div {...pageTransition} className="player-list-wrapper">
      <div className="mobile-sticky-header">
     <header className="page-header">
        <h2>Players <span>List</span></h2>
      </header>

                    {/* --- ADMIN FILTER CONTROLS --- */}
      {isAdmin && (
        <div className="admin-controls-wrapper">
          <div className="status-filter-tabs">
            <div className="filter-icon"><Filter size={18} /></div>
            {(['All', 'Pending', 'Success'] as FilterStatus[]).map(status => (
              <button
                key={status}
                className={`filter-tab ${currentFilter === status ? 'active' : ''}`}
                onClick={() => handleFilterChange(status)}
              >
                {status}
                <span className="count-badge">
                  {status === 'All' 
                    ? players.length 
                    : players.filter(p => p.status === status).length}
                </span>
              </button>
            ))}
          </div>

          {/* NEW PDF DOWNLOAD BUTTON */}
           <button 
              className="download-pdf-btn" 
              onClick={() => setIsPdfModalOpen(true)} // changed this line
              disabled={isGeneratingPDF || players.length === 0}
            >
              {isGeneratingPDF ? <Loader2 size={18} className="spin" /> : <Download size={18} />}
              {isGeneratingPDF ? 'Generating PDF...' : 'Players PDF'}
            </button>
        </div>
      )}

      </div>
 


      {/* --- DESKTOP VIEW --- */}
      <div className="desktop-container">
        <div className="table-scroll-wrapper">
     <table className="premium-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>Club</th>
              <th>Position</th>
              <th>Status</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {desktopPlayers.map((p, i) => {
              const isUpdating = updatingId === p.id;
              // Calculate actual index based on page
              const actualIndex = (currentPage - 1) * ITEMS_PER_PAGE + i + 1;
              
              return (
              <tr key={p.id}>
                <td>{actualIndex}</td>
                <td className="player-cell">
            <img src={getWebSafeImageUrl(p.facePhotoUrl)} alt={p.fullname} />
                  <span>{p.fullname}</span>
                </td>
                <td>{p.club}</td>
                <td><span className={`tag ${p.position}`}>{p.position}</span></td>
                <td>
                  <span className={`status-badge ${p.status?.toLowerCase()}`}>
                    {p.status}
                  </span>
                </td>
           {isAdmin && (
                  <td className="action-cells">
                    {/* --- NEW EDIT BUTTON --- */}
                    <button 
                      className="action-btn edit"
                      disabled={isUpdating}
                   onClick={() => navigate('/register', { 
      state: { 
        player: p, 
        returnState: { currentPage, currentFilter } // 👈 Saves the exact page & filter
      } 
    })}
                      title="Edit Player"
                    >
                      <Edit size={18} />
                    </button>

                    {/* EXISTING STATUS BUTTON */}
                    <button 
                      className={`action-btn ${p.status === 'Pending' ? 'accept' : 'revert'}`}
                      disabled={isUpdating || statusMutation.isPending}
                      onClick={() => handleToggleStatus(p.id!, p.status)}
                      title={p.status === 'Pending' ? "Approve Player" : "Revert to Pending"}
                    >
                      {isUpdating ? <Loader2 size={18} className="spin" /> : 
                       p.status === 'Pending' ? <CheckCircle size={18} /> : <Undo2 size={18} />}
                    </button>

                    {/* EXISTING DELETE BUTTON */}
                    <button 
                      className="action-btn delete"
                      onClick={() => setDeleteModal({ open: true, id: p.id || null })}
                      disabled={isUpdating}
                      title="Delete Player"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                )}
              </tr>
              )
            })}
          </tbody>
        </table>
        </div>
   

        {/* Desktop Pagination Controls */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <button 
              className="page-nav-btn" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="page-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  className={`page-num-btn ${currentPage === num ? 'active' : ''}`}
                  onClick={() => setCurrentPage(num)}
                >
                  {num}
                </button>
              ))}
            </div>

            <button 
              className="page-nav-btn" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* --- MOBILE VIEW --- */}
      <div className="mobile-container">
        <div className="card-stack">
          {mobilePlayers.map((p, i) => {
            const isUpdating = updatingId === p.id;
            const isActive = activeCard === p.id;

            return (
              <motion.div
                layout 
                key={p.id}
                onClick={() => p.id && setActiveCard(isActive ? null : p.id)}
                className={`expandable-card ${isActive ? 'expanded' : ''}`}
                transition={{ layout: { duration: 0.4, type: "spring", bounce: 0.2 } }}
              >
                <motion.div layout className="player-index">#{i + 1}</motion.div>
                <div className="card-header-small">
                <motion.img layout src={getWebSafeImageUrl(p.facePhotoUrl)} alt="player face" />
                  <div className="header-info">
                    <motion.h3 layout>{p.fullname}</motion.h3>
                    <div className="header-tags">
                      <span className={`status-badge mini ${p.status?.toLowerCase()}`}>{p.status}</span>
                      <p>{p.club}</p>
                    </div>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                      style={{ overflow: "hidden" }} 
                    >
                      <div className="expanded-content">
                      <img src={getWebSafeImageUrl(p.fullPhotoUrl)} className="full-view-img" alt="Full View" />
                        <div className="stats-row">
                          <p><span>Position:</span> {p.position}</p>
                          <p><span>Place:</span> {p.place}</p>
                        </div>
                        
                     {isAdmin && (
                          <div className="mobile-admin-actions">
                            {/* --- NEW EDIT BUTTON --- */}
                            <button 
                              className="mobile-btn edit"
                              disabled={isUpdating}
                             onClick={(e) => { 
      e.stopPropagation(); 
      navigate('/register', { 
        state: { 
          player: p,
          returnState: { currentPage, currentFilter } 
        } 
      }); 
    }}
                            >
                              <Edit size={20} /> Edit Details
                            </button>

                            {/* EXISTING STATUS BUTTON */}
                            <button 
                              className={`mobile-btn ${p.status === 'Pending' ? 'accept' : 'revert'}`}
                              disabled={isUpdating || statusMutation.isPending}
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleToggleStatus(p.id!, p.status); 
                              }}
                            >
                              {isUpdating ? <Loader2 size={20} className="spin" /> : 
                               p.status === 'Pending' ? <CheckCircle size={20} /> : <Undo2 size={20} />}
                              {isUpdating ? 'Updating...' : p.status === 'Pending' ? 'Approve Player' : 'Set to Pending'}
                            </button>
                            
                            {/* EXISTING DELETE BUTTON */}
                            <button 
                              className="mobile-btn delete"
                              disabled={isUpdating}
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setDeleteModal({ open: true, id: p.id || null }); 
                              }}
                            >
                              <Trash2 size={20} /> Remove Player
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile Premium Infinite Scroll / Load More */}
{mobileVisibleCount < filteredPlayers.length && (
          <div ref={loadMoreRef} className="infinite-scroll-trigger">
            <AnimatePresence>
              {isLoadingMore && (
                <motion.div 
                  className="loading-spinner-wrapper"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Loader2 size={24} className="spin" color="var(--color-red)" />
                  <span>Loading players...</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Modal 
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={handleDeleteConfirm}
        title="Remove Player"
        message="This will permanently delete the player from the database. Are you sure?"
        confirmText="Delete Now"
        isLoading={deleteMutation.isPending}
      />

    {/* PDF Confirmation Modal */}
      <Modal 
        isOpen={isPdfModalOpen}
        onClose={() => !isGeneratingPDF && setIsPdfModalOpen(false)}
        onConfirm={handleDownloadPDF}
        title="Download All Players PDF"
        message={`Are you sure you want to generate and download the Players List?`}
        confirmText="Download PDF"
        isLoading={isGeneratingPDF}
      />

      <Toast 
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </motion.div>
  );
};

export default PlayerListPage;


