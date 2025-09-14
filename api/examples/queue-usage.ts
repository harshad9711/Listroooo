// Example usage of the simplified Veo 3 queue system

import { veoStartQ, veoPollQ, veoPostQ } from '../queues/veo.js';

// =========================
// ADDING JOBS
// =========================

// Add a start job
async function createVideoJob(jobData: any) {
  const job = await veoStartQ.add('start', jobData, {
    priority: jobData.priority || 0,
    delay: jobData.delay || 0,
  });
  
  console.log('Start job added:', job.id);
  return job;
}

// Add a poll job
async function pollVideoStatus(jobData: any) {
  const job = await veoPollQ.add('poll', jobData, {
    delay: jobData.delay || 5000, // 5 second delay
  });
  
  console.log('Poll job added:', job.id);
  return job;
}

// Add a post-processing job
async function postProcessVideo(jobData: any) {
  const job = await veoPostQ.add('post', jobData, {
    priority: jobData.priority || 0,
  });
  
  console.log('Post job added:', job.id);
  return job;
}

// =========================
// MONITORING JOBS
// =========================

// Get job status
async function getJobStatus(queueName: string, jobId: string) {
  let queue;
  switch (queueName) {
    case 'start':
      queue = veoStartQ;
      break;
    case 'poll':
      queue = veoPollQ;
      break;
    case 'post':
      queue = veoPostQ;
      break;
    default:
      throw new Error('Invalid queue name');
  }

  const job = await queue.getJob(jobId);
  if (!job) {
    return null;
  }

  return {
    id: job.id,
    data: job.data,
    progress: job.progress,
    state: await job.getState(),
    createdAt: new Date(job.timestamp),
    processedAt: job.processedOn ? new Date(job.processedOn) : null,
    completedAt: job.finishedOn ? new Date(job.finishedOn) : null,
    failedReason: job.failedReason,
    attemptsMade: job.attemptsMade,
  };
}

// Get queue statistics
async function getQueueStats() {
  const [startStats, pollStats, postStats] = await Promise.all([
    veoStartQ.getJobCounts(),
    veoPollQ.getJobCounts(),
    veoPostQ.getJobCounts(),
  ]);

  return {
    start: startStats,
    poll: pollStats,
    post: postStats,
  };
}

// =========================
// CLEANING UP
// =========================

// Clean completed jobs
async function cleanQueues() {
  await Promise.all([
    veoStartQ.clean(5000, 100, 'completed'),
    veoPollQ.clean(5000, 100, 'completed'),
    veoPostQ.clean(5000, 100, 'completed'),
  ]);
  
  console.log('Queues cleaned');
}

// Close all queues
async function closeQueues() {
  await Promise.all([
    veoStartQ.close(),
    veoPollQ.close(),
    veoPostQ.close(),
  ]);
  
  console.log('All queues closed');
}

// =========================
// USAGE EXAMPLES
// =========================

async function exampleWorkflow() {
  try {
    // 1. Create a video generation job
    const startJob = await createVideoJob({
      jobId: 'job-123',
      organizationId: 'org-456',
      userId: 'user-789',
      prompt: { text: 'A beautiful sunset over the ocean' },
      config: { duration: 8, quality: 'high' },
      priority: 1
    });

    // 2. Check job status
    const status = await getJobStatus('start', startJob.id);
    console.log('Job status:', status);

    // 3. Get queue statistics
    const stats = await getQueueStats();
    console.log('Queue stats:', stats);

    // 4. Clean up old jobs
    await cleanQueues();

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // 5. Close queues when done
    await closeQueues();
  }
}

// Export for use in other modules
export {
  createVideoJob,
  pollVideoStatus,
  postProcessVideo,
  getJobStatus,
  getQueueStats,
  cleanQueues,
  closeQueues,
  exampleWorkflow
};

