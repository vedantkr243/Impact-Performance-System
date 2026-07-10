import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { refreshSession } from "../features/auth/authSlice";
import { dashboardService } from "../services/dashboardService";

function ProfilePage() {
  const dispatch = useAppDispatch();
  const { token, user } = useAppSelector((state) => state.auth);
  const [formState, setFormState] = useState({ name: "", email: "", contactNumber: "" });
  const [photoFile, setPhotoFile] = useState(null);
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormState({
        name: user.name || "",
        email: user.email || "",
        contactNumber: user.contactNumber || ""
      });
    }
  }, [user]);

  const displayName = useMemo(() => formState.name || user?.name || "Player", [formState.name, user]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswords((current) => ({ ...current, [name]: value }));
  };

  const handlePhotoChange = (event) => {
    setPhotoFile(event.target.files?.[0] || null);
    setStatusMessage(null);
    setErrorMessage(null);
  };

  const handleProfileSave = async () => {
    setStatusMessage(null);
    setErrorMessage(null);
    setIsSaving(true);

    try {
      if (!token) throw new Error("Authentication required.");

      const response = await dashboardService.updateProfile(token, {
        name: formState.name,
        contactNumber: formState.contactNumber
      });

      if (response?.success) {
        setStatusMessage("Profile saved successfully.");
        dispatch(refreshSession());
      }
    } catch (error) {
      setErrorMessage(error.message || "Unable to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadPhoto = async () => {
    if (!photoFile) {
      setErrorMessage("Select a profile photo before uploading.");
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);
    setIsSaving(true);

    try {
      const response = await dashboardService.uploadProfilePhoto(token, photoFile);

      if (response?.success) {
        setStatusMessage("Profile photo uploaded successfully.");
        dispatch(refreshSession());
      }
    } catch (error) {
      setErrorMessage(error.message || "Unable to upload profile photo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setErrorMessage("Fill in all password fields.");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setErrorMessage("New password and confirmation must match.");
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);
    setIsSaving(true);

    try {
      const response = await dashboardService.changePassword(token, {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
        confirmPassword: passwords.confirmPassword
      });

      if (response?.success) {
        setStatusMessage("Password updated successfully.");
        setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (error) {
      setErrorMessage(error.message || "Unable to change password.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-5 sm:p-8 lg:p-10">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold">Profile</h1>
          <p className="mt-2 text-slate-500">Manage your account, upload a profile photo, and change your password.</p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative h-28 w-28 overflow-hidden rounded-full bg-slate-100">
              <img
                src={user?.image || "/images/default-avatar.png"}
                alt={`${displayName} avatar`}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{displayName}</h2>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <label className="block text-sm font-medium text-slate-700">Profile photo</label>
            <input type="file" accept="image/*" onChange={handlePhotoChange} className="block w-full rounded-xl border border-slate-200 p-3" />
            <button
              type="button"
              disabled={isSaving}
              onClick={handleUploadPhoto}
              className="w-full rounded-xl bg-[#0F766E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#115E59] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Upload photo
            </button>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Account details</h2>
            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Name</span>
                <input
                  name="name"
                  value={formState.name}
                  onChange={handleInputChange}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <input
                  value={formState.email}
                  disabled
                  readOnly
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Contact number</span>
                <input
                  name="contactNumber"
                  value={formState.contactNumber}
                  onChange={handleInputChange}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                />
              </label>
            </div>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleProfileSave}
              className="mt-6 rounded-xl bg-[#0F766E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#115E59] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Save details
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Change password</h2>
            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Current password</span>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwords.currentPassword}
                  onChange={handlePasswordChange}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">New password</span>
                <input
                  type="password"
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handlePasswordChange}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Confirm new password</span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={handlePasswordChange}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                />
              </label>
            </div>
            <button
              type="button"
              disabled={isSaving}
              onClick={handlePasswordSave}
              className="mt-6 rounded-xl bg-[#0F766E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#115E59] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Change password
            </button>
          </div>

          {(statusMessage || errorMessage) && (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm">
              {statusMessage ? (
                <p className="text-green-700">{statusMessage}</p>
              ) : (
                <p className="text-red-700">{errorMessage}</p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default ProfilePage;
