import React from "react";
import { NavLink } from "react-router-dom";

const QuickActionsMenu = () => (
  <div className="nav-item dropdown quick-actions">
    <button
      className="nav-link dropdown-toggle menu-item btn btn-link"
      id="quickActionsDropdown"
      data-bs-toggle="dropdown"
      aria-expanded="false"
      type="button"
    >
      <i className="bi bi-lightning-fill me-1"></i> Quick Actions
    </button>
    <ul className="dropdown-menu dropdown-menu-dark" aria-labelledby="quickActionsDropdown">
      <li>
        <NavLink className="dropdown-item d-flex align-items-center" to="/transfer">
          <i className="bi bi-arrow-left-right me-2"></i> Transfer
        </NavLink>
      </li>
      <li>
        <NavLink className="dropdown-item d-flex align-items-center" to="/deposit">
          <i className="bi bi-bank2 me-2"></i> Deposit
        </NavLink>
      </li>
      <li>
        <NavLink className="dropdown-item d-flex align-items-center" to="/withdraw">
          <i className="bi bi-cash-stack me-2"></i> Withdraw
        </NavLink>
      </li>
    </ul>
  </div>
);

export default QuickActionsMenu;
