import React, { useState } from "react";
import "./ContactList.css";

interface Contact {
  id: string;
  name: string;
}

interface ContactListProps {
  currentUser: { id: string; name: string };
  contacts: Contact[];
  onSelect: (id: string) => void;
  selectedId: string | null;
  onSignOut: () => void; // NEW PROP
}

function ContactList({ currentUser, contacts, onSelect, selectedId, onSignOut }: ContactListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="contact-list">
      <div className="contact-list-header">
        <div className="user-info">
          <div className="user-avatar">{currentUser.name[0].toUpperCase()}</div>
          <div className="user-name">{currentUser.name}</div>
        </div>
        <button className="signout-btn" onClick={onSignOut}>
          Sign Out
        </button>
      </div>

      <input
        type="text"
        placeholder="Search contacts..."
        className="contact-search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <ul>
        {filteredContacts.map((contact) => (
          <li
            key={contact.id}
            className={selectedId === contact.id ? "selected" : ""}
            onClick={() => onSelect(contact.id)}
          >
            {contact.name}
          </li>
        ))}
        {filteredContacts.length === 0 && <li className="no-result">No contacts found</li>}
      </ul>
    </div>
  );
}

export default ContactList;
