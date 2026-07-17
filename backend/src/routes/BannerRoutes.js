const express = require('express');
const router = express.Router();
const {
  getBanners,
  getAllBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner
} = require('../controllers/BannerController');
const { protect, authorize } = require('../middleware/AuthMiddleware');

router.route('/')
  .get(getBanners)
  .post(protect, authorize('ADMIN'), createBanner);

router.route('/admin')
  .get(protect, authorize('ADMIN'), getAllBannersAdmin);

router.route('/:id')
  .put(protect, authorize('ADMIN'), updateBanner)
  .delete(protect, authorize('ADMIN'), deleteBanner);

module.exports = router;
