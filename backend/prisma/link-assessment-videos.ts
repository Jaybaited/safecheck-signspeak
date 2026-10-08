import { PrismaClient, AssessmentAudience, AssessmentType, QuestionType, Role } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const videoDir = path.resolve(process.cwd(), '..', 'web', 'public', 'assessment-videos');
  console.log('Scanning folder:', videoDir);

  if (!fs.existsSync(videoDir)) {
    console.log('Video directory does not exist yet.');
    return;
  }

  const files = fs.readdirSync(videoDir);
  console.log('Found video files:', files);

  // Link level1-q1.mp4 explicitly if present
  const l1q1 = files.find(f => f.toLowerCase() === 'level1-q1.mp4');
  if (l1q1) {
    const level1 = await prisma.assessment.findFirst({
      where: { level: 1, audience: AssessmentAudience.STUDENT },
      include: { questions: { orderBy: { order: 'asc' } } }
    });

    if (level1 && level1.questions.length > 0) {
      const q1 = level1.questions[0];
      await prisma.assessmentQuestion.update({
        where: { id: q1.id },
        data: {
          mediaUrl: `/assessment-videos/${l1q1}`,
          prompt: 'Which sign is demonstrated in the video?',
          choices: {
            A: 'Accept',
            B: 'Reject',
            C: 'Welcome',
            D: 'Thank you'
          },
          correctAnswer: 'A'
        }
      });
      console.log(`Updated Level 1 Question 1 -> linked ${l1q1} (Answer: Accept)`);
    } else {
      console.log('Level 1 assessment or questions not found in DB.');
    }
  }

  // Scan and link any other level<X>-q<Y>.mp4 automatically
  for (const f of files) {
    const match = f.match(/^level(\d+)-q(\d+)\.mp4$/i);
    if (!match) continue;
    const levelNum = parseInt(match[1], 10);
    const orderNum = parseInt(match[2], 10);
    if (levelNum === 1 && orderNum === 1) continue; // already handled above

    const targetAssessment = await prisma.assessment.findFirst({
      where: { level: levelNum, audience: AssessmentAudience.STUDENT },
      include: { questions: true }
    });

    if (targetAssessment) {
      const targetQ = targetAssessment.questions.find(q => q.order === orderNum);
      if (targetQ) {
        await prisma.assessmentQuestion.update({
          where: { id: targetQ.id },
          data: { mediaUrl: `/assessment-videos/${f}` }
        });
        console.log(`Linked ${f} to Level ${levelNum} Question ${orderNum}`);
      }
    }
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
