import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { BRAND } from "../config/brand";

interface User {
  id: string;
  email: string;
  name: string;
  role: 'TENANT' | 'OWNER' | 'ADMIN';
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface AvatarMenuProps {
  user: User;
}

export default function AvatarMenu({ user }: AvatarMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  function onAvatarClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setOpen(prev => !prev);
  }

  async function onLogout(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await logout();
    navigate("/login");
  }

  return (
    <div ref={menuRef} className="relative inline-block">
      <button type="button" onClick={onAvatarClick} aria-haspopup="true" aria-expanded={open}>
        <img src={user?.avatar_url || BRAND.defaultAvatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg z-50">
          <div className="p-2">
            <button onClick={() => navigate("/profile")} className="w-full text-left py-2 px-2 text-text-light-primary dark:text-text-dark-primary hover:bg-primary/10 hover:text-primary transition-colors rounded">Profile</button>
            <button onClick={() => navigate("/messages")} className="w-full text-left py-2 px-2 text-text-light-primary dark:text-text-dark-primary hover:bg-primary/10 hover:text-primary transition-colors rounded">Messages</button>
            <hr className="my-1 border-border-light dark:border-border-dark" />
            <button onClick={onLogout} className="w-full text-left py-2 px-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded">Logout</button>
          </div>
        </div>
      )}
    </div>
  );
}