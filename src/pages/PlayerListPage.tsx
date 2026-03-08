import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2, Trash2, Undo2, ChevronLeft, ChevronRight, Filter } from 'lucide-react'; 
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdmin } from '../context/AdminContext';
import { pageTransition } from '../utils/motion';
import Modal from '../components/ui/Modal/Modal';

import './PlayerListPage.scss';
import { fetchPlayersAxios } from '../hooks/usePlayers';
import { deletePlayerAxios, updatePlayerStatusAxios } from '../api/playerApi';

const ITEMS_PER_PAGE = 10;
type FilterStatus = 'All' | 'Pending' | 'Success';

const PlayerListPage = () => {
  const { isAdmin } = useAdmin();
  const queryClient = useQueryClient();
  const [activeCard, setActiveCard] = useState<string | null>(null);
  
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  // --- PAGINATION STATES ---
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileVisibleCount, setMobileVisibleCount] = useState(10);

  const [currentFilter, setCurrentFilter] = useState<FilterStatus>('All');

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

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
                  <img src={p.facePhotoUrl} alt={p.fullname} />
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
                    <button 
                      className={`action-btn ${p.status === 'Pending' ? 'accept' : 'revert'}`}
                      disabled={isUpdating || statusMutation.isPending}
                      onClick={() => handleToggleStatus(p.id!, p.status)}
                      title={p.status === 'Pending' ? "Approve Player" : "Revert to Pending"}
                    >
                      {isUpdating ? <Loader2 size={18} className="spin" /> : 
                       p.status === 'Pending' ? <CheckCircle size={18} /> : <Undo2 size={18} />}
                    </button>
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
                  <motion.img layout src={p.facePhotoUrl} alt="player face" />
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
                        <img src={p.fullPhotoUrl} className="full-view-img" alt="Full View" />
                        <div className="stats-row">
                          <p><span>Position:</span> {p.position}</p>
                          <p><span>Place:</span> {p.place}</p>
                        </div>
                        
                        {isAdmin && (
                          <div className="mobile-admin-actions">
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
    </motion.div>
  );
};

export default PlayerListPage;


// import  { useEffect, useId, useRef, useState } from "react";
// import { AnimatePresence, motion } from "framer-motion";

// import "./PlayerListPage.scss";
// import { useOutsideClick } from "../hooks/use-outside-click";

// export function ExpandableCardDemo() {
//   const [active, setActive] = useState<(typeof cards)[number] | boolean | null>(
//     null
//   );
//   const ref = useRef<HTMLDivElement>(null);
//   const id = useId();

//   useEffect(() => {
//     function onKeyDown(event: KeyboardEvent) {
//       if (event.key === "Escape") {
//         setActive(false);
//       }
//     }

//     if (active && typeof active === "object") {
//       document.body.style.overflow = "hidden";
//     } else {
//       document.body.style.overflow = "auto";
//     }

//     window.addEventListener("keydown", onKeyDown);
//     return () => window.removeEventListener("keydown", onKeyDown);
//   }, [active]);

//   useOutsideClick(ref, () => setActive(null));

//   return (
//     <>
//       <AnimatePresence>
//         {active && typeof active === "object" && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 bg-black/20 h-full w-full z-10"
//           />
//         )}
//       </AnimatePresence>
//       <AnimatePresence>
//         {active && typeof active === "object" ? (
//           <div className="fixed inset-0 grid place-items-center z-[100]">
//             <motion.button
//               key={`button-${active.title}-${id}`}
//               layout
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{
//                 opacity: 0,
//                 transition: { duration: 0.05 },
//               }}
//               className="flex absolute top-2 right-2 lg:hidden items-center justify-center bg-white rounded-full h-6 w-6"
//               onClick={() => setActive(null)}
//             >
//               <CloseIcon />
//             </motion.button>
//             <motion.div
//               layoutId={`card-${active.title}-${id}`}
//               ref={ref}
//               className="w-full max-w-[500px] h-full md:h-fit md:max-h-[90%] flex flex-col bg-white dark:bg-neutral-900 sm:rounded-3xl overflow-hidden"
//             >
//               <motion.div layoutId={`image-${active.title}-${id}`}>
//                 <img
//                   width={200}
//                   height={200}
//                   src={active.src}
//                   alt={active.title}
//                   className="w-full h-80 lg:h-80 sm:rounded-tr-lg sm:rounded-tl-lg object-cover object-top"
//                 />
//               </motion.div>

//               <div>
//                 <div className="flex justify-between items-start p-4">
//                   <div className="">
//                     <motion.h3
//                       layoutId={`title-${active.title}-${id}`}
//                       className="font-bold text-neutral-700 dark:text-neutral-200"
//                     >
//                       {active.title}
//                     </motion.h3>
//                     <motion.p
//                       layoutId={`description-${active.description}-${id}`}
//                       className="text-neutral-600 dark:text-neutral-400"
//                     >
//                       {active.description}
//                     </motion.p>
//                   </div>

//                   <motion.a
//                     layoutId={`button-${active.title}-${id}`}
//                     href={active.ctaLink}
//                     target="_blank"
//                     className="px-4 py-3 text-sm rounded-full font-bold bg-green-500 text-white"
//                   >
//                     {active.ctaText}
//                   </motion.a>
//                 </div>
//                 <div className="pt-4 relative px-4">
//                   <motion.div
//                     layout
//                     initial={{ opacity: 0 }}
//                     animate={{ opacity: 1 }}
//                     exit={{ opacity: 0 }}
//                     className="text-neutral-600 text-xs md:text-sm lg:text-base h-40 md:h-fit pb-10 flex flex-col items-start gap-4 overflow-auto dark:text-neutral-400 [mask:linear-gradient(to_bottom,white,white,transparent)] [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch]"
//                   >
//                     {typeof active.content === "function"
//                       ? active.content()
//                       : active.content}
//                   </motion.div>
//                 </div>
//               </div>
//             </motion.div>
//           </div>
//         ) : null}
//       </AnimatePresence>
//       <ul className="max-w-2xl mx-auto w-full gap-4">
//         {cards.map((card, index) => (
//           <motion.div
//             layoutId={`card-${card.title}-${id}`}
//             key={`card-${card.title}-${id}`}
//             onClick={() => setActive(card)}
//             className="p-4 flex flex-col md:flex-row justify-between items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl cursor-pointer"
//           >
//             <div className="flex gap-4 flex-col md:flex-row ">
//               <motion.div layoutId={`image-${card.title}-${id}`}>
//                 <img
//                   width={100}
//                   height={100}
//                   src={card.src}
//                   alt={card.title}
//                   className="h-40 w-40 md:h-14 md:w-14 rounded-lg object-cover object-top"
//                 />
//               </motion.div>
//               <div className="">
//                 <motion.h3
//                   layoutId={`title-${card.title}-${id}`}
//                   className="font-medium text-neutral-800 dark:text-neutral-200 text-center md:text-left"
//                 >
//                   {card.title}
//                 </motion.h3>
//                 <motion.p
//                   layoutId={`description-${card.description}-${id}`}
//                   className="text-neutral-600 dark:text-neutral-400 text-center md:text-left"
//                 >
//                   {card.description}
//                 </motion.p>
//               </div>
//             </div>
//             <motion.button
//               layoutId={`button-${card.title}-${id}`}
//               className="px-4 py-2 text-sm rounded-full font-bold bg-gray-100 hover:bg-green-500 hover:text-white text-black mt-4 md:mt-0"
//             >
//               {card.ctaText}
//             </motion.button>
//           </motion.div>
//         ))}
//       </ul>
//     </>
//   );
// }

// export const CloseIcon = () => {
//   return (
//     <motion.svg
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       exit={{
//         opacity: 0,
//         transition: { duration: 0.05 },
//       }}
//       xmlns="http://www.w3.org/2000/svg"
//       width="24"
//       height="24"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       className="h-4 w-4 text-black"
//     >
//       <path stroke="none" d="M0 0h24v24H0z" fill="none" />
//       <path d="M18 6l-12 12" />
//       <path d="M6 6l12 12" />
//     </motion.svg>
//   );
// };

// const cards = [
//   {
//     description: "Lana Del Rey",
//     title: "Summertime Sadness",
//     src: "https://assets.aceternity.com/demos/lana-del-rey.jpeg",
//     ctaText: "Play",
//     ctaLink: "https://ui.aceternity.com/templates",
//     content: () => {
//       return (
//         <p>
//           Lana Del Rey, an iconic American singer-songwriter, is celebrated for
//           her melancholic and cinematic music style. Born Elizabeth Woolridge
//           Grant in New York City, she has captivated audiences worldwide with
//           her haunting voice and introspective lyrics. <br /> <br /> Her songs
//           often explore themes of tragic romance, glamour, and melancholia,
//           drawing inspiration from both contemporary and vintage pop culture.
//           With a career that has seen numerous critically acclaimed albums, Lana
//           Del Rey has established herself as a unique and influential figure in
//           the music industry, earning a dedicated fan base and numerous
//           accolades.
//         </p>
//       );
//     },
//   },
//   {
//     description: "Babbu Maan",
//     title: "Mitran Di Chhatri",
//     src: "https://assets.aceternity.com/demos/babbu-maan.jpeg",
//     ctaText: "Play",
//     ctaLink: "https://ui.aceternity.com/templates",
//     content: () => {
//       return (
//         <p>
//           Babu Maan, a legendary Punjabi singer, is renowned for his soulful
//           voice and profound lyrics that resonate deeply with his audience. Born
//           in the village of Khant Maanpur in Punjab, India, he has become a
//           cultural icon in the Punjabi music industry. <br /> <br /> His songs
//           often reflect the struggles and triumphs of everyday life, capturing
//           the essence of Punjabi culture and traditions. With a career spanning
//           over two decades, Babu Maan has released numerous hit albums and
//           singles that have garnered him a massive fan following both in India
//           and abroad.
//         </p>
//       );
//     },
//   },
//   {
//     description: "Metallica",
//     title: "For Whom The Bell Tolls",
//     src: "https://assets.aceternity.com/demos/metallica.jpeg",
//     ctaText: "Play",
//     ctaLink: "https://ui.aceternity.com/templates",
//     content: () => {
//       return (
//         <p>
//           Metallica, an iconic American heavy metal band, is renowned for their
//           powerful sound and intense performances that resonate deeply with
//           their audience. Formed in Los Angeles, California, they have become a
//           cultural icon in the heavy metal music industry. <br /> <br /> Their
//           songs often reflect themes of aggression, social issues, and personal
//           struressions, capturing the essence of the heavy metal genre. With a
//           career spanning over four decades, Metallica has released numerous hit
//           albums and singles that have garnered them a massive fan following
//           both in the United States and abroad.
//         </p>
//       );
//     },
//   },
//   {
//     description: "Led Zeppelin",
//     title: "Stairway To Heaven",
//     src: "https://assets.aceternity.com/demos/led-zeppelin.jpeg",
//     ctaText: "Play",
//     ctaLink: "https://ui.aceternity.com/templates",
//     content: () => {
//       return (
//         <p>
//           Led Zeppelin, a legendary British rock band, is renowned for their
//           innovative sound and profound impact on the music industry. Formed in
//           London in 1968, they have become a cultural icon in the rock music
//           world. <br /> <br /> Their songs often reflect a blend of blues, hard
//           rock, and folk music, capturing the essence of the 1970s rock era.
//           With a career spanning over a decade, Led Zeppelin has released
//           numerous hit albums and singles that have garnered them a massive fan
//           following both in the United Kingdom and abroad.
//         </p>
//       );
//     },
//   },
//   {
//     description: "Mustafa Zahid",
//     title: "Toh Phir Aao",
//     src: "https://assets.aceternity.com/demos/toh-phir-aao.jpeg",
//     ctaText: "Play",
//     ctaLink: "https://ui.aceternity.com/templates",
//     content: () => {
//       return (
//         <p>
//           &quot;Aawarapan&quot;, a Bollywood movie starring Emraan Hashmi, is
//           renowned for its intense storyline and powerful performances. Directed
//           by Mohit Suri, the film has become a significant work in the Indian
//           film industry. <br /> <br /> The movie explores themes of love,
//           redemption, and sacrifice, capturing the essence of human emotions and
//           relationships. With a gripping narrative and memorable music,
//           &quot;Aawarapan&quot; has garnered a massive fan following both in
//           India and abroad, solidifying Emraan Hashmi&apos;s status as a
//           versatile actor.
//         </p>
//       );
//     },
//   },
// ];

// const PlayerListPage = () => {
//   return (
//     <div className="player-list-wrapper">
//       <div className="player-list-header">
//         <h1>Registred players</h1>
//         <p>Click on an artist to see more details and play their top hits.</p>
//       </div>

//       <div className="player-list-content">
//         <ExpandableCardDemo />
//       </div>
//     </div>
//   );
// };

// export default PlayerListPage;