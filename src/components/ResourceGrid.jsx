import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookCard } from './BookCard';

export function ExternalLink({ item, children, className }) {
  return (
    <Link to={'/go/' + item.id} className={className}>
      {children}
    </Link>
  );
}

export function Cards({ list, saved, toggle }) {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const handleSave = (id) => {
    toggle(id);
    if (!isLoggedIn) {
      navigate('/login');
    }
  };

  return (
    <div className="resource-grid">
      {list.map((b) => (
        <BookCard
          key={b.id}
          item={b}
          isSaved={saved.includes(b.id)}
          onSaveToggle={handleSave}
        />
      ))}
    </div>
  );
}

export default Cards;
