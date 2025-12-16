import React from "react";

const Header = ({ onComplainClick, onLoginClick, onLogoutClick, isAdmin, isManager }) => {
  const isLoggedIn = isAdmin || isManager;
  return (
    <header>
      <div className="header-inner">
        <div>
          <h1>Complaint Management System</h1>
          <p>Add a new complaint and track its status in one place.</p>
        </div>
        <div className="header-actions">
          {!isLoggedIn && (
            <button type="button" onClick={onComplainClick}>
              Complain
            </button>
          )}
          {isLoggedIn ? (
            <button type="button" onClick={onLogoutClick}>
              Logout
            </button>
          ) : (
            <button type="button" onClick={onLoginClick}>
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

