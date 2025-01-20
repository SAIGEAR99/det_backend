const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.search = async (req, res) => {
    const { query, page = 1, limit = 10 } = req.query;
  
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
  
    const skip = (page - 1) * limit;
  
    try {
      const users = await prisma.users.findMany({
        where: {
          OR: [
            { username: { contains: query } }, 
            { bio: { contains: query } },
          ],
        },
        take: parseInt(limit),
        skip,
        select: {
          user_id: true,
          username: true,
          bio: true,
          profile_img: true,
          _count: {
            select: { follows_follows_following_idTousers: true },
          },
        },
      });
  
      const response = users.map((user) => ({
        user_id: user.user_id,
        username: user.username,
        bio: user.bio || '',
        profile_img: user.profile_img
          ? `${req.protocol}://${req.get('host')}/det/img/profile/${user.user_id}`
          : `${req.protocol}://${req.get('host')}/det/img/profile/default.jpg`,
        followers: user._count.follows_follows_following_idTousers || 0,
      }));
  
      res.status(200).json(response);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  