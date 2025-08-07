const Project = require('../models/Project');
const { ErrorResponse } = require('../middleware/errorHandler');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private/Admin/Editor
exports.createProject = async (req, res, next) => {
  try {
    // Destructure all fields from ProjectSchema
    const {
      title_en, title_ar, description_en, description_ar, images,
      client_name_en, client_name_ar, project_date, location_en, location_ar,
      category_tags_en, category_tags_ar, isActive // slug_en, slug_ar are auto-generated
    } = req.body;

    if (!title_en || !title_ar || !description_en || !description_ar || !images || images.length === 0) {
      return next(new ErrorResponse('Please provide title (EN/AR), description (EN/AR), and at least one image.', 400));
    }

    const project = new Project({
      title_en, title_ar, description_en, description_ar, images,
      client_name_en, client_name_ar, project_date, location_en, location_ar,
      category_tags_en, category_tags_ar, isActive
    });

    const createdProject = await project.save();
    res.status(201).json({ success: true, data: createdProject });
  } catch (error) {
    // Handle duplicate title error if unique constraint is violated
    if (error.code === 11000 && (error.keyValue.title_en || error.keyValue.title_ar)) {
        return next(new ErrorResponse('Project with this title already exists.', 400));
    }
    next(error);
  }
};

// @desc    Get all projects (with filtering for active ones for public view)
// @route   GET /api/projects
// @access  Public (shows active) / Private (Admin can see all)
exports.getProjects = async (req, res, next) => {
  try {
    let query = {};
    // For public view, only show active projects. Admin can see all by passing a query param e.g., ?status=all
    if (req.user && (req.user.role === 'admin' || req.user.role === 'editor') && req.query.status === 'all') {
      // No filter for admin if status=all
    } else {
      query.isActive = true; // Default to active projects for public
    }

    // Basic search (can be enhanced for specific language fields)
    // Example: /api/projects?search=keyword&lang=en
    const lang = req.query.lang || 'en'; // Default to English
    if (req.query.search) {
        const searchTerm = req.query.search;
        const searchRegex = new RegExp(searchTerm, 'i');
        if (lang === 'ar') {
            query.$or = [
                { title_ar: searchRegex },
                { description_ar: searchRegex },
                { category_tags_ar: searchRegex }
            ];
        } else {
             query.$or = [
                { title_en: searchRegex },
                { description_en: searchRegex },
                { category_tags_en: searchRegex }
            ];
        }
    }

    // TODO: Add pagination, sorting as in productController if needed
    const projects = await Project.find(query).sort({ project_date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single project by ID or Slug
// @route   GET /api/projects/:identifier (ID or slug_en or slug_ar)
// @access  Public (if active) / Private (Admin can see inactive too by ID/slug)
exports.getProjectByIdentifier = async (req, res, next) => {
  try {
    const identifier = req.params.identifier;
    let project;
    let query = {};

    // Check if identifier is a valid MongoDB ObjectId
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = identifier;
    } else {
      query.$or = [{ slug_en: identifier }, { slug_ar: identifier }];
    }

    // If not admin/editor, only allow viewing active projects
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'editor')) {
        query.isActive = true;
    }

    project = await Project.findOne(query);

    if (!project) {
      return next(new ErrorResponse(`Project not found or not accessible with identifier: ${identifier}`, 404));
    }

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

const { deleteFileFromS3 } = require('../utils/s3Service');

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private/Admin/Editor
exports.updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return next(new ErrorResponse(`Project not found with id ${req.params.id}`, 404));
    }

    const oldImageUrls = [...project.images]; // Copy existing image URLs

    // Fields that can be updated (all fields from schema except slugs which auto-update if title changes)
    const {
      title_en, title_ar, description_en, description_ar, images,
      client_name_en, client_name_ar, project_date, location_en, location_ar,
      category_tags_en, category_tags_ar, isActive
    } = req.body;

    // Update fields if they are provided in the request body
    if (title_en !== undefined) project.title_en = title_en;
    if (title_ar !== undefined) project.title_ar = title_ar;
    if (description_en !== undefined) project.description_en = description_en;
    if (description_ar !== undefined) project.description_ar = description_ar;
    if (client_name_en !== undefined) project.client_name_en = client_name_en;
    if (client_name_ar !== undefined) project.client_name_ar = client_name_ar;
    if (project_date !== undefined) project.project_date = project_date;
    if (location_en !== undefined) project.location_en = location_en;
    if (location_ar !== undefined) project.location_ar = location_ar;
    if (category_tags_en !== undefined) project.category_tags_en = category_tags_en;
    if (category_tags_ar !== undefined) project.category_tags_ar = category_tags_ar;
    if (isActive !== undefined) project.isActive = isActive;

    // Handle image updates and S3 deletions
    if (images !== undefined) { // `images` is the new array of S3 URLs from frontend
      project.images = images; // Set the new list of images

      // Determine which images were removed
      const imagesToDelete = oldImageUrls.filter(oldUrl => !images.includes(oldUrl));

      if (imagesToDelete.length > 0) {
        console.log('Deleting images from S3:', imagesToDelete);
        // Asynchronously delete images from S3
        Promise.all(imagesToDelete.map(url => deleteFileFromS3(url)))
          .then(() => console.log('Successfully deleted old images from S3.'))
          .catch(s3Error => console.error('Error deleting some old images from S3:', s3Error));
      }
    }

    // Slugs will be updated by pre-save middleware if titles change
    if (title_en && title_en !== project.title_en) project.slug_en = undefined; // force regeneration
    if (title_ar && title_ar !== project.title_ar) project.slug_ar = undefined; // force regeneration

    const updatedProject = await project.save();
    res.status(200).json({ success: true, data: updatedProject });
  } catch (error) {
    if (error.code === 11000 && (error.keyValue.title_en || error.keyValue.title_ar || error.keyValue.slug_en || error.keyValue.slug_ar)) {
        return next(new ErrorResponse('Update failed. Project with this title or slug already exists.', 400));
    }
    next(error);
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private/Admin
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return next(new ErrorResponse(`Project not found with id ${req.params.id}`, 404));
    }

    // S3 Image Deletion Logic
    if (project.images && project.images.length > 0) {
      console.log('Deleting project images from S3:', project.images);
      // Asynchronously delete images from S3
      Promise.all(project.images.map(url => deleteFileFromS3(url)))
        .then(() => console.log(`Successfully deleted images for project ${project._id} from S3.`))
        .catch(s3Error => console.error(`Error deleting some images for project ${project._id} from S3:`, s3Error));
    }

    await project.deleteOne();
    res.status(200).json({ success: true, message: 'Project deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
