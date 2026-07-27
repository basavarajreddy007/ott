const Channel = require("../models/Channel");
const ChannelSubscription = require("../models/ChannelSubscription");
const Playlist = require("../models/Playlist");
const Movie = require("../models/Movie");
const ChannelAnalytics = require("../models/ChannelAnalytics");

// Create or Get Current User's Channel
exports.createOrGetMyChannel = async (req, res) => {
  try {
    let channel = await Channel.findOne({ owner: req.user._id, isDeleted: false });
    if (!channel) {
      const sanitizedName = req.user.name + "'s Channel";
      const baseUsername = req.user.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const username = baseUsername + "_" + Math.floor(100 + Math.random() * 900);
      
      channel = await Channel.create({
        owner: req.user._id,
        name: sanitizedName,
        username: username,
        slug: username,
        avatar: req.user.avatar || "",
        description: "Welcome to my Creator Channel! More streaming content coming soon."
      });
    }
    return res.status(200).json({ success: true, data: channel });
  } catch (error) {
    console.error("createOrGetMyChannel error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get Public Channel Profile
exports.getChannelBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const channel = await Channel.findOne({ slug, isDeleted: false, isSuspended: false })
      .populate("primaryGenre");
      
    if (!channel) {
      return res.status(404).json({ success: false, message: "Channel not found" });
    }
    return res.status(200).json({ success: true, data: channel });
  } catch (error) {
    console.error("getChannelBySlug error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update Channel Profile (Owner Only)
exports.updateChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const channel = await Channel.findById(id);

    if (!channel) {
      return res.status(404).json({ success: false, message: "Channel not found" });
    }

    if (channel.owner.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to update this channel" });
    }

    const { name, description, avatar, banner, socialLinks, contactEmail, themeColor, featuredTrailer } = req.body;

    if (name) channel.name = name;
    if (description !== undefined) channel.description = description;
    if (avatar) channel.avatar = avatar;
    if (banner) channel.banner = banner;
    if (socialLinks) channel.socialLinks = socialLinks;
    if (contactEmail !== undefined) channel.contactEmail = contactEmail;
    if (themeColor) channel.themeColor = themeColor;
    if (featuredTrailer) channel.featuredTrailer = featuredTrailer;

    await channel.save();
    return res.status(200).json({ success: true, data: channel });
  } catch (error) {
    console.error("updateChannel error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Subscribe to a Channel
exports.subscribeToChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const { preference = "all", source = "channel_page" } = req.body;

    const channel = await Channel.findById(id);
    if (!channel || channel.isDeleted || channel.isSuspended) {
      return res.status(404).json({ success: false, message: "Channel not found" });
    }

    if (channel.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot subscribe to your own channel" });
    }

    let sub = await ChannelSubscription.findOne({ user: req.user._id, channel: id });
    if (sub) {
      sub.notificationPreference = preference;
      await sub.save();
    } else {
      sub = await ChannelSubscription.create({
        user: req.user._id,
        channel: id,
        notificationPreference: preference,
        subscriptionSource: source
      });
      channel.subscribersCount += 1;
      await channel.save();
    }

    return res.status(200).json({ success: true, message: "Subscribed successfully", data: sub });
  } catch (error) {
    console.error("subscribeToChannel error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Unsubscribe from a Channel
exports.unsubscribeFromChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const channel = await Channel.findById(id);
    if (!channel) {
      return res.status(404).json({ success: false, message: "Channel not found" });
    }

    const sub = await ChannelSubscription.findOneAndDelete({ user: req.user._id, channel: id });
    if (sub) {
      channel.subscribersCount = Math.max(0, channel.subscribersCount - 1);
      await channel.save();
    }

    return res.status(200).json({ success: true, message: "Unsubscribed successfully" });
  } catch (error) {
    console.error("unsubscribeFromChannel error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get User's Active Subscriptions
exports.getMySubscriptions = async (req, res) => {
  try {
    const subs = await ChannelSubscription.find({ user: req.user._id })
      .populate({
        path: "channel",
        select: "name username avatar slug verifiedBadge subscribersCount"
      });
    return res.status(200).json({ success: true, data: subs });
  } catch (error) {
    console.error("getMySubscriptions error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get Content Uploaded by Channel
exports.getChannelVideos = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20, page = 1 } = req.query;

    const channel = await Channel.findById(id);
    if (!channel) {
      return res.status(404).json({ success: false, message: "Channel not found" });
    }

    const movies = await Movie.find({ uploadedBy: channel.owner, isActive: true })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("genres");

    const total = await Movie.countDocuments({ uploadedBy: channel.owner, isActive: true });

    return res.status(200).json({
      success: true,
      data: movies,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("getChannelVideos error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get Channel Analytics (Creator Only)
exports.getChannelAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const channel = await Channel.findById(id);
    if (!channel) {
      return res.status(404).json({ success: false, message: "Channel not found" });
    }

    if (channel.owner.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // Dynamic stats aggregation
    const videos = await Movie.find({ uploadedBy: channel.owner });
    const totalViews = videos.reduce((acc, v) => acc + (v.views || 0), 0);
    const totalLikes = videos.reduce((acc, v) => acc + (v.likes?.length || 0), 0);

    // Mock analytics timeseries mapping (in production populated by chron logs)
    const timeseries = Array.from({ length: 7 }).map((_, idx) => {
      const date = new Date();
      date.setDate(date.getDate() - idx);
      return {
        date: date.toISOString().split("T")[0],
        views: Math.floor(50 + Math.random() * 200),
        watchTime: Math.floor(120 + Math.random() * 400),
        subscribersGrowth: Math.floor(1 + Math.random() * 10)
      };
    }).reverse();

    return res.status(200).json({
      success: true,
      data: {
        viewsCount: totalViews || channel.viewsCount,
        subscribersCount: channel.subscribersCount,
        videosCount: videos.length,
        likesCount: totalLikes,
        timeseries,
        trafficSources: [
          { source: "Homepage Recommendations", views: Math.floor(totalViews * 0.45) },
          { source: "Subscriptions Feed", views: Math.floor(totalViews * 0.3) },
          { source: "Direct Search", views: Math.floor(totalViews * 0.15) },
          { source: "Playlists", views: Math.floor(totalViews * 0.1) }
        ],
        devices: [
          { type: "Mobile App", views: Math.floor(totalViews * 0.55) },
          { type: "Desktop Web", views: Math.floor(totalViews * 0.35) },
          { type: "Smart TV", views: Math.floor(totalViews * 0.1) }
        ]
      }
    });
  } catch (error) {
    console.error("getChannelAnalytics error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Search channels
exports.searchChannels = async (req, res) => {
  try {
    const { q = "" } = req.query;
    const channels = await Channel.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { username: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } }
      ],
      isDeleted: false,
      isSuspended: false
    }).limit(10);
    return res.status(200).json({ success: true, data: channels });
  } catch (error) {
    console.error("searchChannels error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
