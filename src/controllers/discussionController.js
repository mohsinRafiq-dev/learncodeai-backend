import Discussion from "../models/Discussion.js";
import User from "../models/User.js";

class DiscussionController {
  /**
   * Create a new discussion/question
   */
  async createDiscussion(req, res) {
    try {
      const { title, content, topic, tags, type, codeSnippets } = req.body;
      const userId = req.user._id;

      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: "Title and content are required",
        });
      }

      const discussion = new Discussion({
        title,
        content,
        topic: topic || "general",
        tags: tags || [],
        type: type || "question",
        codeSnippets: codeSnippets || [],
        author: userId,
      });

      await discussion.save();
      await discussion.populate("author", "username profilePicture");

      res.status(201).json({
        success: true,
        message: "Discussion created successfully",
        data: discussion,
      });
    } catch (error) {
      console.error("Error creating discussion:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create discussion",
        error: error.message,
      });
    }
  }

  /**
   * Get all discussions with filtering and pagination
   */
  async getDiscussions(req, res) {
    try {
      const {
        topic,
        type,
        status,
        tags,
        search,
        sortBy = "newest",
        page = 1,
        limit = 20,
      } = req.query;

      const filter = { isHidden: false };

      if (topic) filter.topic = topic;
      if (type) filter.type = type;
      if (status) filter.status = status;
      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : tags.split(",");
        filter.tags = { $in: tagArray };
      }
      if (search) {
        filter.$text = { $search: search };
      }

      // Sort options
      let sort = {};
      switch (sortBy) {
        case "newest":
          sort = { isPinned: -1, createdAt: -1 };
          break;
        case "oldest":
          sort = { isPinned: -1, createdAt: 1 };
          break;
        case "popular":
          sort = { isPinned: -1, viewCount: -1, createdAt: -1 };
          break;
        case "unanswered":
          filter.status = "open";
          filter.comments = { $size: 0 };
          sort = { isPinned: -1, createdAt: -1 };
          break;
        default:
          sort = { isPinned: -1, createdAt: -1 };
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const discussions = await Discussion.find(filter)
        .populate("author", "username profilePicture")
        .select("-comments.reports -reports")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Add computed fields
      const discussionsWithMeta = discussions.map((d) => ({
        ...d,
        voteScore: (d.upvotes?.length || 0) - (d.downvotes?.length || 0),
        commentCount: d.comments?.filter((c) => !c.isHidden).length || 0,
      }));

      const total = await Discussion.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: {
          discussions: discussionsWithMeta,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      console.error("Error fetching discussions:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch discussions",
        error: error.message,
      });
    }
  }

  /**
   * Get a single discussion by ID
   */
  async getDiscussion(req, res) {
    try {
      const { discussionId } = req.params;
      const userId = req.user?._id;

      const discussion = await Discussion.findById(discussionId)
        .populate("author", "username profilePicture")
        .populate("comments.author", "username profilePicture")
        .populate("hiddenBy", "username")
        .lean();

      if (!discussion) {
        return res.status(404).json({
          success: false,
          message: "Discussion not found",
        });
      }

      if (discussion.isHidden && (!userId || !req.user?.isAdmin)) {
        return res.status(403).json({
          success: false,
          message: "This discussion has been hidden by moderators",
        });
      }

      // Increment view count
      await Discussion.findByIdAndUpdate(discussionId, {
        $inc: { viewCount: 1 },
      });

      // Filter hidden comments for non-admins
      if (!req.user?.isAdmin) {
        discussion.comments = discussion.comments.filter((c) => !c.isHidden);
      }

      // Sort comments - accepted answer first, then by votes
      discussion.comments.sort((a, b) => {
        if (a.isAcceptedAnswer) return -1;
        if (b.isAcceptedAnswer) return 1;
        const aScore = (a.upvotes?.length || 0) - (a.downvotes?.length || 0);
        const bScore = (b.upvotes?.length || 0) - (b.downvotes?.length || 0);
        return bScore - aScore;
      });

      // Add vote scores
      discussion.voteScore =
        (discussion.upvotes?.length || 0) - (discussion.downvotes?.length || 0);
      discussion.comments = discussion.comments.map((c) => ({
        ...c,
        voteScore: (c.upvotes?.length || 0) - (c.downvotes?.length || 0),
      }));

      res.status(200).json({
        success: true,
        data: discussion,
      });
    } catch (error) {
      console.error("Error fetching discussion:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch discussion",
        error: error.message,
      });
    }
  }

  /**
   * Add a comment/answer to a discussion
   */
  async addComment(req, res) {
    try {
      const { discussionId } = req.params;
      const { content, codeSnippets } = req.body;
      const userId = req.user._id;

      if (!content) {
        return res.status(400).json({
          success: false,
          message: "Comment content is required",
        });
      }

      const discussion = await Discussion.findById(discussionId);

      if (!discussion) {
        return res.status(404).json({
          success: false,
          message: "Discussion not found",
        });
      }

      if (discussion.isLocked) {
        return res.status(403).json({
          success: false,
          message: "This discussion is locked",
        });
      }

      const newComment = {
        author: userId,
        content,
        codeSnippets: codeSnippets || [],
        upvotes: [],
        downvotes: [],
      };

      discussion.comments.push(newComment);
      await discussion.save();

      // Populate the new comment's author
      await discussion.populate("comments.author", "username profilePicture");

      const addedComment = discussion.comments[discussion.comments.length - 1];

      res.status(201).json({
        success: true,
        message: "Comment added successfully",
        data: addedComment,
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add comment",
        error: error.message,
      });
    }
  }

  /**
   * Vote on a discussion (upvote/downvote)
   */
  async voteDiscussion(req, res) {
    try {
      const { discussionId } = req.params;
      const { voteType } = req.body; // 'up', 'down', or 'none'
      const userId = req.user._id;

      const discussion = await Discussion.findById(discussionId);

      if (!discussion) {
        return res.status(404).json({
          success: false,
          message: "Discussion not found",
        });
      }

      // Remove existing votes
      discussion.upvotes = discussion.upvotes.filter(
        (id) => id.toString() !== userId.toString()
      );
      discussion.downvotes = discussion.downvotes.filter(
        (id) => id.toString() !== userId.toString()
      );

      // Add new vote
      if (voteType === "up") {
        discussion.upvotes.push(userId);
      } else if (voteType === "down") {
        discussion.downvotes.push(userId);
      }

      await discussion.save();

      const voteScore = discussion.upvotes.length - discussion.downvotes.length;

      res.status(200).json({
        success: true,
        message: "Vote recorded",
        data: {
          voteScore,
          userVote: voteType === "none" ? null : voteType,
        },
      });
    } catch (error) {
      console.error("Error voting on discussion:", error);
      res.status(500).json({
        success: false,
        message: "Failed to vote",
        error: error.message,
      });
    }
  }

  /**
   * Vote on a comment
   */
  async voteComment(req, res) {
    try {
      const { discussionId, commentId } = req.params;
      const { voteType } = req.body;
      const userId = req.user._id;

      const discussion = await Discussion.findById(discussionId);

      if (!discussion) {
        return res.status(404).json({
          success: false,
          message: "Discussion not found",
        });
      }

      const comment = discussion.comments.id(commentId);

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
        });
      }

      // Remove existing votes
      comment.upvotes = comment.upvotes.filter(
        (id) => id.toString() !== userId.toString()
      );
      comment.downvotes = comment.downvotes.filter(
        (id) => id.toString() !== userId.toString()
      );

      // Add new vote
      if (voteType === "up") {
        comment.upvotes.push(userId);
      } else if (voteType === "down") {
        comment.downvotes.push(userId);
      }

      await discussion.save();

      const voteScore = comment.upvotes.length - comment.downvotes.length;

      res.status(200).json({
        success: true,
        message: "Vote recorded",
        data: {
          voteScore,
          userVote: voteType === "none" ? null : voteType,
        },
      });
    } catch (error) {
      console.error("Error voting on comment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to vote",
        error: error.message,
      });
    }
  }

  /**
   * Accept an answer (only discussion author can do this)
   */
  async acceptAnswer(req, res) {
    try {
      const { discussionId, commentId } = req.params;
      const userId = req.user._id;

      const discussion = await Discussion.findById(discussionId);

      if (!discussion) {
        return res.status(404).json({
          success: false,
          message: "Discussion not found",
        });
      }

      if (discussion.author.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Only the discussion author can accept an answer",
        });
      }

      const comment = discussion.comments.id(commentId);

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
        });
      }

      // Remove accepted status from all comments
      discussion.comments.forEach((c) => {
        c.isAcceptedAnswer = false;
      });

      // Set this comment as accepted
      comment.isAcceptedAnswer = true;
      discussion.acceptedAnswer = comment._id;
      discussion.status = "answered";

      await discussion.save();

      res.status(200).json({
        success: true,
        message: "Answer accepted",
        data: { acceptedAnswerId: commentId },
      });
    } catch (error) {
      console.error("Error accepting answer:", error);
      res.status(500).json({
        success: false,
        message: "Failed to accept answer",
        error: error.message,
      });
    }
  }

  /**
   * Report a discussion or comment
   */
  async reportContent(req, res) {
    try {
      const { discussionId, commentId } = req.params;
      const { reason, description } = req.body;
      const userId = req.user._id;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: "Report reason is required",
        });
      }

      const discussion = await Discussion.findById(discussionId);

      if (!discussion) {
        return res.status(404).json({
          success: false,
          message: "Discussion not found",
        });
      }

      const report = {
        reporter: userId,
        reason,
        description: description || "",
        createdAt: new Date(),
      };

      if (commentId) {
        // Report a comment
        const comment = discussion.comments.id(commentId);
        if (!comment) {
          return res.status(404).json({
            success: false,
            message: "Comment not found",
          });
        }

        // Check if user already reported
        const alreadyReported = comment.reports?.some(
          (r) => r.reporter.toString() === userId.toString()
        );
        if (alreadyReported) {
          return res.status(400).json({
            success: false,
            message: "You have already reported this comment",
          });
        }

        comment.reports = comment.reports || [];
        comment.reports.push(report);
      } else {
        // Report the discussion
        const alreadyReported = discussion.reports?.some(
          (r) => r.reporter.toString() === userId.toString()
        );
        if (alreadyReported) {
          return res.status(400).json({
            success: false,
            message: "You have already reported this discussion",
          });
        }

        discussion.reports = discussion.reports || [];
        discussion.reports.push(report);
      }

      await discussion.save();

      res.status(200).json({
        success: true,
        message: "Report submitted successfully",
      });
    } catch (error) {
      console.error("Error reporting content:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit report",
        error: error.message,
      });
    }
  }

  /**
   * Edit a discussion (only author)
   */
  async editDiscussion(req, res) {
    try {
      const { discussionId } = req.params;
      const { title, content, tags, codeSnippets } = req.body;
      const userId = req.user._id;

      const discussion = await Discussion.findById(discussionId);

      if (!discussion) {
        return res.status(404).json({
          success: false,
          message: "Discussion not found",
        });
      }

      if (
        discussion.author.toString() !== userId.toString() &&
        !req.user.isAdmin
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only edit your own discussions",
        });
      }

      if (title) discussion.title = title;
      if (content) discussion.content = content;
      if (tags) discussion.tags = tags;
      if (codeSnippets) discussion.codeSnippets = codeSnippets;

      await discussion.save();
      await discussion.populate("author", "username profilePicture");

      res.status(200).json({
        success: true,
        message: "Discussion updated successfully",
        data: discussion,
      });
    } catch (error) {
      console.error("Error editing discussion:", error);
      res.status(500).json({
        success: false,
        message: "Failed to edit discussion",
        error: error.message,
      });
    }
  }

  /**
   * Edit a comment (only author)
   */
  async editComment(req, res) {
    try {
      const { discussionId, commentId } = req.params;
      const { content, codeSnippets } = req.body;
      const userId = req.user._id;

      const discussion = await Discussion.findById(discussionId);

      if (!discussion) {
        return res.status(404).json({
          success: false,
          message: "Discussion not found",
        });
      }

      const comment = discussion.comments.id(commentId);

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
        });
      }

      if (
        comment.author.toString() !== userId.toString() &&
        !req.user.isAdmin
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only edit your own comments",
        });
      }

      if (content) comment.content = content;
      if (codeSnippets) comment.codeSnippets = codeSnippets;
      comment.isEdited = true;
      comment.editedAt = new Date();

      await discussion.save();

      res.status(200).json({
        success: true,
        message: "Comment updated successfully",
        data: comment,
      });
    } catch (error) {
      console.error("Error editing comment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to edit comment",
        error: error.message,
      });
    }
  }

  /**
   * Delete a discussion (only author or admin)
   */
  async deleteDiscussion(req, res) {
    try {
      const { discussionId } = req.params;
      const userId = req.user._id;

      const discussion = await Discussion.findById(discussionId);

      if (!discussion) {
        return res.status(404).json({
          success: false,
          message: "Discussion not found",
        });
      }

      if (
        discussion.author.toString() !== userId.toString() &&
        !req.user.isAdmin
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only delete your own discussions",
        });
      }

      await Discussion.findByIdAndDelete(discussionId);

      res.status(200).json({
        success: true,
        message: "Discussion deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting discussion:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete discussion",
        error: error.message,
      });
    }
  }

  /**
   * Delete a comment (only author or admin)
   */
  async deleteComment(req, res) {
    try {
      const { discussionId, commentId } = req.params;
      const userId = req.user._id;

      const discussion = await Discussion.findById(discussionId);

      if (!discussion) {
        return res.status(404).json({
          success: false,
          message: "Discussion not found",
        });
      }

      const comment = discussion.comments.id(commentId);

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
        });
      }

      if (
        comment.author.toString() !== userId.toString() &&
        !req.user.isAdmin
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only delete your own comments",
        });
      }

      discussion.comments.pull(commentId);
      await discussion.save();

      res.status(200).json({
        success: true,
        message: "Comment deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete comment",
        error: error.message,
      });
    }
  }

  // ============== MODERATION ENDPOINTS ==============

  /**
   * Get reported content (admin only)
   */
  async getReportedContent(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Find discussions with reports
      const reportedDiscussions = await Discussion.find({
        $or: [
          { "reports.0": { $exists: true } },
          { "comments.reports.0": { $exists: true } },
        ],
      })
        .populate("author", "username profilePicture")
        .populate("comments.author", "username profilePicture")
        .populate("reports.reporter", "username")
        .populate("comments.reports.reporter", "username")
        .sort({ "reports.createdAt": -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Extract reports with context
      const reports = [];

      reportedDiscussions.forEach((discussion) => {
        // Discussion reports
        discussion.reports?.forEach((report) => {
          reports.push({
            type: "discussion",
            discussionId: discussion._id,
            discussionTitle: discussion.title,
            content: discussion.content.substring(0, 200),
            author: discussion.author,
            report,
            isHidden: discussion.isHidden,
          });
        });

        // Comment reports
        discussion.comments?.forEach((comment) => {
          comment.reports?.forEach((report) => {
            reports.push({
              type: "comment",
              discussionId: discussion._id,
              discussionTitle: discussion.title,
              commentId: comment._id,
              content: comment.content.substring(0, 200),
              author: comment.author,
              report,
              isHidden: comment.isHidden,
            });
          });
        });
      });

      // Sort by report date
      reports.sort(
        (a, b) => new Date(b.report.createdAt) - new Date(a.report.createdAt)
      );

      res.status(200).json({
        success: true,
        data: {
          reports: reports.slice(0, parseInt(limit)),
          total: reports.length,
        },
      });
    } catch (error) {
      console.error("Error fetching reported content:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch reported content",
        error: error.message,
      });
    }
  }

  /**
   * Hide/unhide content (admin only)
   */
  async moderateContent(req, res) {
    try {
      const { discussionId, commentId } = req.params;
      const { action, reason } = req.body; // action: 'hide' or 'unhide'
      const adminId = req.user._id;

      const discussion = await Discussion.findById(discussionId);

      if (!discussion) {
        return res.status(404).json({
          success: false,
          message: "Discussion not found",
        });
      }

      if (commentId) {
        // Moderate comment
        const comment = discussion.comments.id(commentId);
        if (!comment) {
          return res.status(404).json({
            success: false,
            message: "Comment not found",
          });
        }

        comment.isHidden = action === "hide";
        comment.hiddenReason = action === "hide" ? reason : undefined;
        comment.hiddenBy = action === "hide" ? adminId : undefined;
      } else {
        // Moderate discussion
        discussion.isHidden = action === "hide";
        discussion.hiddenReason = action === "hide" ? reason : undefined;
        discussion.hiddenBy = action === "hide" ? adminId : undefined;
      }

      await discussion.save();

      res.status(200).json({
        success: true,
        message: `Content ${
          action === "hide" ? "hidden" : "unhidden"
        } successfully`,
      });
    } catch (error) {
      console.error("Error moderating content:", error);
      res.status(500).json({
        success: false,
        message: "Failed to moderate content",
        error: error.message,
      });
    }
  }

  /**
   * Lock/unlock a discussion (admin only)
   */
  async lockDiscussion(req, res) {
    try {
      const { discussionId } = req.params;
      const { lock } = req.body;

      const discussion = await Discussion.findByIdAndUpdate(
        discussionId,
        { isLocked: lock },
        { new: true }
      );

      if (!discussion) {
        return res.status(404).json({
          success: false,
          message: "Discussion not found",
        });
      }

      res.status(200).json({
        success: true,
        message: `Discussion ${lock ? "locked" : "unlocked"} successfully`,
      });
    } catch (error) {
      console.error("Error locking discussion:", error);
      res.status(500).json({
        success: false,
        message: "Failed to lock discussion",
        error: error.message,
      });
    }
  }

  /**
   * Pin/unpin a discussion (admin only)
   */
  async pinDiscussion(req, res) {
    try {
      const { discussionId } = req.params;
      const { pin } = req.body;

      const discussion = await Discussion.findByIdAndUpdate(
        discussionId,
        { isPinned: pin },
        { new: true }
      );

      if (!discussion) {
        return res.status(404).json({
          success: false,
          message: "Discussion not found",
        });
      }

      res.status(200).json({
        success: true,
        message: `Discussion ${pin ? "pinned" : "unpinned"} successfully`,
      });
    } catch (error) {
      console.error("Error pinning discussion:", error);
      res.status(500).json({
        success: false,
        message: "Failed to pin discussion",
        error: error.message,
      });
    }
  }

  /**
   * Dismiss a report (admin only)
   */
  async dismissReport(req, res) {
    try {
      const { discussionId, commentId, reportId } = req.params;

      const discussion = await Discussion.findById(discussionId);

      if (!discussion) {
        return res.status(404).json({
          success: false,
          message: "Discussion not found",
        });
      }

      if (commentId) {
        const comment = discussion.comments.id(commentId);
        if (comment) {
          comment.reports = comment.reports.filter(
            (r) => r._id.toString() !== reportId
          );
        }
      } else {
        discussion.reports = discussion.reports.filter(
          (r) => r._id.toString() !== reportId
        );
      }

      await discussion.save();

      res.status(200).json({
        success: true,
        message: "Report dismissed",
      });
    } catch (error) {
      console.error("Error dismissing report:", error);
      res.status(500).json({
        success: false,
        message: "Failed to dismiss report",
        error: error.message,
      });
    }
  }

  /**
   * Get forum statistics (admin)
   */
  async getForumStats(req, res) {
    try {
      const totalDiscussions = await Discussion.countDocuments({
        isHidden: false,
      });
      const openQuestions = await Discussion.countDocuments({
        status: "open",
        type: "question",
        isHidden: false,
      });
      const answeredQuestions = await Discussion.countDocuments({
        status: "answered",
        type: "question",
        isHidden: false,
      });

      // Get discussions by topic
      const topicStats = await Discussion.aggregate([
        { $match: { isHidden: false } },
        { $group: { _id: "$topic", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      // Get recent activity
      const recentActivity = await Discussion.find({ isHidden: false })
        .sort({ updatedAt: -1 })
        .limit(10)
        .select("title topic createdAt updatedAt")
        .lean();

      // Pending reports count
      const pendingReports = await Discussion.countDocuments({
        $or: [
          { "reports.0": { $exists: true } },
          { "comments.reports.0": { $exists: true } },
        ],
      });

      res.status(200).json({
        success: true,
        data: {
          totalDiscussions,
          openQuestions,
          answeredQuestions,
          topicStats,
          recentActivity,
          pendingReports,
        },
      });
    } catch (error) {
      console.error("Error fetching forum stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch stats",
        error: error.message,
      });
    }
  }
}

export default new DiscussionController();
