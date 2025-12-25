import NewsletterSubscription from "../models/NewsletterSubscription.js";
import emailService from "../services/emailService.js";

// Subscribe to newsletter
export const subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Email is required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: "error",
        message: "Please provide a valid email address",
      });
    }

    // Get request metadata
    const ipAddress = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    // Check if email already exists
    let subscription = await NewsletterSubscription.findOne({ email: email.toLowerCase() });

    if (subscription) {
      if (subscription.isActive) {
        return res.status(200).json({
          status: "success",
          message: "You're already subscribed to LearnCode AI newsletter! Thanks for your continued interest. 🎉",
        });
      } else {
        // Reactivate subscription
        subscription.isActive = true;
        subscription.subscribedAt = new Date();
        subscription.unsubscribedAt = null;
        subscription.ipAddress = ipAddress;
        subscription.userAgent = userAgent;
        await subscription.save();
      }
    } else {
      // Create new subscription
      subscription = await NewsletterSubscription.create({
        email: email.toLowerCase(),
        ipAddress,
        userAgent,
      });
    }

    // Send welcome email
    try {
      const welcomeMessage = `
        <h2>Welcome to LearnCode AI Newsletter! 🎉</h2>
        <p>Thank you for subscribing to our newsletter. You've successfully joined the LearnCode AI community!</p>
        <p>You can expect to receive:</p>
        <ul>
          <li>🚀 Latest coding tutorials and tips</li>
          <li>📚 New course announcements</li>
          <li>💡 Programming insights and best practices</li>
          <li>🔧 Tool recommendations and resources</li>
        </ul>
        <p>We're excited to help you on your coding journey!</p>
        <p>Happy coding!</p>
        <p><strong>The LearnCode AI Team</strong></p>
      `;

      await emailService.sendCustomEmail(
        email,
        "Welcome to LearnCode AI Newsletter! 🎉",
        welcomeMessage,
        "Subscriber"
      );
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail the request if email fails, but log it
    }

    res.status(201).json({
      status: "success",
      message: "You have successfully subscribed to LearnCode AI newsletter!",
      data: {
        subscriptionId: subscription._id,
        email: subscription.email,
        subscribedAt: subscription.subscribedAt,
      },
    });

  } catch (error) {
    console.error("Newsletter subscription error:", error);
    
    // Handle duplicate email error specifically
    if (error.code === 11000) {
      return res.status(200).json({
        status: "success",
        message: "You're already subscribed to LearnCode AI newsletter! Thanks for your continued interest. 🎉",
      });
    }

    res.status(500).json({
      status: "error",
      message: "An error occurred while processing your subscription",
    });
  }
};

// Unsubscribe from newsletter
export const unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Email is required",
      });
    }

    const subscription = await NewsletterSubscription.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    });

    if (!subscription) {
      return res.status(404).json({
        status: "error",
        message: "Email not found in our subscription list",
      });
    }

    // Deactivate subscription
    subscription.isActive = false;
    subscription.unsubscribedAt = new Date();
    await subscription.save();

    res.status(200).json({
      status: "success",
      message: "You have been successfully unsubscribed from our newsletter",
    });

  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);
    res.status(500).json({
      status: "error",
      message: "An error occurred while processing your unsubscription",
    });
  }
};

// Get subscription status (for checking if email is subscribed)
export const getStatus = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Email is required",
      });
    }

    const subscription = await NewsletterSubscription.findOne({ 
      email: email.toLowerCase() 
    });

    res.status(200).json({
      status: "success",
      data: {
        isSubscribed: subscription ? subscription.isActive : false,
        subscribedAt: subscription?.subscribedAt || null,
      },
    });

  } catch (error) {
    console.error("Newsletter status check error:", error);
    res.status(500).json({
      status: "error",
      message: "An error occurred while checking subscription status",
    });
  }
};
