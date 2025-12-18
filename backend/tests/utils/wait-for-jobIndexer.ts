import { TypesenseService } from "@/infrastructure/typesense.service/typesense.service";
import logger from "@/logger";

const typesenseService = new TypesenseService();

export async function waitForJobIndexing(
  jobId: number,
  timeout = 5000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const timeoutId = setTimeout(() => {
      clearInterval(checkInterval);
      reject(
        new Error(`Job indexing timed out after ${timeout}ms for job ${jobId}`),
      );
    }, timeout);

    // Poll Typesense to check if the job has been indexed
    const checkInterval = setInterval(async () => {
      try {
        const elapsed = Date.now() - startTime;
        logger.info(
          `⏳ Checking if job ${jobId} is indexed (elapsed: ${elapsed}ms)...`,
        );

        // Try to fetch the document from Typesense
        const document = await typesenseService.retrieveJobDocumentById(
          `${jobId}`,
        );

        if (document) {
          logger.info(`✅ Job ${jobId} successfully indexed in Typesense`);
          clearTimeout(timeoutId);
          clearInterval(checkInterval);
          resolve();
        }
      } catch (error: any) {
        // Document not found yet, continue polling
        if (error.httpStatus === 404) {
          // Not found yet, keep waiting
        } else {
          logger.error("Error checking Typesense:", error);
        }
      }
    }, 500);

    logger.info(`⏳ Waiting for job ${jobId} to be indexed in Typesense...`);
  });
}
