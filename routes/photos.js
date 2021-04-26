const Post = require('../models/post'),
      User = require('../models/user'),
      Group = require('../models/group'),
      Comment = require('../models/comment'),
      Photo = require('../models/photo'),
      express = require('express'),
      middleware = require('../middleware'),
      router = express.Router(),
      multer = require('multer'),
      cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name:  process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

// Multer file limits
const limits = {
    fileSize: 10240 * 10240, // 10 MB (max file size)
    };

// Set up multer
const upload = multer({ 
    limits: limits,
    storage: multer.diskStorage({})
});
// for parsing multipart/form-data
//router.use(upload.array());

router.use((req, res, next) => {
    ssn = req.session;

    res.locals.currentUser = req.user;
    res.locals.currentGroup = ssn.currentGroup;
    res.locals.path = req.path;
    next();
});

router.post('/photo/upload/profile', middleware.isLoggedIn, upload.single('photoUpload'), middleware.allowedFileType, async(req, res) => {
    // Delete existing profile picture
    // Retrieve photo metadata
    if(req.user.profilePhoto) {
        await Photo.findById(req.user.profilePhoto, (err, photoToDelete) => {
            if(err) {
                req.flash('error', 'Photo not found');
                res.redirect('back');
            } else if(photoToDelete) {
                Photo.deleteOne({_id: photoToDelete._id}, (err) => {
                    if(err) {
                        req.flash('error', 'Something went wrong, changes not saved');
                        res.redirect('back');
                    } else {
                        if(photoToDelete.user.id.equals(req.user._id)) {
                            // Delete the photo from cloudinary
                            deletePhoto(req, res, photoToDelete.public_id);
                            // Continue with upload
                            // 1. Upload the file
                        } else {
                            req.flash('error', 'You are not permitted to delete this photo');
                            res.redirect('back');
                        }
                    }
                })
            }
        })
    }
    cloudinary.uploader.upload(req.file.path, {folder: '/famsocial'}, function(err, result) {
        if(err) {
            if(err.message.includes('File size too large')) {
                req.flash('error', 'File too large, must be less than 10MB.')
                return res.redirect('back');
            }
            req.flash('error', 'Something went wrong, try again.')
            return res.redirect('back');
        }
        
        const fileToSave = {
            url: result.url,
            secure_url: result.secure_url,
            public_id: result.public_id,
            user: {
                id: req.user._id,
                username: req.user.username
            },
            profile: true
        }
        // 2. Create the file info in the db
        Photo.create(fileToSave, (err, uploadedPhoto) => {
            if(err) {
                req.flash('error', 'Something went wrong, try again.');
                res.redirect('back');
            } else {
                User.findById(req.user._id, (err, user) => {
                    if(err) {
                        req.flash('error', 'Something went wrong, try again.');
                        res.redirect('back');
                    } else {
                        user.profilePhoto = uploadedPhoto._id;
                        user.save().then(() => {
                            req.flash('success', 'Profile picture changed');
                            res.redirect('back');
                        });
                    }
                })
            }
        })
    });

});

// Delete photo
router.delete('/photo/profile/:id', middleware.isLoggedIn, async(req, res) => {
    // Delete from user profile
    if(req.user.profilePhoto) {
        await Photo.findById(req.user.profilePhoto, (err, photoToDelete) => {
            if(err) {
                req.flash('error', 'Photo not found');
                return res.redirect('back');
            } 
            // 1. Delete image from mongodb
            Photo.deleteOne({_id: photoToDelete._id}, (err) => {
                if(err) {
                    req.flash('error', 'Something went wrong, changes not saved');
                    res.redirect('back');
                } else {
                    // 2. Delete profile photo from user
                    User.findByIdAndUpdate(req.user.id, {profilePhoto: null}, (err, user) => {
                        if(err) {
                            req.flash('error', 'Something went wrong');
                            res.redirect('back');
                        } else {
                            // 3. Delete the photo from cloudinary
                            if(photoToDelete.user.id.equals(req.user._id)) {
                                deletePhoto(req, res, photoToDelete.public_id);
                                req.flash('success', 'Profile picture deleted');
                                res.redirect('back');
                            } else {
                                req.flash('error', 'You are not permitted to delete this photo');
                                res.redirect('back');
                            }
                        }
                    })
                }
            })
        })
    } else {
        req.flash('error', 'No profile picture to delete');
        res.redirect('back');
    }
});

function deletePhoto(req,res,publicId) {
    // Delete from server
    cloudinary.uploader.destroy(publicId, (err, result) => {
        if(err) {
            req.flash('error', 'Photo not deleted from server');
            return res.redirect('back');
        }
     });
}

module.exports = router;