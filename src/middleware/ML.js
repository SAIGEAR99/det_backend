const { PrismaClient } = require('@prisma/client');
const MultivariateLinearRegression = require('ml-regression-multivariate-linear');

const prisma = new PrismaClient();
let model = null;

async function trainModel() {
    try {
        const rawData = await prisma.posts.findMany({
            include: {
                _count: { select: { likes: true, comments: true, reposts: true } }
            }
        });

        console.log("Raw Data from Prisma:", rawData);

        const currentTime = new Date();
        const trainingData = [];
        const postScores = [];

        rawData.forEach(post => {
            const timeSincePost = (currentTime - new Date(post.created_at)) / 36e5; 
            let timeDecay = Math.exp(-timeSincePost / 24); 
            timeDecay = Math.max(0.01, timeDecay); 

    
            const likes = post._count.likes || 0;
            const comments = post._count.comments || 0;
            const reposts = post._count.reposts || 0;

            if (likes === 0 && comments === 0 && reposts === 0) {
                return; 
            }

            const input = [likes, comments, reposts, timeDecay];
            const score = [(likes * 2) + (comments * 3) + (reposts * 5)];

            trainingData.push(input);
            postScores.push(score);
        });

        console.log(`Training Data:`, trainingData);
        console.log(`Post Scores:`, postScores);

        if (trainingData.length === 0 || postScores.length === 0) {
            throw new Error("ไม่มีข้อมูลเพียงพอสำหรับการฝึกโมเดล");
        }

   
        model = new MultivariateLinearRegression(trainingData, postScores);
        console.log("AI Model Training Complete.");
        console.log("Model Coefficients:", model.weights);

    } catch (error) {
        console.error("Error training AI:", error);
    }
}


function predictPostScore(post) {
    if (!model) return 0;

    const currentTime = new Date();
    const timeSincePost = (currentTime - new Date(post.created_at)) / 36e5;
    let timeDecay = Math.exp(-timeSincePost / 24);
    timeDecay = Math.max(0.01, timeDecay);

    const input = [
        Number(post._count.likes) || 0, 
        Number(post._count.comments) || 0, 
        Number(post._count.reposts) || 0, 
        Number(timeDecay)
    ];

    let score = model.predict(input);
    if (Array.isArray(score)) score = score[0]; 
    return Number(score) || 0; 
}


module.exports = { trainModel, predictPostScore };
