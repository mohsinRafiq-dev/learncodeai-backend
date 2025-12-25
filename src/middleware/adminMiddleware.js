// Admin middleware to verify admin role
const adminMiddleware = (req, res, next) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized - Please login first" });
  }

  // Check if user has admin role
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }

  next();
};

export default adminMiddleware;

