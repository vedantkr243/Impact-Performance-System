import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { staticDataService } from "../services/staticDataService";

function SignupDetails() {
  const location = useLocation();
  const navigate = useNavigate();

  const { email, otp } = location.state || {};

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
    contactNumber: "",
    accountType: "User",
    selectedCharityName: ""
  });

  const [availableCharities, setAvailableCharities] = useState([]);

  useEffect(() => {
    if (!email || !otp) {
      navigate("/signup", { replace: true });
    }

    (async () => {
      const data = await staticDataService.getSignupData();
      if (data && data.charities) {
        setAvailableCharities(data.charities);
      }
    })();
  }, [email, otp, navigate]);

  if (!email || !otp) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    navigate("/signup/subscription", { state: { ...form, email, otp } });
  };

  return (
    <div className="auth-shell">
      <section className="auth-panel">
        <div className="auth-copy">
          <span className="product-tag">Impact Performance System</span>
          <h1>Your Details</h1>
          <p>Please provide your personal information to create your account.</p>
          <button
            className="text-button"
            type="button"
            onClick={() => navigate("/signup/verify-otp", { state: { email } })}
          >
            Back to OTP
          </button>
        </div>

        <div className="auth-card">
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              First Name
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Last Name
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
              />
            </label>
            <label>
              Confirm Password
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                minLength={8}
              />
            </label>
            <label>
              Contact Number
              <input
                type="tel"
                name="contactNumber"
                value={form.contactNumber}
                onChange={handleChange}
              />
            </label>
            <label>
              Account Type
              <select name="accountType" value={form.accountType} onChange={handleChange}>
                <option value="User">User</option>
                <option value="Instructor">Instructor</option>
                <option value="Charity">Charity</option>
              </select>
            </label>

            {form.accountType === "User" && (
              <label>
                Select Charity to Support
                <select 
                  name="selectedCharityName" 
                  value={form.selectedCharityName} 
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select a Cause --</option>
                  {availableCharities.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <small style={{ marginTop: '4px', display: 'block', color: '#64748B' }}>
                  10% of your subscription will go to this charity.
                </small>
              </label>
            )}

            <button className="action action-solid auth-submit" type="submit">
              Next: Choose Subscription
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

export default SignupDetails;
