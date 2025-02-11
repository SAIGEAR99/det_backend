const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.search = async (req, res) => {
    const { query, user_id, page = 1, limit = 10 } = req.query;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    const skip = (page - 1) * limit;

    try {
        // ✅ ดึงข้อมูลผู้ใช้ที่ค้นหา
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

        let followingIds = [];

        // ✅ ถ้ามี `user_id` ให้ตรวจสอบว่าติดตามใครบ้าง
        if (user_id) {
            const following = await prisma.follows.findMany({
                where: { follower_id: parseInt(user_id) },
                select: { following_id: true },
            });

            followingIds = following.map(f => f.following_id); // ดึงเฉพาะ `following_id`
        }

        // ✅ สร้าง response โดยเพิ่ม `is_following`
        const response = users.map((user) => ({
            user_id: user.user_id,
            username: user.username,
            bio: user.bio || '',
            profile_img: user.profile_img
                ? `${req.protocol}://${req.get('host')}/det/img/profile/${user.user_id}`
                : `${req.protocol}://${req.get('host')}/det/img/profile/default.jpg`,
            followers: user._count.follows_follows_following_idTousers || 0,
            is_following: followingIds.includes(user.user_id), // ✅ ตรวจสอบว่าติดตามหรือยัง
        }));

        res.status(200).json(response);
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({ error: '❌ Internal Server Error' });
    }
};
