const path = require('path');
const Application = require('../../models/applicationModel');
const ApiError = require('../../../../core/utils/ApiError');
const cleanupFiles = require('../../../../core/utils/cleanupFiles');


module.exports = {
  /**
   * Stores uploaded files in an application
   * @param {string} applicationId
   * @param {Object} uploadedFiles - { resume?, coverLetter?, documents[]? }
   * @returns {Promise<Application>} Updated application
   */
  async storeDocuments(applicationId, uploadedFiles) {
    const application = await Application.findById(applicationId);
    if (!application) throw new ApiError(`Application not found`, 404);

    // Handle resume
    if (uploadedFiles.resume) {
      application.resumeUrl = uploadedFiles.resume.url;
    }

    // Handle cover letter
    if (uploadedFiles.coverLetter) {
      application.coverLetter = uploadedFiles.coverLetter.url;
    }

    // Handle additional docs
    if (uploadedFiles.documents?.length) {
      application.documents.push(
        ...uploadedFiles.documents.map((doc) => ({
          name: doc.name,
          url: doc.url,
          type: doc.type,
          size: doc.size,
          uploadedAt: new Date(),
        }))
      );
    }

    return application.save();
  },

  /**
   * Removes all documents from an application (with disk cleanup)
   * @param {string} applicationId
   * @returns {Promise<Application>} Updated application
   */
  async removeAllDocuments(applicationId) {
    const application = await Application.findById(applicationId);
    if (!application) throw new ApiError(`Application not found`, 404);

    const filesToDelete = [];

    if (application.coverLetter) {
      filesToDelete.push(path.join(process.cwd(), application.coverLetter));
      application.coverLetter = undefined;
    }

    if (application.documents?.length) {
      application.documents.forEach((doc) => {
        filesToDelete.push(path.join(process.cwd(), doc.url));
      });
      application.documents = [];
    }

    await cleanupFiles(filesToDelete);
    return application.save();
  },
};
