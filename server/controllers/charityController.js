const User = require("../models/User");

exports.updateSelectedCharity = async (req, res) => {
    try {
        const { charityId } = req.body;
        const userId = req.user.id;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { selectedCharityId: charityId },
            { new: true }
        );

        res.status(200).json({ success: true, selectedCharityId: updatedUser.selectedCharityId });
    } catch (error) {
        console.error("Charity Selection Error:", error);
        res.status(500).json({ success: false, message: "Failed to update selected cause" });
    }
};