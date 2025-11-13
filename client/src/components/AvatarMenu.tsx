import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

interface User {
  id: string;
  email: string;
  name: string;
  role: 'TENANT' | 'OWNER' | 'ADMIN';
  phone?: string;
  avatar_url?: string;
  image_id?: string;
  createdAt: string;
  updatedAt: string;
}

interface AvatarMenuProps {
  user: User;
}

export default function AvatarMenu({ user }: AvatarMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

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
    // use supabase auth signout or your API
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("logout failed", err);
    }
    // redirect to login
    navigate("/login");
  }

  return (
    <div ref={menuRef} className="relative inline-block">
      <button type="button" onClick={onAvatarClick} aria-haspopup="true" aria-expanded={open}>
        <img
          src={user?.image_id ? `https://ik.imagekit.io/Shanky/profiles/${user.image_id}.png` : "/default_profile_pic.jpg"}
          alt="avatar"
          className="w-10 h-10 rounded-full object-cover"
        />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border rounded shadow-lg z-50">
          <div className="p-3">
            <div className="flex items-center gap-3 mb-3 pb-3 border-b">
              <img
                src={user?.image_id ? `https://ik.imagekit.io/Shanky/profiles/${user.image_id}.png` : "/default_profile_pic.jpg"}
                alt="profile"
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="font-medium text-gray-900">{user?.name || 'User'}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            <button onClick={() => navigate("/profile")} className="w-full text-left py-2 text-gray-700 hover:bg-gray-100 rounded">Profile</button>
            <button onClick={() => navigate("/messages")} className="w-full text-left py-2 text-gray-700 hover:bg-gray-100 rounded">Messages</button>
            <hr className="my-1" />
            <button onClick={onLogout} className="w-full text-left py-2 text-red-600 hover:bg-red-50 rounded">Logout</button>
          </div>
        </div>
      )}
    </div>
  );
}