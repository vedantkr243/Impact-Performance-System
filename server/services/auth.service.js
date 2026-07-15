const jwt = require("jsonwebtoken");

const env = require("../config/env");
const ApiError = require("../utils api-error");
const { hashPassword, comparePassword } = require("../utils/password");
const { uploadImage } = require("../utils/fileUpload");
const { isUsingMemoryStore } = require("../config/database");
const memoryStore = require("../dev/memoryStore");
const User = require("../models/auth.model");
const Subscription = require("../modules/billing/billing.model");
const { ACTIVE_SUBSCRIPTION_STATUSES } = require("../modules/billing/billing.constants");
const { assertEmailVerified } = require("./auth.otp.service");
const normalizeRole = require("../utils/normalize-role");

const DEFAULT_AVATAR = "/images/default-avatar.png";

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role || "user",
  accountType: user.accountType || "Student",
  contactNumber: user.contactNumber || null,
  image: user.image || DEFAULT_AVATAR,
  createdAt: user.createdAt
});

const buildAuthResponse = async (user) => {
  const token = jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role || "user"
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

  let activeSubscription = null;

  if (!isUsingMemoryStore()) {
    activeSubscription = await Subscription.findOne({
      userId: user._id,
      status: { $in: ACTIVE_SUBSCRIPTION_STATUSES }
    }).sort({ createdAt: -1 });
  } else {
    activeSubscription = memoryStore.findSubscriptionByUserId?.(user._id) || null;
  }

  return {
    token,
    user: serializeUser(user),
    subscription: activeSubscription
      ? {
          id: activeSubscription._id,
          planCode: activeSubscription.planCode,
          status: activeSubscription.status,
          currentPeriodEnd: activeSubscription.currentPeriodEnd,
          charityRevenueShare: activeSubscription.charityRevenueShare
        }
      : null,
    hasActiveSubscription: !!activeSubscription
  };
};

const signup = async ({ name, firstName, lastName, email, password, role, accountType, contactNumber, selectedCharityName }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const resolvedName = (name || [firstName, lastName].filter(Boolean).join(" ")).trim();
  const resolvedRole = normalizeRole(role || accountType);
  const resolvedAccountType = accountType || role || "user";

  await assertEmailVerified(normalizedEmail);

  const useMemory = isUsingMemoryStore();
  console.log(`[auth] signup for ${normalizedEmail} using ${useMemory ? "memory" : "mongodb"} store`);

  if (useMemory) {
    if (memoryStore.findUserByEmail(normalizedEmail)) {
      throw new ApiError(409, "An account with this email already exists.");
    }

    const passwordHash = await hashPassword(password);
    const user = memoryStore.createUser({
      name: resolvedName,
      email: normalizedEmail,
      passwordHash,
      role: resolvedRole,
      accountType: resolvedAccountType,
      contactNumber: contactNumber || null,
      image: DEFAULT_AVATAR
    });

    return buildAuthResponse(user);
  }

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists.");
  }

  const passwordHash = await hashPassword(password);

  let selectedCharityId = null;
  if (selectedCharityName && resolvedRole !== "charity") {
    const charityUser = await User.findOne({ name: selectedCharityName, role: "charity" });
    if (charityUser) {
      selectedCharityId = charityUser._id;
    }
  }

  const user = await User.create({
    name: resolvedName,
    email: normalizedEmail,
    passwordHash,
    role: resolvedRole,
    accountType: resolvedAccountType,
    contactNumber: contactNumber || null,
    selectedCharityId,
    isCharity: resolvedRole === "charity",
    image: DEFAULT_AVATAR
  });

  return buildAuthResponse(user);
};
const auth0SignIn = async ({email}) => {
  const user = await User.findOne({ email: email });
  if (!user) {
    throw new ApiError(401, "Invalid email.");
    console.log("User not found for email:", email); // Debugging log
  }
  return buildAuthResponse(user);
}
const login = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  if (isUsingMemoryStore()) {
    const user = memoryStore.findUserByEmail(normalizedEmail);
  
    if (!user) {
      throw new ApiError(401, "Invalid email or password.");
    }

    const passwordMatches = await comparePassword(password, user.passwordHash);

    if (!passwordMatches) {
      throw new ApiError(401, "Invalid email or password.");
    }

    return buildAuthResponse(user);
};

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new ApiError(401, "Invalid email.");
    console.log("User not found for email:", normalizedEmail); // Debugging log
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);
  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password.");
  }

  return buildAuthResponse(user);
};

const getCurrentUser = async (userId) => {
  if (isUsingMemoryStore()) {
    const user = memoryStore.findUserById(userId);

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || "user",
      accountType: user.accountType || "user",
      contactNumber: user.contactNumber || null,
      image: user.image || DEFAULT_AVATAR,
      createdAt: user.createdAt,
      subscription: null,
      hasActiveSubscription: false
    };
  }

  const user = await User.findById(userId).select("-passwordHash");

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const activeSubscription = await Subscription.findOne({
    userId: user._id,
    status: { $in: ACTIVE_SUBSCRIPTION_STATUSES }
  }).sort({ createdAt: -1 });

  return {
    ...serializeUser(user),
    subscription: activeSubscription
      ? {
          id: activeSubscription._id,
          planCode: activeSubscription.planCode,
          status: activeSubscription.status,
          currentPeriodEnd: activeSubscription.currentPeriodEnd,
          charityRevenueShare: activeSubscription.charityRevenueShare
        }
      : null,
    hasActiveSubscription: !!activeSubscription
  };
};

const updateProfile = async (userId, { name, contactNumber }) => {
  if (isUsingMemoryStore()) {
    const user = memoryStore.findUserById(userId);
    if (!user) throw new ApiError(404, "User not found.");
    if (name) user.name = name.trim();
    if (contactNumber !== undefined) user.contactNumber = contactNumber || null;
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      contactNumber: user.contactNumber,
      image: user.image || DEFAULT_AVATAR
    };
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      ...(name ? { name: name.trim() } : {}),
      ...(contactNumber !== undefined ? { contactNumber: contactNumber || null } : {})
    },
    { new: true }
  ).select("-passwordHash");

  if (!updatedUser) {
    throw new ApiError(404, "User not found.");
  }

  return updatedUser;
};

const uploadProfilePhoto = async (userId, files = {}) => {
  const photoFile = files?.photo || files?.file || files?.image;
  if (!photoFile) {
    throw new ApiError(400, "Profile photo is required.");
  }

  const imageUrl = await uploadImage(photoFile, "profiles");

  if (isUsingMemoryStore()) {
    const user = memoryStore.findUserById(userId);
    if (!user) throw new ApiError(404, "User not found.");
    user.image = imageUrl || user.image;
    return { image: user.image };
  }

  const updatedUser = await User.findByIdAndUpdate(userId, { image: imageUrl }, { new: true }).select("-passwordHash");
  if (!updatedUser) {
    throw new ApiError(404, "User not found.");
  }

  return { image: updatedUser.image };
};

const changePassword = async (userId, payload = {}) => {
  const { currentPassword, newPassword, confirmPassword } = payload;

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new ApiError(400, "All password fields are required.");
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "New password and confirmation must match.");
  }

  if (isUsingMemoryStore()) {
    const user = memoryStore.findUserById(userId);
    if (!user) throw new ApiError(404, "User not found.");

    const matches = await comparePassword(currentPassword, user.passwordHash);
    if (!matches) {
      throw new ApiError(401, "Current password is incorrect.");
    }

    user.passwordHash = await hashPassword(newPassword);
    return { success: true };
  }

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found.");

  const matches = await comparePassword(currentPassword, user.passwordHash);
  if (!matches) {
    throw new ApiError(401, "Current password is incorrect.");
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  return { success: true };
};

module.exports = {
  signup,
  login,
  getCurrentUser,
  updateProfile,
  uploadProfilePhoto,
  changePassword,
  auth0SignIn
};
