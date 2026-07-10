const Winning = require("../models/Winning");
const { uploadImageToCloudinary } = require("../config/cloudinary");

// User uploads proof
exports.uploadWinningProof = async (req, res) => {
    try {
        const { winningId } = req.body;
        const file = req.files.proofImage; // Assuming express-fileupload middleware
        const userId = req.user.id;

        const winning = await Winning.findById(winningId);

        if (!winning || winning.user.toString() !== userId) {
            return res.status(404).json({ success: false, message: "Winning record not found." });
        }

        if (winning.status !== "pending_proof") {
            return res.status(400).json({ success: false, message: "Proof already submitted or verified." });
        }

        // Upload to Cloudinary
        const uploadDetails = await uploadImageToCloudinary(file, process.env.CLOUDINARY_FOLDER_PROOFS);
        
        winning.proofUrl = uploadDetails.secure_url;
        winning.status = "pending_verification";
        await winning.save();

        res.status(200).json({
            success: true,
            message: "Proof uploaded successfully. Pending Admin verification.",
            winning
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Admin verifies/rejects proof
exports.verifyWinning = async (req, res) => {
    try {
        const { winningId, action } = req.body; // action: 'approve' or 'reject'
        
        if (req.user.accountType !== "Admin") {
            return res.status(403).json({ success: false, message: "Unauthorized: Admin only." });
        }

        const status = action === "approve" ? "verified" : "rejected";
        const winning = await Winning.findByIdAndUpdate(winningId, { status }, { new: true });

        res.status(200).json({
            success: true,
            message: `Winning claim ${action}ed successfully.`,
            winning
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
