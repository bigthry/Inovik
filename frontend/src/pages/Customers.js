import React, { useState, useEffect } from "react";
import PopupContainer from "../components/PopupContainer";
import { usePopupManager } from "../hooks/usePopupManager";
import "./Customers.css";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { popups, showSuccess, showError, hidePopup } = usePopupManager();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showError("Authentication required. Please login again.");
        return;
      }
      const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${API_BASE_URL}/api/customers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch customers");
      }

      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      showError("Error loading customers: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Safe filtering even if some fields are missing
  const filteredCustomers = customers.filter((customer) => {
    const nameMatch = customer.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const mobileMatch = customer.mobileNumber?.includes(searchTerm);
    const gstMatch = customer.gstNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || mobileMatch || gstMatch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleEditClick = (customer) => {
    setEditingCustomer({ ...customer });
    setShowEditModal(true);
  };

  const handleUpdateCustomer = async () => {
    try {
      if (!editingCustomer.name || !editingCustomer.name.trim()) {
        showError("Customer name is required");
        return;
      }

      const token = localStorage.getItem("token");
      const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

      const res = await fetch(`${API_BASE_URL}/api/customers/${editingCustomer._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingCustomer),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update customer");
      }

      // Update local state
      setCustomers(prev => prev.map(c => c._id === editingCustomer._id ? data : c));
      setShowEditModal(false);
      setEditingCustomer(null);
      showSuccess("Customer updated successfully");
    } catch (err) {
      console.error("Error updating customer:", err);
      showError("Error updating customer: " + err.message);
    }
  };

  return (
    <div className="customers-page">
      <PopupContainer popups={popups} onClose={hidePopup} />

      {/* Header */}
      <div className="customers-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Customers</h1>
            <p>Manage your customer database</p>
          </div>
          <div className="header-right">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="customers-content">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading customers...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h2>{searchTerm ? "No matching customers found" : "No customers yet"}</h2>
            <p>
              {searchTerm
                ? "Try adjusting your search terms"
                : "Customers will appear here once added"}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="customers-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mobile Number</th>
                  <th>GST Number</th>
                  <th>Address</th>
                  <th>Building</th>
                  <th>Floor</th>
                  <th>Landmark</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer._id}>
                    <td className="customer-name">
                      <strong>{customer.name}</strong>
                    </td>
                    <td className="mobile-number">
                      {customer.mobileNumber ? (
                        customer.mobileNumber
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td>{customer.gstNumber || "N/A"}</td>
                    <td>{customer.address || "N/A"}</td>
                    <td>{customer.building || "N/A"}</td>
                    <td>{customer.floor || "N/A"}</td>
                    <td>{customer.nearestLandmark || "N/A"}</td>
                    <td>{formatDate(customer.createdAt)}</td>
                    <td>
                      <button className="edit-btn" onClick={() => handleEditClick(customer)}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingCustomer && (
        <div className="modal-overlay">
          <div className="modal">
            <h4>Edit Customer</h4>
            <div className="form-group">
              <label>Name</label>
              <input
                value={editingCustomer.name}
                onChange={e => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                placeholder="Name"
              />
            </div>
            <div className="form-group">
              <label>Mobile Number</label>
              <input
                value={editingCustomer.mobileNumber || ""}
                onChange={e => setEditingCustomer({ ...editingCustomer, mobileNumber: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                placeholder="Mobile Number"
              />
            </div>
            <div className="form-group">
              <label>GST Number</label>
              <input
                value={editingCustomer.gstNumber || ""}
                onChange={e => setEditingCustomer({ ...editingCustomer, gstNumber: e.target.value.toUpperCase().slice(0, 15) })}
                placeholder="GST Number"
              />
            </div>
            <div className="form-group">
              <label>Building</label>
              <input
                value={editingCustomer.building || ""}
                onChange={e => setEditingCustomer({ ...editingCustomer, building: e.target.value })}
                placeholder="Building"
              />
            </div>
            <div className="form-group">
              <label>Floor</label>
              <input
                value={editingCustomer.floor || ""}
                onChange={e => setEditingCustomer({ ...editingCustomer, floor: e.target.value })}
                placeholder="Floor"
              />
            </div>
            <div className="form-group">
              <label>Nearest Landmark</label>
              <input
                value={editingCustomer.nearestLandmark || ""}
                onChange={e => setEditingCustomer({ ...editingCustomer, nearestLandmark: e.target.value })}
                placeholder="Nearest Landmark"
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input
                value={editingCustomer.address || ""}
                onChange={e => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                placeholder="Address"
              />
            </div>

            <div className="modal-actions">
              <button className="save-btn" onClick={handleUpdateCustomer}>Update</button>
              <button className="cancel-btn" onClick={() => setShowEditModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
