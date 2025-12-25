import Contact from "../models/Contact.js";
import emailService from "../services/emailService.js";

// Submit a contact form
export const submitContact = async (req, res) => {
  try {
    const { fullName, email, subject, message } = req.body;

    // Validation
    if (!fullName || !email || !subject || !message) {
      return res.status(400).json({
        status: "error",
        message: "All fields are required",
      });
    }

    // Get user info if authenticated
    const userId = req.user?._id || null;

    // Get request metadata
    const ipAddress =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    // Create contact submission
    const contact = await Contact.create({
      fullName,
      email,
      subject,
      message,
      userId,
      ipAddress,
      userAgent,
    });

    // Send confirmation email to user
    try {
      await emailService.sendContactConfirmation(email, fullName, subject);
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the request if email fails
    }

    // Send notification to admin (optional)
    try {
      await emailService.sendContactNotification({
        fullName,
        email,
        subject,
        message,
        contactId: contact._id,
      });
    } catch (emailError) {
      console.error("Failed to send admin notification:", emailError);
    }

    res.status(201).json({
      status: "success",
      message: "Your message has been sent successfully. We'll get back to you soon!",
      data: {
        contactId: contact._id,
      },
    });
  } catch (error) {
    console.error("Error submitting contact form:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors,
      });
    }

    res.status(500).json({
      status: "error",
      message: "Failed to submit contact form. Please try again later.",
    });
  }
};

// Get all contact submissions (Admin only)
export const getAllContacts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    const contacts = await Contact.find(query)
      .populate("userId", "username email")
      .populate("respondedBy", "username email")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Contact.countDocuments(query);

    res.status(200).json({
      status: "success",
      data: {
        contacts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch contact submissions",
    });
  }
};

// Get single contact submission (Admin only)
export const getContactById = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findById(id)
      .populate("userId", "username email")
      .populate("respondedBy", "username email");

    if (!contact) {
      return res.status(404).json({
        status: "error",
        message: "Contact submission not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: { contact },
    });
  } catch (error) {
    console.error("Error fetching contact:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch contact submission",
    });
  }
};

// Update contact status (Admin only)
export const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, response } = req.body;

    const validStatuses = ["pending", "in-progress", "resolved", "closed"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid status value",
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (response) {
      updateData.response = response;
      updateData.respondedAt = new Date();
      updateData.respondedBy = req.user._id;
    }

    const contact = await Contact.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!contact) {
      return res.status(404).json({
        status: "error",
        message: "Contact submission not found",
      });
    }

    // Send response email to user if response is provided
    if (response) {
      try {
        await emailService.sendContactResponse(
          contact.email,
          contact.fullName,
          contact.subject,
          response
        );
      } catch (emailError) {
        console.error("Failed to send response email:", emailError);
      }
    }

    res.status(200).json({
      status: "success",
      message: "Contact submission updated successfully",
      data: { contact },
    });
  } catch (error) {
    console.error("Error updating contact:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update contact submission",
    });
  }
};

// Reply to contact submission (Admin only)
export const replyToContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        status: "error",
        message: "Subject and message are required",
      });
    }

    const contact = await Contact.findById(id);

    if (!contact) {
      return res.status(404).json({
        status: "error",
        message: "Contact submission not found",
      });
    }

    // Send reply email to user
    try {
      await emailService.sendContactReply({
        to: contact.email,
        recipientName: contact.fullName,
        originalSubject: contact.subject,
        subject,
        message,
        adminName: req.user.username || "LearnCode AI Admin"
      });
    } catch (emailError) {
      console.error("Failed to send reply email:", emailError);
      return res.status(500).json({
        status: "error",
        message: "Failed to send reply email",
      });
    }

    // Update contact status and response
    const updateData = {
      status: 'replied',
      response: message,
      respondedAt: new Date(),
      respondedBy: req.user._id,
    };

    const updatedContact = await Contact.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("userId", "username email")
      .populate("respondedBy", "username email");

    res.status(200).json({
      status: "success",
      message: "Reply sent successfully",
      data: { contact: updatedContact },
    });
  } catch (error) {
    console.error("Error replying to contact:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to send reply",
    });
  }
};

// Delete contact submission (Admin only)
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findByIdAndDelete(id);

    if (!contact) {
      return res.status(404).json({
        status: "error",
        message: "Contact submission not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Contact submission deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to delete contact submission",
    });
  }
};

